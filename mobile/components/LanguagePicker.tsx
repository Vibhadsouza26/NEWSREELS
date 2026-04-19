import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { LANGUAGES, LangCode } from '../constants/i18n';
import { LanguagePrefs } from '../hooks/useLanguagePrefs';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (prefs: LanguagePrefs) => void;
  initialPrefs?: LanguagePrefs;
}

export default function LanguagePicker({ visible, onClose, onSave, initialPrefs }: Props) {
  const [selected, setSelected] = useState<LangCode[]>(
    initialPrefs ? [initialPrefs.primary, initialPrefs.secondary, initialPrefs.tertiary] : []
  );

  const toggle = (code: LangCode) => {
    setSelected((prev) => {
      if (prev.includes(code)) {
        return prev.filter((c) => c !== code);
      }
      if (prev.length >= 3) return prev;
      return [...prev, code];
    });
  };

  const handleSave = () => {
    if (selected.length === 3) {
      onSave({
        primary: selected[0],
        secondary: selected[1],
        tertiary: selected[2],
      });
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Pick your languages</Text>
          <Text style={styles.subtitle}>
            Choose 3 languages. First one is your default.
          </Text>

          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {LANGUAGES.map((lang) => {
              const idx = selected.indexOf(lang.code);
              const isSelected = idx >= 0;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langCard, isSelected && styles.langCardSelected]}
                  onPress={() => toggle(lang.code)}
                  activeOpacity={0.7}
                >
                  {isSelected && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {idx === 0 ? 'Default' : idx + 1}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.nativeLabel}>{lang.nativeLabel}</Text>
                  <Text style={styles.engLabel}>{lang.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.saveBtn, selected.length < 3 && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={selected.length < 3}
          >
            <Text style={styles.saveBtnText}>
              {selected.length < 3 ? `Select ${3 - selected.length} more` : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: SCREEN_HEIGHT * 0.75,
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 20,
  },
  langCard: {
    width: '30%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  langCardSelected: {
    borderColor: '#7c3aed',
    backgroundColor: 'rgba(124,58,237,0.12)',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  nativeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  engLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  saveBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: {
    backgroundColor: 'rgba(124,58,237,0.3)',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
