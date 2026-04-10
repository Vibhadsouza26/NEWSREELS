import axios from 'axios';

// Primary: 2.0-flash is stable and fast on free tier.
// Fallback: 2.0-flash-lite if primary is rate-limited or unavailable.
const MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];

function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
}

export interface AiRequest {
  question: string;
  selectedText?: string;
  pageContent?: string;
  articleTitle: string;
}

function buildPrompt(req: AiRequest): string {
  const content = req.pageContent?.trim() ?? '';
  const hasRichContent = content.length > 400;
  const hasPartialContent = content.length > 20;
  const hasSelection = (req.selectedText?.trim().length ?? 0) > 5;

  const noMarkdown = 'PLAIN TEXT ONLY. No asterisks, no bullet symbols, no bold markers, no markdown. If listing items use "1. ... 2. ... 3. ..." format. Short paragraphs.';

  if (hasRichContent) {
    return `You are a helpful assistant. Answer questions strictly based on the article content below.

Article title: "${req.articleTitle}"

Article content:
${content.substring(0, 4500)}
${hasSelection ? `\nUser highlighted this passage:\n"${req.selectedText}"` : ''}

User question: ${req.question}

Instructions:
- Answer ONLY from the article content above.
- If asked to summarize: give a clear concise summary of what the article actually says.
- If the question is about something not in the article, say so briefly.
- You may clarify technical terms that appear in the article.
- ${noMarkdown}`;
  }

  if (hasPartialContent) {
    return `You are a helpful assistant for a news app.

Article title: "${req.articleTitle}"
Brief description: "${content}"
${hasSelection ? `\nUser highlighted: "${req.selectedText}"` : ''}

User question: ${req.question}

Only the headline and a brief snippet are available. Answer helpfully using the title, snippet, and your knowledge of this topic. Note you are working from limited info. Do not invent specific facts.
${noMarkdown} Be direct and useful.`;
  }

  return `You are a helpful assistant for a news app.

Article title: "${req.articleTitle}"
${hasSelection ? `\nUser highlighted: "${req.selectedText}"` : ''}

User question: ${req.question}

The article content has not loaded yet. Answer based on the headline and your knowledge of this topic. Note you have not read the article.
${noMarkdown} Be direct.`;
}

export async function askGemini(req: AiRequest): Promise<string> {
  const prompt = buildPrompt(req);
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
  };

  let lastError: any;
  for (const model of MODELS) {
    try {
      const response = await axios.post(geminiUrl(model), body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text.trim();
      throw new Error('Empty response');
    } catch (err: any) {
      const status = err?.response?.status;
      // Only retry on rate limit (429) or server overload (503)
      if (status === 429 || status === 503 || status === 500) {
        lastError = err;
        await new Promise((r) => setTimeout(r, 800));
        continue;
      }
      throw err;
    }
  }
  throw lastError ?? new Error('All models failed');
}
