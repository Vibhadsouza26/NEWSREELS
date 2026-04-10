export type Category = 'ai' | 'tech' | 'startups' | 'product' | 'companies' | 'geopolitical' | 'learn';

export const ALL_CATEGORIES: Category[] = ['ai', 'tech', 'startups', 'product', 'companies', 'geopolitical', 'learn'];

export interface FeedSource {
  name: string;
  url: string;
  category: Category;
  logoUrl?: string;
}

export const FEED_SOURCES: FeedSource[] = [
  // ── AI ──────────────────────────────────────────────────────────────────
  {
    name: 'OpenAI',
    url: 'https://openai.com/blog/rss.xml',
    category: 'ai',
  },
  {
    name: 'Hugging Face',
    url: 'https://huggingface.co/blog/feed.xml',
    category: 'ai',
  },
  {
    name: 'Google AI',
    url: 'https://blog.google/technology/ai/rss/',
    category: 'ai',
  },
  {
    name: 'Anthropic',
    url: 'https://www.anthropic.com/rss.xml',
    category: 'ai',
  },
  {
    name: 'MIT Tech Review AI',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
    category: 'ai',
  },
  {
    name: 'VentureBeat AI',
    url: 'https://venturebeat.com/category/ai/feed/',
    category: 'ai',
  },

  // ── TECH ────────────────────────────────────────────────────────────────
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'tech',
  },
  {
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'tech',
  },
  {
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    category: 'tech',
  },
  {
    name: 'Wired',
    url: 'https://www.wired.com/feed/rss',
    category: 'tech',
  },

  // ── STARTUPS ────────────────────────────────────────────────────────────
  // HN is fetched separately via hnApi.ts
  {
    name: 'TechCrunch Startups',
    url: 'https://techcrunch.com/category/startups/feed/',
    category: 'startups',
  },
  {
    name: 'VentureBeat',
    url: 'https://venturebeat.com/feed/',
    category: 'startups',
  },

  // ── PRODUCT ─────────────────────────────────────────────────────────────
  {
    name: '9to5Mac',
    url: 'https://9to5mac.com/feed/',
    category: 'product',
  },
  {
    name: 'TechCrunch Apps',
    url: 'https://techcrunch.com/category/apps/feed/',
    category: 'product',
  },
  {
    name: 'The Verge Product',
    url: 'https://www.theverge.com/rss/full.xml',
    category: 'product',
  },

  // ── COMPANIES ───────────────────────────────────────────────────────────
  {
    name: 'Reuters Tech',
    url: 'https://feeds.reuters.com/reuters/technologyNews',
    category: 'companies',
  },
  {
    name: 'CNBC Tech',
    url: 'https://www.cnbc.com/id/19854910/device/rss/rss.html',
    category: 'companies',
  },
  {
    name: 'Fortune Tech',
    url: 'https://fortune.com/section/tech/feed',
    category: 'companies',
  },

  // ── GEOPOLITICAL ────────────────────────────────────────────────────────
  {
    name: 'BBC World',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'geopolitical',
  },
  {
    name: 'Reuters World',
    url: 'https://feeds.reuters.com/reuters/worldNews',
    category: 'geopolitical',
  },
  {
    name: 'Al Jazeera',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    category: 'geopolitical',
  },

  // ── LEARN ───────────────────────────────────────────────────────────────
  {
    name: "Lil'Log (Lilian Weng)",
    url: 'https://lilianweng.github.io/index.xml',
    category: 'learn',
  },
  {
    name: 'Simon Willison',
    url: 'https://simonwillison.net/atom/everything/',
    category: 'learn',
  },
  {
    name: 'The Gradient',
    url: 'https://thegradient.pub/rss/',
    category: 'learn',
  },
  {
    name: 'BAIR Blog',
    url: 'https://bair.berkeley.edu/blog/feed.xml',
    category: 'learn',
  },
  {
    name: 'Interconnects',
    url: 'https://www.interconnects.ai/feed',
    category: 'learn',
  },
  {
    name: 'Sebastian Ruder',
    url: 'https://ruder.io/rss/index.rss',
    category: 'learn',
  },
  {
    name: 'Andrej Karpathy',
    url: 'https://karpathy.substack.com/feed',
    category: 'learn',
  },
  {
    name: 'Hugging Face Papers',
    url: 'https://huggingface.co/blog/feed.xml',
    category: 'learn',
  },
  {
    name: 'Distill.pub',
    url: 'https://distill.pub/rss.xml',
    category: 'learn',
  },
  {
    name: 'Anthropic Research',
    url: 'https://www.anthropic.com/rss.xml',
    category: 'learn',
  },
];
