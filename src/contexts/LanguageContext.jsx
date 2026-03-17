import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { STORAGE_LANG_KEY } from '../constants/brand';
import { translations } from '../constants/translations';

const LanguageContext = createContext(null);

const supportedUiLangs = ['de', 'en', 'fr', 'ru', 'uk', 'tr', 'es', 'pt', 'ar'];
const RTL_LANGS = ['ar'];
function getUiLang(code) {
  return supportedUiLangs.includes(code) ? code : 'en';
}
function isRtlLang(code) {
  return RTL_LANGS.includes(code);
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    if (typeof window === 'undefined') return 'de';
    return localStorage.getItem(STORAGE_LANG_KEY) || 'de';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_LANG_KEY, lang);
  }, [lang]);

  const setLang = useCallback((code) => {
    setLangState(code || 'de');
  }, []);

  const uiLang = useMemo(() => getUiLang(lang), [lang]);
  const rtl = useMemo(() => isRtlLang(uiLang), [uiLang]);
  const t = useMemo(() => {
    const dict = translations[uiLang] || translations.en;
    const fallback = translations.de;
    return (key) => dict[key] ?? fallback[key] ?? key;
  }, [uiLang]);

  useEffect(() => {
    const root = document.documentElement;
    if (rtl) {
      root.setAttribute('dir', 'rtl');
      root.setAttribute('lang', 'ar');
    } else {
      root.setAttribute('dir', 'ltr');
      root.setAttribute('lang', uiLang);
    }
  }, [uiLang, rtl]);

  const value = useMemo(
    () => ({ lang, setLang, t, isEnglish: uiLang === 'en', isFrench: uiLang === 'fr', isRussian: uiLang === 'ru', isUkrainian: uiLang === 'uk', isTurkish: uiLang === 'tr', isSpanish: uiLang === 'es', isPortuguese: uiLang === 'pt', isArabic: uiLang === 'ar', isRtl: rtl }),
    [lang, setLang, t, uiLang, rtl]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export function useTranslation() {
  const { t } = useLanguage();
  return t;
}
