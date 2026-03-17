// src/pages/WortschatzTopicPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getVocabularyTopics, getVocabularyWords } from "../services/api";
import { useTranslation } from "../contexts/LanguageContext";

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
  const t = useTranslation();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topic, setTopic] = useState(null);

  const topicConfig = TOPIC_CONFIG[topicSlug] || {
    icon: "📝",
    title: "Wortschatzthema",
    description: "",
  };

  useEffect(() => {
    async function loadVocab() {
      try {
        setLoading(true);
        setError("");

        // 1. جلب المواضيع حسب المستوى
        const topicsData = await getVocabularyTopics(level);
        const topicsList = Array.isArray(topicsData) ? topicsData : (topicsData?.items || topicsData?.topics || []);
        
        // 2. البحث عن الموضوع الذي slug = topicSlug
        const foundTopic = topicsList.find(t => 
          t.slug === topicSlug || 
          t._id === topicSlug || 
          t.id === topicSlug
        );

        if (!foundTopic) {
          setError(t("wortschatz_topicNotFound"));
          setLoading(false);
          return;
        }

        // حفظ معلومات الموضوع
        setTopic(foundTopic);

        // 3. جلب الكلمات باستخدام topicId
        const topicId = foundTopic._id || foundTopic.id;
        const wordsData = await getVocabularyWords(topicId);
        // الباك يرجع array مباشر
        const wordsList = Array.isArray(wordsData) ? wordsData : [];

        // ترتيب الكلمات حسب order إذا كان موجوداً، وإلا حسب createdAt
        // هذا يضمن أن الكلمات تظهر بنفس الترتيب الذي أضافه المدرس
        const sortedWords = [...wordsList].sort((a, b) => {
          // إذا كان order موجوداً، استخدمه للترتيب
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          // إذا كان order موجوداً في واحدة فقط، ضعها أولاً
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          // إذا لم يكن order موجوداً، استخدم createdAt كترتيب احتياطي
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateA - dateB; // ASC - الكلمات القديمة أولاً
        });

        setItems(sortedWords);
      } catch (err) {
        console.error('Error loading vocabulary:', err);
        setError(t("wortschatz_errorLoad"));
      } finally {
        setLoading(false);
      }
    }

    if (level && topicSlug) {
      loadVocab();
    }
  }, [level, topicSlug]);

  const displayLevel = level?.toUpperCase();

  // استخدام معلومات الموضوع من الباك إذا كانت متوفرة
  const displayTopic = topic || topicConfig;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* الشريط العلوي — رجوع فقط على اليسار */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← {t('wortschatz_backToTopics')}
          </button>
        </div>

        {/* الهيدر — بدون أيقونة */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-1">
            {displayTopic.title || (topicConfig.title === "Wortschatzthema" ? t("wortschatz_topicDefault") : topicConfig.title)}{" "}
            <span className="text-red-600">– {displayLevel}</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl">
            {displayTopic.description || displayTopic.shortDescription || topicConfig.description ||
              t("wortschatz_topicDescription")}
          </p>
        </div>

        {/* حالة التحميل */}
        {loading && (
          <div className="py-10 text-center text-slate-500 text-sm">
            {t("wortschatz_loadingWords")}
          </div>
        )}

        {/* حالة الخطأ */}
        {error && !loading && (
          <div className="py-4 mb-4 text-center text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
            {error}
          </div>
        )}

        {/* لو ما في داتا */}
        {!loading && !error && items.length === 0 && (
          <div className="py-10 text-center text-slate-500 text-sm">
            {t("wortschatz_noWords")}
          </div>
        )}

        {/* قائمة الكلمات */}
        {!loading && !error && items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 wortschatz-words-list">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              {t("wortschatz_wordList")} ({items.length})
            </h2>

            <div className="divide-y-2 divide-[#DD0000]">
              {items.map((word) => {
                // دعم meanings array أو meaning string (للتوافق مع البيانات القديمة)
                const meaningsArray = word.meanings || (word.meaning ? [{ text: word.meaning }] : []);

                // بناء قائمة المعاني جاهزة للعرض
                const meaningParts = [];

                // أولوية: meanings array إن وجد
                if (Array.isArray(meaningsArray) && meaningsArray.length > 0) {
                  meaningsArray.forEach((meaning) => {
                    const raw = meaning.text || meaning;
                    if (!raw) return;
                    const text = String(raw).trim();
                    if (!text) return;

                    // لو النص نفسه يحتوي على / أو | نقسمه أيضاً (لأن بعض البيانات القديمة مخزنة هكذا)
                    if (text.includes('/')) {
                      meaningParts.push(
                        ...text.split(/\s*\/\s*/).map(m => m.trim()).filter(Boolean)
                      );
                    } else if (text.includes('|')) {
                      meaningParts.push(
                        ...text.split(/\s*\|\s*/).map(m => m.trim()).filter(Boolean)
                      );
                    } else {
                      meaningParts.push(text);
                    }
                  });
                }

                // إذا لم تكن هناك meanings array، نستخدم meaning string ونقسمها
                if (meaningParts.length === 0 && word.meaning) {
                  const meaningStr = String(word.meaning);
                  if (meaningStr.includes('/')) {
                    meaningParts.push(
                      ...meaningStr.split(/\s*\/\s*/).map(m => m.trim()).filter(Boolean)
                    );
                  } else if (meaningStr.includes('|')) {
                    meaningParts.push(
                      ...meaningStr.split(/\s*\|\s*/).map(m => m.trim()).filter(Boolean)
                    );
                  } else if (meaningStr.trim()) {
                    meaningParts.push(meaningStr.trim());
                  }
                }

                return (
                  <div
                    key={word._id || word.id}
                    className="py-4 wortschatz-word-entry"
                  >
                    <div className="flex flex-col space-y-2">
                      <div className="wortschatz-word-term text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white" dir="ltr">
                        {word.word || word.germanWord}
                      </div>
                      
                      {/* عرض المعاني — بما فيها العربية */}
                      {meaningParts.length > 0 && (
                        <div className="flex flex-wrap gap-2 items-center wortschatz-word-meanings text-slate-900 dark:text-slate-100" dir="auto">
                          {meaningParts.map((text, index) => (
                            <span
                              key={index}
                              className="inline-block text-lg sm:text-xl font-semibold"
                              dir={/[\u0600-\u06FF]/.test(text) ? 'rtl' : 'ltr'}
                            >
                              {text}
                              {index < meaningParts.length - 1 && <span className="mx-2 font-normal text-slate-600 dark:text-slate-400">|</span>}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* عرض المثال — أكبر وداكن */}
                      {word.exampleSentence && (
                        <div className="text-xl sm:text-2xl text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2" dir="ltr">
                          <span className="font-bold">{t("wortschatz_example")}</span>
                          <span>{word.exampleSentence}</span>
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
