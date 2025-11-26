// src/pages/WortschatzTopicPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

// إعداد بسيط لعناوين التوبيكات حسب الـ slug
const TOPIC_CONFIG = {
  "daily-life": {
    icon: "🏠",
    title: "الحياة اليومية",
    description: "كلمات عن الروتين اليومي، البيت، الشارع، المواصلات…",
  },
  family: {
    icon: "👨‍👩‍👧",
    title: "العائلة",
    description: "أفراد العائلة، العلاقات، الحالات الاجتماعية…",
  },
  food: {
    icon: "🍽️",
    title: "الطعام والشراب",
    description: "أسماء الأطعمة، المطعم، التسوّق من السوبرماركت…",
  },
  work: {
    icon: "💼",
    title: "العمل",
    description: "أماكن العمل، المهن، أدوات العمل الأساسية…",
  },
  travel: {
    icon: "✈️",
    title: "السفر",
    description: "المطار، القطار، الفندق، حجز التذاكر…",
  },
  health: {
    icon: "❤️",
    title: "الصحة",
    description: "زيارة الطبيب، الأعراض، أجزاء الجسم…",
  },
  shopping: {
    icon: "🛍️",
    title: "التسوّق",
    description: "الملابس، المقاسات، وسائل الدفع…",
  },
  environment: {
    icon: "🌍",
    title: "البيئة",
    description: "المناخ، التلوث، إعادة التدوير، الطاقة…",
  },
  society: {
    icon: "👥",
    title: "المجتمع",
    description: "العادات، التقاليد، التعامل مع الآخرين…",
  },
  politics: {
    icon: "🗳️",
    title: "السياسة",
    description: "الانتخابات، الحكومة، الأحزاب، الحقوق والواجبات…",
  },
  education: {
    icon: "🎓",
    title: "التعليم",
    description: "المدرسة، الجامعة، الدورات التدريبية…",
  },
  media: {
    icon: "📰",
    title: "الإعلام",
    description: "الصحافة، الأخبار، وسائل الإعلام المختلفة…",
  },
  culture: {
    icon: "🎭",
    title: "الثقافة والفنون",
    description: "المسرح، السينما، الأدب، الفنون…",
  },
};

export default function WortschatzTopicPage() {
  const { level, topicSlug } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const topicConfig = TOPIC_CONFIG[topicSlug] || {
    icon: "📝",
    title: "موضوع مفردات",
    description: "",
  };

  useEffect(() => {
    async function loadVocab() {
      try {
        setLoading(true);
        setError("");

        // بناء الـ URL يدوياً لتجنب مشاكل axios في تحويل params
        let url = '/questions/vocab?';
        const params = [];
        if (level) params.push(`level=${encodeURIComponent(level)}`);
        if (topicSlug) params.push(`tags=${encodeURIComponent(topicSlug)}`);
        url += params.join('&');

        const response = await api.get(url);

        // البيانات موجودة في response.data.items حسب الـ API response
        setItems(response.data.items || response.data || []);
      } catch (err) {
        console.error(err);
        setError("حدث خطأ أثناء تحميل الكلمات. جرّبي مرة أخرى.");
      } finally {
        setLoading(false);
      }
    }

    if (level && topicSlug) {
      loadVocab();
    }
  }, [level, topicSlug]);

  const displayLevel = level?.toUpperCase();

  // دالة صغيرة لاختيار الترجمة من جسم السؤال
  const getArabicMeaning = (q) => {
    const fromTranslationField = q.translationAr || q.meaningAr;
    const fromCorrectOption =
      q.correctAnswerText ||
      q.options?.find((opt) => opt.isCorrect)?.text ||
      q.options?.[0];

    return fromTranslationField || fromCorrectOption || "";
  };

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
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
            {topicConfig.icon} {topicConfig.title}{" "}
            <span className="text-rose-500">– مستوى {displayLevel}</span>
          </h1>
          <p className="text-sm text-slate-600 max-w-xl">
            {topicConfig.description ||
              "تدرّبي على الكلمات الأساسية لهذا الموضوع، ثم جرّبي حلّ تمارين قصيرة لتثبيت المفردات في الذاكرة."}
          </p>
        </div>

        {/* حالة التحميل */}
        {loading && (
          <div className="py-10 text-center text-slate-500 text-sm">
            جاري تحميل الكلمات…
          </div>
        )}

        {/* حالة الخطأ */}
        {error && !loading && (
          <div className="py-4 mb-4 text-center text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
            {error}
          </div>
        )}

        {/* لو ما في داتا */}
        {!loading && !error && items.length === 0 && (
          <div className="py-10 text-center text-slate-500 text-sm">
            لا توجد كلمات مضافة لهذا الموضوع حتى الآن.
          </div>
        )}

        {/* قائمة الكلمات */}
        {!loading && !error && items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">
              قائمة الكلمات ({items.length})
            </h2>

            <div className="divide-y divide-slate-100">
              {items.map((q) => {
                const meaning = getArabicMeaning(q);

                return (
                  <div
                    key={q._id}
                    className="py-3"
                  >
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">
                        {q.prompt || q.text || q.question}
                      </div>
                      {meaning && (
                        <div className="text-xs text-slate-600 mt-0.5">
                          {meaning}
                        </div>
                      )}
                      {q.exampleDe && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          مثال: {q.exampleDe}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
