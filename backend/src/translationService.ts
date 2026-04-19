import { translateBatch as sarvamTranslate } from './sarvamClient';

const BATCH_SIZE = 20;

export async function translateTexts(
  texts: string[],
  targetLang: string
): Promise<string[]> {
  if (targetLang === 'en' || !texts.length) return texts;

  const results: string[] = [];

  // Process in batches of BATCH_SIZE — translateBatch handles internal concurrency
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    try {
      const translated = await sarvamTranslate(batch, targetLang);
      results.push(...translated);
    } catch (err: any) {
      console.warn(`[Translation] Batch ${i} failed: ${err.message}`);
      results.push(...batch); // fallback to originals
    }
  }

  return results;
}
