import React, { createContext, useContext, useState, useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import enTranslations from '../translations/en.json';
import deTranslations from '../translations/de.json';
import frTranslations from '../translations/fr.json';
import esTranslations from '../translations/es.json';

const LanguageContext = createContext();

export const usePluginLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('usePluginLanguage must be used within LanguageProvider');
  }
  return context;
};

const translations = {
  en: enTranslations,
  de: deTranslations,
  fr: frTranslations,
  es: esTranslations,
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('magic-link-language') || 'en';
  });

  const changeLanguage = (newLang) => {
    setCurrentLanguage(newLang);
    localStorage.setItem('magic-link-language', newLang);
  };

  const value = {
    language: currentLanguage,
    changeLanguage,
    t: (key) => {
      const messages = translations[currentLanguage] || translations.en;
      return messages[key] || key;
    },
  };

  return (
    <LanguageContext.Provider value={value}>
      <IntlProvider
        locale={currentLanguage}
        messages={translations[currentLanguage]}
        defaultLocale="en"
      >
        {children}
      </IntlProvider>
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;

