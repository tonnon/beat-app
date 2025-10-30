import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import esCommon from '@/locales/es/common.json';
import esNavbar from '@/locales/es/navbar.json';
import esQuestionnaires from '@/locales/es/questionnaires.json';
import esAuth from '@/locales/es/auth.json';
import caCommon from '@/locales/ca/common.json';
import caNavbar from '@/locales/ca/navbar.json';
import caQuestionnaires from '@/locales/ca/questionnaires.json';
import caAuth from '@/locales/ca/auth.json';

const resources = {
  es: {
    common: esCommon,
    navbar: esNavbar,
  questionnaires: esQuestionnaires,
  auth: esAuth,
  },
  ca: {
    common: caCommon,
    navbar: caNavbar,
  questionnaires: caQuestionnaires,
  auth: caAuth,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['es', 'ca'],
    load: 'languageOnly',
  defaultNS: 'common',
  ns: ['common', 'navbar', 'questionnaires', 'auth'],
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    
    interpolation: {
      escapeValue: false,
    },
    
  debug: false,
    
    react: {
      useSuspense: true,
    },
  });

export default i18n;
