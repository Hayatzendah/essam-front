import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamDetails } from '../services/api';
import { BRAND } from '../constants/brand';
import { useTranslation } from '../contexts/LanguageContext';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';

export default function GrammatikTrainingTopicPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const t = useTranslation();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!examId) {
      setLoading(false);
      setError(t('grammatikTraining_invalidTopicId'));
      return;
    }
    getExamDetails(examId)
      .then((data) => {
        setExam(data);
        setError(null);
      })
      .catch(() => {
        setExam(null);
        setError(t('grammatikTraining_topicNotFound'));
      })
      .finally(() => setLoading(false));
  }, [examId]);

  const handleStartQuiz = (count) => {
    navigate(`/grammatik-training/quiz/topic/${examId}?count=${count}`);
  };

  const title = exam?.title || exam?.name || t('grammatikTraining_thema');

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-500 dark:text-slate-400 text-base">{t('grammatikTraining_topicLoading')}</div>
        </div>
        <AppFooter />
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-600 p-8 max-w-md w-full text-center">
            <p className="text-slate-600 dark:text-slate-400 text-base mb-6">{error || t('grammatikTraining_topicUnavailable')}</p>
            <button
              onClick={() => navigate('/grammatik-training')}
              className="px-6 py-3 rounded-xl font-semibold text-white transition-colors"
              style={{ background: BRAND.red }}
            >
              {t('grammatikTraining_back')}
            </button>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <AppHeader />
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-md">
          <button
            onClick={() => navigate('/grammatik-training')}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors mb-6 block"
          >
            ← {t('grammatikTraining_back')}
          </button>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-600 p-6 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3" dir="ltr">
              {title}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-8">
              {t('howManyTasks')}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[5, 10, 20, 30].map((count) => (
                <button
                  key={count}
                  onClick={() => handleStartQuiz(count)}
                  className="py-4 px-5 rounded-xl border-2 font-bold text-base sm:text-lg transition-all hover:shadow-md"
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
      </div>
      <AppFooter />
    </div>
  );
}
