import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { BRAND, ADDITIONAL_SITE } from '../constants/brand';
import { useTranslation } from '../contexts/LanguageContext';

export default function ImpressumPage() {
  const navigate = useNavigate();
  const t = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <AppHeader />
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-6 transition-colors"
        >
          ← {t('back')}
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-600 p-6 sm:p-8 md:p-10" dir="ltr">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-1">
            {t('impressum_title')}
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10" style={{ color: BRAND.red }}>
            {t('impressum_subtitle')}
          </p>

          <section className="mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              {t('impressum_company')}
            </h2>
            <div className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed space-y-1">
              <p className="font-medium text-slate-800 dark:text-slate-200">Essam Hammam</p>
              <p>{t('impressum_addressStreet')}</p>
              <p>{t('impressum_addressCity')}</p>
              <p>{t('impressum_country')}</p>
              <p className="pt-2">
                <a href={ADDITIONAL_SITE.url} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80" style={{ color: BRAND.red }}>
                  {ADDITIONAL_SITE.name}
                </a>
              </p>
            </div>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              {t('impressum_contact')}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
              E-Mail: <a href="mailto:deutschvorbereitungstests@gmail.com" className="underline hover:opacity-80" style={{ color: BRAND.red }}>deutschvorbereitungstests@gmail.com</a>
            </p>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              USt.-ID: DE 455942863
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              {t('impressum_responsible')}
            </h2>
            <div className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed space-y-1">
              <p className="font-medium text-slate-800 dark:text-slate-200">Essam Hammam</p>
              <p>{t('impressum_addressStreet')}</p>
              <p>{t('impressum_addressCity')}</p>
              <p>{t('impressum_country')}</p>
            </div>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              {t('impressum_consumer')}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('impressum_consumerText')}
            </p>
          </section>

          <section className="mb-10 pt-6 border-t border-slate-200 dark:border-slate-600">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6">
              {t('impressum_disclaimer')}
            </h2>

            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              {t('impressum_liabilityContent')}
            </h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Die Inhalte dieser Website werden mit größter Sorgfalt erstellt. Dennoch übernehmen wir keine Gewähr für die Richtigkeit, Vollständigkeit und Aktualität der bereitgestellten Informationen. Als Diensteanbieter sind wir nach den allgemeinen gesetzlichen Vorschriften für eigene Inhalte auf diesen Seiten verantwortlich. Eine Haftung für konkrete Rechtsverstöße entsteht jedoch erst ab dem Zeitpunkt, in dem wir von einer solchen Rechtsverletzung Kenntnis erlangen. Sobald uns entsprechende Verstöße bekannt werden, werden die betroffenen Inhalte unverzüglich entfernt.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              {t('impressum_liabilityLinks')}
            </h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Diese Website enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Daher übernehmen wir für diese fremden Inhalte keine Gewähr. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Zum Zeitpunkt der Verlinkung wurden die externen Seiten auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zu diesem Zeitpunkt nicht erkennbar. Eine dauerhafte inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden derartige Links unverzüglich entfernt.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              {t('impressum_copyright')}
            </h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Die auf dieser Website veröffentlichten Inhalte und Werke unterliegen dem deutschen Urheberrecht. Jede Vervielfältigung, Bearbeitung, Verbreitung oder sonstige Verwertung außerhalb der Grenzen des Urheberrechts bedarf der vorherigen schriftlichen Zustimmung des jeweiligen Rechteinhabers, soweit gesetzlich nichts anderes vorgesehen ist. Downloads und Kopien dieser Seite sind nur für den privaten und nicht kommerziellen Gebrauch gestattet. Soweit Inhalte auf dieser Website nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet und entsprechend gekennzeichnet. Sollten Sie dennoch auf eine mögliche Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden die betroffenen Inhalte unverzüglich entfernt.
            </p>
          </section>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
