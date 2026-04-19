import { useState, useEffect, useCallback, useRef } from 'react';
import { File, Paths } from 'expo-file-system';

type Category = string;

interface PersonalizationData {
  categoryViews: Record<Category, number>;
  articleOpens: Record<Category, number>;
  articleSaves: Record<Category, number>;
}

const PERSIST_FILE = new File(Paths.document, 'personalization.json');
const DEBOUNCE_MS = 5000;

const defaultData: PersonalizationData = {
  categoryViews: {},
  articleOpens: {},
  articleSaves: {},
};

export function usePersonalization() {
  const [data, setData] = useState<PersonalizationData>(defaultData);
  const dataRef = useRef(data);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  dataRef.current = data;

  // Load from disk on mount
  useEffect(() => {
    (async () => {
      try {
        if (PERSIST_FILE.exists) {
          const raw = await PERSIST_FILE.text();
          const parsed = JSON.parse(raw) as PersonalizationData;
          setData(parsed);
        }
      } catch {
        // file doesn't exist or is corrupt
      }
    })();
  }, []);

  const scheduleSave = useCallback(() => {
    if (writeTimer.current) clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(async () => {
      try {
        await PERSIST_FILE.write(JSON.stringify(dataRef.current));
      } catch (err) {
        console.warn('[Personalization] Save failed:', err);
      }
    }, DEBOUNCE_MS);
  }, []);

  const increment = useCallback(
    (field: keyof PersonalizationData, category: Category) => {
      setData((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          [category]: (prev[field][category] || 0) + 1,
        },
      }));
      scheduleSave();
    },
    [scheduleSave]
  );

  const trackView = useCallback(
    (category: Category) => increment('categoryViews', category),
    [increment]
  );

  const trackOpen = useCallback(
    (category: Category) => increment('articleOpens', category),
    [increment]
  );

  const trackSave = useCallback(
    (category: Category) => increment('articleSaves', category),
    [increment]
  );

  const getScores = useCallback((): Record<Category, number> => {
    const scores: Record<Category, number> = {};
    const d = dataRef.current;
    const allCategories = new Set([
      ...Object.keys(d.categoryViews),
      ...Object.keys(d.articleOpens),
      ...Object.keys(d.articleSaves),
    ]);
    for (const cat of allCategories) {
      scores[cat] =
        (d.articleSaves[cat] || 0) * 3 +
        (d.articleOpens[cat] || 0) * 2 +
        (d.categoryViews[cat] || 0) * 1;
    }
    return scores;
  }, []);

  return { trackView, trackOpen, trackSave, getScores };
}
