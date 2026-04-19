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
export const BOTTOM_TAB_HEIGHT = 72;

interface Props {
  item: NewsItem;
  onPress: () => void;
  translatedTitle?: string;
  translatedDescription?: string;
  translatedTakeaways?: string[];
  swipeHintText?: string;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

function NewsCard({
  item,
  onPress,
  translatedTitle,
  translatedDescription,
  translatedTakeaways,
  swipeHintText,
  isSaved,
  onToggleSave,
}: Props) {
  const meta = getCategoryMeta(item.category as Category);
  const timeAgo = dayjs(item.publishedAt).fromNow();
  const hasImage = !!item.imageUrl;

  const displayTitle = translatedTitle || item.title;
  const displayDescription = translatedDescription || item.description;
  const displayTakeaways = translatedTakeaways || item.takeaways;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={1}>
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

      {/* Gradient overlay */}
      <LinearGradient
        colors={
          hasImage
            ? ['transparent', 'transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.92)', '#000']
            : ['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)', '#000']
        }
        locations={[0, 0.25, 0.5, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* No-image: large faint symbol */}
      {!hasImage && (
        <View style={styles.bgSymbol}>
          <Text style={styles.bgSymbolText}>{meta.emoji}</Text>
        </View>
      )}

      {/* Content — pinned to bottom */}
      <View style={styles.content}>
        {/* Source + time + save row */}
        <View style={styles.sourceRow}>
          <View style={styles.sourcePill}>
            <Text style={styles.sourcePillText}>{item.sourceName}</Text>
          </View>
          <Text style={styles.time}>{timeAgo}</Text>
          <View style={{ flex: 1 }} />
          {onToggleSave && (
            <TouchableOpacity onPress={onToggleSave} style={styles.bookmarkBtn} activeOpacity={0.7}>
              <View style={isSaved ? styles.bookmarkFilled : styles.bookmarkOutline}>
                <View style={isSaved ? styles.bookmarkFoldFilled : styles.bookmarkFold} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={3}>
          {displayTitle}
        </Text>

        {/* Key Takeaways — right below title in a glass card */}
        {displayTakeaways && displayTakeaways.length > 0 && (
          <View style={styles.takeawaysCard}>
            <Text style={styles.takeawaysLabel}>KEY TAKEAWAYS</Text>
            {displayTakeaways.map((t, i) => (
              <View key={i} style={styles.takeawayRow}>
                <View style={styles.takeawayDot} />
                <Text style={styles.takeawayText} numberOfLines={3}>
                  {t}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Description — only if no takeaways, to avoid overcrowding */}
        {displayDescription && (!displayTakeaways || displayTakeaways.length === 0) ? (
          <Text style={styles.description} numberOfLines={2}>
            {displayDescription}
          </Text>
        ) : null}

        {/* Category tag */}
        <View style={styles.categoryRow}>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryChipText}>{meta.emoji}  {meta.label.toUpperCase()}</Text>
          </View>
          <Text style={styles.swipeHint}>{swipeHintText || 'Swipe for next'} ↑</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(NewsCard);

const styles = StyleSheet.create({
  card: {
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    backgroundColor: '#050505',
    justifyContent: 'flex-end',
  },
  bgSymbol: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 120,
  },
  bgSymbolText: {
    fontSize: 140,
    opacity: 0.08,
    color: '#fff',
  },
  content: {
    paddingHorizontal: 22,
    paddingBottom: BOTTOM_TAB_HEIGHT + 24,
    gap: 10,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sourcePill: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  sourcePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  time: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  bookmarkBtn: {
    padding: 6,
  },
  bookmarkOutline: {
    width: 16,
    height: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 2,
    position: 'relative',
  },
  bookmarkFilled: {
    width: 16,
    height: 20,
    backgroundColor: '#7c3aed',
    borderRadius: 2,
    position: 'relative',
  },
  bookmarkFold: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 6,
    height: 6,
    borderBottomLeftRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  bookmarkFoldFilled: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 6,
    height: 6,
    borderBottomLeftRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 33,
    letterSpacing: -0.5,
  },
  takeawaysCard: {
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  takeawaysLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a78bfa',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  takeawayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  takeawayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#a78bfa',
    marginTop: 5,
    flexShrink: 0,
  },
  takeawayText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 21,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1,
  },
  swipeHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 0.3,
  },
});
