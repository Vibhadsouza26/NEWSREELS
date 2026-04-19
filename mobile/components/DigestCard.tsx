import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface TopArticle {
  id: string;
  title: string;
  url: string;
}

interface Props {
  date: string;
  summary: string;
  topArticles: TopArticle[];
  articleCount?: number;
  onArticlePress: (url: string, title: string) => void;
  onDismiss?: () => void;
}

function DigestCard({ summary, topArticles, articleCount, onArticlePress, onDismiss }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerRow}>
          <View style={styles.dot} />
          <Text style={styles.label}>Your briefing</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.expandArrow}>{expanded ? '▾' : '▸'}</Text>
          {onDismiss && (
            <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn} activeOpacity={0.6}>
              <Text style={styles.dismissText}>x</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.summary} numberOfLines={expanded ? undefined : 2}>{summary}</Text>
      </TouchableOpacity>

      {expanded && topArticles.length > 0 && (
        <View style={styles.storiesSection}>
          {topArticles.slice(0, 3).map((article, i) => (
            <TouchableOpacity
              key={article.id}
              style={styles.storyItem}
              onPress={() => onArticlePress(article.url, article.title)}
              activeOpacity={0.6}
            >
              <Text style={styles.storyNumber}>{i + 1}</Text>
              <Text style={styles.storyTitle} numberOfLines={1}>{article.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {expanded && articleCount != null && (
        <Text style={styles.footer}>From {articleCount} stories</Text>
      )}
    </View>
  );
}

export default React.memo(DigestCard);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38bdf8',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  expandArrow: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    marginRight: 6,
  },
  dismissBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    marginTop: -1,
  },
  summary: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.6)',
  },
  storiesSection: {
    marginTop: 4,
    gap: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 8,
  },
  storyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  storyNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(14,165,233,0.5)',
    width: 14,
  },
  storyTitle: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  footer: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
  },
});
