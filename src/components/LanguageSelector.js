import React, { useState, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { getLanguage, setLanguage, t } from '../utils/i18n';
import './LanguageSelector.css';

const LanguageSelector = () => {
  const [currentLang, setCurrentLang] = useState(getLanguage());
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  useEffect(() => {
    const handleLanguageChange = (event) => {
      setCurrentLang(event.detail);
      setIsOpen(false);
    };

    window.addEventListener('languageChange', handleLanguageChange);
    return () => window.removeEventListener('languageChange', handleLanguageChange);
  }, []);

  const handleLanguageSelect = (langCode) => {
    setLanguage(langCode);
    setCurrentLang(langCode);
    setIsOpen(false);
    // Reload page to apply language changes (or use React context for reactive updates)
    window.location.reload();
  };

  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];

  return (
    <div className="language-selector-wrapper">
      <button
        className="language-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('language.select')}
        title={t('language.select')}
      >
        <Globe size={18} />
        <span className="language-flag">{currentLanguage.flag}</span>
        <span className="language-code">{currentLanguage.code.toUpperCase()}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="language-selector-overlay"
            onClick={() => setIsOpen(false)}
          />
          <div className="language-selector-dropdown">
            {languages.map(lang => (
              <button
                key={lang.code}
                className={`language-option ${currentLang === lang.code ? 'active' : ''}`}
                onClick={() => handleLanguageSelect(lang.code)}
              >
                <span className="language-flag">{lang.flag}</span>
                <span className="language-name">{lang.name}</span>
                {currentLang === lang.code && (
                  <Check size={16} className="check-icon" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
