# News Reels

A TikTok/Reels-style vertical scroll news app for AI, tech, startups, geopolitics, and more. Swipe through full-screen cards, tap to read the full article in-app, and ask an AI assistant questions about any story.

---

## What It Does

- **Snap-scroll feed** — full-screen cards, swipe up/down between stories
- **7 categories** — AI, Tech, Startups, Product, Companies, World, Learn
- **In-app article reader** — WebView with content extraction, no leaving the app
- **AI assistant** — ask questions, get summaries, key takeaways, impact analysis
- **Live RSS aggregation** — 40+ curated sources, refreshed every 10 minutes
- **Android APK** — built and distributed via EAS Build

---

## Architecture

```
news-reels/
├── backend/          Node.js + Express (deployed on Vercel)
│   └── src/
│       ├── server.ts         Express routes + in-memory cache
│       ├── feedSources.ts    All RSS feed URLs by category
│       ├── rssParser.ts      Fetch + parse feeds → NewsItem[]
│       ├── hnApi.ts          Hacker News API (tech category)
│       └── aiHandler.ts      Groq (primary) + Gemini (fallback) AI
│
└── mobile/           React Native + Expo SDK 54
    ├── app/
    │   ├── index.tsx         Snap-scroll feed (FlatList + pagingEnabled)
    │   ├── article.tsx       WebView article reader
    │   └── _layout.tsx       Expo Router layout
    ├── components/
    │   ├── NewsCard.tsx       Full-bleed card with gradient overlay
    │   ├── CategoryTabs.tsx   Bottom navigation bar with category pills
    │   ├── AiBottomSheet.tsx  AI assistant drawer
    │   └── SkeletonCard.tsx   Loading placeholder
    └── hooks/
        └── useNewsFeed.ts    react-query data fetching hook
```

---

## Tech Stack

### Backend
| Package | Purpose |
|---|---|
| `express` | HTTP server |
| `rss-parser` | Parse RSS/Atom feeds |
| `node-cache` | In-memory TTL cache (10 min) |
| `axios` | HTTP requests |
| `cors` | Allow React Native app to call the API |

### Mobile
| Package | Purpose |
|---|---|
| `expo` SDK 54 | Cross-platform iOS/Android |
| `expo-router` | File-based navigation |
| `react-native-reanimated` | Smooth animations |
| `react-native-gesture-handler` | Swipe gestures |
| `react-native-webview` | In-app article browser |
| `@tanstack/react-query` | Data fetching + background refresh |
| `expo-image` | Performant image loading |
| `expo-linear-gradient` | Full-bleed card gradients |
| `dayjs` | Relative time formatting |

---

## Feed Sources by Category

### AI
- OpenAI Blog, Google DeepMind, Google Research, Hugging Face
- AI News, MarkTechPost, VentureBeat AI, MIT Tech Review AI, The Gradient

### Tech
- TechCrunch, The Verge, Ars Technica, Wired, 9to5Google
- Engadget, The Register, MIT Tech Review, CNET
- Hacker News frontpage (100+ points filter)

### Startups
Focus: new companies, what they're building, marketing plays, founder journeys — not funding rounds.
- **India**: YourStory, Inc42 Features, Entrackr
- **Global**: Product Hunt Daily, Startup Grind, First Round Review, YCombinator Blog, Show HN (50+ points), EU-Startups

### Product
- 9to5Mac, 9to5Google, TechCrunch Apps, Android Authority, The Verge

### Companies
Big tech moves, strategy, earnings — Apple, Google, Meta, etc.
- CNBC Tech, Fortune Tech, VentureBeat, Wired Business

### World (Geopolitics)
Pure geopolitics — conflicts, diplomacy, power shifts. No markets, no finance.
- BBC World, Al Jazeera, The Guardian World, DW World, France 24
- UN News, Crisis Group, Chatham House, ECFR, Global Voices

### Learn
Prompting techniques, building with AI, model releases, AI literacy.
- One Useful Thing, Simon Willison, Latent Space, Ben's Bites
- Lil'Log, Interconnects, The Gradient, Hugging Face Blog, The Batch (DeepLearning.AI)

---

## API Endpoints

```
GET  /api/news                    → all categories, sorted newest first
GET  /api/news?category=ai        → single category
GET  /api/news?category=tech
GET  /api/news?category=startups
GET  /api/news?category=product
GET  /api/news?category=companies
GET  /api/news?category=geopolitical
GET  /api/news?category=learn
GET  /api/categories              → list of available categories
POST /api/ai/ask                  → AI question about an article
```

### NewsItem shape
```ts
interface NewsItem {
  id: string;           // hash of URL
  title: string;
  url: string;
  imageUrl?: string;
  sourceName: string;
  category: Category;
  publishedAt: Date;
  description?: string;
}
```

---

## AI Assistant

Powered by **Groq (llama-3.3-70b-versatile)** as primary, **Gemini 2.0 Flash Lite** as fallback.

Three-tier prompt system based on available content:
1. **Rich content** (full article extracted via WebView JS injection) → answers strictly from article
2. **Partial content** (RSS description, 20+ chars) → answers from description + general knowledge
3. **No content** → answers from title + general knowledge

Quick actions available in the UI:
- Summarize
- Key takeaways
- Explain simply
- What's the impact?

All responses are plain text (no markdown formatting) for clean display in React Native.

---

## Running Locally

### Backend
```bash
cd backend
npm install
# Create .env with:
# GROQ_API_KEY=your_key
# GEMINI_API_KEY=your_key (optional fallback)
npx ts-node src/server.ts
# → http://localhost:3001
```

### Mobile
```bash
cd mobile
npm install
npx expo start
# Scan QR with Expo Go, or press 'a' for Android emulator
```

---

## Building the APK

```bash
cd mobile
npx eas build --platform android --profile preview
```

Requires:
- EAS CLI: `npm install -g eas-cli`
- Expo account logged in: `eas login`
- `.npmrc` with `legacy-peer-deps=true` (already committed)

---

## Deployment

Backend is deployed as a Vercel serverless function. Push to `main` triggers auto-deploy.

```bash
git push origin main   # triggers Vercel redeploy automatically
```

Environment variables set in Vercel dashboard:
- `GROQ_API_KEY`
- `GEMINI_API_KEY`

---

## Key Design Decisions

**Why Groq over Gemini?**
Gemini 2.5 Flash hit 503s and daily quota limits (200 req/day free tier) during testing. Groq gives 14,400 req/day on the free tier with faster responses.

**Why RSS-only for startups (no Hacker News top stories)?**
HN top stories are general tech/science — penguins, Linux, space — not startup content. Show HN (hnrss.org/show?points=50) is specifically builders sharing what they made, which is what belongs in startups.

**Why no Reuters?**
Reuters killed their RSS feeds in June 2020. All `feeds.reuters.com` URLs return empty.

**Why `legacy-peer-deps=true` in `.npmrc`?**
React Native 0.81 + Expo SDK 54 + react-native-reanimated 4.x have peer dependency conflicts that npm 7+ rejects by default. EAS Build uses npm and respects `.npmrc`, so this file must be committed.

**Why WebView JS injection for article content?**
RSS feeds only provide short descriptions (~50–100 chars). For the AI to give meaningful answers, the full article text needs to be extracted from the page after it loads. JS injection reads `document.body.innerText` and passes it back to React Native via `onMessage`.
