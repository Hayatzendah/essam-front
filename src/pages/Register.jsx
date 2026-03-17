import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import registerImage from '../images/47163.jpg';

function Register() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError(t('registerErrorPasswordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('registerErrorPasswordShort'));
      return;
    }

    setLoading(true);

    try {
      // التحقق من البريد الإلكتروني أولاً (اختياري)
      try {
        const emailCheck = await authAPI.checkEmail(email);
        if (emailCheck.exists) {
          setError(t('registerErrorEmailInUse'));
          setLoading(false);
          return;
        }
      } catch (checkError) {
        // إذا فشل التحقق، نتابع التسجيل (قد لا يكون endpoint متاح)
        console.log('Email check failed, continuing with registration:', checkError);
      }

      const registerResult = await authAPI.register(email, password, 'student');
      console.log('Registration successful:', registerResult);

      // بعد التسجيل الناجح، انتظر قليلاً ثم سجل الدخول تلقائياً
      // (لإعطاء الوقت لقاعدة البيانات لحفظ البيانات)
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        await authAPI.login(email, password);

        // إذا في redirect parameter، روح عليه
        // وإلا حسب دور المستخدم: طالب -> /، أدمن/معلم -> /welcome
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const defaultRedirect = (user.role === 'student') ? '/' : '/welcome';
        const redirectTo = searchParams.get('redirect') || defaultRedirect;
        navigate(redirectTo);
      } catch (loginError) {
        console.error('Auto-login failed after registration:', loginError);
        // إذا فشل تسجيل الدخول التلقائي، اعرض رسالة نجاح واطلب من المستخدم تسجيل الدخول يدوياً
        setSuccess(t('registerSuccess'));
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      console.error('=== Registration Error Details ===');
      console.error('Full error object:', err);
      console.error('Error response data:', err.response?.data);
      console.error('Error status code:', err.response?.status);
      console.error('Original email:', email);
      console.error('Email (normalized):', email.trim().toLowerCase());
      console.error('Request URL:', err.config?.url);
      console.error('Request data:', err.config?.data);
      console.error('===================================');

      if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        setError(t('registerErrorNetwork'));
      } else if (err.response?.status === 400) {
        const errorData = err.response?.data;
        let errorMessage = t('registerErrorInvalidData');

        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData?.errors) {
          errorMessage = Object.values(errorData.errors).flat().join(', ');
        }

        if (errorMessage.toLowerCase().includes('email already') ||
            errorMessage.toLowerCase().includes('already in use') ||
            errorMessage.toLowerCase().includes('email exists')) {
          errorMessage = t('registerErrorEmailInUse');
        }

        setError(errorMessage);
      } else if (err.response?.status === 409) {
        const errorData = err.response?.data;
        let errorMessage = t('registerErrorEmailInUseConflict');

        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }

        errorMessage += `. ${t('registerErrorEmailInUse')}`;
        setError(errorMessage);
      } else if (err.response?.status === 500) {
        setError(t('registerErrorServer'));
      } else {
        setError(
          err.response?.data?.message || err.response?.data?.error || t('registerErrorGeneric')
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
        {/* العمود اليسار: صورة + نص تعريفي */}
        <div className="hidden lg:flex flex-1 items-center justify-center bg-white">
        <div className="max-w-lg px-8 pr-8">
          <div className="mb-6 text-sm font-semibold text-red-600">
            {t('appTagline')}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4 leading-snug">
            {t('registerHeadline')}
          </h1>
          <p className="text-slate-600 text-sm mb-8">
            {t('registerIntro')}
          </p>
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={registerImage}
              alt={t('home_heroAlt')}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>

      {/* العمود اليمين: فورم التسجيل */}
      <div className="w-full lg:max-w-md flex items-center justify-center px-4 py-8 lg:mr-8">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-slate-100 px-6 py-7">
          <div className="flex flex-col items-center mb-6">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
              <span className="text-2xl">📝</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {t('registerTitle')}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t('registerSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* الإيميل */}
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

            {/* كلمة المرور */}
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
              <p className="text-[11px] text-slate-400">
                {t('registerPasswordHint')}
              </p>
            </div>

            {/* تأكيد كلمة المرور */}
            <div className="space-y-1 text-sm">
              <label className="block font-medium text-slate-700">
                {t('confirmPassword')}
              </label>
              <input
                type="password"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-slate-50"
                placeholder={t('confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            {success && (
              <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-md px-3 py-2">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-red-600 text-white text-sm font-semibold py-2.5 mt-2 hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t('registerLoading') : t('createStudentAccount')}
            </button>

            <p className="text-xs text-center text-slate-500 mt-3">
              {t('alreadyHaveAccount')}{' '}
              <Link
                to={searchParams.get('redirect') ? `/login?redirect=${searchParams.get('redirect')}` : '/login'}
                className="text-red-600 font-medium hover:text-red-700"
              >
                {t('loginLink')}
              </Link>
            </p>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}

export default Register;

