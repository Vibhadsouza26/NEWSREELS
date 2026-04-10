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
  const content = req.pageContent?.trim() ?? '';
  // Rich: WebView extracted the full article (>400 chars)
  const hasRichContent = content.length > 400;
  // Partial: at least have the RSS description/snippet (>20 chars)
  const hasPartialContent = content.length > 20;
  const hasSelection = (req.selectedText?.trim().length ?? 0) > 5;

  let prompt: string;

  if (hasRichContent) {
    // Full article extracted — answer strictly from the article
    prompt = `You are a helpful assistant. Answer questions strictly based on the article content below.

Article title: "${req.articleTitle}"

Article content:
${content.substring(0, 4500)}
${hasSelection ? `\nUser highlighted this passage:\n"${req.selectedText}"` : ''}

User question: ${req.question}

Instructions:
- Answer ONLY from the article content above.
- If asked to summarize: give a clear, concise summary of what the article actually says.
- If the question is about something not covered in the article, say so briefly, then describe what the article does cover.
- You may clarify technical terms that appear in the article.
- PLAIN TEXT ONLY. No asterisks, no bullet symbols, no bold markers, no markdown. If listing items, use "1. ... 2. ... 3. ..." format. Write in short paragraphs. Be direct.`;

  } else if (hasPartialContent) {
    // Only have the RSS snippet — answer from title + snippet + background knowledge
    prompt = `You are a helpful assistant for a news app.

Article title: "${req.articleTitle}"
Brief description: "${content}"
${hasSelection ? `\nUser highlighted: "${req.selectedText}"` : ''}

User question: ${req.question}

The full article hasn't been extracted yet — only the headline and brief snippet are available. Answer helpfully using the title, snippet, and your knowledge of this topic. Note you're working from limited info. Don't invent specific facts. PLAIN TEXT ONLY — no asterisks, no bullet symbols, no markdown formatting whatsoever. Use numbered sentences if listing: "1. ... 2. ..." Short paragraphs, direct.`;

  } else {
    // Nothing at all — answer from title + general knowledge
    prompt = `You are a helpful assistant for a news app.

Article title: "${req.articleTitle}"
${hasSelection ? `\nUser highlighted: "${req.selectedText}"` : ''}

User question: ${req.question}

The article content hasn't loaded yet. Answer based on the headline and your knowledge of this topic. Be helpful, note you haven't read the article. PLAIN TEXT ONLY — no asterisks, no bullet symbols, no markdown. Short paragraphs, direct.`;
  }

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.4,
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
