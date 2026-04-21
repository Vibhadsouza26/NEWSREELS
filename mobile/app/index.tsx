import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useNewsFeed, NewsItem } from '../hooks/useNewsFeed';
import NewsCard from '../components/NewsCard';
import AiInline from '../components/AiInline';
import DoubleTapSave from '../components/DoubleTapSave';
import SkeletonCard from '../components/SkeletonCard';
import { useSavedArticles } from '../hooks/useSavedArticles';
import { usePersonalizationContext } from './_layout';

export default function FeedScreen() {
  const router = useRouter();
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const { data: articles, isLoading, isError } = useNewsFeed();
  const { isSaved, toggleSave, saved } = useSavedArticles();
  const { trackView, trackSave, getScores } = usePersonalizationContext();

  // Personalization: boost articles from preferred categories
  const feedItems = useMemo(() => {
    if (!articles?.length) return [];
    const items = [...articles];
    const scores = getScores();
    const maxScore = Math.max(...Object.values(scores), 1);
    items.sort((a, b) => {
      const timeA = new Date(a.publishedAt).getTime() + (scores[a.category] || 0) / maxScore * 0.5 * 3600000;
      const timeB = new Date(b.publishedAt).getTime() + (scores[b.category] || 0) / maxScore * 0.5 * 3600000;
      return timeB - timeA;
    });
    return items;
  }, [articles, getScores]);

  const handleDoubleTap = useCallback((item: NewsItem) => {
    if (!isSaved(item.id)) {
      trackSave(item.category);
    }
    toggleSave(item);
  }, [isSaved, toggleSave, trackSave]);

  const handleSingleTap = useCallback((item: NewsItem) => {
    router.push({
      pathname: '/article',
      params: { url: item.url, title: item.title, description: item.description ?? '' },
    });
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: NewsItem }) => (
      <FeedCard
        item={item}
        screenHeight={screenHeight}
        onDoubleTap={() => handleDoubleTap(item)}
        onSingleTap={() => handleSingleTap(item)}
      />
    ),
    [screenHeight, handleDoubleTap, handleSingleTap]
  );

  const keyExtractor = useCallback((item: NewsItem) => item.id, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Saved pill — top left */}
      {saved.length > 0 && (
        <TouchableOpacity
          style={[styles.savedPill, { top: insets.top + 4 }]}
          onPress={() => router.push('/saved')}
          activeOpacity={0.7}
        >
          <Text style={styles.savedHeart}>♥</Text>
          <View style={styles.savedCount}>
            <Text style={styles.savedCountText}>{saved.length}</Text>
          </View>
          <Text style={styles.savedLabel}>saved</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <SkeletonCard />
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Couldn't load news. Pull down to retry.</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={feedItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={(_data, index) => ({
            length: screenHeight,
            offset: screenHeight * index,
            index,
          })}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={screenHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          windowSize={7}
          removeClippedSubviews
          scrollsToTop={false}
        />
      )}
    </View>
  );
}

/**
 * FeedCard — one full-screen card with image, takeaways, AI section.
 * Image area handles swipe navigation + double-tap save.
 * Content area scrolls freely.
 */
interface FeedCardProps {
  item: NewsItem;
  screenHeight: number;
  onDoubleTap: () => void;
  onSingleTap: () => void;
}

const FeedCard = React.memo(function FeedCard({ item, screenHeight, onDoubleTap, onSingleTap }: FeedCardProps) {
  const imageHeight = Math.round(screenHeight * 0.42);
  const bodyHeight = screenHeight - imageHeight;

  const articleContent = [
    item.title,
    item.description,
    ...(item.takeaways || []),
  ].filter(Boolean).join('\n');

  return (
    <View style={[styles.card, { height: screenHeight }]}>
      {/* Image area — double-tap to save, single tap to open article */}
      <DoubleTapSave onDoubleTap={onDoubleTap} onSingleTap={onSingleTap} height={imageHeight}>
        <NewsCard item={item} />
      </DoubleTapSave>

      {/* Scrollable body */}
      <ScrollView
        style={[styles.cardBody, { height: bodyHeight }]}
        contentContainerStyle={styles.cardBodyContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {/* Takeaways */}
        {item.takeaways && item.takeaways.length > 0 && (
          <View style={styles.takeaways}>
            {item.takeaways.map((t, i) => (
              <View key={i} style={styles.takeawayItem}>
                <Text style={styles.takeawayNum}>{i + 1}</Text>
                <Text style={styles.takeawayText}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Description fallback if no takeaways */}
        {item.description && (!item.takeaways || item.takeaways.length === 0) && (
          <Text style={styles.description}>{item.description}</Text>
        )}

        {/* AI Section */}
        <AiInline
          articleTitle={item.title}
          articleContent={articleContent}
          articleUrl={item.url}
        />
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  savedPill: {
    position: 'absolute',
    left: 16,
    zIndex: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  savedHeart: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  savedCount: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 9,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  savedCountText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  savedLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#000',
  },
  cardBody: {
    backgroundColor: '#000',
  },
  cardBodyContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
  },
  takeaways: {
    gap: 0,
  },
  takeawayItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  takeawayNum: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.12)',
    minWidth: 16,
    textAlign: 'right',
    marginTop: 2,
  },
  takeawayText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 21,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 21,
  },
});
