import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en';
import fr from './locales/fr';
import ar from './locales/ar';

export const LANG_KEY = 'internhub-lang';
export const SUPPORTED_LANGS = ['fr', 'en', 'ar'];
export const RTL_LANGS = ['ar'];

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      const stored = await AsyncStorage.getItem(LANG_KEY);
      callback(stored && SUPPORTED_LANGS.includes(stored) ? stored : 'fr');
    } catch {
      callback('fr');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lang) => {
    try {
      await AsyncStorage.setItem(LANG_KEY, lang);
    } catch {}
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      ar: { translation: ar },
    },
    fallbackLng: 'fr',
    supportedLngs: SUPPORTED_LANGS,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18n;
