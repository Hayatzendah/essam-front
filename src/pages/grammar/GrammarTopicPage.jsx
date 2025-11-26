// src/pages/grammar/GrammarTopicPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGrammarTopic } from '../../services/api';

export default function GrammarTopicPage() {
  const { level, topicSlug } = useParams();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTopic() {
      try {
        setLoading(true);
        setError('');

        // جلب محتوى الموضوع
        const topicData = await getGrammarTopic(topicSlug, level);
        setTopic(topicData);
      } catch (err) {
        console.error(err);

        // معالجة الأخطاء حسب النوع
        if (err.response?.status === 401) {
          // 401 = Token منتهي أو غير صالح
          console.error('🔒 401 Unauthorized - Token منتهي أو غير صالح');
          setError('انتهت صلاحية جلسة الدخول. يرجى تسجيل الدخول مرة أخرى.');

          // حذف tokens القديمة
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');

          // إعادة التوجيه للـ login
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else if (err.response?.status === 403) {
          // 403 = Forbidden - ما عندك صلاحية
          console.error('🚫 403 Forbidden - ليس لديك صلاحية');
          setError('عذراً، ليس لديك صلاحية للوصول لهذا المحتوى.');
        } else {
          setError('حدث خطأ أثناء تحميل محتوى القواعد. جرّبي مرة أخرى.');
        }
      } finally {
        setLoading(false);
      }
    }

    if (level && topicSlug) {
      loadTopic();
    }
  }, [level, topicSlug, navigate]);

  const displayLevel = level?.toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* الشريط العلوي */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← رجوع لقائمة المواضيع
          </button>
          <span className="text-xs font-semibold text-rose-500">
            Deutsch Learning App
          </span>
        </div>

        {/* الهيدر */}
        {!loading && topic && (
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
              {topic.title}{" "}
              <span className="text-rose-500">– مستوى {displayLevel}</span>
            </h1>
            <p className="text-sm text-slate-600 max-w-xl">
              {topic.shortDescription || topic.description || ""}
            </p>
          </div>
        )}


        {/* حالة التحميل */}
        {loading && (
          <div className="py-10 text-center text-slate-500 text-sm">
            جاري تحميل المحتوى…
          </div>
        )}

        {/* حالة الخطأ */}
        {error && !loading && (
          <div className="py-4 mb-4 text-center text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
            {error}
          </div>
        )}

        {/* محتوى القاعدة (HTML) */}
        {!loading && !error && topic && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 mb-4">
              <div
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: topic.contentHtml || topic.content }}
              />
            </div>

            {/* زر ابدأ التمرين */}
            <div className="flex justify-center">
              <button
                onClick={() => navigate(`/grammatik/${level}/${topicSlug}/exercise`)}
                className="px-6 py-3 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 transition-colors shadow-sm"
              >
                🎯 ابدأ التمرين
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
