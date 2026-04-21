import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import { fetchAllFeeds, NewsItem } from './rssParser';
import { askAI, AiRequest } from './aiHandler';
import { ALL_CATEGORIES, Category } from './feedSources';
import { translateTexts } from './translationService';
import { generateTakeaways, generateYouTubeTakeaways } from './sarvamClient';
import { generateInsights } from './insightsGenerator';
import { fetchTranscript, getCachedTranscript, extractVideoId } from './youtubeTranscript';
import crypto from 'crypto';
import { setEntry as setStoreEntry } from './takeawaysStore';

// Load .env for local development (Vercel injects env vars automatically)
import path from 'path';
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Warn if no AI provider keys are configured
if (!process.env.GROQ_API_KEY && !process.env.SARVAM_API_KEY && !process.env.GEMINI_API_KEY) {
  console.warn('[Startup] WARNING: No AI provider API keys found (GROQ_API_KEY, SARVAM_API_KEY, GEMINI_API_KEY). AI features will not work.');
}

const app = express();
const cache = new NodeCache({ stdTTL: 600 }); // 10 min TTL for news
const takeawaysCache = new NodeCache({ stdTTL: 86400 }); // 24h TTL — same article = same takeaway
const ytDescriptionCache = new NodeCache({ stdTTL: 86400 }); // 24h — YouTube generated descriptions
const translationCache = new NodeCache({ stdTTL: 1800 }); // 30 min TTL for translations

// In-flight fetch deduplication — prevents cache stampede
const inFlightFetches = new Map<string, Promise<any>>();

// CORS — restrict origins via ALLOWED_ORIGINS env var (comma-separated), default '*' for dev
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
app.use(cors({ origin: allowedOrigins.includes('*') ? true : allowedOrigins }));
app.use(express.json({ limit: '10mb' }));

// Rate limiting — general: 100 req/min per IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

// Rate limiting — strict: 10 req/min per IP for expensive endpoints
const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/ai/ask', strictLimiter);
app.use('/api/transcribe', strictLimiter);
app.use('/api/translate', strictLimiter);
app.use('/api/digest', strictLimiter);
app.use('/api/insights', strictLimiter);

// ── GET /api/categories ─────────────────────────────────────────────────────
app.get('/api/categories', (_req, res) => {
  res.json({ categories: ALL_CATEGORIES });
});

