import axios from 'axios';
import crypto from 'crypto';
import { NewsItem } from './rssParser';

const HN_BASE = 'https://hacker-news.firebaseio.com/v0';

interface HNStory {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number;
  descendants?: number;
  type: string;
}

async function fetchStory(id: number): Promise<HNStory | null> {
  try {
    const res = await axios.get<HNStory>(`${HN_BASE}/item/${id}.json`, { timeout: 5000 });
    return res.data;
  } catch {
    return null;
  }
}

export async function fetchHNStories(limit = 20): Promise<NewsItem[]> {
  try {
    const res = await axios.get<number[]>(`${HN_BASE}/topstories.json`, { timeout: 5000 });
    const topIds = res.data.slice(0, 60);

    const stories = await Promise.allSettled(topIds.map(fetchStory));

    const items: NewsItem[] = [];
    const seen = new Set<string>();

    for (const result of stories) {
      if (result.status !== 'fulfilled' || !result.value) continue;
      const story = result.value;

      // Skip Ask HN / Show HN / polls / stories without external URLs
      if (!story.url || story.type !== 'story') continue;
      if (seen.has(story.url)) continue;
      seen.add(story.url);

      const id = crypto.createHash('md5').update(story.url).digest('hex');
      items.push({
        id,
        title: story.title,
        url: story.url,
        sourceName: 'Hacker News',
        category: 'startups',
        publishedAt: new Date(story.time * 1000).toISOString(),
        description: `${story.score} points · ${story.descendants ?? 0} comments · by ${story.by}`,
      });

      if (items.length >= limit) break;
    }

    return items;
  } catch (err: any) {
    console.warn(`[HN] Failed to fetch: ${err.message}`);
    return [];
  }
}
