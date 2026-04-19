import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_BASE, Category, getCategoryMeta } from '../constants/categories';

interface SearchResult {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  category: string;
  publishedAt: string;
  description?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onArticlePress: (url: string, title: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SearchOverlay({ visible, onClose, onArticlePress }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus on open
  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [visible]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch {
        // silent fail
      }
      setLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handlePress = useCallback(
    (item: SearchResult) => {
      onArticlePress(item.url, item.title);
      onClose();
    },
    [onArticlePress, onClose]
  );

  const renderItem = useCallback(
    ({ item }: { item: SearchResult }) => {
      const catMeta = getCategoryMeta(item.category as Category);
      return (
        <TouchableOpacity style={styles.resultRow} onPress={() => handlePress(item)} activeOpacity={0.6}>
          <View style={styles.resultContent}>
            <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
            <View style={styles.resultMeta}>
              <Text style={styles.resultSource}>{item.sourceName}</Text>
              <Text style={styles.resultDot}>{'\u00B7'}</Text>
              <Text style={styles.resultTime}>{timeAgo(item.publishedAt)}</Text>
              <View style={[styles.categoryChip, { backgroundColor: catMeta.gradient[1] + '30' }]}>
                <Text style={[styles.categoryChipText, { color: catMeta.gradient[1] }]}>
                  {catMeta.label}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [handlePress]
  );

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        {/* Search bar */}
        <View style={styles.topBar}>
          <View style={styles.inputWrapper}>
            <View style={styles.searchIconWrap}>
              <View style={styles.searchIconCircle} />
              <View style={styles.searchIconHandle} />
            </View>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Search news articles"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCorrect={false}
              selectionColor="#7c3aed"
            />
          </View>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        {!query.trim() ? (
          <View style={styles.emptyState}>
            <Text style={styles.hintText}>Search across all news articles</Text>
          </View>
        ) : results.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.hintText}>No articles found</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchIconWrap: {
    width: 18,
    height: 18,
    position: 'relative' as const,
  },
  searchIconCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  searchIconHandle: {
    width: 1.5,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 1,
    position: 'absolute' as const,
    bottom: 1,
    right: 2,
    transform: [{ rotate: '-45deg' }],
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    paddingVertical: 0,
  },
  cancelText: {
    fontSize: 15,
    color: '#7c3aed',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.3)',
  },
  listContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  resultRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  resultContent: {
    gap: 6,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 20,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultSource: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  resultDot: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
  },
  resultTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  categoryChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  categoryChipText: {
    fontSize: 9,
    fontWeight: '700',
  },
});
