import { askSarvam } from './sarvamClient';
import { NewsItem } from './rssParser';

export interface InsightCard {
  id: string;
  theme: string;
  summary: string;
  articleIds: string[];
  articleTitles: string[];
  articleUrls: string[];
}

export async function generateInsights(articles: NewsItem[]): Promise<InsightCard[]> {
  if (articles.length < 5) return [];

  const titleList = articles
    .slice(0, 20)
    .map((a, i) => `${i + 1}. [${a.id}] ${a.title}`)
    .join('\n');

  const system = `You analyze news articles and find cross-cutting themes. Return exactly 5 insights in this exact format per line:
THEME: <short theme title>
SUMMARY: <1-2 sentence insight connecting the articles>
ARTICLES: <comma-separated numbers of related articles>

No other text. No markdown.`;

  const user = `Find themes across these articles:\n${titleList}`;

  try {
    const response = await askSarvam(system, user);
    const insights: InsightCard[] = [];
    const lines = response.split('\n').filter((l) => l.trim());

    let current: Partial<InsightCard> = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^\s*theme:\s*/i.test(trimmed)) {
        current.theme = trimmed.replace(/^\s*theme:\s*/i, '').trim();
      } else if (/^\s*summary:\s*/i.test(trimmed)) {
        current.summary = trimmed.replace(/^\s*summary:\s*/i, '').trim();
      } else if (/^\s*articles:\s*/i.test(trimmed)) {
        const nums = trimmed
          .replace(/^\s*articles:\s*/i, '')
          .split(',')
          .map((n) => parseInt(n.trim()) - 1)
          .filter((n) => n >= 0 && n < articles.length);

        if (current.theme && current.summary && nums.length > 0) {
          insights.push({
            id: `insight_${insights.length}`,
            theme: current.theme,
            summary: current.summary,
            articleIds: nums.map((n) => articles[n].id),
            articleTitles: nums.map((n) => articles[n].title),
            articleUrls: nums.map((n) => articles[n].url),
          });
        }
        current = {};
      }
    }

    return insights.slice(0, 6);
  } catch (err: any) {
    console.warn(`[Insights] Generation failed: ${err.message}`);
    return [];
  }
}
