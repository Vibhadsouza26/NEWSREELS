import { useState, useCallback } from 'react';
import { NewsItem } from './useNewsFeed';

// In-memory store (persists within session)
let savedStore: NewsItem[] = [];
let listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

export function useSavedArticles() {
  const [, setTick] = useState(0);

  // Subscribe to changes
  useState(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  });

  const saved = savedStore;

  const isSaved = useCallback((id: string) => {
    return savedStore.some((item) => item.id === id);
  }, [saved]);

  const toggleSave = useCallback((item: NewsItem) => {
    const exists = savedStore.findIndex((s) => s.id === item.id);
    if (exists >= 0) {
      savedStore = savedStore.filter((s) => s.id !== item.id);
    } else {
      savedStore = [item, ...savedStore];
    }
    notify();
  }, []);

  return { saved, isSaved, toggleSave };
}
