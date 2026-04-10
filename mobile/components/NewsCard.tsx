import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { NewsItem } from '../hooks/useNewsFeed';
import { getCategoryMeta, Category } from '../constants/categories';

dayjs.extend(relativeTime);

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  item: NewsItem;
  onPress: () => void;
}

export default function NewsCard({ item, onPress }: Props) {
  const meta = getCategoryMeta(item.category as Category);
  const timeAgo = dayjs(item.publishedAt).fromNow();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      {/* Hero image / gradient fallback */}
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={300}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)', '#000']}
              style={styles.imageOverlay}
            />
          </>
        ) : (
          <LinearGradient
            colors={meta.gradient}
            style={styles.gradientFallback}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.gradientEmoji}>{meta.emoji}</Text>
          </LinearGradient>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Category pill + source + time */}
        <View style={styles.metaRow}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryEmoji}>{meta.emoji}</Text>
            <Text style={styles.categoryLabel}>{meta.label}</Text>
          </View>
          <Text style={styles.source}>{item.sourceName}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={3}>
          {item.title}
        </Text>

        {/* Description */}
        {item.description ? (
          <Text style={styles.description} numberOfLines={4}>
            {item.description}
          </Text>
        ) : null}

        {/* CTA */}
        <Text style={styles.cta}>Tap to read more →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    backgroundColor: '#000',
  },
  imageContainer: {
    height: SCREEN_HEIGHT * 0.42,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientEmoji: {
    fontSize: 72,
    opacity: 0.4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 100, // space for swipe indicator
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryEmoji: {
    fontSize: 12,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  source: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  dot: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
  },
  time: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 22,
  },
  cta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 4,
  },
});
