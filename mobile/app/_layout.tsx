import React, { createContext, useContext } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useLanguagePrefs, LanguagePrefs } from '../hooks/useLanguagePrefs';
import { usePersonalization } from '../hooks/usePersonalization';
import { LangCode } from '../constants/i18n';

const queryClient = new QueryClient();

interface LanguageContextType {
  prefs: LanguagePrefs;
  savePrefs: (prefs: LanguagePrefs) => Promise<void>;
  currentLang: LangCode;
  setCurrentLang: (lang: LangCode) => void;
  languages: LangCode[];
  loaded: boolean;
}

export const LanguageContext = createContext<LanguageContextType>({
  prefs: { primary: 'en', secondary: 'hi', tertiary: 'ta' },
  savePrefs: async () => {},
  currentLang: 'en',
  setCurrentLang: () => {},
  languages: ['en', 'hi', 'ta'],
  loaded: false,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

interface PersonalizationContextType {
  trackView: (category: string) => void;
  trackOpen: (category: string) => void;
  trackSave: (category: string) => void;
  getScores: () => Record<string, number>;
}

export const PersonalizationContext = createContext<PersonalizationContextType>({
  trackView: () => {},
  trackOpen: () => {},
  trackSave: () => {},
  getScores: () => ({}),
});

export function usePersonalizationContext() {
  return useContext(PersonalizationContext);
}

export default function RootLayout() {
  const langPrefs = useLanguagePrefs();
  const personalization = usePersonalization();

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <LanguageContext.Provider value={langPrefs}>
          <PersonalizationContext.Provider value={personalization}>
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="article" />
              <Stack.Screen name="saved" />
            </Stack>
          </PersonalizationContext.Provider>
        </LanguageContext.Provider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
