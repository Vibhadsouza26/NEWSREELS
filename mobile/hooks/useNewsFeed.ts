import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { API_BASE } from '../constants/categories';

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

async function fetchNews(): Promise<NewsItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${API_BASE}/api/news`, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.items as NewsItem[];
  } finally {
    clearTimeout(timeout);
  }
}

export function useNewsFeed() {
  const queryClient = useQueryClient();
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const polledRef = useRef(false);

  const query = useQuery({
    queryKey: ['news'],
    queryFn: fetchNews,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  });

  useEffect(() => {
    if (!query.data?.length) return;
    if (polledRef.current) return;

    const top10Missing = query.data.slice(0, 10).some((item) => !item.takeaways?.length);
    if (!top10Missing) {
      polledRef.current = true;
      return;
    }

    timersRef.current.forEach(clearTimeout);
    polledRef.current = true;

    const refetch = () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      polledRef.current = false;
    };

    timersRef.current = [2000, 6000, 12000].map((d) => setTimeout(refetch, d));
  }, [query.data, queryClient]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  return query;
}
