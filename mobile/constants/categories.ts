export type Category = 'all' | 'ai' | 'tech' | 'startups' | 'product' | 'companies' | 'geopolitical' | 'learn';

export interface CategoryMeta {
  key: Category;
  label: string;
  emoji: string;
  gradient: [string, string];
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'all',          label: 'For You',      emoji: '✦',  gradient: ['#0f0c29', '#302b63'] },
  { key: 'ai',           label: 'AI',           emoji: '⚡', gradient: ['#3b0764', '#7c3aed'] },
  { key: 'tech',         label: 'Tech',         emoji: '◈',  gradient: ['#0c1445', '#1e3a8a'] },
  { key: 'startups',     label: 'Startups',     emoji: '◎',  gradient: ['#431407', '#c2410c'] },
  { key: 'product',      label: 'Product',      emoji: '◇',  gradient: ['#064e3b', '#059669'] },
  { key: 'companies',    label: 'Companies',    emoji: '▣',  gradient: ['#1c1917', '#44403c'] },
  { key: 'geopolitical', label: 'World',        emoji: '◉',  gradient: ['#3b0000', '#991b1b'] },
  { key: 'learn',        label: 'Learn',        emoji: '◈',  gradient: ['#1e1b4b', '#4f46e5'] },
];

export function getCategoryMeta(key: Category): CategoryMeta {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];
}

// ⚠️  For real devices on your WiFi, replace with your Mac's local IP.
// e.g. 'http://192.168.1.10:3001'
// For iOS Simulator: 'http://localhost:3001' works fine.
// For Android Emulator: 'http://10.0.2.2:3001'
export const API_BASE = 'http://localhost:3001';
