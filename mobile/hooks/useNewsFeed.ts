import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
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
  takeaways?: string[];
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
  const queryClient = useQueryClient();
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const polledCategoryRef = useRef<string | null>(null);

  const query = useQuery({
    queryKey: ['news', category],
    queryFn: () => fetchNews(category),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  });

  useEffect(() => {
    if (!query.data?.length) return;
    if (polledCategoryRef.current === category) return;

    // Check if any of the top 10 items are missing takeaways
    const top10Missing = query.data.slice(0, 10).some((item) => !item.takeaways?.length);
    if (!top10Missing) {
      polledCategoryRef.current = category;
      return;
    }

    // Clear old timers from previous category
    timersRef.current.forEach(clearTimeout);
    polledCategoryRef.current = category;

    // Refetch aggressively until top items have takeaways
    // Backend now generates top 5 before responding, so the next fetch should have them
    const refetch = () => {
      queryClient.invalidateQueries({ queryKey: ['news', category] });
      // After invalidation, reset polledCategoryRef so next render re-checks
      polledCategoryRef.current = null;
    };

    // Quick first refetch at 2s (backend ensureTopTakeaways is fast),
    // then 6s, 12s as safety nets
    timersRef.current = [2000, 6000, 12000].map((d) => setTimeout(refetch, d));
  }, [query.data, category, queryClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  return query;
}
