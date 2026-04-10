import axios from 'axios';

// Groq free tier: 14,400 req/day, sub-1s responses, no billing required.
// Model: llama-3.3-70b-versatile is high quality and very fast.
// Fallback: gemini-2.0-flash if GEMINI_API_KEY is also set.
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export interface AiRequest {
  question: string;
  selectedText?: string;
  pageContent?: string;
  articleTitle: string;
}

function buildSystemPrompt(req: AiRequest): { system: string; user: string } {
  const content = req.pageContent?.trim() ?? '';
  const hasRichContent = content.length > 400;
  const hasPartialContent = content.length > 20;
  const hasSelection = (req.selectedText?.trim().length ?? 0) > 5;

  const noMarkdown = 'Use plain text only. No asterisks, no bullet symbols, no bold markers, no markdown. If you need to list items, use "1. ... 2. ... 3. ..." format. Short paragraphs.';

  if (hasRichContent) {
    const system = `You are a helpful assistant that answers questions about news articles. ${noMarkdown}`;
    const user = `Article title: "${req.articleTitle}"

Article content:
${content.substring(0, 4500)}
${hasSelection ? `\nUser highlighted: "${req.selectedText}"` : ''}

Question: ${req.question}

Answer only from the article content. If asked to summarize, summarize what the article actually says. If the question is not covered in the article, say so briefly.`;
    return { system, user };
  }

  if (hasPartialContent) {
    const system = `You are a helpful assistant for a news app. ${noMarkdown}`;
    const user = `Article title: "${req.articleTitle}"
Brief description: "${content}"
${hasSelection ? `User highlighted: "${req.selectedText}"` : ''}

Question: ${req.question}

Only the headline and a short description are available. Answer based on these and your knowledge of this topic. Be honest that you are working from limited information.`;
    return { system, user };
  }

  const system = `You are a helpful assistant for a news app. ${noMarkdown}`;
  const user = `Article title: "${req.articleTitle}"
${hasSelection ? `User highlighted: "${req.selectedText}"` : ''}

Question: ${req.question}

The article has not loaded yet. Answer based on the headline and your general knowledge of this topic. Note you have not read the article.`;
  return { system, user };
}

export async function askGroq(req: AiRequest): Promise<string> {
  const { system, user } = buildSystemPrompt(req);

  const response = await axios.post(
    GROQ_URL,
    {
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 800,
      temperature: 0.4,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      timeout: 15000,
    }
  );

  const text = response.data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from Groq');
  return text.trim();
}

// Keep Gemini as fallback if GEMINI_API_KEY is set
async function askGeminiFallback(req: AiRequest): Promise<string> {
  const { system, user } = buildSystemPrompt(req);
  const prompt = `${system}\n\n${user}`;
  const model = 'gemini-2.0-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await axios.post(
    url,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
  );

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text.trim();
}

export async function askAI(req: AiRequest): Promise<string> {
  // Try Groq first (more generous free tier)
  if (process.env.GROQ_API_KEY) {
    try {
      return await askGroq(req);
    } catch (err: any) {
      const status = err?.response?.status;
      // Only fall through to Gemini on rate limit or server errors
      if (status !== 429 && status !== 503 && status !== 500) throw err;
      console.warn('[AI] Groq failed with', status, '— trying Gemini fallback');
    }
  }

  // Fallback to Gemini
  if (process.env.GEMINI_API_KEY) {
    return await askGeminiFallback(req);
  }

  throw new Error('No AI API key configured');
}
