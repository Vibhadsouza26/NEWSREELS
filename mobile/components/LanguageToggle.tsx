import React, { useState, useRef } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { LANGUAGES, LangCode } from '../constants/i18n';
import { LanguagePrefs } from '../hooks/useLanguagePrefs';

interface Props {
  languages: LangCode[];
  currentLang: LangCode;
  onSelect: (lang: LangCode) => void;
  onSavePrefs: (prefs: LanguagePrefs) => void;
}

export default function LanguageToggle({ languages, currentLang, onSelect, onSavePrefs }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [selected, setSelected] = useState<LangCode[]>([]);
  const [hintVisible, setHintVisible] = useState(false);
  const hintOpacity = useRef(new Animated.Value(0)).current;

  // Show "hold to set default" hint briefly on first tap
  const showHint = () => {
    setHintVisible(true);
    Animated.sequence([
      Animated.timing(hintOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(hintOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setHintVisible(false));
  };

  const handleTap = (code: LangCode) => {
    onSelect(code);
    // Show hint if they tap a non-default language
    if (code !== languages[0]) {
      showHint();
    }
  };

  const handleLongPress = (code: LangCode) => {
    // Reorder: long-pressed language becomes primary
    const newLangs = [code, ...languages.filter((l) => l !== code)];
    onSavePrefs({
      primary: newLangs[0],
      secondary: newLangs[1],
      tertiary: newLangs[2],
    });
    onSelect(code);
  };

  const openPicker = () => {
    setSelected([...languages]);
    setShowPicker(true);
  };

  const toggleLang = (code: LangCode) => {
    setSelected((prev) => {
      if (prev.includes(code)) {
        if (prev.length <= 1) return prev; // keep at least 1
        return prev.filter((c) => c !== code);
      }
      if (prev.length >= 3) return prev; // max 3
      return [...prev, code];
    });
  };

  const savePicker = () => {
    if (selected.length === 3) {
      onSavePrefs({
        primary: selected[0],
        secondary: selected[1],
        tertiary: selected[2],
      });
      onSelect(selected[0]);
      setShowPicker(false);
    }
  };

  return (
    <>
      <View style={styles.wrapper}>
        <View style={styles.container}>
          {languages.map((code) => {
            const lang = LANGUAGES.find((l) => l.code === code);
            if (!lang) return null;
            const active = code === currentLang;
            const isDefault = code === languages[0];
            return (
              <TouchableOpacity
                key={code}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => handleTap(code)}
                onLongPress={() => handleLongPress(code)}
                delayLongPress={500}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {lang.shortLabel}
                </Text>
                {isDefault && <View style={styles.defaultDot} />}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.editBtn}
            onPress={openPicker}
            activeOpacity={0.7}
          >
            <Text style={styles.editText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Long-press hint toast */}
        {hintVisible && (
          <Animated.View style={[styles.hintBubble, { opacity: hintOpacity }]}>
            <Text style={styles.hintText}>Hold to set as default</Text>
          </Animated.View>
        )}
      </View>

      {/* Picker modal — choose 3 languages */}
      {showPicker && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setShowPicker(false)}>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setShowPicker(false)}
          >
            <View style={styles.pickerSheet} onStartShouldSetResponder={() => true}>
              <Text style={styles.pickerTitle}>Choose 3 languages</Text>
              <Text style={styles.pickerSub}>
                First selected = default. Tap to add/remove.
              </Text>
              <ScrollView contentContainerStyle={styles.langGrid} showsVerticalScrollIndicator={false}>
                {LANGUAGES.map((lang) => {
                  const idx = selected.indexOf(lang.code);
                  const isSelected = idx >= 0;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={[styles.langChip, isSelected && styles.langChipActive]}
                      onPress={() => toggleLang(lang.code)}
                      activeOpacity={0.7}
                    >
                      {isSelected && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{idx + 1}</Text>
                        </View>
                      )}
                      <Text style={[styles.langNative, isSelected && styles.langNativeActive]}>
                        {lang.nativeLabel}
                      </Text>
                      <Text style={styles.langEng}>{lang.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={[styles.saveBtn, selected.length !== 3 && styles.saveBtnDisabled]}
                onPress={savePicker}
                disabled={selected.length !== 3}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>
                  {selected.length === 3 ? 'Save' : `Pick ${3 - selected.length} more`}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-end',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 3,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: 'rgba(124,58,237,0.5)',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
  },
  pillTextActive: {
    color: '#fff',
  },
  defaultDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#a78bfa',
    marginTop: 3,
  },
  editBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  editText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  hintBubble: {
    marginTop: 8,
    backgroundColor: 'rgba(124,58,237,0.85)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hintText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerSheet: {
    width: '85%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    maxHeight: '70%',
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  pickerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 20,
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 16,
  },
  langChip: {
    width: '30%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  langChipActive: {
    borderColor: '#7c3aed',
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  langNative: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  langNativeActive: {
    color: '#fff',
  },
  langEng: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
  saveBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: {
    backgroundColor: 'rgba(124,58,237,0.3)',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
