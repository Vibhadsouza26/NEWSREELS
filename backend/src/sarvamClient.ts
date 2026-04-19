import axios from 'axios';

const SARVAM_URL = 'https://api.sarvam.ai/v1/chat/completions';
const SARVAM_MODEL = 'sarvam-m';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'api-subscription-key': process.env.SARVAM_API_KEY || '',
  };
}

// Strip <think>...</think> blocks from Sarvam responses
function stripThinking(text: string): string {
  // Remove closed <think>...</think> blocks
  let result = text.replace(/<think>[\s\S]*?<\/think>/g, '');
  // Remove unclosed <think> tags (model didn't close it) — strip from <think> to end
  result = result.replace(/<think>[\s\S]*/g, '');
  // Remove any stray closing tags
  result = result.replace(/<\/think>/g, '');
  return result.trim();
}

// Strip markdown bold markers
function stripMarkdown(text: string): string {
  return text.replace(/\*\*/g, '').trim();
}

const TAKEAWAY_SYSTEM = 'You generate concise key takeaways from news articles. Return exactly 3 takeaways, one per line. Each should be a single sentence, max 15 words. No bullets, no numbers, no prefixes — just the sentence. No markdown.';

function parseTakeaways(raw: string): string[] {
  const text = stripMarkdown(stripThinking(raw));
  return text
    .split('\n')
    .map((line: string) => line.replace(/^[\d\.\-\*\•\)]+\s*/, '').trim())
    .filter((line: string) => line.length > 5)
    .slice(0, 3);
}

// Track Groq rate limit — skip it entirely for a cooldown period after a 429
let groqCooldownUntil = 0;

export async function generateTakeaways(
  title: string,
  description: string
): Promise<string[]> {
  const userContent = `Article: "${title}"\n\n${description || 'No description available.'}`;

  // Try Groq first, but skip if rate-limited recently
  if (process.env.GROQ_API_KEY && Date.now() > groqCooldownUntil) {
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: TAKEAWAY_SYSTEM },
            { role: 'user', content: userContent },
          ],
          max_tokens: 300,
          temperature: 0.3,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          timeout: 10000,
        }
      );
      const raw = response.data?.choices?.[0]?.message?.content?.trim();
      if (raw) {
        const result = parseTakeaways(raw);
        if (result.length > 0) return result;
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
        // Cooldown for 60s — go straight to Sarvam for all calls
        groqCooldownUntil = Date.now() + 60000;
        console.warn(`[Takeaways] Groq rate-limited — skipping for 60s`);
      } else {
        console.warn(`[Takeaways] Groq failed: ${err.message}`);
      }
    }
  }

  // Fallback to Sarvam
  const response = await axios.post(
    SARVAM_URL,
    {
      model: SARVAM_MODEL,
      messages: [
        { role: 'system', content: TAKEAWAY_SYSTEM },
        { role: 'user', content: userContent },
      ],
      max_tokens: 300,
      temperature: 0.3,
    },
    { headers: getHeaders(), timeout: 15000 }
  );

  const raw = response.data?.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('Empty takeaways response');
  return parseTakeaways(raw);
}

export async function askSarvam(
  system: string,
  user: string
): Promise<string> {
  const response = await axios.post(
    SARVAM_URL,
    {
      model: SARVAM_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 2000,
      temperature: 0.4,
    },
    { headers: getHeaders(), timeout: 25000 }
  );

  const raw = response.data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Empty Sarvam response');
  return stripThinking(raw);
}

const TRANSLATE_URL = 'https://api.sarvam.ai/translate';

const LANG_CODE_MAP: Record<string, string> = {
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  or: 'od-IN',
};

async function translateOne(text: string, targetLangCode: string): Promise<string> {
  const response = await axios.post(
    TRANSLATE_URL,
    {
      input: text,
      source_language_code: 'en-IN',
      target_language_code: targetLangCode,
      model: 'mayura:v1',
      mode: 'formal',
    },
    { headers: getHeaders(), timeout: 15000 }
  );
  return response.data?.translated_text || text;
}

export async function translateBatch(
  texts: string[],
  targetLang: string
): Promise<string[]> {
  if (!texts.length) return [];

  const targetCode = LANG_CODE_MAP[targetLang];
  if (!targetCode) return texts; // unsupported language, return originals

  const results: string[] = new Array(texts.length);
  const CONCURRENCY = 5;

  for (let i = 0; i < texts.length; i += CONCURRENCY) {
    const chunk = texts.slice(i, i + CONCURRENCY);
    const translations = await Promise.all(
      chunk.map(async (text, j) => {
        try {
          return await translateOne(text, targetCode);
        } catch (err: any) {
          console.warn(`[Translate] Failed for text ${i + j}: ${err.message}`);
          return text; // fallback to original
        }
      })
    );
    for (let j = 0; j < translations.length; j++) {
      results[i + j] = translations[j];
    }
  }

  return results;
}
