import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSLATIONS, i18n } from '../constants/translations';

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('mfg_lang_v12') || 'ko';
  });

  useEffect(() => {
    localStorage.setItem('mfg_lang_v12', lang);
    document.documentElement.lang = lang;
    if (window.i18n) {
      window.i18n.setLang(lang); // Sync global vanilla i18n manager
      window.i18n.applyTranslations(); // Force re-render of vanilla DOM if necessary
    } else {
      i18n.setLang(lang);
      i18n.applyTranslations();
    }
  }, [lang]);

  const t = (key) => {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS['ko'];
    return dict[key] || TRANSLATIONS['ko'][key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
