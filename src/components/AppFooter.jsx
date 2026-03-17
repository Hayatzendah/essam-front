import { useNavigate } from 'react-router-dom';
import { BRAND, HEADER_LINKS_ROW1, HEADER_LINKS_ROW2 } from '../constants/brand';
import { useLanguage } from '../contexts/LanguageContext';
import logoImage from '../images/logo.png';

export default function AppFooter() {
  const navigate = useNavigate();
  const { t, isRtl } = useLanguage();

  return (
    <footer className="mt-auto w-full overflow-x-hidden" style={{ background: BRAND.black }}>
      <div
        className="h-1 w-full flex-shrink-0"
        style={{ background: isRtl ? `linear-gradient(270deg, ${BRAND.black} 0%, ${BRAND.red} 50%, ${BRAND.gold} 100%)` : `linear-gradient(90deg, ${BRAND.black} 0%, ${BRAND.red} 50%, ${BRAND.gold} 100%)` }}
      />
      <div className="max-w-5xl mx-auto w-full min-w-0 px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-4">
            <div
              className="flex-shrink-0 rounded-full p-1.5 sm:p-2 flex items-center justify-center ring-2 ring-[#FFCE00]/60 bg-white/95 shadow-lg"
              style={{ boxShadow: '0 4px 24px rgba(255,206,0,0.25)' }}
            >
              <img
                src={logoImage}
                alt={t('appName')}
                className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 object-contain"
              />
            </div>
            <div className="text-left sm:border-l sm:border-[#FFCE00]/40 sm:pl-4 min-w-0 rtl:text-right sm:rtl:border-l-0 sm:rtl:border-r sm:rtl:pl-0 sm:rtl:pr-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight" style={{ color: BRAND.gold }}>
                {t('appName')}
              </h2>
              <p className="text-sm sm:text-base mt-0.5 italic opacity-90" style={{ color: BRAND.gold }}>
                {t('tagline')}
              </p>
            </div>
          </div>
          <p
            className="text-slate-300 w-full max-w-md min-w-0 px-1 leading-relaxed mb-4 text-center text-sm sm:text-base sm:whitespace-nowrap"
          >
            {t('footerDescription')}
          </p>
          <nav className="flex flex-wrap justify-center gap-x-3 sm:gap-x-4 gap-y-2 text-sm sm:text-base">
            {[...HEADER_LINKS_ROW1, ...HEADER_LINKS_ROW2].slice(0, 8).map(({ to, labelKey }) => (
              <button
                key={to}
                type="button"
                onClick={() => navigate(to)}
                className="py-1 text-[#FFCE00] hover:text-[#DD0000] transition-colors duration-200"
              >
                {t(labelKey)}
              </button>
            ))}
          </nav>
        </div>
      </div>
      <div
        className="py-2 px-4 sm:px-6 border-t border-white/10 w-full min-w-0 overflow-x-hidden"
        style={{ background: 'rgba(0,0,0,0.4)' }}
      >
        <nav className="flex flex-wrap justify-center gap-x-3 sm:gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-400 mb-1">
          <button type="button" onClick={() => navigate('/impressum')} className="text-[#FFCE00] hover:text-[#DD0000] transition-colors">
            {t('impressum')}
          </button>
          <span className="text-slate-500">·</span>
          <button type="button" onClick={() => navigate('/agb')} className="text-[#FFCE00] hover:text-[#DD0000] transition-colors">
            {t('agb')}
          </button>
          <span className="text-slate-500">·</span>
          <button type="button" onClick={() => navigate('/datenschutz')} className="text-[#FFCE00] hover:text-[#DD0000] transition-colors">
            {t('datenschutz')}
          </button>
          <span className="text-slate-500">·</span>
          <button type="button" onClick={() => navigate('/kontakt')} className="text-[#FFCE00] hover:text-[#DD0000] transition-colors">
            {t('kontakt')}
          </button>
        </nav>
        <p className="text-center text-xs sm:text-sm text-slate-400">
          © {new Date().getFullYear()}{' '}
          <span className="text-[#FFCE00] font-medium">{t('appName')}</span>
          <span className="text-slate-500 mx-1">·</span>
          <span style={{ color: BRAND.red }}>{t('allRightsReserved')}</span>
        </p>
      </div>
    </footer>
  );
}
