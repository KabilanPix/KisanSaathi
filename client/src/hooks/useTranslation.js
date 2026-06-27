import { useLanguage } from './useLanguage';
import { translations } from '../locales/translations';

export function useTranslation() {
  const [language] = useLanguage();
  
  const t = (key) => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    // Fallback to English if translation is missing
    if (translations['en'] && translations['en'][key]) {
        return translations['en'][key];
    }
    return key;
  };

  return { t, language };
}
