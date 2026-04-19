import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useNewsFeed, NewsItem } from '../hooks/useNewsFeed';
import { useTranslatedNews } from '../hooks/useTranslatedNews';
import { Category, API_BASE } from '../constants/categories';
import { getUIStrings } from '../constants/i18n';
import NewsCard from '../components/NewsCard';
import CategoryTabs from '../components/CategoryTabs';
import SkeletonCard from '../components/SkeletonCard';
import LanguageToggle from '../components/LanguageToggle';
import InsightCard from '../components/InsightCard';
import DigestCard from '../components/DigestCard';
import SearchOverlay from '../components/SearchOverlay';
import { useSavedArticles } from '../hooks/useSavedArticles';
import { useLanguage, usePersonalizationContext } from './_layout';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface InsightData {
  id: string;
  theme: string;
  summary: string;
  articleIds: string[];
  articleTitles: string[];
  articleUrls: string[];
}

interface TopArticle {
  id: string;
  title: string;
  url: string;
}

interface DigestData {
  date: string;
  summary: string;
  articleCount: number;
  topArticles: TopArticle[];
}

type FeedItem =
  | { type: 'news'; data: NewsItem }
  | { type: 'insight'; data: InsightData };

export default function FeedScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<Category>('all');
  const [showSearch, setShowSearch] = useState(false);
  const [showDigest, setShowDigest] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const { data: articles, isLoading, isError } = useNewsFeed(category);
  const { currentLang, setCurrentLang, languages, savePrefs } = useLanguage();
  const { isSaved, toggleSave, saved } = useSavedArticles();
  const { trackView, trackOpen, trackSave, getScores } = usePersonalizationContext();

  const strings = getUIStrings(currentLang);
  const translatedItems = useTranslatedNews(articles, currentLang);

  // Track category views with 2s timer
  useEffect(() => {
    const timer = setTimeout(() => {
      trackView(category);
    }, 2000);
    return () => clearTimeout(timer);
  }, [category, trackView]);

  // Fetch insights
  const { data: insights } = useQuery<InsightData[]>({
    queryKey: ['insights', category],
    queryFn: async () => {
      const url = category === 'all'
        ? `${API_BASE}/api/insights`
        : `${API_BASE}/api/insights?category=${category}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return data.insights || [];
    },
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });

  // Fetch daily digest with personalization
  const { data: digest } = useQuery<DigestData | null>({
    queryKey: ['digest'],
    queryFn: async () => {
      const scores = getScores();
      const sorted = Object.entries(scores)
        .filter(([cat]) => cat !== 'all')
        .sort((a, b) => b[1] - a[1]);
      const top3 = sorted.slice(0, 3).map(([cat]) => cat);
      const params = top3.length ? `?preferred=${top3.join(',')}` : '';
      const res = await fetch(`${API_BASE}/api/digest${params}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.digest || null;
    },
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  // Merge news + insights into feed with personalization
  const feedItems: FeedItem[] = React.useMemo(() => {
    if (!translatedItems.length) return [];

    let newsItems = [...translatedItems];

    // Apply personalization boost when on "all" tab
    if (category === 'all') {
      const scores = getScores();
      const maxScore = Math.max(...Object.values(scores), 1);
      newsItems.sort((a, b) => {
        const timeA = new Date(a.publishedAt).getTime() + (scores[a.category] || 0) / maxScore * 0.5 * 3600000;
        const timeB = new Date(b.publishedAt).getTime() + (scores[b.category] || 0) / maxScore * 0.5 * 3600000;
        return timeB - timeA;
      });
    }

    const items: FeedItem[] = newsItems.map((item) => ({
      type: 'news' as const,
      data: item,
    }));

    // Digest is now rendered as an overlay, not a feed item

    // Insert insights every 2 news items (after positions 2, 4, 6, 8, ...)
    if (insights?.length) {
      let insightIdx = 0;
      // Start after 2 news items, then every 2 more
      for (let pos = 2; pos < items.length && insightIdx < insights.length; pos += 3) {
        // pos += 3 because after inserting, the next 2 news items are 2 slots ahead + 1 for the inserted insight
        items.splice(pos, 0, { type: 'insight', data: insights[insightIdx] });
        insightIdx++;
      }
    }

    return items;
  }, [translatedItems, insights, digest, category, getScores]);

  const handleCategoryChange = useCallback((cat: Category) => {
    setCategory(cat);
    setShowDigest(true);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const handleCardPress = useCallback((item: NewsItem) => {
    trackOpen(item.category);
    router.push({
      pathname: '/article',
      params: { url: item.url, title: item.title, description: item.description ?? '' },
    });
  }, [router, trackOpen]);

  const handleArticlePress = useCallback((url: string, title: string) => {
    router.push({
      pathname: '/article',
      params: { url, title, description: '' },
    });
  }, [router]);

  const handleToggleSave = useCallback((item: NewsItem) => {
    if (!isSaved(item.id)) {
      trackSave(item.category);
    }
    toggleSave(item);
  }, [isSaved, toggleSave, trackSave]);

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => {
      if (item.type === 'insight') {
        return (
          <InsightCard
            theme={item.data.theme}
            summary={item.data.summary}
            articleTitles={item.data.articleTitles}
            articleUrls={item.data.articleUrls}
            onArticlePress={(url, title) => handleArticlePress(url, title)}
            badgeText={strings.aiInsight}
          />
        );
      }

      const newsItem = item.data as NewsItem & {
        translatedTitle?: string;
        translatedDescription?: string;
        translatedTakeaways?: string[];
      };

      return (
        <NewsCard
          item={newsItem}
          onPress={() => handleCardPress(newsItem)}
          translatedTitle={newsItem.translatedTitle}
          translatedDescription={newsItem.translatedDescription}
          translatedTakeaways={newsItem.translatedTakeaways}
          swipeHintText={strings.swipeForNext}
          isSaved={isSaved(newsItem.id)}
          onToggleSave={() => handleToggleSave(newsItem)}
        />
      );
    },
    [handleCardPress, handleArticlePress, handleToggleSave, strings, isSaved]
  );

  const keyExtractor = useCallback((item: FeedItem) => {
    return item.data.id;
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top header: saved + search + language toggle */}
      <View style={styles.topHeader}>
        <View style={styles.leftButtons}>
          <TouchableOpacity
            style={styles.savedBtn}
            onPress={() => router.push('/saved')}
            activeOpacity={0.7}
          >
            <View style={saved.length > 0 ? styles.savedBookmarkFilled : styles.savedBookmarkOutline}>
              <View style={saved.length > 0 ? styles.savedBookmarkFoldFilled : styles.savedBookmarkFold} />
            </View>
            {saved.length > 0 && (
              <View style={styles.savedBadge}>
                <Text style={styles.savedBadgeText}>{saved.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => setShowSearch(true)}
            activeOpacity={0.7}
          >
            <View style={styles.searchIconCircle} />
            <View style={styles.searchIconHandle} />
          </TouchableOpacity>
        </View>
        <LanguageToggle
          languages={languages}
          currentLang={currentLang}
          onSelect={setCurrentLang}
          onSavePrefs={savePrefs}
        />
      </View>

      {/* Compact digest — floats below header */}
      {showDigest && digest && category === 'all' && (
        <View style={styles.digestOverlay}>
          <DigestCard
            date={digest.date}
            summary={digest.summary}
            topArticles={digest.topArticles}
            articleCount={digest.articleCount}
            onArticlePress={handleArticlePress}
            onDismiss={() => setShowDigest(false)}
          />
        </View>
      )}

      {isLoading ? (
        <SkeletonCard />
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Couldn't load news.</Text>
          <Text style={styles.errorSub}>Make sure the backend is running on port 3001.</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={feedItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={(_data, index) => ({
            length: SCREEN_HEIGHT,
            offset: SCREEN_HEIGHT * index,
            index,
          })}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={SCREEN_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          windowSize={7}
          removeClippedSubviews
          scrollsToTop={false}
        />
      )}

      <CategoryTabs
        selected={category}
        onSelect={handleCategoryChange}
        lang={currentLang}
      />

      <SearchOverlay
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onArticlePress={handleArticlePress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  digestOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 82,
    left: 16,
    right: 16,
    zIndex: 15,
  },
  topHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 36,
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  leftButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  savedBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedBookmarkOutline: {
    width: 14,
    height: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 2,
    position: 'relative' as const,
  },
  savedBookmarkFilled: {
    width: 14,
    height: 18,
    backgroundColor: '#7c3aed',
    borderRadius: 2,
    position: 'relative' as const,
  },
  savedBookmarkFold: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    width: 5,
    height: 5,
    borderBottomLeftRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  savedBookmarkFoldFilled: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    width: 5,
    height: 5,
    borderBottomLeftRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  savedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  savedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  searchIconHandle: {
    width: 2,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 1,
    position: 'absolute' as const,
    bottom: 8,
    right: 9,
    transform: [{ rotate: '-45deg' }],
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  errorSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
});
