import { useState, useCallback } from 'react';
import { LangCode } from '../constants/i18n';

export interface LanguagePrefs {
  primary: LangCode;
  secondary: LangCode;
  tertiary: LangCode;
}

const DEFAULT_PREFS: LanguagePrefs = {
  primary: 'en',
  secondary: 'hi',
  tertiary: 'ta',
};

export function useLanguagePrefs() {
  const [prefs, setPrefs] = useState<LanguagePrefs>(DEFAULT_PREFS);
  const [currentLang, setCurrentLangState] = useState<LangCode>('en');

  const savePrefs = useCallback(async (newPrefs: LanguagePrefs) => {
    setPrefs(newPrefs);
    setCurrentLangState(newPrefs.primary);
  }, []);

  const setCurrentLang = useCallback((lang: LangCode) => {
    setCurrentLangState(lang);
  }, []);

  const languages: LangCode[] = [prefs.primary, prefs.secondary, prefs.tertiary];

  return {
    prefs,
    savePrefs,
    currentLang,
    setCurrentLang,
    languages,
    loaded: true,
  };
}
