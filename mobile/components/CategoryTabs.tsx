import React, { useRef, useEffect } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CATEGORIES, Category } from '../constants/categories';
import { BOTTOM_TAB_HEIGHT } from './NewsCard';

interface Props {
  selected: Category;
  onSelect: (category: Category) => void;
}

export default function CategoryTabs({ selected, onSelect }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnims = useRef<Record<string, Animated.Value>>(
    Object.fromEntries(CATEGORIES.map((c) => [c.key, new Animated.Value(c.key === selected ? 1 : 0)]))
  ).current;

  useEffect(() => {
    CATEGORIES.forEach((c) => {
      Animated.timing(fadeAnims[c.key], {
        toValue: c.key === selected ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });

    // Auto-scroll to keep active tab visible
    const idx = CATEGORIES.findIndex((c) => c.key === selected);
    if (idx >= 0) {
      scrollRef.current?.scrollTo({ x: Math.max(0, idx * 72 - 36), animated: true });
    }
  }, [selected]);

  return (
    <View style={styles.wrapper}>
      {/* Top edge gradient line */}
      <LinearGradient
        colors={['rgba(255,255,255,0.06)', 'transparent']}
        style={styles.topLine}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {CATEGORIES.map((cat) => {
          const isActive = selected === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={styles.tab}
              onPress={() => onSelect(cat.key)}
              activeOpacity={0.6}
            >
              {/* Active pill background */}
              <Animated.View
                style={[
                  styles.activePill,
                  { opacity: fadeAnims[cat.key] },
                ]}
              />

              <Text style={[styles.emoji, isActive && styles.emojiActive]}>
                {cat.emoji}
              </Text>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const SAFE_BOTTOM = Platform.OS === 'ios' ? 26 : 8;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_TAB_HEIGHT + SAFE_BOTTOM,
    backgroundColor: 'rgba(4,4,4,0.96)',
    zIndex: 10,
  },
  topLine: {
    height: 1,
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: SAFE_BOTTOM,
    gap: 4,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 60,
    position: 'relative',
  },
  activePill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  emoji: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 3,
  },
  emojiActive: {
    color: '#fff',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
  },
});
