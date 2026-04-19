import React, { useRef, useState, useCallback } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AiBottomSheet from '../components/AiBottomSheet';
import { useLanguage } from './_layout';

// Injected into WebView to:
// 1. Set black background immediately (prevents white flash)
// 2. Extract page text content when loaded
// 3. Detect text selection and post it back
const INJECTED_JS_BEFORE = `true;`;

const INJECTED_JS = `
(function() {
  function extractArticleText() {
    try {
      var selectors = [
        'article', '[role="main"]', '.article-body', '.article-content',
        '.post-content', '.entry-content', '.story-body', '.content-body', 'main',
      ];
      for (var i = 0; i < selectors.length; i++) {
        var el = document.querySelector(selectors[i]);
        if (el && el.innerText && el.innerText.trim().length > 300) {
          return el.innerText.trim().substring(0, 6000);
        }
      }
      return document.body ? document.body.innerText.trim().substring(0, 6000) : '';
    } catch(e) { return ''; }
  }

  function sendPageContent() {
    var text = extractArticleText();
    if (text.length > 100) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAGE_CONTENT', text: text }));
    }
  }

  if (document.readyState === 'complete') {
    setTimeout(sendPageContent, 1000);
  } else {
    window.addEventListener('load', function() { setTimeout(sendPageContent, 1000); });
    document.addEventListener('DOMContentLoaded', function() { setTimeout(sendPageContent, 2000); });
  }

  document.addEventListener('selectionchange', function() {
    try {
      var sel = window.getSelection();
      var text = sel ? sel.toString().trim() : '';
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TEXT_SELECTED', text: text }));
    } catch(e) {}
  });
})();
true;
`;

export default function ArticleScreen() {
  const router = useRouter();
  const { url, title, description } = useLocalSearchParams<{ url: string; title: string; description: string }>();

  const { currentLang } = useLanguage();
  const [selectedText, setSelectedText] = useState('');
  const [pageContent, setPageContent] = useState(description ?? '');
  const [showAi, setShowAi] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);

  const handleMessage = useCallback((event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'PAGE_CONTENT') {
        if (msg.text.length > pageContent.length) setPageContent(msg.text);
      } else if (msg.type === 'TEXT_SELECTED') {
        setSelectedText(msg.text);
        setHasSelection(msg.text.length > 10);
      }
    } catch {}
  }, []);

  const openAi = useCallback((withSelection = false) => {
    if (!withSelection) setSelectedText('');
    setShowAi(true);
  }, []);

  if (!url) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No URL provided.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <TouchableOpacity onPress={() => openAi(false)} style={styles.aiHeaderBtn}>
          <Text style={styles.aiHeaderBtnText}>✨ AI</Text>
        </TouchableOpacity>
      </View>

      {/* WebView */}
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        injectedJavaScriptBeforeContentLoaded={INJECTED_JS_BEFORE}
        injectedJavaScript={INJECTED_JS}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
      />

      {/* Floating "Ask AI about selection" button */}
      {hasSelection && !showAi && (
        <TouchableOpacity
          style={styles.selectionFab}
          onPress={() => openAi(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.selectionFabText}>✨ Ask AI about selection</Text>
        </TouchableOpacity>
      )}

      {/* Persistent bottom AI button */}
      {!hasSelection && !showAi && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => openAi(false)}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>✨</Text>
        </TouchableOpacity>
      )}

      {/* AI Bottom Sheet */}
      <AiBottomSheet
        visible={showAi}
        onClose={() => {
          setShowAi(false);
          setHasSelection(false);
          setSelectedText('');
        }}
        articleTitle={title ?? ''}
        selectedText={selectedText || undefined}
        pageContent={pageContent || undefined}
        lang={currentLang}
        onOpenArticle={(articleUrl, articleTitle) => {
          setShowAi(false);
          router.push({
            pathname: '/article',
            params: { url: articleUrl, title: articleTitle, description: '' },
          });
        }}
      />
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
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#000',
    gap: 12,
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
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  aiHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(124,58,237,0.25)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.5)',
  },
  aiHeaderBtnText: {
    fontSize: 13,
    color: '#c4b5fd',
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
  selectionFab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 24,
    alignSelf: 'center',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  selectionFabText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 24,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    fontSize: 22,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
});
