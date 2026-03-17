import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLevels } from "../hooks/useLevels";
import { getNounCounts } from "../services/api";
import { BRAND } from "../constants/brand";
import { useTranslation } from "../contexts/LanguageContext";

export default function DerDieDasPage() {
  const t = useTranslation();
  const { levelNames } = useLevels("derdiedas");
  const [activeLevel, setActiveLevel] = useState("A1");
  const [counts, setCounts] = useState({});
  const [showCountPicker, setShowCountPicker] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isTeacher = user.role === "admin" || user.role === "teacher";

  useEffect(() => {
    if (isTeacher) {
      getNounCounts()
        .then((data) => setCounts(data || {}))
        .catch(() => setCounts({}));
    }
  }, [isTeacher]);

  const handleLevelClick = (level) => {
    setActiveLevel(level);
    setShowCountPicker(true);
  };

  const handleStartQuiz = (count) => {
    navigate(`/derdiedas/quiz/${activeLevel}?count=${count}`);
  };

  // Page is inside AuthLayout (header/footer)
  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-6">
        <button
          onClick={() => navigate("/")}
          className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          ← {t('backToHome')}
        </button>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-3">
          {t('derdiedas_articles')}{' '}
          <span style={{ color: BRAND.red }}>{t('nav_derdiedas')}</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          {t('derdiedas_subtitle')}
        </p>
      </div>

      {/* Level tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
        {levelNames.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => handleLevelClick(level)}
            className={`px-5 py-2.5 rounded-xl border-2 font-semibold text-base transition ${
              activeLevel === level && showCountPicker
                ? "text-white border-transparent shadow-md"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:border-[#DD0000] hover:text-[#DD0000]"
            }`}
            style={activeLevel === level && showCountPicker ? { background: BRAND.red } : {}}
          >
            {level}
            {isTeacher && counts[level] !== undefined && (
              <span className="mr-1 text-xs opacity-75">({counts[level]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Word count selection card */}
      {showCountPicker && (
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-600 p-6 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              {activeLevel}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-8">
              {t('howManyTasks')}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[5, 10, 20, 30].map((count) => (
                <button
                  key={count}
                  onClick={() => handleStartQuiz(count)}
                  className="py-4 px-5 rounded-xl border-2 font-bold text-base sm:text-lg transition-all hover:shadow-md dark:bg-transparent"
                  style={{
                    borderColor: BRAND.red,
                    color: BRAND.red,
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${BRAND.red}18`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {count} {t('tasksCount')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!showCountPicker && (
        <div className="text-center text-slate-500 dark:text-slate-400 text-base mt-10">
          {t('derdiedas_chooseLevelToStart')}
        </div>
      )}
    </div>
  );
}
