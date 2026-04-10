import Parser from 'rss-parser';
import crypto from 'crypto';
import { FEED_SOURCES, FeedSource, Category } from './feedSources';

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  imageUrl?: string;
  sourceName: string;
  category: Category;
  publishedAt: string;
  description?: string;
}

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['enclosure', 'enclosure'],
    ],
  },
  timeout: 3000,
});

const MAX_AGE_DAYS = 14; // filter out articles older than 14 days

function extractImage(item: any): string | undefined {
  // 1. media:content
  if (item.mediaContent?.$.url) return item.mediaContent.$.url;
  // 2. media:thumbnail
  if (item.mediaThumbnail?.$.url) return item.mediaThumbnail.$.url;
  // 3. enclosure
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image')) return item.enclosure.url;
  // 4. Parse first <img> from content/summary HTML
  const html = item.content || item.summary || item['content:encoded'] || '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match?.[1]) return match[1];
  return undefined;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function parseFeed(source: FeedSource): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(source.url);
    const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

    return (feed.items || [])
      .filter((item) => {
        if (!item.link || !item.title) return false;
        const date = item.isoDate || item.pubDate;
        if (date) {
          const t = new Date(date).getTime();
          if (!isNaN(t) && t < cutoff) return false; // skip old articles
        }
        return true;
      })
      .slice(0, 10) // max 10 per feed for speed
      .map((item) => {
        const url = item.link!;
        const id = crypto.createHash('md5').update(url).digest('hex');
        const raw = item.contentSnippet || item.summary || item.content || '';
        const description = stripHtml(raw).substring(0, 300) || undefined;
        return {
          id,
          title: item.title!.trim(),
          url,
          imageUrl: extractImage(item),
          sourceName: source.name,
          category: source.category,
          publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
          description: description || undefined,
        };
      });
  } catch (err: any) {
    console.warn(`[RSS] Failed to fetch ${source.name}: ${err.message}`);
    return [];
  }
}

export async function fetchAllFeeds(category?: Category): Promise<NewsItem[]> {
  const sources = category
    ? FEED_SOURCES.filter((s) => s.category === category)
    : FEED_SOURCES;

  const results = await Promise.allSettled(sources.map(parseFeed));

  const all: NewsItem[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const item of result.value) {
        if (!seen.has(item.url)) {
          seen.add(item.url);
          all.push(item);
        }
      }
    }
  }

  // Sort newest first
  all.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return all;
}
