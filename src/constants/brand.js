// ألوان اللوجو — نستخدمها في الهيدر والفوتر والصفحات
export const BRAND = { black: '#000000', red: '#DD0000', gold: '#FFCE00' };

/** دومين إضافي (استضافة) — نعرض اسمه في الإمبريسوم */
export const ADDITIONAL_SITE = { name: 'lightsalmon-anteater-987020.hostingersite.com', url: 'https://lightsalmon-anteater-987020.hostingersite.com' };

const FLAG_BASE = 'https://flagcdn.com/w40';
export const LANGUAGES = [
  { code: 'de', label: 'Deutsch', flagUrl: `${FLAG_BASE}/de.png` },
  { code: 'en', label: 'English', flagUrl: `${FLAG_BASE}/gb.png` },
  { code: 'fr', label: 'Français', flagUrl: `${FLAG_BASE}/fr.png` },
  { code: 'ru', label: 'Русский', flagUrl: `${FLAG_BASE}/ru.png` },
  { code: 'uk', label: 'Українська', flagUrl: `${FLAG_BASE}/ua.png` },
  { code: 'tr', label: 'Türkçe', flagUrl: `${FLAG_BASE}/tr.png` },
  { code: 'es', label: 'Español', flagUrl: `${FLAG_BASE}/es.png` },
  { code: 'pt', label: 'Português', flagUrl: `${FLAG_BASE}/pt.png` },
  { code: 'ar', label: 'العربية', flagUrl: `${FLAG_BASE}/sa.png` },
];

export const STORAGE_LANG_KEY = 'essam_app_lang';

export const HEADER_LINKS_ROW1 = [
  { to: '/student/liden', labelKey: 'nav_lidTest' },
  { to: '/pruefungen', labelKey: 'nav_pruefungen' },
  { to: '/grammatik', labelKey: 'nav_grammatik' },
  { to: '/wortschatz', labelKey: 'nav_wortschatz' },
];
export const HEADER_LINKS_ROW2 = [
  { to: '/grammatik-training', labelKey: 'nav_grammatikTraining' },
  { to: '/derdiedas', labelKey: 'nav_derdiedas' },
  { to: '/lesen-hoeren', labelKey: 'nav_lesenHoeren' },
  { to: '/dialoge', labelKey: 'nav_dialoge' },
];
