import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useLevels } from '../hooks/useLevels';
import { getPublicExams } from '../services/api';
import { BRAND } from '../constants/brand';
import { useTranslation } from '../contexts/LanguageContext';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';

export default function GrammatikTrainingPage() {
  const navigate = useNavigate();
  const t = useTranslation();
  const { levelNames, loading: levelsLoading } = useLevels('grammatik_training');
  const [activeLevel, setActiveLevel] = useState('');
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);

  useEffect(() => {
    if (levelNames.length > 0 && !activeLevel) {
      setActiveLevel(levelNames[0]);
    }
  }, [levelNames, activeLevel]);

  useEffect(() => {
    if (!activeLevel) {
      setTopics([]);
      return;
    }
    setTopicsLoading(true);
    getPublicExams({
      level: activeLevel,
      examCategory: 'grammatik_training_exam',
      limit: 50,
    })
      .then((res) => {
        const list = res?.items ?? res?.exams ?? res?.data ?? (Array.isArray(res) ? res : []);
        setTopics(Array.isArray(list) ? list : []);
      })
      .catch(() => setTopics([]))
      .finally(() => setTopicsLoading(false));
  }, [activeLevel]);

  const handleLevelClick = (level) => {
    setActiveLevel(level);
  };

  const handleTopicClick = (exam) => {
    const id = exam?._id ?? exam?.id;
    if (id) navigate(`/grammatik-training/topic/${id}`);
  };

  if (!levelsLoading && levelNames.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
        <AppHeader />
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="h-14 w-14 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${BRAND.red}18` }}>
              <BookOpen className="w-7 h-7" style={{ color: BRAND.red }} strokeWidth={1.8} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('grammatikTraining_title')}</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {t('grammatikTraining_noLevelMessage')}
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 rounded-xl font-medium transition-colors text-white"
              style={{ background: BRAND.red }}
            >
              {t('backToHome')}
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
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            ← {t('backToHome')}
          </button>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-3">
            <span style={{ color: BRAND.red }}>{t('grammatikTraining_title')}</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {t('grammatikTraining_subtitle')}
          </p>
        </div>

        {levelsLoading ? (
          <div className="text-center text-slate-500 dark:text-slate-400 text-base py-6">{t('levelsLoading')}</div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {levelNames.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => handleLevelClick(level)}
                className={`px-5 py-2.5 rounded-xl border-2 font-semibold text-base transition ${
                  activeLevel === level
                    ? 'text-white border-transparent shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:border-[#DD0000] hover:text-[#DD0000]'
                }`}
                style={activeLevel === level ? { background: BRAND.red } : {}}
              >
                {level}
              </button>
            ))}
          </div>
        )}

        {activeLevel && (
          <>
            <div className="text-center mb-8">
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
                {t('grammatikTraining_chooseTopic')} ({activeLevel})
              </p>
            </div>
            {topicsLoading ? (
              <div className="text-center text-slate-500 dark:text-slate-400 text-base py-6">{t('grammatikTraining_topicsLoading')}</div>
            ) : topics.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-12">
                {topics.map((exam) => {
                  const id = exam?._id ?? exam?.id;
                  const title = exam?.title ?? exam?.name ?? t('grammatikTraining_thema');
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleTopicClick(exam)}
                      className="group text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${BRAND.red}18` }}>
                          <BookOpen className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: BRAND.red }} strokeWidth={1.8} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {title}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {t('grammatikTraining_topicFor')} {activeLevel}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-base font-semibold group-hover:underline" style={{ color: BRAND.red }}>
                        {t('grammatikTraining_startTopic')}
                        <span>›</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-slate-500 dark:text-slate-400 text-base py-10 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl">
                {t('grammatikTraining_noTopics')}
              </div>
            )}
          </>
        )}

        {!activeLevel && levelNames.length > 0 && (
          <div className="text-center text-slate-500 dark:text-slate-400 text-base mt-10">
            {t('grammatikTraining_chooseLevelToShow')}
          </div>
        )}
      </div>
      <AppFooter />
    </div>
  );
}
