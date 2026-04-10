import React, { useRef, useState, useCallback } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useNewsFeed, NewsItem } from '../hooks/useNewsFeed';
import { Category } from '../constants/categories';
import NewsCard from '../components/NewsCard';
import CategoryTabs from '../components/CategoryTabs';
import SkeletonCard from '../components/SkeletonCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FeedScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<Category>('all');
  const flatListRef = useRef<FlatList>(null);
  const { data: articles, isLoading, isError } = useNewsFeed(category);

  const handleCategoryChange = useCallback((cat: Category) => {
    setCategory(cat);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const handleCardPress = useCallback((item: NewsItem) => {
    router.push({
      pathname: '/article',
      params: { url: item.url, title: item.title, description: item.description ?? '' },
    });
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: NewsItem }) => (
      <NewsCard item={item} onPress={() => handleCardPress(item)} />
    ),
    [handleCardPress]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: SCREEN_HEIGHT,
      offset: SCREEN_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {isLoading ? (
        <SkeletonCard />
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>Couldn't load news.</Text>
          <Text style={styles.errorSub}>Make sure the backend is running on port 3001.</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={articles}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={SCREEN_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          getItemLayout={getItemLayout}
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          windowSize={7}
          removeClippedSubviews
        />
      )}

      <CategoryTabs selected={category} onSelect={handleCategoryChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  errorEmoji: {
    fontSize: 48,
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
