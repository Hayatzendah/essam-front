// src/pages/Wortschatz.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

const TOPICS_BY_LEVEL = {
  A1: [
    {
      slug: "daily-life",
      icon: "🏠",
      title: "الحياة اليومية",
      description: "كلمات عن الروتين اليومي، البيت، الشارع، المواصلات…",
    },
    {
      slug: "family",
      icon: "👨‍👩‍👧",
      title: "العائلة",
      description: "أفراد العائلة، العلاقات، الحالات الاجتماعية…",
    },
    {
      slug: "food",
      icon: "🍽️",
      title: "الطعام والشراب",
      description: "أسماء الأطعمة، المطعم، التسوّق من السوبرماركت…",
    },
    {
      slug: "work",
      icon: "💼",
      title: "العمل",
      description: "أماكن العمل، المهن، أدوات العمل الأساسية…",
    },
  ],
  A2: [
    {
      slug: "travel",
      icon: "✈️",
      title: "السفر",
      description: "المطار، القطار، الفندق، حجز التذاكر…",
    },
    {
      slug: "health",
      icon: "❤️",
      title: "الصحة",
      description: "زيارة الطبيب، الأعراض، أجزاء الجسم…",
    },
    {
      slug: "shopping",
      icon: "🛍️",
      title: "التسوّق",
      description: "الملابس، المقاسات، وسائل الدفع…",
    },
  ],
  B1: [
    {
      slug: "environment",
      icon: "🌍",
      title: "البيئة",
      description: "المناخ، التلوث، إعادة التدوير، الطاقة…",
    },
    {
      slug: "society",
      icon: "👥",
      title: "المجتمع",
      description: "العادات، التقاليد، التعامل مع الآخرين…",
    },
  ],
  B2: [
    {
      slug: "politics",
      icon: "🗳️",
      title: "السياسة",
      description: "الانتخابات، الحكومة، الأحزاب، الحقوق والواجبات…",
    },
    {
      slug: "education",
      icon: "🎓",
      title: "التعليم",
      description: "المدرسة، الجامعة، الدورات التدريبية…",
    },
  ],
  C1: [
    {
      slug: "media",
      icon: "📰",
      title: "الإعلام",
      description: "الصحافة، الأخبار، وسائل الإعلام المختلفة…",
    },
    {
      slug: "culture",
      icon: "🎭",
      title: "الثقافة والفنون",
      description: "المسرح، السينما، الأدب، الفنون…",
    },
  ],
};

export default function WortschatzPage() {
  const [activeLevel, setActiveLevel] = useState("A1");
  const navigate = useNavigate();

  const topics = TOPICS_BY_LEVEL[activeLevel] ?? [];

  const handleTopicClick = (topicSlug) => {
    // هنستخدم الروت ده لاحقًا لعرض الكلمات واستدعاء /questions/vocab
    navigate(`/wortschatz/${activeLevel}/${topicSlug}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* شريط أعلى بسيط */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← العودة للرئيسية
          </button>
          <span className="text-xs font-semibold text-rose-500">
            Deutsch Learning App
          </span>
        </div>

        {/* العنوان الرئيسي */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            المفردات <span className="text-rose-500">Wortschatz</span>
          </h1>
          <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto">
            اختاري مستواك ثم موضوع المفردات الذي تحبين التدرب عليه. يمكنك لاحقًا
            حلّ تمارين واختبارات على نفس الكلمات لتثبيتها في الذاكرة. 💡
          </p>
        </div>

        {/* Tabs للمستويات */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setActiveLevel(level)}
              className={`px-4 py-2 text-sm rounded-full border transition ${
                activeLevel === level
                  ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:border-rose-400 hover:text-rose-600"
              }`}
            >
              مستوى {level}
            </button>
          ))}
        </div>

        {/* عنوان فرعي للمستوى */}
        <div className="text-center mb-4">
          <p className="text-xs text-slate-500">
            يتم عرض المواضيع المناسبة لمستوى{" "}
            <span className="font-semibold text-slate-800">{activeLevel}</span>.
          </p>
        </div>

        {/* كروت المواضيع */}
        {topics.length === 0 ? (
          <div className="text-center text-slate-500 text-sm mt-10">
            لا توجد مواضيع مضافة لهذا المستوى حتى الآن.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => (
              <button
                key={topic.slug}
                type="button"
                onClick={() => handleTopicClick(topic.slug)}
                className="group text-right bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-xl">
                    {topic.icon}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      {topic.title}
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      موضوع مفردات لمستوى {activeLevel}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  {topic.description}
                </p>
                <div className="flex items-center justify-between text-[11px] text-rose-600">
                  <span className="font-semibold group-hover:underline">
                    عرض الكلمات والتدريب
                  </span>
                  <span>↗</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
