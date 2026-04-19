import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../constants/categories';
import { LangCode } from '../constants/i18n';
import { NewsItem } from './useNewsFeed';

interface TranslatedItem extends NewsItem {
  translatedTitle?: string;
  translatedDescription?: string;
  translatedTakeaways?: string[];
}

// In-memory cache: key = `${text_hash}_${lang}`
const translationCache = new Map<string, string>();

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

async function translateTexts(texts: string[], lang: LangCode): Promise<string[]> {
  // Check cache first
  const uncached: { index: number; text: string }[] = [];
  const results: string[] = new Array(texts.length);

  for (let i = 0; i < texts.length; i++) {
    const key = `${simpleHash(texts[i])}_${lang}`;
    const cached = translationCache.get(key);
    if (cached) {
      results[i] = cached;
    } else {
      uncached.push({ index: i, text: texts[i] });
    }
  }

  if (uncached.length === 0) return results;

  try {
    const res = await fetch(`${API_BASE}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texts: uncached.map((u) => u.text),
        targetLang: lang,
      }),
    });
    const data = await res.json();
    const translations: string[] = data.translations || [];

    for (let i = 0; i < uncached.length; i++) {
      const translated = translations[i] || uncached[i].text;
      results[uncached[i].index] = translated;
      // Cache it
      const key = `${simpleHash(uncached[i].text)}_${lang}`;
      translationCache.set(key, translated);
    }
  } catch {
    // Fill with originals on failure
    for (const u of uncached) {
      if (!results[u.index]) results[u.index] = u.text;
    }
  }

  return results;
}

export function useTranslatedNews(
  items: NewsItem[] | undefined,
  lang: LangCode
): TranslatedItem[] {
  const [translated, setTranslated] = useState<TranslatedItem[]>([]);
  const prevKey = useRef('');

  useEffect(() => {
    if (!items || !items.length) {
      setTranslated([]);
      return;
    }

    // If English, just pass through
    if (lang === 'en') {
      setTranslated(items as TranslatedItem[]);
      return;
    }

    const key = `${items[0]?.id}_${items.length}_${lang}`;
    if (key === prevKey.current) return;
    prevKey.current = key;

    // Collect all texts to translate
    const titles = items.map((i) => i.title);
    const descriptions = items.map((i) => i.description || '');
    const allTakeaways = items.flatMap((i) => i.takeaways || []);

    Promise.all([
      translateTexts(titles, lang),
      translateTexts(descriptions.filter(Boolean), lang),
      allTakeaways.length > 0 ? translateTexts(allTakeaways, lang) : Promise.resolve([]),
    ]).then(([tTitles, tDescs, tTakeaways]) => {
      let descIdx = 0;
      let takeawayIdx = 0;

      const result: TranslatedItem[] = items.map((item, i) => {
        const hasDesc = !!item.description;
        const translatedTakeaways: string[] = [];

        if (item.takeaways) {
          for (let j = 0; j < item.takeaways.length; j++) {
            translatedTakeaways.push(tTakeaways[takeawayIdx] || item.takeaways[j]);
            takeawayIdx++;
          }
        }

        return {
          ...item,
          translatedTitle: tTitles[i],
          translatedDescription: hasDesc ? tDescs[descIdx++] : undefined,
          translatedTakeaways: translatedTakeaways.length ? translatedTakeaways : undefined,
        };
      });

      setTranslated(result);
    });
  }, [items, lang]);

  // Return items directly while translating (no blank screen)
  if (!translated.length && items?.length) {
    return items as TranslatedItem[];
  }
  return translated;
}
