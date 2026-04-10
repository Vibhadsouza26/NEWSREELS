export type Category = 'ai' | 'tech' | 'startups' | 'product' | 'companies' | 'geopolitical' | 'learn';

export const ALL_CATEGORIES: Category[] = ['ai', 'tech', 'startups', 'product', 'companies', 'geopolitical', 'learn'];

export interface FeedSource {
  name: string;
  url: string;
  category: Category;
}

export const FEED_SOURCES: FeedSource[] = [
  // ── AI ──────────────────────────────────────────────────────────────────
  // Note: Anthropic, Meta AI, Mistral have no official RSS feeds.
  // Reuters RSS is dead since 2020 — not used anywhere below.
  { name: 'OpenAI',               url: 'https://openai.com/news/rss.xml',                                      category: 'ai' },
  { name: 'Google DeepMind',      url: 'https://deepmind.google/blog/rss.xml',                                  category: 'ai' },
  { name: 'Google Research',      url: 'https://research.google/blog/rss/',                                     category: 'ai' },
  { name: 'Hugging Face',         url: 'https://huggingface.co/blog/feed.xml',                                  category: 'ai' },
  { name: 'AI News',              url: 'https://www.artificialintelligence-news.com/feed/rss/',                 category: 'ai' },
  { name: 'MarkTechPost',         url: 'https://www.marktechpost.com/feed/',                                    category: 'ai' },
  { name: 'VentureBeat AI',       url: 'https://venturebeat.com/category/ai/feed/',                             category: 'ai' },
  { name: 'MIT Tech Review AI',   url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',   category: 'ai' },
  { name: 'The Gradient',         url: 'https://thegradient.pub/rss/',                                          category: 'ai' },

  // ── TECH ────────────────────────────────────────────────────────────────
  { name: 'TechCrunch',           url: 'https://techcrunch.com/feed/',                                          category: 'tech' },
  { name: 'The Verge',            url: 'https://www.theverge.com/rss/index.xml',                                category: 'tech' },
  { name: 'Ars Technica',         url: 'https://feeds.arstechnica.com/arstechnica/index',                       category: 'tech' },
  { name: 'Wired',                url: 'https://www.wired.com/feed/rss',                                        category: 'tech' },
  { name: '9to5Google',           url: 'https://9to5google.com/feed/',                                          category: 'tech' },

  // ── STARTUPS ─────────────────────────────────────────────────────────────
  // Global + India + Europe — funding rounds, new companies, ideas
  { name: 'TechCrunch Startups',  url: 'https://techcrunch.com/category/startups/feed/',                        category: 'startups' },
  { name: 'TechCrunch Venture',   url: 'https://techcrunch.com/category/venture/feed/',                         category: 'startups' },
  { name: 'TechCrunch Fundings',  url: 'https://techcrunch.com/fundings-exits/feed/',                           category: 'startups' },
  { name: 'YCombinator',          url: 'https://www.ycombinator.com/blog/rss.xml',                              category: 'startups' },
  { name: 'EU-Startups',          url: 'https://www.eu-startups.com/feed/',                                     category: 'startups' },
  // India
  { name: 'Inc42',                url: 'https://inc42.com/feed/',                                               category: 'startups' },
  { name: 'YourStory',            url: 'https://yourstory.com/feed/',                                           category: 'startups' },

  // ── PRODUCT ─────────────────────────────────────────────────────────────
  { name: '9to5Mac',              url: 'https://9to5mac.com/feed/',                                             category: 'product' },
  { name: '9to5Google',           url: 'https://9to5google.com/feed/',                                          category: 'product' },
  { name: 'TechCrunch Apps',      url: 'https://techcrunch.com/category/apps/feed/',                            category: 'product' },
  { name: 'Android Authority',    url: 'https://www.androidauthority.com/feed/',                                category: 'product' },
  { name: 'The Verge',            url: 'https://www.theverge.com/rss/index.xml',                                category: 'product' },

  // ── COMPANIES ───────────────────────────────────────────────────────────
  { name: 'CNBC Tech',            url: 'https://www.cnbc.com/id/15838652/device/rss/rss.html',                  category: 'companies' },
  { name: 'Fortune Tech',         url: 'https://fortune.com/section/tech/feed',                                  category: 'companies' },
  { name: 'MarketWatch',          url: 'https://feeds.marketwatch.com/marketwatch/topstories/',                  category: 'companies' },
  { name: 'VentureBeat',          url: 'https://venturebeat.com/feed/',                                         category: 'companies' },

  // ── WORLD — Geopolitics + Markets ───────────────────────────────────────
  // Free sources only. Reuters RSS is dead. Foreign Policy is paywalled.
  // Coverage: world events, conflicts, diplomacy, gold/macro, market moves.
  { name: 'BBC World',            url: 'https://feeds.bbci.co.uk/news/world/rss.xml',                           category: 'geopolitical' },
  { name: 'Al Jazeera',           url: 'https://www.aljazeera.com/xml/rss/all.xml',                             category: 'geopolitical' },
  { name: 'UN News',              url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml',                category: 'geopolitical' },
  { name: 'Chatham House',        url: 'https://www.chathamhouse.org/rss/all',                                  category: 'geopolitical' },
  { name: 'Crisis Group',         url: 'https://www.crisisgroup.org/rss',                                       category: 'geopolitical' },
  { name: 'ECFR',                 url: 'https://ecfr.eu/feed/',                                                  category: 'geopolitical' },
  { name: 'MarketWatch',          url: 'https://feeds.marketwatch.com/marketwatch/topstories/',                  category: 'geopolitical' },
  { name: 'Global Voices',        url: 'https://globalvoices.org/feeds/',                                        category: 'geopolitical' },

  // ── LEARN ─────────────────────────────────────────────────────────────
  // How to use AI better, prompting techniques, building with AI, new models
  { name: 'One Useful Thing',     url: 'https://www.oneusefulthing.org/feed',                                   category: 'learn' },
  { name: 'Simon Willison',       url: 'https://simonwillison.net/atom/everything/',                            category: 'learn' },
  { name: 'Latent Space',         url: 'https://www.latent.space/feed',                                         category: 'learn' },
  { name: "Ben's Bites",          url: 'https://bensbites.substack.com/feed',                                   category: 'learn' },
  { name: "Lil'Log",              url: 'https://lilianweng.github.io/index.xml',                                 category: 'learn' },
  { name: 'Interconnects',        url: 'https://www.interconnects.ai/feed',                                     category: 'learn' },
  { name: 'The Gradient',         url: 'https://thegradient.pub/rss/',                                          category: 'learn' },
  { name: 'Hugging Face Blog',    url: 'https://huggingface.co/blog/feed.xml',                                  category: 'learn' },
  { name: 'The Batch',            url: 'https://www.deeplearning.ai/the-batch/feed/',                           category: 'learn' },
];
