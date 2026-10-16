import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './translations';

const savedLanguage = localStorage.getItem('bnsm_language');

const initialLanguage =
  savedLanguage === 'en' ? 'en' : 'es';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;