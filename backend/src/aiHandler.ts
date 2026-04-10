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
  const hasPageContent = req.pageContent && req.pageContent.trim().length > 100;
  const hasSelection = req.selectedText && req.selectedText.trim().length > 5;

  const prompt = hasPageContent
    ? `You are a helpful assistant. Answer questions strictly based on the article content below. Do not use outside knowledge except to briefly explain technical terms that appear in the article.

Article title: "${req.articleTitle}"

Article content:
${req.pageContent!.substring(0, 4000)}
${hasSelection ? `\nUser highlighted this specific passage:\n"${req.selectedText}"` : ''}

User question: ${req.question}

Instructions:
- Answer ONLY from the article content above. Quote or paraphrase specific parts when relevant.
- If asked to summarize: give a concise summary of what the article actually says.
- If the question asks about something not in the article, say so, then describe what the article does cover.
- You may explain technical terms or acronyms that appear in the article.
- Use plain text, no markdown. Be direct and concise.`
    : `You are a helpful assistant. The article content has not loaded yet.

Article title: "${req.articleTitle}"
${hasSelection ? `\nUser highlighted: "${req.selectedText}"` : ''}

User question: ${req.question}

The article text hasn't been extracted yet — it may still be loading. Tell the user you don't have the article content yet and suggest waiting a moment for the page to fully load before asking again. If they highlighted a passage, you can answer about that specifically.`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 1024,
    },
  };

  const response = await axios.post(geminiUrl(), body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 20000,
  });

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text.trim();
}
