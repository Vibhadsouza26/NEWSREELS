import fs from 'fs';
import path from 'path';

const STORE_PATH = path.join(__dirname, '..', 'takeaways-cache.json');
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEBOUNCE_MS = 3000;

interface StoreEntry {
  takeaways: string[];
  createdAt: number;
}

let store: Record<string, StoreEntry> = {};
let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** Load from disk, pruning expired entries */
export function loadStore(): Record<string, string[]> {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')) as Record<string, StoreEntry>;
      const now = Date.now();
      store = {};
      for (const [key, entry] of Object.entries(raw)) {
        if (now - entry.createdAt < TTL_MS) {
          store[key] = entry;
        }
      }
      console.log(`[TakeawaysStore] Loaded ${Object.keys(store).length} entries from disk`);
    }
  } catch (err: any) {
    console.warn(`[TakeawaysStore] Failed to load: ${err.message}`);
    store = {};
  }

  // Return a flat map for hydrating NodeCache
  const flat: Record<string, string[]> = {};
  for (const [key, entry] of Object.entries(store)) {
    flat[key] = entry.takeaways;
  }
  return flat;
}

/** Get a single entry */
export function getEntry(id: string): string[] | undefined {
  const entry = store[id];
  if (!entry) return undefined;
  if (Date.now() - entry.createdAt >= TTL_MS) {
    delete store[id];
    return undefined;
  }
  return entry.takeaways;
}

/** Set a single entry and schedule debounced save */
export function setEntry(id: string, takeaways: string[]): void {
  store[id] = { takeaways, createdAt: Date.now() };
  scheduleSave();
}

function scheduleSave(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 0));
    } catch (err: any) {
      console.warn(`[TakeawaysStore] Failed to save: ${err.message}`);
    }
  }, DEBOUNCE_MS);
}
