import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from '../constants/dayjs';
import { NewsItem } from '../hooks/useNewsFeed';
import { getCategoryMeta, Category } from '../constants/categories';

interface Props {
  item: NewsItem;
}

function NewsCard({ item }: Props) {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const meta = getCategoryMeta(item.category as Category);
  const timeAgo = dayjs(item.publishedAt).fromNow();
  const hasImage = !!item.imageUrl;
  const imageHeight = Math.round(screenHeight * 0.42);

  return (
    <View style={[styles.imageContainer, { height: imageHeight, width: screenWidth }]}>
      {/* Background layer */}
      {hasImage ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          priority="high"
        />
      ) : (
        <LinearGradient
          colors={meta.gradient as [string, string]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
        />
      )}

      {/* Gradient fade at bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)', '#000']}
        locations={[0, 0.6, 1]}
        style={styles.fade}
      />

      {/* No-image: large faint symbol */}
      {!hasImage && (
        <View style={styles.bgSymbol}>
          <Text style={styles.bgSymbolText}>{meta.emoji}</Text>
        </View>
      )}

      {/* Source + title overlay on image */}
      <View style={styles.overlay}>
        <View style={styles.sourceRow}>
          <View style={styles.sourcePill}>
            <Text style={styles.sourcePillText}>{item.sourceName}</Text>
          </View>
          <View style={styles.metaDot} />
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>
        <Text style={styles.title} numberOfLines={3}>
          {item.title}
        </Text>
      </View>
    </View>
  );
}

export default React.memo(NewsCard);

const styles = StyleSheet.create({
  imageContainer: {
    position: 'relative',
  },
  fade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  bgSymbol: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  bgSymbolText: {
    fontSize: 120,
    opacity: 0.08,
    color: '#fff',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sourcePill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  sourcePillText: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  metaDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  timeAgo: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.25)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 25,
    letterSpacing: -0.3,
  },
});