// ── GET /api/news?category=ai ───────────────────────────────────────────────
app.get('/api/news', async (req, res) => {
  try {
    const category = req.query.category as Category | undefined;

    // Validate category against allowed list
    if (category && !ALL_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${ALL_CATEGORIES.join(', ')}` });
    }

    const cacheKey = `news_${category ?? 'all'}`;

    let items = cache.get<NewsItem[]>(cacheKey);
    let wasCached = true;

    if (!items) {
      wasCached = false;

      // Cache stampede protection: reuse in-flight fetch for same key
      let fetchPromise = inFlightFetches.get(cacheKey);
      if (!fetchPromise) {
        fetchPromise = (async () => {
          const rssItems = await fetchAllFeeds(category);

          // Deduplicate by URL and title
          const seenUrls = new Set<string>();
          const seenTitles = new Set<string>();
          const merged: NewsItem[] = [];
          for (const item of rssItems) {
            const titleKey = item.title.toLowerCase().trim();
            if (!seenUrls.has(item.url) && !seenTitles.has(titleKey)) {
              seenUrls.add(item.url);
              seenTitles.add(titleKey);
              merged.push(item);
            }
          }

          // Sort newest first
          merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

          // Deduplicate by source — max 3 articles per source to prevent flooding
          const sourceCounts = new Map<string, number>();
          const diversified = merged.filter((item) => {
            const count = sourceCounts.get(item.sourceName) || 0;
            if (count >= 3) return false;
            sourceCounts.set(item.sourceName, count + 1);
            return true;
          });

          cache.set(cacheKey, diversified);
          return diversified;
        })();
        inFlightFetches.set(cacheKey, fetchPromise);
        fetchPromise.finally(() => inFlightFetches.delete(cacheKey));
      }

      items = await fetchPromise;
    }

    // Send response immediately — don't block on takeaway generation
    const finalItems = items!;
    const withTakeaways = attachTakeaways(finalItems);
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    res.json({ items: withTakeaways, cached: wasCached, count: withTakeaways.length });

    // Generate takeaways in background (persistent process keeps running)
    ensureTopTakeaways(finalItems, 5).catch(() => {});
    generateMissingTakeaways(finalItems);
  } catch (err: any) {
    console.error('[/api/news]', err.message);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// ── GET /api/takeaways?ids=id1,id2,... ──────────────────────────────────────
app.get('/api/takeaways', (req, res) => {
  const ids = ((req.query.ids as string) || '').split(',').filter(Boolean);
  const result: Record<string, string[]> = {};

  for (const id of ids) {
    const cached = takeawaysCache.get<string[]>(`takeaway_${id}`);
    if (cached) result[id] = cached;
  }

  res.json({ takeaways: result });
});

// ── POST /api/translate ─────────────────────────────────────────────────────
app.post('/api/translate', async (req, res) => {
  try {
    const { texts, targetLang } = req.body as { texts: string[]; targetLang: string };

    if (!texts?.length || !targetLang) {
      return res.status(400).json({ error: 'texts[] and targetLang required' });
    }

    // Cap texts array at 100 items to prevent abuse
    if (texts.length > 100) {
      return res.status(400).json({ error: 'texts[] cannot exceed 100 items' });
    }

    if (targetLang === 'en') {
      return res.json({ translations: texts });
    }

    // Check translation cache
    const results: string[] = new Array(texts.length);
    const uncached: { idx: number; text: string }[] = [];

    for (let i = 0; i < texts.length; i++) {
      const key = `tr_${crypto.createHash('md5').update(texts[i] + targetLang).digest('hex')}`;
      const cached = translationCache.get<string>(key);
      if (cached) {
        results[i] = cached;
      } else {
        uncached.push({ idx: i, text: texts[i] });
      }
    }

    if (uncached.length > 0) {
      const translated = await translateTexts(
        uncached.map((u) => u.text),
        targetLang
      );

      for (let i = 0; i < uncached.length; i++) {
        results[uncached[i].idx] = translated[i];
        const key = `tr_${crypto.createHash('md5').update(uncached[i].text + targetLang).digest('hex')}`;
        translationCache.set(key, translated[i]);
      }
    }

    res.json({ translations: results });
  } catch (err: any) {
    console.error('[/api/translate]', err.message);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// ── POST /api/ai/ask ────────────────────────────────────────────────────────
app.post('/api/ai/ask', async (req, res) => {
  try {
    const { question, selectedText, pageContent, articleTitle, articleUrl } = req.body as AiRequest & { articleUrl?: string };

    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    if (!articleTitle) {
      return res.status(400).json({ error: 'question and articleTitle are required' });
    }

    // If pageContent is thin and URL is YouTube, inject transcript
    let enrichedContent = pageContent;
    if ((!pageContent || pageContent.length < 200) && articleUrl) {
      const videoId = extractVideoId(articleUrl);
      if (videoId) {
        const transcript = getCachedTranscript(videoId) || await fetchTranscript(videoId);
        if (transcript) {
          enrichedContent = transcript.fullText.substring(0, 8000);
        }
      }
    }

    const answer = await askAI({ question, selectedText, pageContent: enrichedContent, articleTitle });
    return res.json({ answer });
  } catch (err: any) {
    console.error('[/api/ai/ask]', err.message);
    res.status(500).json({ error: 'AI request failed' });
  }
});

// ── POST /api/transcribe ─────────────────────────────────────────────────────
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audio } = req.body as { audio: string }; // base64 encoded audio
    if (!audio) return res.status(400).json({ error: 'audio (base64) required' });

    // Validate base64 payload size (max 5MB)
    const estimatedBytes = Math.ceil(audio.length * 3 / 4);
    if (estimatedBytes > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Audio payload exceeds 5MB limit' });
    }

    const FormData = require('form-data');
    const form = new FormData();
    const buffer = Buffer.from(audio, 'base64');
    form.append('file', buffer, { filename: 'audio.m4a', contentType: 'audio/m4a' });
    form.append('model', 'whisper-large-v3');
    form.append('language', 'en');

    const axios = require('axios');
    const response = await axios.post(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        timeout: 15000,
      }
    );

    res.json({ text: response.data?.text || '' });
  } catch (err: any) {
    console.error('[/api/transcribe]', err.message);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

// ── GET /api/related?title=X ─────────────────────────────────────────────────
app.get('/api/related', async (req, res) => {
  try {
    const title = req.query.title as string;
    if (!title) return res.status(400).json({ error: 'title required' });

    // Get all cached news items
    const allItems: NewsItem[] = [];
    const keys = cache.keys().filter((k) => k.startsWith('news_'));
    for (const key of keys) {
      const items = cache.get<NewsItem[]>(key);
      if (items) allItems.push(...items);
    }

    // Deduplicate
    const seen = new Set<string>();
    const unique = allItems.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    // Simple keyword matching: split title into words, score by overlap
    const titleWords = title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const scored = unique
      .map((item) => {
        const itemWords = item.title.toLowerCase();
        const score = titleWords.filter((w) => itemWords.includes(w)).length;
        return { item, score };
      })
      .filter((s) => s.score > 0 && s.item.title !== title)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    res.json({ related: scored.map((s) => s.item) });
  } catch (err: any) {
    console.error('[/api/related]', err.message);
    res.status(500).json({ error: 'Failed to find related articles' });
  }
});

// ── GET /api/insights?category=X ────────────────────────────────────────────
app.get('/api/insights', async (req, res) => {
  try {
    const category = req.query.category as Category | undefined;
    const cacheKey = `insights_${category ?? 'all'}`;

    const cached = cache.get<any>(cacheKey);
    if (cached) {
      return res.json({ insights: cached });
    }

    // Get latest articles for this category
    const newsKey = `news_${category ?? 'all'}`;
    let articles = cache.get<NewsItem[]>(newsKey);

    if (!articles) {
      articles = await fetchAllFeeds(category);
    }

    const top20 = articles.slice(0, 20);
    const insights = await generateInsights(top20);

    cache.set(cacheKey, insights, 900); // 15 min cache
    res.json({ insights });
  } catch (err: any) {
    console.error('[/api/insights]', err.message);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// ── GET /api/digest?category=X&preferred=ai,tech,startups ────────────────────
app.get('/api/digest', async (req, res) => {
  try {
    const category = req.query.category as Category | undefined;
    const preferred = ((req.query.preferred as string) || '').split(',').filter(Boolean);
    const cacheKey = `daily_digest_${category ?? 'all'}_${preferred.join(',')}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) return res.json({ digest: cached });

    // Get top articles
    const newsKey = `news_${category ?? 'all'}`;
    let articles = cache.get<NewsItem[]>(newsKey);
    if (!articles || articles.length === 0) {
      articles = await fetchAllFeeds(category);
      if (articles.length > 0) cache.set(newsKey, articles);
    }

    let top: NewsItem[];
    if (preferred.length > 0 && articles.length > 10) {
      // Weight: 60% from preferred categories, 40% from others
      const prefSet = new Set(preferred);
      const prefArticles = articles.filter((a) => prefSet.has(a.category));
      const otherArticles = articles.filter((a) => !prefSet.has(a.category));
      const prefCount = Math.min(6, prefArticles.length);
      const otherCount = Math.min(10 - prefCount, otherArticles.length);
      top = [...prefArticles.slice(0, prefCount), ...otherArticles.slice(0, otherCount)];
    } else {
      top = articles.slice(0, 10);
    }

    const articleContext = top.map((a, i) => {
      const desc = a.description ? ` — ${a.description.substring(0, 120)}` : '';
      return `${i + 1}. [${a.category}] ${a.title}${desc}`;
    }).join('\n');

    const { askSarvam: askSarvamFn } = require('./sarvamClient');
    const prefLabel = preferred.length > 0 ? ` The user follows: ${preferred.join(', ')}.` : '';
    const summary = await askSarvamFn(
      `You write ultra-concise news digests. Plain text only, no markdown, no asterisks, no bullet symbols. Max 2-3 sentences. Connect the dots across stories — what's the bigger picture today? Be specific: use names, numbers, companies.${prefLabel}`,
      `What's the single most important narrative across these stories today?\n${articleContext}`
    );

    const digest = {
      date: new Date().toISOString().split('T')[0],
      summary,
      articleCount: top.length,
      topArticles: top.slice(0, 5).map((a) => ({ id: a.id, title: a.title, url: a.url })),
    };

    if (top.length > 0) cache.set(cacheKey, digest, 3600); // 1 hour cache
    res.json({ digest });
  } catch (err: any) {
    console.error('[/api/digest]', err.message);
    res.status(500).json({ error: 'Failed to generate digest' });
  }
});

