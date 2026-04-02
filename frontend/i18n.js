import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from './src/locales/en.json';
import hiTranslations from './src/locales/hi.json';

i18n
  .use(initReactI18next) // react-i18next को इनिशियलाइज़ करे
  .init({
    resources: {
      en: { translation: enTranslations },
      hi: { translation: hiTranslations }
    },
    lng: 'en', // Default language is English
    fallbackLng: 'en', // अगर अनुवाद न मिले तो अंग्रेज़ी
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false // React पहले से ही XSS से बचाता है
    }
  });

export default i18n;