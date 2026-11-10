import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import viTranslation from './locales/vi.js';
import enTranslation from './locales/en.js';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      vi: viTranslation,
      en: enTranslation,
    },
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'sdms_language',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
  });

// Force base languages instead of variants like vi-VN
i18n.on('languageChanged', (lng) => {
  if (lng && lng.length > 2 && lng.includes('-')) {
    const baseLng = lng.split('-')[0];
    if (baseLng === 'vi' || baseLng === 'en') {
      if (i18n.language !== baseLng) {
        i18n.changeLanguage(baseLng);
      }
    } else {
      if (i18n.language !== 'en') {
        i18n.changeLanguage('en');
      }
    }
  }
});

// Initial normalization
if (i18n.language && i18n.language.includes('-')) {
  const baseLng = i18n.language.split('-')[0];
  if (baseLng === 'vi') i18n.changeLanguage('vi');
  else i18n.changeLanguage('en');
} else if (i18n.language !== 'vi' && i18n.language !== 'en') {
  i18n.changeLanguage('en');
}

export default i18n;