// ── GET /api/search?q=query ─────────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  try {
    const rawQuery = (req.query.q as string || '').trim();

    // Cap query string length at 200 chars
    if (rawQuery.length > 200) {
      return res.status(400).json({ error: 'Search query cannot exceed 200 characters' });
    }

    const query = rawQuery.toLowerCase();
    if (!query) return res.json({ results: [] });

    // Gather all cached news items
    const allItems: NewsItem[] = [];
    const keys = cache.keys().filter((k) => k.startsWith('news_'));
    for (const key of keys) {
      const items = cache.get<NewsItem[]>(key);
      if (items) allItems.push(...items);
    }

    // Deduplicate
    const seen = new Set<string>();
    const unique = allItems.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    const queryWords = query.split(/\s+/).filter((w) => w.length > 1);

    // Score each item — simple includes, no regex overhead
    const scored = unique
      .map((item) => {
        const titleLower = item.title.toLowerCase();
        const descLower = (item.description || '').toLowerCase();
        const sourceLower = item.sourceName.toLowerCase();
        let score = 0;

        for (const word of queryWords) {
          if (titleLower.includes(word)) {
            score += 3;
          }
          if (descLower.includes(word)) {
            score += 1;
          }
          if (sourceLower.includes(word)) {
            score += 2;
          }
        }

        return { item, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    res.json({ results: scored.map((s) => s.item) });
  } catch (err: any) {
    console.error('[/api/search]', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ── Helpers ─────────────────────────────────────────────────────────────────

function attachTakeaways(items: NewsItem[]): (NewsItem & { takeaways?: string[] })[] {
  return items.map((item) => {
    const takeaways = takeawaysCache.get<string[]>(`takeaway_${item.id}`);
    // Attach generated description for YouTube items with empty/short RSS description
    const ytDesc = ytDescriptionCache.get<string>(`ytdesc_${item.id}`);
    const description = (!item.description || item.description.length < 30) && ytDesc
      ? ytDesc
      : item.description;
    return { ...item, ...(takeaways && { takeaways }), ...(description && { description }) };
  });
}

/** Generate takeaways for top N items synchronously before responding */
async function ensureTopTakeaways(items: NewsItem[], count: number) {
  const topMissing = items
    .slice(0, count)
    .filter((item) => !takeawaysCache.get(`takeaway_${item.id}`));

  if (!topMissing.length) return;

  console.log(`[Takeaways] Ensuring top ${topMissing.length} items before response`);
  await Promise.all(
    topMissing.map(async (item) => {
      try {
        if (item.isYouTube) {
          const videoId = extractVideoId(item.url);
          if (videoId) {
            const transcript = await fetchTranscript(videoId);
            if (transcript && transcript.wordCount > 50) {
              const result = await generateYouTubeTakeaways(item.title, transcript.condensed);
              if (result.takeaways.length > 0) {
                takeawaysCache.set(`takeaway_${item.id}`, result.takeaways);
                setStoreEntry(item.id, result.takeaways);
              }
              if (result.description) {
                ytDescriptionCache.set(`ytdesc_${item.id}`, result.description);
              }
              return;
            }
          }
        }
        const takeaways = await generateTakeaways(item.title, item.description || '');
        if (takeaways.length > 0) {
          takeawaysCache.set(`takeaway_${item.id}`, takeaways);
          setStoreEntry(item.id, takeaways);
        }
      } catch (err: any) {
        console.warn(`[Takeaways] Top item failed: ${err.message}`);
      }
    })
  );
}

async function generateMissingTakeaways(items: NewsItem[]) {
  const missing = items.filter((item) => !takeawaysCache.get(`takeaway_${item.id}`));
  if (!missing.length) return;

  console.log(`[Takeaways] Generating for ${missing.length} items`);

  const generateOne = async (item: NewsItem, retries = 1): Promise<void> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (item.isYouTube) {
          // YouTube path: fetch transcript → generate description + takeaways
          const videoId = extractVideoId(item.url);
          if (!videoId) return;
          const transcript = await fetchTranscript(videoId);
          if (transcript && transcript.wordCount > 50) {
            const result = await generateYouTubeTakeaways(item.title, transcript.condensed);
            if (result.takeaways.length > 0) {
              takeawaysCache.set(`takeaway_${item.id}`, result.takeaways);
              setStoreEntry(item.id, result.takeaways);
            }
            if (result.description) {
              ytDescriptionCache.set(`ytdesc_${item.id}`, result.description);
            }
          } else {
            // No transcript — fall back to title-only takeaways
            const takeaways = await generateTakeaways(item.title, item.description || '');
            if (takeaways.length > 0) {
              takeawaysCache.set(`takeaway_${item.id}`, takeaways);
              setStoreEntry(item.id, takeaways);
            }
          }
        } else {
          // Regular article path
          const takeaways = await generateTakeaways(item.title, item.description || '');
          if (takeaways.length > 0) {
            takeawaysCache.set(`takeaway_${item.id}`, takeaways);
            setStoreEntry(item.id, takeaways);
          }
        }
        return;
      } catch (err: any) {
        if (attempt < retries) {
          // Wait a bit before retrying (rate limit backoff)
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        } else {
          console.warn(`[Takeaways] Failed for "${item.title.substring(0, 40)}": ${err.message}`);
        }
      }
    }
  };

  const generateBatch = async (batch: NewsItem[], concurrency: number) => {
    for (let i = 0; i < batch.length; i += concurrency) {
      const chunk = batch.slice(i, i + concurrency);
      await Promise.all(chunk.map((item) => generateOne(item)));
      // Small delay between batches to avoid rate limits
      if (i + concurrency < batch.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  };

  // Tier 1 (items 0-9): concurrency 3, awaited — user sees these first
  const tier1 = missing.slice(0, 10);
  await generateBatch(tier1, 3);
  console.log(`[Takeaways] Tier 1 done (${tier1.length} items)`);

  // Tier 2 (items 10-29): concurrency 3, fire-and-forget
  const tier2 = missing.slice(10, 30);
  if (tier2.length) {
    generateBatch(tier2, 3).then(() => console.log(`[Takeaways] Tier 2 done (${tier2.length} items)`)).catch(() => {});
  }

  // Tier 3 (items 30+): delayed 2s, concurrency 2
  const tier3 = missing.slice(30);
  if (tier3.length) {
    setTimeout(() => generateBatch(tier3, 2).then(() => console.log(`[Takeaways] Tier 3 done (${tier3.length} items)`)).catch(() => {}), 2000);
  }
}

// Export for Vercel serverless
export default app;

// Start locally when not on Vercel
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`News Reels backend running on http://localhost:${PORT}`);
    console.log(`    GET  /api/news`);
    console.log(`    GET  /api/news?category=ai|tech|startups|product|companies|geopolitical|learn`);
    console.log(`    GET  /api/categories`);
    console.log(`    GET  /api/takeaways?ids=id1,id2`);
    console.log(`    POST /api/translate`);
    console.log(`    POST /api/ai/ask`);
    console.log(`    GET  /api/insights?category=X`);
    console.log(`    GET  /api/digest?category=X`);
    console.log(`    GET  /api/search?q=query`);
  });
}
