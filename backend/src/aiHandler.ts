import axios from 'axios';

const MODEL = 'gemini-2.5-flash';
function geminiUrl() {
  return `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
}

export interface AiRequest {
  question: string;
  selectedText?: string;
  pageContent?: string;
  articleTitle: string;
}

export async function askGemini(req: AiRequest): Promise<string> {
  const contextParts: string[] = [];

  if (req.pageContent) {
    const excerpt = req.pageContent.substring(0, 4000);
    contextParts.push(`Article content:\n${excerpt}`);
  }

  if (req.selectedText) {
    contextParts.push(`Highlighted text the user is asking about:\n"${req.selectedText}"`);
  }

  const systemContext = `You are a helpful reading assistant. The user is reading an article titled: "${req.articleTitle}".
${contextParts.join('\n\n')}

Guidelines:
- Be concise and clear. 2-4 sentences unless the question genuinely needs more.
- Use plain conversational language, no markdown formatting.
- If asked to summarize, focus on the key insight or news.
- If the user asks a follow-up question, answer it directly using the article context.`;

  const prompt = `${systemContext}\n\nUser: ${req.question}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 512,
    },
  };

  const response = await axios.post(geminiUrl(), body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
  });

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text.trim();
}
