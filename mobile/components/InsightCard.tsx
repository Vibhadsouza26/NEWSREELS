import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
import { BOTTOM_TAB_HEIGHT } from './NewsCard';

interface Props {
  theme: string;
  summary: string;
  articleTitles: string[];
  articleUrls?: string[];
  onArticlePress?: (url: string, title: string) => void;
  badgeText?: string;
}

function InsightCard({
  theme,
  summary,
  articleTitles,
  articleUrls,
  onArticlePress,
  badgeText = 'AI Insight',
}: Props) {
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['#1a0533', '#0a0a1a', '#000']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Gradient border effect */}
      <LinearGradient
        colors={['rgba(124,58,237,0.4)', 'rgba(167,139,250,0.2)', 'rgba(124,58,237,0.1)', 'transparent']}
        style={styles.borderGlow}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.content}>
        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>

        {/* Theme */}
        <Text style={styles.theme}>{theme}</Text>

        {/* Summary */}
        <Text style={styles.summary}>{summary}</Text>

        {/* Connected articles */}
        <View style={styles.articlesSection}>
          <Text style={styles.connectedLabel}>Connected stories:</Text>
          {articleTitles.slice(0, 4).map((title, i) => (
            <TouchableOpacity
              key={i}
              style={styles.articleLink}
              onPress={() => {
                const url = articleUrls?.[i];
                if (url && onArticlePress) onArticlePress(url, title);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.linkDot} />
              <Text style={[styles.articleLinkText, articleUrls?.[i] && styles.articleLinkClickable]} numberOfLines={2}>
                {title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

export default React.memo(InsightCard);

const styles = StyleSheet.create({
  card: {
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  borderGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  content: {
    paddingHorizontal: 28,
    paddingBottom: BOTTOM_TAB_HEIGHT + 24,
    gap: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(124,58,237,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.5)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#c4b5fd',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  theme: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  summary: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 24,
  },
  articlesSection: {
    marginTop: 8,
    gap: 8,
  },
  connectedLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  articleLink: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  linkDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#7c3aed',
    marginTop: 7,
    flexShrink: 0,
  },
  articleLinkText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 19,
    flex: 1,
  },
  articleLinkClickable: {
    color: 'rgba(196,181,253,0.8)',
    textDecorationLine: 'underline' as const,
  },
});
