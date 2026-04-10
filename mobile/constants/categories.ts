export type Category = 'all' | 'ai' | 'tech' | 'startups' | 'product' | 'companies' | 'geopolitical' | 'learn';

export interface CategoryMeta {
  key: Category;
  label: string;
  emoji: string;
  gradient: [string, string];
}

export const CATEGORIES: CategoryMeta[] = [
  { key: 'all',          label: 'All',          emoji: '🌐', gradient: ['#1a1a2e', '#16213e'] },
  { key: 'ai',           label: 'AI',           emoji: '🤖', gradient: ['#4a00e0', '#8e2de2'] },
  { key: 'tech',         label: 'Tech',         emoji: '💻', gradient: ['#0052d4', '#4364f7'] },
  { key: 'startups',     label: 'Startups',     emoji: '🚀', gradient: ['#f7971e', '#ffd200'] },
  { key: 'product',      label: 'Product',      emoji: '📱', gradient: ['#11998e', '#38ef7d'] },
  { key: 'companies',    label: 'Companies',    emoji: '🏢', gradient: ['#434343', '#000000'] },
  { key: 'geopolitical', label: 'World',        emoji: '🌍', gradient: ['#c0392b', '#e74c3c'] },
  { key: 'learn',        label: 'Learn',        emoji: '🧠', gradient: ['#6a3093', '#a044ff'] },
];

export function getCategoryMeta(key: Category): CategoryMeta {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];
}

// ⚠️  For real devices on your WiFi, replace with your Mac's local IP.
// e.g. 'http://192.168.1.10:3001'
// For iOS Simulator: 'http://localhost:3001' works fine.
// For Android Emulator: 'http://10.0.2.2:3001'
export const API_BASE = 'https://newsreels-eight.vercel.app';
