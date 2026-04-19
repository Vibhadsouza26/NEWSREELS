import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { API_BASE } from '../constants/categories';
import { getUIStrings, LangCode } from '../constants/i18n';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.72;

interface RelatedArticle {
  id: string;
  title: string;
  url: string;
  sourceName: string;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  followUps?: string[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  articleTitle: string;
  selectedText?: string;
  pageContent?: string;
  lang?: LangCode;
  onOpenArticle?: (url: string, title: string) => void;
}

function parseFollowUps(text: string): { cleanText: string; followUps: string[] } {
  const marker = 'FOLLOW_UP:';
  const idx = text.indexOf(marker);
  if (idx === -1) return { cleanText: text, followUps: [] };

  const cleanText = text.substring(0, idx).trim();
  const followUpStr = text.substring(idx + marker.length).trim();
  const followUps = followUpStr
    .split('|')
    .map((q) => q.trim())
    .filter((q) => q.length > 3)
    .slice(0, 3);

  return { cleanText, followUps };
}

function cleanText(text: string): string {
  // Strip all markdown: **, *, __, `, #
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/__/g, '').replace(/`/g, '').replace(/^#+\s*/gm, '');
}

function renderStructuredText(text: string) {
  const cleaned = cleanText(text);
  const parts = cleaned.split('\n\n').filter((p) => p.trim());

  return parts.map((part, pIdx) => {
    const lines = part.split('\n');
    return (
      <View key={pIdx} style={pIdx > 0 ? { marginTop: 10 } : undefined}>
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          // Numbered list item
          const numMatch = trimmed.match(/^(\d+)[\.\)]\s+(.+)/);
          if (numMatch) {
            return (
              <View key={lIdx} style={styles.numberedRow}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>{numMatch[1]}</Text>
                </View>
                <Text style={[styles.aiText, { flex: 1 }]}>{numMatch[2]}</Text>
              </View>
            );
          }

          // Bullet list item (•, -, *)
          const bulletMatch = trimmed.match(/^[•\-]\s+(.+)/);
          if (bulletMatch) {
            return (
              <View key={lIdx} style={styles.numberedRow}>
                <View style={styles.bulletDot} />
                <Text style={[styles.aiText, { flex: 1 }]}>{bulletMatch[1]}</Text>
              </View>
            );
          }

          return (
            <Text key={lIdx} style={styles.aiText}>
              {trimmed}
            </Text>
          );
        })}
      </View>
    );
  });
}

export default function AiBottomSheet({
  visible,
  onClose,
  articleTitle,
  selectedText,
  pageContent,
  lang = 'en',
  onOpenArticle,
}: Props) {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [related, setRelated] = useState<RelatedArticle[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const strings = getUIStrings(lang);

  async function startRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
    } catch (err) {
      console.warn('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    if (!recording) return;
    // Keep isRecording=true visually during grace period so mic stays active
    setInput('Processing...');

    try {
      // Grace period: mic keeps recording for 1.5s to capture trailing words
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      // Reset audio mode so playback works normally
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (!uri) { setInput(''); return; }

      // Read file as base64
      const base64 = await readAsStringAsync(uri, {
        encoding: EncodingType.Base64,
      });

      // Send to transcription endpoint
      const res = await fetch(`${API_BASE}/api/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64 }),
      });
      const data = await res.json();
      setInput('');
      if (data.text) {
        ask(data.text);
      }
    } catch (err) {
      console.warn('Transcription failed', err);
      setRecording(null);
      setInput('');
    }
  }

  const QUICK_ACTIONS = [
    { label: strings.summarize, question: 'Summarize this article' },
    { label: strings.keyTakeaways, question: 'What are the key takeaways?' },
    { label: strings.explainSimply, question: 'Explain this simply' },
    { label: strings.whatsTheImpact, question: 'What is the impact or significance of this?' },
    { label: strings.bothSides, question: 'Present balanced arguments for and against the main point of this article' },
  ];

  useEffect(() => {
    if (visible) {
      setMessages([]);
      setRelated([]);
      // Fetch related articles
      fetch(`${API_BASE}/api/related?title=${encodeURIComponent(articleTitle)}`)
        .then((r) => r.json())
        .then((d) => setRelated(d.related || []))
        .catch(() => {});
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    const userMsg: Message = { role: 'user', text: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          selectedText,
          pageContent,
          articleTitle,
        }),
      });
      const data = await res.json();
      const raw = data.answer || 'No response.';
      const { cleanText, followUps } = parseFollowUps(raw);
      const aiMsg: Message = { role: 'assistant', text: cleanText, followUps };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Something went wrong. Try asking again.' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{strings.askAI}</Text>
            {selectedText ? (
              <Text style={styles.contextBadge} numberOfLines={1}>
                "{selectedText.substring(0, 60)}{selectedText.length > 60 ? '...' : ''}"
              </Text>
            ) : null}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>X</Text>
            </TouchableOpacity>
          </View>

          {/* Quick actions */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickActionsBar}
            contentContainerStyle={styles.quickActionsContent}
          >
            {QUICK_ACTIONS.map((a) => (
              <TouchableOpacity
                key={a.label}
                style={styles.quickPill}
                onPress={() => ask(a.question)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text style={styles.quickPillText}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg, i) => (
              <View key={i}>
                {msg.role === 'user' ? (
                  <View style={[styles.bubble, styles.userBubble]}>
                    <Text style={styles.userText}>{msg.text}</Text>
                  </View>
                ) : (
                  <View style={[styles.bubble, styles.aiBubble]}>
                    {renderStructuredText(msg.text)}
                  </View>
                )}

                {/* Follow-up chips */}
                {msg.followUps && msg.followUps.length > 0 && (
                  <View style={styles.followUpContainer}>
                    {msg.followUps.map((q, j) => (
                      <TouchableOpacity
                        key={j}
                        style={styles.followUpChip}
                        onPress={() => ask(q)}
                        activeOpacity={0.7}
                        disabled={loading}
                      >
                        <Text style={styles.followUpText} numberOfLines={2}>
                          {q}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
            {loading && (
              <View style={[styles.bubble, styles.aiBubble]}>
                <ActivityIndicator size="small" color="#a78bfa" />
              </View>
            )}
            {/* Related articles */}
            {related.length > 0 && messages.length > 0 && (
              <View style={styles.relatedSection}>
                <Text style={styles.relatedLabel}>RELATED STORIES</Text>
                {related.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={styles.relatedItem}
                    onPress={() => onOpenArticle?.(r.url, r.title)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.relatedDot} />
                    <View style={styles.relatedTextWrap}>
                      <Text style={styles.relatedTitle} numberOfLines={2}>{r.title}</Text>
                      <Text style={styles.relatedSource}>{r.sourceName}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={[styles.micBtn, isRecording && styles.micBtnActive]}
              onPress={isRecording ? stopRecording : startRecording}
              activeOpacity={0.7}
              disabled={loading}
            >
              <View style={isRecording ? styles.stopSquare : styles.micDot} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={isRecording ? 'Listening...' : strings.askAnything}
              placeholderTextColor={isRecording ? '#a78bfa' : 'rgba(255,255,255,0.3)'}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => ask(input)}
              editable={!isRecording}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => ask(input)}
              disabled={!input.trim() || loading}
            >
              <Text style={styles.sendBtnText}>↑</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  contextBadge: {
    fontSize: 12,
    color: '#a78bfa',
    fontStyle: 'italic',
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    top: 14,
    padding: 4,
  },
  closeBtnText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },
  quickActionsBar: {
    flexShrink: 0,
    maxHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  quickActionsContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: 'rgba(124,58,237,0.18)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.35)',
    alignSelf: 'center',
  },
  quickPillText: {
    fontSize: 12,
    color: '#c4b5fd',
    fontWeight: '600',
  },
  messages: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingTop: 8,
    paddingBottom: 8,
    gap: 10,
  },
  bubble: {
    borderRadius: 16,
  },
  userBubble: {
    marginLeft: 'auto' as any,
    backgroundColor: '#6d28d9',
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: SCREEN_WIDTH - 64,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: SCREEN_WIDTH - 64,
  },
  userText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#fff',
  },
  aiText: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.9)',
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#a78bfa',
    marginTop: 7,
    flexShrink: 0,
  },
  numberedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  numberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(124,58,237,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  numberBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#c4b5fd',
  },
  followUpContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    maxWidth: '85%',
  },
  followUpChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
  },
  followUpText: {
    fontSize: 12,
    color: '#c4b5fd',
  },
  relatedSection: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  relatedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1,
    marginBottom: 2,
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  relatedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#7c3aed',
    marginTop: 6,
    flexShrink: 0,
  },
  relatedTextWrap: {
    flex: 1,
    gap: 2,
  },
  relatedTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  relatedSource: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#fff',
    maxHeight: 100,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: 'rgba(239,68,68,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.5)',
  },
  micDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#a78bfa',
  },
  stopSquare: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(124,58,237,0.3)',
  },
  sendBtnText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
});
