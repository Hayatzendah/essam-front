import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BRAND, LANGUAGES, HEADER_LINKS_ROW1, HEADER_LINKS_ROW2 } from '../constants/brand';
import { useLanguage } from '../contexts/LanguageContext';
import logoImage from '../images/logo.png';
import UserProfileDropdown from './UserProfileDropdown';

export default function AppHeader() {
  const navigate = useNavigate();
  const { lang, setLang, t, isRtl } = useLanguage();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const langDropdownRef = useRef(null);
  const headerRef = useRef(null);
  const isLoggedIn = !!localStorage.getItem('accessToken');

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setLangDropdownOpen(false);
      }
      if (mobileMenuOpen && headerRef.current && !headerRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <header ref={headerRef} className="z-40">
      <div
        className="h-1.5 w-full flex-shrink-0"
        style={{ background: isRtl ? 'linear-gradient(270deg, #000000 0%, #DD0000 50%, #FFCE00 100%)' : 'linear-gradient(90deg, #000000 0%, #DD0000 50%, #FFCE00 100%)' }}
      />
      <div className="relative border-b border-slate-200/80 dark:border-slate-600/80 bg-gradient-to-br from-white via-slate-50/40 to-slate-100/50 dark:from-slate-800 dark:via-slate-800/95 dark:to-slate-700/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 min-h-[8.5rem]">
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              <button type="button" onClick={() => navigate('/')} className="flex items-center gap-4 sm:gap-5 min-w-0">
                <img
                  src={logoImage}
                  alt={t('appName')}
                  className="h-24 sm:h-28 md:h-32 lg:h-40 w-auto object-contain flex-shrink-0"
                />
                <div className="hidden sm:block flex-shrink-0 border-l border-slate-200 dark:border-slate-600 pl-4 sm:pl-5 text-left rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-4 sm:rtl:pr-5 rtl:text-right">
                  <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                    {t('appName')}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('tagline')}</p>
                </div>
              </button>
            </div>

            <nav className="hidden md:flex flex-1 justify-center items-center min-w-0">
              <div className="flex flex-col gap-1">
                <div className="flex justify-center items-center gap-2 flex-wrap">
                  {HEADER_LINKS_ROW1.map(({ to, labelKey }) => (
                    <button
                      key={to}
                      type="button"
                      onClick={() => navigate(to)}
                      className="px-3.5 py-2 text-base font-semibold tracking-tight text-slate-700 dark:text-slate-200 hover:text-[#DD0000] dark:hover:text-[#FFCE00] rounded-lg hover:bg-[#DD0000]/8 dark:hover:bg-[#FFCE00]/10 transition-all whitespace-nowrap"
                    >
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
                <div className="flex justify-center items-center gap-2 flex-wrap">
                  {HEADER_LINKS_ROW2.map(({ to, labelKey }) => (
                    <button
                      key={to}
                      type="button"
                      onClick={() => navigate(to)}
                      className="px-3.5 py-2 text-base font-semibold tracking-tight text-slate-700 dark:text-slate-200 hover:text-[#DD0000] dark:hover:text-[#FFCE00] rounded-lg hover:bg-[#DD0000]/8 dark:hover:bg-[#FFCE00]/10 transition-all whitespace-nowrap"
                    >
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            </nav>

            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <div ref={langDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setLangDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100 rounded-xl pl-3 pr-9 py-2.5 rtl:pl-9 rtl:pr-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFCE00] shadow-sm hover:shadow-md transition-all min-w-[8rem] border-2 dark:bg-slate-700/90"
                  style={{
                    borderColor: BRAND.red,
                    backgroundColor: 'rgba(255, 206, 0, 0.08)',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23DD0000'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: isRtl ? 'left 0.6rem center' : 'right 0.6rem center',
                    backgroundSize: '1rem',
                  }}
                  aria-label={t('selectLanguage')}
                  aria-expanded={langDropdownOpen}
                >
                  <img src={currentLang.flagUrl} alt="" className="w-6 h-4 object-cover rounded-sm flex-shrink-0" />
                  <span className="truncate">{currentLang.label}</span>
                </button>
                {langDropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 w-full min-w-[10rem] bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 py-1 z-50 overflow-hidden rtl:right-auto rtl:left-0"
                    style={{ borderColor: BRAND.red }}
                  >
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setLang(l.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-right text-sm transition-colors rtl:text-right ${
                          l.code === lang
                            ? 'bg-[#DD0000]/15 dark:bg-[#DD0000]/25 text-slate-900 dark:text-white font-medium'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <img src={l.flagUrl} alt="" className="w-6 h-4 object-cover rounded-sm flex-shrink-0" />
                        <span>{l.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {isLoggedIn ? (
                <UserProfileDropdown />
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                >
                  {t('login')}
                </button>
              )}
              {/* قائمة الموبايل — أقصى اليمين */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="md:hidden p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-[#DD0000] flex-shrink-0"
                aria-label={t('menu')}
                aria-expanded={mobileMenuOpen}
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* لوحة الموبايل — تفتح فوق المحتوى (overlay) */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 top-full z-50 border-t border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl max-h-[70vh] overflow-y-auto">
            <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-2">{t('menu')}</p>
              {[...HEADER_LINKS_ROW1, ...HEADER_LINKS_ROW2].map(({ to, labelKey }) => (
                <button
                  key={to}
                  type="button"
                  onClick={() => {
                    navigate(to);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-right px-4 py-3 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-[#DD0000]/10 dark:hover:bg-[#DD0000]/20 rounded-lg transition-colors"
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
