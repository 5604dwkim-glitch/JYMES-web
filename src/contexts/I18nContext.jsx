import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TRANSLATIONS, i18n } from '../constants/translations';

const I18nContext = createContext();

const SUPPORTED_LANGS = new Set(['ko', 'en', 'th', 'vi']);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem('mfg_lang_v12') || localStorage.getItem('mes_lang') || 'ko';
    const valid = SUPPORTED_LANGS.has(saved) ? saved : 'ko';
    if (typeof window !== 'undefined') {
      window.i18n = i18n;
    }
    i18n.setLang(valid, false);
    return valid;
  });

  // 자식 컴포넌트의 렌더링 및 bottom-up useEffect가 부모 useEffect보다 먼저 실행되므로
  // 렌더 단계와 setLang 호출 시점에 i18n 싱글톤 언어를 즉시 동기화하여 1박자 밀림 현상을 원천 차단
  if (typeof window !== 'undefined' && window.i18n !== i18n) {
    window.i18n = i18n;
  }
  if (i18n.getLang() !== lang) {
    i18n.setLang(lang, false);
  }

  const setLang = useCallback((nextLang) => {
    const valid = SUPPORTED_LANGS.has(nextLang) ? nextLang : 'ko';
    if (typeof window !== 'undefined') {
      window.i18n = i18n;
    }
    i18n.setLang(valid, false);
    setLangState(valid);
  }, []);

  useEffect(() => {
    localStorage.setItem('mfg_lang_v12', lang);
    localStorage.setItem('mes_lang', lang);
    document.documentElement.lang = lang;

    if (typeof window !== 'undefined') {
      window.i18n = i18n;
    }
    i18n.setLang(lang, false);
    i18n.applyTranslations(document);

    if (lang === 'ko' || typeof MutationObserver === 'undefined' || !document.body) {
      i18n.registerObserver(null);
      return undefined;
    }

    let rafId = null;
    const observer = new MutationObserver(() => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        i18n.applyTranslations(document);
      });
    });

    i18n.registerObserver(observer);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title']
    });

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      observer.disconnect();
      i18n.registerObserver(null);
    };
  }, [lang]);

  const t = useCallback((key, fallback = '') => {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS['ko'];
    return dict[key] || TRANSLATIONS['ko'][key] || fallback || key;
  }, [lang]);

  const td = useCallback((rawStr) => {
    if (rawStr === null || rawStr === undefined) return '';
    if (lang === 'ko') return String(rawStr);
    i18n.setLang(lang, false);
    return i18n.translateDisplay(rawStr);
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, td }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
