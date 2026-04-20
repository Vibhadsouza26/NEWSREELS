import { useState, useCallback, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import { NewsItem } from './useNewsFeed';

const STORAGE_PATH = FileSystem.documentDirectory + 'saved-articles.json';

// In-memory store (persists within session, synced to disk)
let savedStore: NewsItem[] = [];
let savedIds: Set<string> = new Set();
let listeners: Set<() => void> = new Set();
let diskLoaded = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function notify() {
  listeners.forEach((fn) => fn());
}

function syncIds() {
  savedIds = new Set(savedStore.map((item) => item.id));
}

function writeToDisk() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try {
      await FileSystem.writeAsStringAsync(STORAGE_PATH, JSON.stringify(savedStore));
    } catch (e) {
      console.warn('Failed to persist saved articles', e);
    }
  }, 500);
}

// Load from disk on module init
(async () => {
  try {
    const info = await FileSystem.getInfoAsync(STORAGE_PATH);
    if (info.exists) {
      const raw = await FileSystem.readAsStringAsync(STORAGE_PATH);
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        savedStore = parsed;
        syncIds();
        diskLoaded = true;
        notify();
        return;
      }
    }
  } catch (e) {
    console.warn('Failed to load saved articles from disk', e);
  }
  diskLoaded = true;
})();

export function useSavedArticles() {
  const [, setTick] = useState(0);

  // Subscribe to changes
  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const saved = savedStore;

  const isSaved = useCallback((id: string) => {
    return savedIds.has(id);
  }, [saved]);

  const toggleSave = useCallback((item: NewsItem) => {
    const exists = savedIds.has(item.id);
    if (exists) {
      savedStore = savedStore.filter((s) => s.id !== item.id);
    } else {
      savedStore = [item, ...savedStore];
    }
    syncIds();
    notify();
    writeToDisk();
  }, []);

  return { saved, isSaved, toggleSave };
}
