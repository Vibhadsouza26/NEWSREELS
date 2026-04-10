import express from 'express';
import cors from 'cors';
import NodeCache from 'node-cache';
import { fetchAllFeeds, NewsItem } from './rssParser';
import { fetchHNStories } from './hnApi';
import { askGemini, AiRequest } from './aiHandler';
import { ALL_CATEGORIES, Category } from './feedSources';

// Load .env for local development (Vercel injects env vars automatically)
import path from 'path';
import fs from 'fs';
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  }
}

const app = express();
const cache = new NodeCache({ stdTTL: 600 }); // 10 min TTL

app.use(cors());
app.use(express.json());

// ── GET /api/categories ─────────────────────────────────────────────────────
app.get('/api/categories', (_req, res) => {
  res.json({ categories: ALL_CATEGORIES });
});

// ── GET /api/news?category=ai ───────────────────────────────────────────────
app.get('/api/news', async (req, res) => {
  try {
    const category = req.query.category as Category | undefined;
    const cacheKey = `news_${category ?? 'all'}`;

    const cached = cache.get<NewsItem[]>(cacheKey);
    if (cached) {
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
      return res.json({ items: cached, cached: true, count: cached.length });
    }

    // Fetch RSS feeds
    const [rssItems, hnItems] = await Promise.all([
      fetchAllFeeds(category),
      !category || category === 'startups' ? fetchHNStories(20) : Promise.resolve([]),
    ]);

    // Merge + deduplicate by URL
    const seen = new Set<string>();
    const merged: NewsItem[] = [];

    for (const item of [...hnItems, ...rssItems]) {
      if (!seen.has(item.url)) {
        seen.add(item.url);
        merged.push(item);
      }
    }

    // Sort newest first
    merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    cache.set(cacheKey, merged);
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    return res.json({ items: merged, cached: false, count: merged.length });
  } catch (err: any) {
    console.error('[/api/news]', err.message);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// ── POST /api/ai/ask ────────────────────────────────────────────────────────
app.post('/api/ai/ask', async (req, res) => {
  try {
    const { question, selectedText, pageContent, articleTitle } = req.body as AiRequest;

    if (!question || !articleTitle) {
      return res.status(400).json({ error: 'question and articleTitle are required' });
    }

    const answer = await askGemini({ question, selectedText, pageContent, articleTitle });
    return res.json({ answer });
  } catch (err: any) {
    console.error('[/api/ai/ask]', err.message);
    res.status(500).json({ error: 'AI request failed' });
  }
});

// Export for Vercel serverless
export default app;

// Start locally when not on Vercel
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`✅  News Reels backend running on http://localhost:${PORT}`);
    console.log(`    GET  /api/news`);
    console.log(`    GET  /api/news?category=ai|tech|startups|product|companies|geopolitical|learn`);
    console.log(`    GET  /api/categories`);
    console.log(`    POST /api/ai/ask`);
  });
}
