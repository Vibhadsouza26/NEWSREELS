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
  { name: 'OpenAI',           url: 'https://openai.com/blog/rss.xml',                           category: 'ai' },
  { name: 'Anthropic',        url: 'https://www.anthropic.com/rss.xml',                          category: 'ai' },
  { name: 'Google DeepMind',  url: 'https://deepmind.google/blog/rss.xml',                       category: 'ai' },
  { name: 'Google AI',        url: 'https://blog.google/technology/ai/rss/',                     category: 'ai' },
  { name: 'Meta AI',          url: 'https://ai.meta.com/blog/feed/',                             category: 'ai' },
  { name: 'Mistral AI',       url: 'https://mistral.ai/news/feed.xml',                           category: 'ai' },
  { name: 'The Decoder',      url: 'https://the-decoder.com/feed/',                              category: 'ai' },
  { name: 'VentureBeat AI',   url: 'https://venturebeat.com/category/ai/feed/',                  category: 'ai' },
  { name: 'MIT Tech Review AI', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed', category: 'ai' },
  { name: 'Hugging Face',     url: 'https://huggingface.co/blog/feed.xml',                       category: 'ai' },

  // ── TECH ────────────────────────────────────────────────────────────────
  { name: 'TechCrunch',       url: 'https://techcrunch.com/feed/',                               category: 'tech' },
  { name: 'The Verge',        url: 'https://www.theverge.com/rss/index.xml',                     category: 'tech' },
  { name: 'Ars Technica',     url: 'https://feeds.arstechnica.com/arstechnica/index',            category: 'tech' },
  { name: 'Wired',            url: 'https://www.wired.com/feed/rss',                             category: 'tech' },

  // ── STARTUPS ─────────────────────────────────────────────────────────────
  // Global funding rounds, new ideas, startup launches
  { name: 'TechCrunch Startups', url: 'https://techcrunch.com/category/startups/feed/',         category: 'startups' },
  { name: 'TechCrunch Venture',  url: 'https://techcrunch.com/category/venture/feed/',          category: 'startups' },
  { name: 'Crunchbase News',     url: 'https://news.crunchbase.com/feed/',                       category: 'startups' },
  { name: 'YCombinator Blog',    url: 'https://www.ycombinator.com/blog/rss.xml',               category: 'startups' },
  // India startups
  { name: 'Inc42',               url: 'https://inc42.com/feed/',                                 category: 'startups' },
  { name: 'YourStory',           url: 'https://yourstory.com/feed/',                             category: 'startups' },
  // Europe
  { name: 'Sifted',              url: 'https://sifted.eu/feed/',                                 category: 'startups' },

  // ── PRODUCT ─────────────────────────────────────────────────────────────
  { name: '9to5Mac',          url: 'https://9to5mac.com/feed/',                                  category: 'product' },
  { name: 'TechCrunch Apps',  url: 'https://techcrunch.com/category/apps/feed/',                 category: 'product' },
  { name: 'The Verge Product', url: 'https://www.theverge.com/rss/full.xml',                    category: 'product' },

  // ── COMPANIES ───────────────────────────────────────────────────────────
  { name: 'Reuters Tech',     url: 'https://feeds.reuters.com/reuters/technologyNews',           category: 'companies' },
  { name: 'CNBC Tech',        url: 'https://www.cnbc.com/id/19854910/device/rss/rss.html',      category: 'companies' },
  { name: 'Fortune Tech',     url: 'https://fortune.com/section/tech/feed',                      category: 'companies' },
  { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews',             category: 'companies' },

  // ── WORLD (GEOPOLITICAL + MARKETS) ──────────────────────────────────────
  // World events
  { name: 'BBC World',        url: 'http://feeds.bbci.co.uk/news/world/rss.xml',                category: 'geopolitical' },
  { name: 'Reuters World',    url: 'https://feeds.reuters.com/reuters/worldNews',               category: 'geopolitical' },
  { name: 'Al Jazeera',       url: 'https://www.aljazeera.com/xml/rss/all.xml',                 category: 'geopolitical' },
  { name: 'Foreign Policy',   url: 'https://foreignpolicy.com/feed/',                           category: 'geopolitical' },
  // Markets & economy — gold, currency, macro
  { name: 'Reuters Markets',  url: 'https://feeds.reuters.com/reuters/businessNews',            category: 'geopolitical' },
  { name: 'MarketWatch',      url: 'https://feeds.marketwatch.com/marketwatch/topstories/',     category: 'geopolitical' },

  // ── LEARN ────────────────────────────────────────────────────────────────
  // How to use AI better, prompting techniques, new AI tools, AI in daily life

  // Practical AI usage & prompting for everyday people
  { name: 'One Useful Thing — Ethan Mollick', url: 'https://www.oneusefulthing.org/feed',      category: 'learn' },
  { name: 'Simon Willison',   url: 'https://simonwillison.net/atom/everything/',                category: 'learn' },

  // AI engineering & building with AI
  { name: 'Latent Space',     url: 'https://www.latent.space/feed',                             category: 'learn' },
  { name: "Ben's Bites",      url: 'https://bensbites.beehiiv.com/feed',                        category: 'learn' },

  // Deep technical — models, training, research
  { name: "Lil'Log — Lilian Weng", url: 'https://lilianweng.github.io/index.xml',              category: 'learn' },
  { name: 'Andrej Karpathy',  url: 'https://karpathy.substack.com/feed',                        category: 'learn' },

  // Weekly digests
  { name: 'The Batch — DeepLearning.AI', url: 'https://www.deeplearning.ai/the-batch/feed/',   category: 'learn' },
  { name: 'Interconnects — Nathan Lambert', url: 'https://www.interconnects.ai/feed',           category: 'learn' },

  // Open source models & releases
  { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml',                    category: 'learn' },
  { name: 'Anthropic Research', url: 'https://www.anthropic.com/rss.xml',                      category: 'learn' },

  // Research breakdowns
  { name: 'The Gradient',     url: 'https://thegradient.pub/rss/',                              category: 'learn' },
];
