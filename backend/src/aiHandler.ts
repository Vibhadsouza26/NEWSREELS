import axios from 'axios';
import { askSarvam } from './sarvamClient';

// Groq — primary (best rate limits)
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

export interface AiRequest {
  question: string;
  selectedText?: string;
  pageContent?: string;
  articleTitle: string;
  articleUrl?: string;
}

function buildSystemPrompt(req: AiRequest): { system: string; user: string } {
  const content = req.pageContent?.trim() ?? '';
  const hasRichContent = content.length > 400;
  const hasPartialContent = content.length > 20;
  const hasSelection = (req.selectedText?.trim().length ?? 0) > 5;

  const noMarkdown = 'CRITICAL FORMAT RULES: Plain text only. NEVER use *, **, •, -, bullet symbols, or markdown. For lists ONLY use numbered format like "1. First point" "2. Second point". Never mix formats. Never use sub-bullets. Keep each point to 1-2 sentences max.';
  const multilingualHint = 'If the user writes in any Indian language, respond in that same language.';
  const followUpHint = 'After your answer, on a new line write FOLLOW_UP: followed by exactly 3 brief follow-up questions separated by |';

  if (hasRichContent) {
    const system = `You are a helpful assistant that answers questions about news articles. ${noMarkdown} ${multilingualHint}`;
    const user = `Article title: "${req.articleTitle}"

Article content:
${content.substring(0, 4500)}
${hasSelection ? `\nUser highlighted: "${req.selectedText}"` : ''}

Question: ${req.question}

Leverage this article content primarily to answer questions. If the answer is not in the article, explicitly state "This isn't covered in the article" but then provide the answer using your general knowledge.

${followUpHint}`;
    return { system, user };
  }

  if (hasPartialContent) {
    const system = `You are a helpful assistant for a news app. ${noMarkdown} ${multilingualHint}`;
    const user = `Article title: "${req.articleTitle}"
Brief description: "${content}"
${hasSelection ? `User highlighted: "${req.selectedText}"` : ''}

Question: ${req.question}

Only the headline and a short description are available. Answer based on these and your knowledge of this topic. Be honest that you are working from limited information.

${followUpHint}`;
    return { system, user };
  }

  const system = `You are a helpful assistant for a news app. ${noMarkdown} ${multilingualHint}`;
  const user = `Article title: "${req.articleTitle}"
${hasSelection ? `User highlighted: "${req.selectedText}"` : ''}

Question: ${req.question}

The article has not loaded yet. Answer based on the headline and your general knowledge of this topic. Note you have not read the article.

${followUpHint}`;
  return { system, user };
}

async function askGroq(req: AiRequest): Promise<string> {
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

async function askSarvamAI(req: AiRequest): Promise<string> {
  const { system, user } = buildSystemPrompt(req);
  return askSarvam(system, user);
}

async function askGeminiFallback(req: AiRequest): Promise<string> {
  const { system, user } = buildSystemPrompt(req);
  const prompt = `${system}\n\n${user}`;
  const model = 'gemini-2.0-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await axios.post(
    url,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
    },
    { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY! }, timeout: 15000 }
  );

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text.trim();
}

export async function askAI(req: AiRequest): Promise<string> {
  // Chain: Groq (primary, best rate limits) → Sarvam → Gemini
  // Always try all three before giving up

  // 1. Groq (primary)
  if (process.env.GROQ_API_KEY) {
    try {
      return await askGroq(req);
    } catch (err: any) {
      console.warn(`[AI] Groq failed: ${err.message} — trying Sarvam`);
    }
  }

  // 2. Sarvam (secondary)
  if (process.env.SARVAM_API_KEY) {
    try {
      return await askSarvamAI(req);
    } catch (err: any) {
      console.warn(`[AI] Sarvam failed: ${err.message} — trying Gemini`);
    }
  }

  // 3. Gemini (last resort)
  if (process.env.GEMINI_API_KEY) {
    try {
      return await askGeminiFallback(req);
    } catch (err: any) {
      console.warn(`[AI] Gemini also failed: ${err.message}`);
    }
  }

  throw new Error('All AI providers failed');
}
