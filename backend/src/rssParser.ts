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
  takeaways?: string[];
  isYouTube?: boolean;
}

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['enclosure', 'enclosure'],
    ],
  },
  timeout: 8000,
});

const ytParser = new Parser({
  timeout: 10000, // YouTube RSS is slower
});

const MAX_AGE_DAYS = 14; // filter out articles older than 14 days

// ── YouTube InnerTube fallback (when RSS feeds are down) ─────────────────────

let innertubeApiKey: string | null = null;
let innertubeKeyFetchedAt = 0;

async function getInnertubeKey(): Promise<string> {
  if (innertubeApiKey && Date.now() - innertubeKeyFetchedAt < 3600000) return innertubeApiKey;
  const resp = await fetch('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept-Language': 'en-US,en;q=0.9' },
  });
  const html = await resp.text();
  const m = html.match(/"INNERTUBE_API_KEY":\s*"([a-zA-Z0-9_-]+)"/);
  if (!m) throw new Error('No INNERTUBE_API_KEY');
  innertubeApiKey = m[1];
  innertubeKeyFetchedAt = Date.now();
  return innertubeApiKey;
}

async function fetchYouTubeViaInnerTube(source: FeedSource): Promise<NewsItem[]> {
  const channelMatch = source.url.match(/channel_id=([^&]+)/);
  if (!channelMatch) return [];
  const channelId = channelMatch[1];

  try {
    const key = await getInnertubeKey();
    const resp = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: { client: { clientName: 'WEB', clientVersion: '2.20240101' } },
        browseId: channelId,
        params: 'EgZ2aWRlb3PyBgQKAjoA', // Videos tab
      }),
    });
    const data: any = await resp.json();
    const text = JSON.stringify(data);

    // Extract video entries from the response
    const videoRegex = /"videoId":"([^"]{11})".*?"title":\{"runs":\[\{"text":"([^"]+)"\}\].*?"publishedTimeText":\{"simpleText":"([^"]+)"\}/g;
    const items: NewsItem[] = [];
    const seen = new Set<string>();
    let match;

    while ((match = videoRegex.exec(text)) !== null && items.length < 10) {
      const [, videoId, title, timeText] = match;
      if (seen.has(videoId)) continue;
      seen.add(videoId);

      const url = `https://www.youtube.com/watch?v=${videoId}`;
      // Skip Shorts (usually very short titles or #shorts tag)
      if (title.includes('#shorts') || title.includes('#Shorts')) continue;

      items.push({
        id: crypto.createHash('md5').update(url).digest('hex'),
        title: title.trim(),
        url,
        imageUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        sourceName: source.name,
        category: source.category,
        publishedAt: parseRelativeTime(timeText),
        isYouTube: true,
      });
    }

    if (items.length > 0) {
      console.log(`[YT InnerTube] ${source.name}: ${items.length} videos`);
    }
    return items;
  } catch (err: any) {
    console.warn(`[YT InnerTube] Failed for ${source.name}: ${err.message}`);
    return [];
  }
}

function parseRelativeTime(text: string): string {
  // "2 days ago", "3 hours ago", "1 week ago", etc.
  const now = Date.now();
  const m = text.match(/(\d+)\s+(second|minute|hour|day|week|month|year)/i);
  if (!m) return new Date().toISOString();
  const n = parseInt(m[1]);
  const unit = m[2].toLowerCase();
  const ms: Record<string, number> = {
    second: 1000, minute: 60000, hour: 3600000,
    day: 86400000, week: 604800000, month: 2592000000, year: 31536000000,
  };
  return new Date(now - n * (ms[unit] || 86400000)).toISOString();
}

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
    const feed = await (source.isYouTube ? ytParser : parser).parseURL(source.url);
    const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

    return (feed.items || [])
      .filter((item) => {
        if (!item.link || !item.title) return false;
        // Skip YouTube Shorts — they're clips, not full episodes
        if (source.isYouTube && item.link.includes('/shorts/')) return false;
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

        // YouTube thumbnail fallback: extract video ID from URL or RSS id field
        let imageUrl = extractImage(item);
        if (!imageUrl && source.isYouTube) {
          const vidMatch = url.match(/[?&]v=([^&]+)/) || (item as any).id?.match(/yt:video:(.+)/);
          if (vidMatch) imageUrl = `https://i.ytimg.com/vi/${vidMatch[1]}/hqdefault.jpg`;
        }

        return {
          id,
          title: item.title!.trim(),
          url,
          imageUrl,
          sourceName: source.name,
          category: source.category,
          publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
          description: description || undefined,
          ...(source.isYouTube && { isYouTube: true }),
        };
      });
  } catch (err: any) {
    console.warn(`[RSS] Failed to fetch ${source.name}: ${err.message}`);
    // Fallback: if YouTube RSS is down, use InnerTube API
    if (source.isYouTube) {
      return fetchYouTubeViaInnerTube(source);
    }
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
