import { useState, useEffect } from 'react';
import { Language, getCurrentLanguage, setCurrentLanguage, getTranslation } from '@/lib/translations';

export const useLanguage = () => {
  const [language, setLanguageState] = useState<Language>(getCurrentLanguage());
  const [translations, setTranslations] = useState(getTranslation(language));

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    setCurrentLanguage(newLanguage);
    setTranslations(getTranslation(newLanguage));
  };

  useEffect(() => {
    setTranslations(getTranslation(language));
  }, [language]);

  return {
    language,
    setLanguage,
    translations,
    t: (key: keyof typeof translations) => translations[key],
  };
};
