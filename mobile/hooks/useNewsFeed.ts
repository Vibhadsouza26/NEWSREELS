import { useQuery } from '@tanstack/react-query';
import { Category, API_BASE } from '../constants/categories';

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  imageUrl?: string;
  sourceName: string;
  category: string;
  publishedAt: string;
  description?: string;
}

async function fetchNews(category: Category): Promise<NewsItem[]> {
  const url =
    category === 'all'
      ? `${API_BASE}/api/news`
      : `${API_BASE}/api/news?category=${category}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.items as NewsItem[];
}

export function useNewsFeed(category: Category) {
  return useQuery({
    queryKey: ['news', category],
    queryFn: () => fetchNews(category),
    staleTime: 5 * 60 * 1000,      // 5 min — don't refetch if fresh
    refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 min
    retry: 2,
  });
}
