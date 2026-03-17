import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { BRAND } from '../constants/brand';
import { useTranslation } from '../contexts/LanguageContext';

export default function KontaktPage() {
  const navigate = useNavigate();
  const t = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const isLoggedIn = !!localStorage.getItem('accessToken');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    window.location.href = `mailto:deutschvorbereitungstests@gmail.com?subject=Kontakt von ${encodeURIComponent(name)}&body=${encodeURIComponent(message)}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <AppHeader />
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-6 transition-colors"
        >
          ← {t('back')}
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-600 p-6 sm:p-8 md:p-10" dir="ltr">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">
            {t('kontakt')}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-10">
            {t('kontakt_intro')}
          </p>

          <div className="grid md:grid-cols-2 gap-10 md:gap-12">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-6" style={{ color: BRAND.red }}>
                {t('kontakt_writeUs')}
              </h2>

              {!isLoggedIn ? (
                <>
                  <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-medium">
                    {t('kontakt_loginRequired')}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-white transition hover:opacity-90 text-base sm:text-lg"
                    style={{ background: BRAND.red }}
                  >
                    {t('kontakt_registerLogin')}
                  </button>
                </>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="kontakt-name" className="block text-base sm:text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('kontakt_yourName')}
                    </label>
                    <input
                      id="kontakt-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#DD0000] transition-colors text-base sm:text-lg"
                      placeholder={t('kontakt_yourNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <label htmlFor="kontakt-email" className="block text-base sm:text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('kontakt_emailLabel')}
                    </label>
                    <input
                      id="kontakt-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#DD0000] transition-colors text-base sm:text-lg"
                      placeholder={t('kontakt_emailPlaceholder')}
                    />
                  </div>
                  <div>
                    <label htmlFor="kontakt-message" className="block text-base sm:text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {t('kontakt_yourMessage')}
                    </label>
                    <textarea
                      id="kontakt-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#DD0000] transition-colors resize-y text-base sm:text-lg"
                      placeholder={t('kontakt_messagePlaceholder')}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-white transition hover:opacity-90 text-base sm:text-lg"
                    style={{ background: BRAND.red }}
                  >
                    {t('kontakt_sendMessage')}
                  </button>
                </form>
              )}
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-6" style={{ color: BRAND.red }}>
                {t('kontakt_questions')}
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                {t('kontakt_weAreOpen')}
              </p>
              <div className="text-base sm:text-lg text-slate-700 dark:text-slate-200 leading-relaxed space-y-1">
                <p className="font-semibold" style={{ color: BRAND.red }}>{t('impressum_company')}</p>
                <p className="font-medium">Essam Hammam</p>
                <p>{t('impressum_addressStreet')}</p>
                <p>{t('impressum_addressCity')}</p>
                <p>{t('impressum_country')}</p>
                <p className="mt-4">
                  {t('kontakt_emailLabel')}{' '}
                  <a href="mailto:deutschvorbereitungstests@gmail.com" className="underline hover:opacity-80" style={{ color: BRAND.red }}>
                    deutschvorbereitungstests@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
