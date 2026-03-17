import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import loginImage from '../images/41658.jpg';

function Login() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // إذا المستخدم مسجل دخول بالفعل، وجهه للصفحة المناسبة
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const dest = user.role === 'student' ? '/' : '/welcome';
      navigate(dest, { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.login(email, password);

      // التحقق من الدور - هذه الصفحة مخصصة للطلاب فقط
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role === 'admin' || user.role === 'teacher') {
        await authAPI.logout();
        setError(t('loginErrorStudentsOnly'));
        setLoading(false);
        return;
      }

      // إذا في redirect parameter، روح عليه
      // وإلا حسب دور المستخدم: طالب -> /، أدمن/معلم -> /welcome
      const defaultRedirect = (user.role === 'student') ? '/' : '/welcome';
      const redirectTo = searchParams.get('redirect') || defaultRedirect;
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        setError(t('loginErrorNetwork'));
      } else if (err.response?.status === 400) {
        const errorData = err.response?.data;
        let errorMessage = t('loginErrorInvalidCredentials');

        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData?.errors) {
          errorMessage = Object.values(errorData.errors).flat().join(', ');
        }

        setError(errorMessage);
      } else if (err.response?.status === 401) {
        setError(t('loginErrorInvalidCredentials'));
      } else {
        setError(
          err.response?.data?.message || err.response?.data?.error || t('loginErrorGeneric')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* زر الرجوع للرئيسية */}
      <div className="w-full px-6 py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors group"
        >
          <svg
            className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">{t('home')}</span>
        </Link>
      </div>

      <div className="flex-1 flex items-stretch">
        {/* العمود اليسار: فورم الدخول */}
        <div className="w-full lg:max-w-md flex items-center justify-center px-4 py-8 lg:ml-8">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-slate-100 px-6 py-7">
          <div className="flex flex-col items-center mb-6">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <span className="text-2xl">🎓</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {t('loginTitle')}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t('loginSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1 text-sm">
              <label className="block font-medium text-slate-700">
                {t('email')}
              </label>
              <input
                type="email"
                required
                dir="ltr"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-slate-50"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1 text-sm">
              <label className="block font-medium text-slate-700">
                {t('password')}
              </label>
              <input
                type="password"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-slate-50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-red-600 text-white text-sm font-semibold py-2.5 mt-2 hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('loginLoading') : t('studentLogin')}
            </button>

            <p className="text-xs text-center text-slate-500 mt-3">
              {t('noAccount')}{' '}
              <Link
                to={searchParams.get('redirect') ? `/register?redirect=${searchParams.get('redirect')}` : '/register'}
                className="text-red-600 font-medium hover:text-red-700"
              >
                {t('registerNow')}
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* العمود اليمين: صورة + نص */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-white">
        <div className="max-w-lg px-8 pl-8">
          <div className="mb-6 text-sm font-semibold text-red-600">
            {t('appTagline')}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4 leading-snug">
            {t('startJourney')}
          </h1>
          <p className="text-slate-600 text-sm mb-8">
            {t('featureDescription')}
          </p>
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={loginImage}
              alt={t('home_heroAlt')}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default Login;

