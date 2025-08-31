import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, getCurrentLanguage, setCurrentLanguage, getTranslation } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: ReturnType<typeof getTranslation>;
  t: (key: keyof ReturnType<typeof getTranslation>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
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

  const t = (key: keyof ReturnType<typeof getTranslation>) => translations[key];

  const value = {
    language,
    setLanguage,
    translations,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
