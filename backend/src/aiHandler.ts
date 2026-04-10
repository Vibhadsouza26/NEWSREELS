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

  const prompt = `You are an expert AI assistant helping someone understand news, research, and technology topics. You have deep knowledge of AI models, ML techniques, LLMs, startups, geopolitics, and tech industry developments up to your knowledge cutoff.

Article title: "${req.articleTitle}"
${hasPageContent ? `\nArticle content (excerpt):\n${req.pageContent!.substring(0, 4000)}` : '\n(Full article text not available — answer from your knowledge based on the title and topic.)'}
${hasSelection ? `\nUser highlighted this specific text:\n"${req.selectedText}"` : ''}

User question: ${req.question}

Instructions:
- Answer thoroughly and helpfully. If the article content is available, use it. If not, draw on your own knowledge about the topic.
- For questions about AI models (GPT, Claude, Gemini, Llama etc.), prompting techniques, or ML concepts — give detailed, accurate explanations from your training knowledge.
- For news/current events questions where you lack context, explain what you know about the topic generally.
- Never just say "no" or "I don't know" — always provide useful context or explanation.
- Use plain text, no markdown. Be direct and clear.`;

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
