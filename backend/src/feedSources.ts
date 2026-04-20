export type Category = 'ai' | 'tech' | 'startups' | 'product' | 'companies' | 'geopolitical' | 'learn';

export const ALL_CATEGORIES: Category[] = ['ai', 'tech', 'startups', 'product', 'companies', 'geopolitical', 'learn'];

export interface FeedSource {
  name: string;
  url: string;
  category: Category;
  isYouTube?: boolean;
}

function ytFeed(channelId: string): string {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
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

  // ── TECH ────────────────────────────────────────────────────────────────
  { name: 'TechCrunch',           url: 'https://techcrunch.com/feed/',                                          category: 'tech' },
  { name: 'The Verge',            url: 'https://www.theverge.com/rss/index.xml',                                category: 'tech' },
  { name: 'Ars Technica',         url: 'https://feeds.arstechnica.com/arstechnica/index',                       category: 'tech' },
  { name: 'Wired',                url: 'https://www.wired.com/feed/rss',                                        category: 'tech' },
  { name: 'Engadget',             url: 'https://www.engadget.com/rss.xml',                                      category: 'tech' },
  { name: 'The Register',         url: 'https://www.theregister.com/headlines.atom',                            category: 'tech' },
  { name: 'Hacker News',          url: 'https://hnrss.org/frontpage?points=100',                                category: 'tech' },
  { name: 'MIT Tech Review',      url: 'https://www.technologyreview.com/feed/',                                category: 'tech' },
  { name: 'CNET',                 url: 'https://www.cnet.com/rss/news/',                                        category: 'tech' },

  // ── STARTUPS ─────────────────────────────────────────────────────────────
  // What new companies are building — founder journeys, ideas, what made them
  // different, marketing plays, product launches. NOT VC funding rounds.

  // India ecosystem — new startups, founder stories, what they're doing
  { name: 'YourStory',            url: 'https://yourstory.com/feed/',                                           category: 'startups' },
  { name: 'Inc42',                url: 'https://inc42.com/features/feed/',                                      category: 'startups' },
  { name: 'Entrackr',             url: 'https://entrackr.com/feed/',                                            category: 'startups' },

  // Global — what startups are building and how they grew
  { name: 'Product Hunt',         url: 'https://www.producthunt.com/feed',                                      category: 'startups' },
  { name: 'Startup Grind',        url: 'https://medium.com/feed/startup-grind',                                 category: 'startups' },
  { name: 'First Round Review',   url: 'https://review.firstround.com/feed.xml',                                category: 'startups' },
  { name: 'YCombinator',          url: 'https://www.ycombinator.com/blog/rss.xml',                              category: 'startups' },
  { name: 'Show HN',              url: 'https://hnrss.org/show?points=50',                                      category: 'startups' },
  { name: 'EU-Startups',          url: 'https://www.eu-startups.com/feed/',                                     category: 'startups' },

  // ── PRODUCT ─────────────────────────────────────────────────────────────
  { name: '9to5Mac',              url: 'https://9to5mac.com/feed/',                                             category: 'product' },
  { name: '9to5Google',           url: 'https://9to5google.com/feed/',                                          category: 'product' },
  { name: 'TechCrunch Apps',      url: 'https://techcrunch.com/category/apps/feed/',                            category: 'product' },
  { name: 'Android Authority',    url: 'https://www.androidauthority.com/feed/',                                category: 'product' },

  // ── COMPANIES ───────────────────────────────────────────────────────────
  // Big company moves, earnings, strategy, leadership — Apple, Google, Meta etc.
  { name: 'CNBC Tech',            url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19854910', category: 'companies' },
  { name: 'VentureBeat',          url: 'https://venturebeat.com/feed/',                                         category: 'companies' },
  { name: 'Wired Business',       url: 'https://www.wired.com/feed/category/business/latest/rss',               category: 'companies' },

  // ── WORLD — Pure Geopolitics ────────────────────────────────────────────
  // Conflicts, diplomacy, political movements, power shifts, global affairs.
  // No markets, no finance — that's Companies. No paywall sources.
  { name: 'BBC World',            url: 'https://feeds.bbci.co.uk/news/world/rss.xml',                           category: 'geopolitical' },
  { name: 'Al Jazeera',           url: 'https://www.aljazeera.com/xml/rss/all.xml',                             category: 'geopolitical' },
  { name: 'The Guardian World',   url: 'https://www.theguardian.com/world/rss',                                 category: 'geopolitical' },
  { name: 'DW World',             url: 'https://rss.dw.com/rdf/rss-en-world',                                   category: 'geopolitical' },
  { name: 'France 24',            url: 'https://www.france24.com/en/rss',                                       category: 'geopolitical' },
  { name: 'UN News',              url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml',                category: 'geopolitical' },
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
  { name: 'The Batch',            url: 'https://www.deeplearning.ai/the-batch/feed/',                           category: 'learn' },

  // ── YOUTUBE PODCASTS ──────────────────────────────────────────────────────
  // Category is a default — each video gets classified dynamically by title.
  // AI-focused podcasts
  { name: 'Lex Fridman',          url: ytFeed('UCSHZKyawb77ixDdsGog4iWA'), category: 'ai',           isYouTube: true },
  { name: 'No Priors',            url: ytFeed('UCSI7h9hydQ40K5MJHnCrQvw'), category: 'ai',           isYouTube: true },
  { name: 'Dwarkesh Podcast',     url: ytFeed('UCXl4i9dYBrFOabk0xGmbkRA'), category: 'ai',           isYouTube: true },
  { name: 'Latent Space Pod',     url: ytFeed('UCxBcwypKK-W3GHd_RZ9FZrQ'), category: 'ai',           isYouTube: true },
  { name: 'TWIML AI',             url: ytFeed('UC7kjWIK1H8tfmFlzZO-wHMw'), category: 'ai',           isYouTube: true },
  { name: 'NVIDIA AI Podcast',    url: ytFeed('UCZ-R3VhhIwOnK-Wb0ue2SCA'), category: 'ai',           isYouTube: true },
  { name: 'Eye on AI',            url: ytFeed('UC-o9u9QL4zXzBwjvT1gmzNg'), category: 'ai',           isYouTube: true },

  // Tech podcasts
  { name: 'The Vergecast',        url: ytFeed('UCVHdvAX5-R8y5l9xp6nroBQ'), category: 'tech',         isYouTube: true },
  { name: 'Waveform Podcast',     url: ytFeed('UCEcrRXW3oEYfUctetZTAWLw'), category: 'tech',         isYouTube: true },
  { name: 'TWiT',                 url: ytFeed('UCagoIYmo_gO1iVaCeeSikEg'), category: 'tech',         isYouTube: true },
  { name: 'All-In Podcast',       url: ytFeed('UCESLZhusAkFfsNsApnjF_Cg'), category: 'tech',         isYouTube: true },
  { name: 'The Changelog',        url: ytFeed('UCZbtcRQHGpU_tt2yM4C7k0A'), category: 'tech',         isYouTube: true },
  { name: 'BG2 Pod',              url: ytFeed('UC-yRDvpR99LUc5l7i7jLzew'), category: 'tech',         isYouTube: true },

  // Startups & entrepreneurship podcasts
  { name: '20VC',                  url: ytFeed('UCf0PBRjhf0rF8fWBIxTuoWA'), category: 'startups',     isYouTube: true },
  { name: 'My First Million',     url: ytFeed('UCyaN6mg5u8Cjy2ZI4ikWaug'), category: 'startups',     isYouTube: true },
  { name: 'This Week in Startups', url: ytFeed('UCkkhmBWfS7pILYIk0izkc3A'), category: 'startups',    isYouTube: true },
  { name: 'How I Built This',     url: ytFeed('UCNSfrxNEmCruNtjIzxCBHjg'), category: 'startups',     isYouTube: true },
  { name: 'Diary of a CEO',       url: ytFeed('UCGq-a57w-aPwyi3pW7XLiHw'), category: 'startups',     isYouTube: true },
  { name: 'Masters of Scale',     url: ytFeed('UCiemDAS1bXMBTx3jIIOukFg'), category: 'startups',     isYouTube: true },
  { name: 'The Pitch',            url: ytFeed('UCwnsSwjrVvNrxP15gZLbQMA'), category: 'startups',     isYouTube: true },

  // Product podcasts
  { name: "Lenny's Podcast",      url: ytFeed('UC6t1O76G0jYXOAoYCm153dA'), category: 'product',      isYouTube: true },
  { name: 'MKBHD',                url: ytFeed('UCBJycsmduvYEL83R_U4JriQ'), category: 'product',      isYouTube: true },
  { name: 'Linus Tech Tips',      url: ytFeed('UCXuqSBlHAE6Xw-yeJA0Tunw'), category: 'product',      isYouTube: true },
  { name: 'CNET YouTube',         url: ytFeed('UCOmcA3f_RrH6b9NmcNa4tdg'), category: 'product',      isYouTube: true },

  // Companies & business podcasts
  { name: 'Acquired',             url: ytFeed('UCyFqFYfTW2VoIQKylJ04Rtw'), category: 'companies',    isYouTube: true },
  { name: 'Prof G Pod',           url: ytFeed('UC1E1SVcVyU3ntWMSQEp38Yw'), category: 'companies',    isYouTube: true },
  { name: 'Bloomberg Podcasts',   url: ytFeed('UChF5O40UBqAc82I7-i5ig6A'), category: 'companies',    isYouTube: true },
  { name: 'Real Vision',          url: ytFeed('UCBH5VZE_Y4F3CMcPIzPEB5A'), category: 'companies',    isYouTube: true },
  { name: 'Valuetainment',        url: ytFeed('UCIHdDJ0tjn_3j-FS7s_X1kQ'), category: 'companies',    isYouTube: true },
  { name: 'Think School',         url: ytFeed('UCKZozRVHRYsYHGEyNKuhhdA'), category: 'companies',    isYouTube: true },

  // Geopolitics podcasts
  { name: 'CaspianReport',        url: ytFeed('UCwnKziETDbHJtx78nIkfYug'), category: 'geopolitical', isYouTube: true },
  { name: 'Zeihan on Geopolitics', url: ytFeed('UCsy9I56PY3IngCf_VGjunMQ'), category: 'geopolitical', isYouTube: true },
  { name: 'Fareed Zakaria GPS',   url: ytFeed('UCm8Tj3OHh4RUOW2z5wD3cHA'), category: 'geopolitical', isYouTube: true },
  { name: 'TLDR News Global',     url: ytFeed('UC-uhvujip5deVcEtLxnW8qg'), category: 'geopolitical', isYouTube: true },
  { name: 'Geopolitics Decanted', url: ytFeed('UCIdb5_KxhGjQzi3RlM8eBhQ'), category: 'geopolitical', isYouTube: true },

  // Learn — educational podcasts & explainers
  { name: 'Huberman Lab',         url: ytFeed('UC2D2CMWXMOVWx7giW1n3LIg'), category: 'learn',        isYouTube: true },
  { name: 'Veritasium',           url: ytFeed('UCHnyfMqiRRG1u-2MsSQLbXA'), category: 'learn',        isYouTube: true },
  { name: 'Wendover Productions', url: ytFeed('UC9RM-iSvTu1uPJb8X5yp3EQ'), category: 'learn',        isYouTube: true },
  { name: 'Radiolab',             url: ytFeed('UCaum_fMDGgFQCmKHUBPq_xg'), category: 'learn',        isYouTube: true },
  { name: 'StarTalk',             url: ytFeed('UCqoAEDirJPjEUFcF2FklnBA'), category: 'learn',        isYouTube: true },
];
