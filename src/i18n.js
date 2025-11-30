import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationTH from './locales/th.json';
import translationEN from './locales/en.json';
import translationZH from './locales/zh.json';
import translationJA from './locales/ja.json';

const resources = {
    th: {
        translation: translationTH
    },
    en: {
        translation: translationEN
    },
    zh: {
        translation: translationZH
    },
    ja: {
        translation: translationJA
    }
};

// Get saved language from localStorage or default to Thai
const savedLanguage = localStorage.getItem('language') || 'th';

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: savedLanguage,
        fallbackLng: 'th',
        interpolation: {
            escapeValue: false
        }
    });

// Save language preference when it changes
i18n.on('languageChanged', (lng) => {
    localStorage.setItem('language', lng);
});

export default i18n;
