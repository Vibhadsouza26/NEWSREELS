import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { API_BASE } from '../constants/categories';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  followUps?: string[];
}

interface Props {
  articleTitle: string;
  articleContent?: string;
  selectedText?: string;
  articleUrl?: string;
  onClose?: () => void;
  /** When true, shows input row and quick actions immediately (panel mode) */
  panelMode?: boolean;
}

const QUICK_ACTIONS = [
  { label: 'Summarize', question: 'Summarize this article' },
  { label: 'Key Points', question: 'What are the key takeaways?' },
  { label: 'Explain', question: 'Explain this simply' },
  { label: 'Impact', question: 'What is the impact or significance of this?' },
  { label: 'Both Sides', question: 'Present balanced arguments for and against the main point of this article' },
];

function parseFollowUps(text: string): { cleanText: string; followUps: string[] } {
  const marker = 'FOLLOW_UP:';
  const idx = text.indexOf(marker);
  if (idx === -1) return { cleanText: text, followUps: [] };
  const cleanText = text.substring(0, idx).trim();
  const followUps = text.substring(idx + marker.length).trim()
    .split('|').map((q) => q.trim()).filter((q) => q.length > 3).slice(0, 3);
  return { cleanText, followUps };
}

function stripMarkdown(text: string): string {
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/__/g, '').replace(/`/g, '').replace(/^#+\s*/gm, '');
}

function StructuredText({ text }: { text: string }) {
  const cleaned = stripMarkdown(text);
  const parts = cleaned.split('\n\n').filter((p) => p.trim());

  return (
    <>
      {parts.map((part, pIdx) => {
        const lines = part.split('\n');
        return (
          <View key={pIdx} style={pIdx > 0 ? { marginTop: 10 } : undefined}>
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return null;

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

              const bulletMatch = trimmed.match(/^[•\-]\s+(.+)/);
              if (bulletMatch) {
                return (
                  <View key={lIdx} style={styles.numberedRow}>
                    <View style={styles.bulletDot} />
                    <Text style={[styles.aiText, { flex: 1 }]}>{bulletMatch[1]}</Text>
                  </View>
                );
              }

              return <Text key={lIdx} style={styles.aiText}>{trimmed}</Text>;
            })}
          </View>
        );
      })}
    </>
  );
}

export default function AiInline({ articleTitle, articleContent, selectedText, articleUrl, onClose, panelMode }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  async function startRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
      setIsRecording(true);
    } catch (err) {
      console.warn('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    if (!recording) return;
    setInput('Processing...');
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      if (!uri) { setInput(''); return; }
      const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      let data: any;
      try {
        const res = await fetch(`${API_BASE}/api/transcribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: base64 }),
          signal: controller.signal,
        });
        data = await res.json();
      } finally { clearTimeout(timeout); }
      setInput('');
      if (data.text) ask(data.text);
    } catch (err) {
      console.warn('Transcription failed', err);
      setRecording(null);
      setInput('');
    }
  }

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    const userMsg: Message = { role: 'user', text: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(`${API_BASE}/api/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          selectedText,
          pageContent: articleContent,
          articleTitle,
          articleUrl,
        }),
        signal: controller.signal,
      });
      const data = await res.json();
      const raw = data.answer || 'No response.';
      const { cleanText, followUps } = parseFollowUps(raw);
      setMessages((prev) => [...prev, { role: 'assistant', text: cleanText, followUps }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Something went wrong. Try asking again.' }]);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  const hasMessages = messages.length > 0 || loading;
  const showInputRow = panelMode || hasMessages;

  return (
    <View style={panelMode ? styles.panelContainer : styles.container}>
      {/* Header row with close button (panel mode) */}
      {panelMode && onClose ? (
        <View style={styles.panelHeader}>
          <Text style={styles.sectionLabel}>ASK AI</Text>
          {selectedText ? (
            <Text style={styles.contextBadge} numberOfLines={1}>
              "{selectedText.substring(0, 50)}{selectedText.length > 50 ? '...' : ''}"
            </Text>
          ) : null}
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.sectionLabel}>ASK AI</Text>
      )}

      {/* Quick action pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
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

      {/* AI thread — only shows after first interaction */}
      {hasMessages && (
        <View style={styles.threadContainer}>
          {messages.map((msg, i) => (
            <View key={i}>
              {msg.role === 'user' ? (
                <View style={styles.qBlock}>
                  <Text style={styles.qText}>{msg.text}</Text>
                </View>
              ) : (
                <View style={styles.responseCard}>
                  <StructuredText text={msg.text} />
                </View>
              )}
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
                      <Text style={styles.followUpText} numberOfLines={2}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
          {loading && (
            <View style={styles.responseCard}>
              <ActivityIndicator size="small" color="rgba(180,160,255,0.5)" />
            </View>
          )}
        </View>
      )}

      {/* Input row — shows after first AI interaction (or always in panel mode) */}
      {showInputRow && (
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
            placeholder={isRecording ? 'Listening...' : 'Ask anything...'}
            placeholderTextColor={isRecording ? 'rgba(180,160,255,0.5)' : 'rgba(255,255,255,0.12)'}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  panelContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 10,
  },
  contextBadge: {
    fontSize: 11,
    color: 'rgba(180,160,255,0.5)',
    fontStyle: 'italic',
    flexShrink: 1,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.4)',
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(180,160,255,0.2)',
    letterSpacing: 1,
    marginBottom: 10,
  },
  quickActionsContent: {
    gap: 8,
    flexDirection: 'row',
  },
  quickPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.1,
  },
  threadContainer: {
    marginTop: 12,
    gap: 8,
  },
  qBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(180,160,255,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(140,120,220,0.06)',
    overflow: 'hidden',
  },
  responseCard: {
    backgroundColor: 'rgba(140,120,220,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(140,120,220,0.08)',
    borderRadius: 10,
    padding: 12,
  },
  aiText: {
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.78)',
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
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(180,160,255,0.4)',
    marginTop: 7,
    flexShrink: 0,
  },
  followUpContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },
  followUpChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  followUpText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.32)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 10,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingLeft: 3,
    paddingRight: 3,
    paddingVertical: 3,
  },
  input: {
    flex: 1,
    fontSize: 12,
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxHeight: 80,
  },
  micBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: 'rgba(239,68,68,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.5)',
  },
  micDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(180,160,255,0.5)',
  },
  stopSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#ef4444',
  },
  sendBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(140,120,220,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    fontSize: 12,
    color: 'rgba(180,160,255,0.7)',
    fontWeight: '700',
  },
});
