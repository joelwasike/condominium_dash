import React, { createContext, useContext, useState, useEffect } from 'react';
import { getLanguage, setLanguage as setStoredLanguage, t } from '../utils/i18n';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(getLanguage());

  const changeLanguage = (lang) => {
    setStoredLanguage(lang);
    setCurrentLanguage(lang);
    // Dispatch event for components that listen to it
    window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
  };

  // Listen for language changes from other sources
  useEffect(() => {
    const handleLanguageChange = (event) => {
      setCurrentLanguage(event.detail || getLanguage());
    };

    window.addEventListener('languageChange', handleLanguageChange);
    return () => window.removeEventListener('languageChange', handleLanguageChange);
  }, []);

  const translate = (key) => t(key, currentLanguage);

  return (
    <LanguageContext.Provider value={{ language: currentLanguage, changeLanguage, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
};
