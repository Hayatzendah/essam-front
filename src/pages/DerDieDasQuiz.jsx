import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { getQuizNouns } from "../services/api";
import { BRAND } from "../constants/brand";
import { useTranslation } from "../contexts/LanguageContext";

export default function DerDieDasQuiz() {
  const { level } = useParams();
  const [searchParams] = useSearchParams();
  const count = parseInt(searchParams.get("count") || "10", 10);
  const navigate = useNavigate();
  const t = useTranslation();

  const [nouns, setNouns] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState("loading"); // loading | question | feedback | finished
  const timerRef = useRef(null);

  // Fetch nouns on mount
  useEffect(() => {
    let cancelled = false;
    setPhase("loading");

    getQuizNouns(level, count)
      .then((data) => {
        if (!cancelled) {
          const list = Array.isArray(data) ? data : [];
          setNouns(list);
          setPhase(list.length > 0 ? "question" : "finished");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNouns([]);
          setPhase("finished");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [level, count]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const goNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (currentIndex + 1 >= nouns.length) {
      setPhase("finished");
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setPhase("question");
    }
  }, [currentIndex, nouns.length]);

  const handleAnswer = (article) => {
    if (phase !== "question" || !nouns[currentIndex]) return;

    const correct = nouns[currentIndex].article === article;
    setSelectedAnswer(article);
    setIsCorrect(correct);
    setPhase("feedback");

    if (correct) {
      setScore((prev) => prev + 1);
      timerRef.current = setTimeout(goNext, 3000);
    } else {
      timerRef.current = setTimeout(goNext, 5000);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setScore(0);
    setPhase("loading");

    getQuizNouns(level, count)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setNouns(list);
        setPhase(list.length > 0 ? "question" : "finished");
      })
      .catch(() => {
        setNouns([]);
        setPhase("finished");
      });
  };

  const noun = nouns[currentIndex];
  const total = nouns.length;
  const progress = total > 0 ? ((currentIndex + (phase === "feedback" ? 1 : 0)) / total) * 100 : 0;

  // Loading
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-600 rounded-full animate-spin mx-auto mb-4" style={{ borderTopColor: BRAND.red }} />
          <p className="text-slate-500 dark:text-slate-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Result card
  if (phase === "finished") {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const colorClass =
      pct >= 80
        ? "text-green-600 dark:text-green-400"
        : pct >= 50
        ? "text-amber-500"
        : "text-red-600";

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center py-4 px-4">
        <div className="max-w-sm w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-600 p-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('grammatikQuiz_result')}</h2>
          <div className={`text-5xl font-bold mb-2 ${colorClass}`}>
            {score} {t('exam_of')} {total}
          </div>
          <p className={`text-lg font-semibold mb-6 ${colorClass}`}>{pct}%</p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full py-3 text-white rounded-xl font-medium transition hover:opacity-90"
              style={{ background: BRAND.red }}
            >
              {t('results_tryAgainButton')}
            </button>
            <button
              onClick={() => navigate("/derdiedas")}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-xl font-medium transition"
            >
              {t('derdiedas_backToOverview')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz question
  const articles = ["der", "die", "das"];

  const getButtonClass = (article) => {
    const base =
      "py-5 px-6 rounded-xl text-2xl font-bold transition border-2 ";

    if (phase === "feedback") {
      if (article === noun.article) {
        return base + "bg-green-100 border-green-500 text-green-700";
      }
      if (article === selectedAnswer && !isCorrect) {
        return base + "bg-red-100 border-red-500 text-red-700";
      }
      return base + "bg-slate-50 border-slate-200 text-slate-400";
    }

    return (
      base +
      "bg-white dark:bg-slate-800 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 cursor-pointer"
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {t('exam_question')} {currentIndex + 1} {t('exam_of')} {total}
            </span>
            <button
              onClick={() => navigate("/derdiedas")}
              className="text-sm text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              ✕ {t('grammatikQuiz_end')}
            </button>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: BRAND.red }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-600 px-4 sm:px-8 py-8 sm:py-[8.19rem] mb-8 w-full min-w-0 overflow-hidden">
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-4 text-center">Wähle den richtigen Artikel:</p>
          <div className="text-center mb-2 w-full min-w-0 overflow-hidden" style={{ fontSize: 'clamp(0.75rem, 3vw + 0.75rem, 2.25rem)' }}>
            <span className="font-bold text-slate-900 dark:text-white break-words">
              <span className="inline-block min-w-[2ch] mx-0.5 align-baseline" style={{ color: BRAND.red }}>___</span> {noun?.singular}
            </span>
          </div>
          <p className="text-center w-full min-w-0 overflow-hidden text-slate-500 dark:text-slate-400 break-words" style={{ fontSize: 'clamp(0.65rem, 2.5vw + 0.65rem, 1.5rem)' }}>
            die {noun?.plural}
          </p>
        </div>

        {/* Article Buttons */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {articles.map((article) => (
            <button
              key={article}
              onClick={() => handleAnswer(article)}
              disabled={phase === "feedback"}
              className={getButtonClass(article)}
            >
              {article}
            </button>
          ))}
        </div>

        {/* Feedback + Next */}
        {phase === "feedback" && (
          <div className="text-center">
            <p
              className={`text-lg font-bold mb-3 ${
                isCorrect ? "text-green-600" : "text-red-600"
              }`}
            >
              {isCorrect ? `${t('derdiedas_correct')} 🎉` : `${t('derdiedas_incorrect')} ${noun?.article}`}
            </p>
            <button
              onClick={goNext}
              className="px-6 py-2 text-white rounded-xl font-medium transition hover:opacity-90"
              style={{ background: BRAND.red }}
            >
              {t('exam_next')} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
