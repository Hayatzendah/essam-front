// src/pages/GrammatikPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { getGrammarTopics } from "../services/api";
import { useLevels } from "../hooks/useLevels";
import { BRAND } from "../constants/brand";
import { useTranslation } from "../contexts/LanguageContext";
import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";

export default function GrammatikPage() {
  const t = useTranslation();
  const { levelNames } = useLevels('grammatik');
  const [activeLevel, setActiveLevel] = useState("A1");
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadTopics() {
      try {
        setLoading(true);
        setError("");

        const data = await getGrammarTopics(activeLevel, { provider: 'Grammatik' });
        setTopics(data.items || data || []);
      } catch (err) {
        console.error(err);
        setError(t("grammatik_error"));
      } finally {
        setLoading(false);
      }
    }

    loadTopics();
  }, [activeLevel]);

  const handleTopicClick = (topicSlug) => {
    navigate(`/grammatik/${activeLevel}/${topicSlug}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <AppHeader />
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-3">
            <span style={{ color: BRAND.red }}>{t('grammatik_title')}</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {t('grammatik_subtitle')}
          </p>
        </div>

        {/* Tabs للمستويات — نفس أسلوب Prüfungen */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {levelNames.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setActiveLevel(level)}
              className={`px-5 py-2.5 rounded-xl border-2 font-semibold text-base transition ${
                activeLevel === level
                  ? "text-white border-transparent shadow-md"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:border-[#DD0000] hover:text-[#DD0000]"
              }`}
              style={activeLevel === level ? { background: BRAND.red } : {}}
            >
              {level}
            </button>
          ))}
        </div>

        <div className="text-center mb-8">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
            {t('grammatik_topicsFor')} {activeLevel}
          </h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
            {t('grammatik_rulesAndExercises')}
          </p>
        </div>

        {loading && (
          <div className="text-center text-slate-500 dark:text-slate-400 text-base mt-10">
            {t('grammatik_loading')}
          </div>
        )}

        {/* حالة الخطأ — نفس أسلوب Prüfungen */}
        {error && !loading && (
          <div className="text-center rounded-xl py-4 px-4 border-2 mb-10" style={{ color: BRAND.red, backgroundColor: `${BRAND.red}12`, borderColor: BRAND.red }}>
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Keine Themen */}
        {!loading && !error && topics.length === 0 && (
          <div className="text-center text-slate-500 dark:text-slate-400 text-base mt-10 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl py-8">
            {t('grammatik_noTopics')}
          </div>
        )}

        {/* كروت المواضيع — نفس البطاقات والخطوط والألوان مثل Prüfungen */}
        {!loading && !error && topics.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-12">
            {topics.map((topic) => (
              <button
                key={topic.slug}
                type="button"
                onClick={() => handleTopicClick(topic.slug)}
                className="group text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${BRAND.red}18` }}>
                    <BookOpen className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: BRAND.red }} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {topic.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('grammatik_topicFor')} {activeLevel}
                    </p>
                  </div>
                </div>
                <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 mb-4 leading-relaxed line-clamp-2">
                  {topic.shortDescription || topic.description || ""}
                </p>
                <span className="inline-flex items-center gap-1 text-base font-semibold group-hover:underline" style={{ color: BRAND.red }}>
                  {t('grammatik_ruleAndPractice')}
                  <span>›</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <AppFooter />
    </div>
  );
}
