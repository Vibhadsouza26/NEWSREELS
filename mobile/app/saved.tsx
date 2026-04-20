import React, { useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from '../constants/dayjs';
import { useSavedArticles } from '../hooks/useSavedArticles';
import { NewsItem } from '../hooks/useNewsFeed';

export default function SavedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { saved, toggleSave } = useSavedArticles();

  const handlePress = useCallback((item: NewsItem) => {
    router.push({
      pathname: '/article',
      params: { url: item.url, title: item.title, description: item.description ?? '' },
    });
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Articles</Text>
      </View>

      {saved.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyHeart}>♡</Text>
          <Text style={styles.emptyText}>No saved articles yet</Text>
          <Text style={styles.emptySub}>Double-tap any article to save it here</Text>
        </View>
      ) : (
        <FlatList
          data={saved}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handlePress(item)}
              activeOpacity={0.8}
            >
              {item.imageUrl && (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.thumb}
                  contentFit="cover"
                />
              )}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardMeta}>
                  {item.sourceName} · {dayjs(item.publishedAt).fromNow()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleSave(item)}
                style={styles.removeBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#000',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  emptyHeart: {
    fontSize: 48,
    color: 'rgba(255,255,255,0.2)',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  emptySub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
  },
  thumb: {
    width: 80,
    height: 80,
  },
  cardContent: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 20,
  },
  cardMeta: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  removeBtn: {
    padding: 16,
  },
  removeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
  },
});
