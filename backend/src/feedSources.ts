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
  // Big lab blogs — model launches, safety, research announcements
  {
    name: 'OpenAI',
    url: 'https://openai.com/blog/rss.xml',
    category: 'ai',
  },
  {
    name: 'Anthropic',
    url: 'https://www.anthropic.com/rss.xml',
    category: 'ai',
  },
  {
    name: 'Google DeepMind',
    url: 'https://deepmind.google/blog/rss.xml',
    category: 'ai',
  },
  {
    name: 'Google AI',
    url: 'https://blog.google/technology/ai/rss/',
    category: 'ai',
  },
  {
    name: 'Meta AI',
    url: 'https://ai.meta.com/blog/feed/',
    category: 'ai',
  },
  {
    name: 'Mistral AI',
    url: 'https://mistral.ai/news/feed.xml',
    category: 'ai',
  },
  // High-frequency AI news
  {
    name: 'The Decoder',
    url: 'https://the-decoder.com/feed/',
    category: 'ai',
  },
  {
    name: 'VentureBeat AI',
    url: 'https://venturebeat.com/category/ai/feed/',
    category: 'ai',
  },
  {
    name: 'MIT Tech Review AI',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
    category: 'ai',
  },
  // Open source models & HuggingFace
  {
    name: 'Hugging Face',
    url: 'https://huggingface.co/blog/feed.xml',
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

  // ── LEARN ─────────────────────────────────────────────────────────────
  // Prompting techniques, model deep-dives, open source releases, benchmarks

  // Best technical writers on how models work + prompting
  {
    name: "Lil'Log — Lilian Weng",
    url: 'https://lilianweng.github.io/index.xml',
    category: 'learn',
  },
  {
    name: 'Andrej Karpathy',
    url: 'https://karpathy.substack.com/feed',
    category: 'learn',
  },
  {
    name: 'Simon Willison',         // real-world LLM usage, prompting tricks, tool use
    url: 'https://simonwillison.net/atom/everything/',
    category: 'learn',
  },
  {
    name: 'Ahead of AI — Sebastian Raschka',   // LLM research, open source models
    url: 'https://magazine.sebastianraschka.com/feed',
    category: 'learn',
  },
  {
    name: 'The Batch — DeepLearning.AI',       // Andrew Ng's weekly AI digest
    url: 'https://www.deeplearning.ai/the-batch/feed/',
    category: 'learn',
  },

  // Open source model news — what's on HuggingFace, new releases
  {
    name: 'Hugging Face Blog',
    url: 'https://huggingface.co/blog/feed.xml',
    category: 'learn',
  },
  {
    name: 'Interconnects — Nathan Lambert',    // RLHF, fine-tuning, model evals
    url: 'https://www.interconnects.ai/feed',
    category: 'learn',
  },

  // What big players are doing — model cards, evals, system prompts
  {
    name: 'Anthropic Research',
    url: 'https://www.anthropic.com/rss.xml',
    category: 'learn',
  },

  // Broader research & technique breakdowns
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
    name: 'Last Week in AI',
    url: 'https://lastweekinai.substack.com/feed',
    category: 'learn',
  },
  {
    name: 'Import AI — Jack Clark',
    url: 'https://importai.substack.com/feed',
    category: 'learn',
  },
];
