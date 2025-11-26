import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">

      {/* NAVBAR */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            <div className="flex items-center">
              <img
                src="/src/images/logo.png"
                alt="Deutsch Learning"
                className="h-40 w-auto"
              />
            </div>

            <button
              onClick={() => setShowLoginModal(true)}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition-colors"
            >
              تسجيل الدخول
            </button>
          </div>
        </div>
      </header>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={() => setShowLoginModal(false)}
          ></div>

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-lg max-w-sm w-full p-6">
              {/* Close Button */}
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute left-3 top-3 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>

              {/* Title */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">🎓</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  تسجيل الدخول
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  ابدأ رحلتك في تعلم الألمانية
                </p>
              </div>

              {/* Login Button */}
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  navigate("/login");
                }}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-lg p-4 transition-colors font-medium"
              >
                دخول الطالب
              </button>

              {/* Register Link */}
              <div className="text-center mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  ليس لديك حساب؟{" "}
                  <button
                    onClick={() => {
                      setShowLoginModal(false);
                      navigate("/register");
                    }}
                    className="text-rose-600 hover:text-rose-700 font-medium"
                  >
                    سجل الآن
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              تعلم الألمانية خطوة بخطوة 🇩🇪
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              اختبارات الحياة في ألمانيا – امتحانات GOETHE وTELC – قواعد اللغة – مفردات
              <br />
              كل شيء في مكان واحد، بسهولة وسرعة
            </p>
          </div>
        </div>
      </section>

      {/* MAIN CARDS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* CARD 1 - Leben in Deutschland */}
          <div
            onClick={() => navigate("/student/liden")}
            className="group cursor-pointer bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 p-6 transition-all hover:-translate-y-1 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4 text-3xl">
              🏠
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Leben in Deutschland Test
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              33 سؤال عشوائي — 30 من الـ300 و3 من الولاية المختارة.
            </p>
          </div>

          {/* CARD 2 - Prüfungen */}
          <div
            onClick={() => navigate("/pruefungen")}
            className="group cursor-pointer bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 p-6 transition-all hover:-translate-y-1 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 text-3xl">
              📝
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Prüfungen
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Goethe – TELC – ÖSD – ECL – DTB – DTZ.
              الاستماع، القراءة، الكتابة، المحادثة.
            </p>
          </div>

          {/* CARD 3 - Grammatik */}
          <div
            onClick={() => navigate("/grammatik")}
            className="group cursor-pointer bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 p-6 transition-all hover:-translate-y-1 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-4 text-3xl">
              📚
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Grammatik
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              قواعد مرتبة حسب المستويات A1 – C1: الأزمنة، الجمل، المبني للمجهول…
            </p>
          </div>

          {/* CARD 4 - Wortschatz */}
          <div
            onClick={() => navigate("/wortschatz")}
            className="group cursor-pointer bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 p-6 transition-all hover:-translate-y-1 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mb-4 text-3xl">
              💬
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Wortschatz
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              كلمات ومفردات للمستويات A1 – C1: الحياة اليومية، العمل، السفر…
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}

