import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Home, ClipboardList, Clock } from 'lucide-react';
import { usersAPI } from '../../services/usersAPI';
import { examsAPI } from '../../services/examsAPI';
import { BRAND } from '../../constants/brand';
import { useTranslation } from '../../contexts/LanguageContext';

const GERMAN_STATES = [
  'Baden-Württemberg',
  'Bayern',
  'Berlin',
  'Brandenburg',
  'Bremen',
  'Hamburg',
  'Hessen',
  'Mecklenburg-Vorpommern',
  'Niedersachsen',
  'Nordrhein-Westfalen',
  'Rheinland-Pfalz',
  'Saarland',
  'Sachsen',
  'Sachsen-Anhalt',
  'Schleswig-Holstein',
  'Thüringen',
];

function LebenInDeutschland() {
  const navigate = useNavigate();
  const t = useTranslation();
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('');
  const [availableExams, setAvailableExams] = useState([]);
  const [error, setError] = useState('');
  const [loadingExams, setLoadingExams] = useState(false);

  useEffect(() => {
    loadUserState();
  }, []);

  useEffect(() => {
    if (selectedState) {
      loadAvailableExams(selectedState);
    }
  }, [selectedState]);

  const loadUserState = async () => {
    try {
      setLoading(true);
      const userData = await usersAPI.getMe();

      // إذا كان المستخدم لديه ولاية محفوظة، نستخدمها
      if (userData.state) {
        setSelectedState(userData.state);
      }
    } catch (err) {
      console.error('Error loading user data:', err);

      if (err.response?.status === 401) {
        navigate('/login');
      } else if (err.response?.status === 502) {
        setError('❌ Backend nicht erreichbar. Stellen Sie sicher, dass der Server unter http://localhost:4000 läuft.');
      } else {
        setError(err.response?.data?.message || 'Beim Laden der Daten ist ein Fehler aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStateChange = async (newState) => {
    try {
      setSelectedState(newState);

      // حفظ الولاية في قاعدة البيانات
      await usersAPI.updateState(newState);

      // تحديث localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...currentUser, state: newState }));
    } catch (err) {
      console.error('Error updating state:', err);
      setError(err.response?.data?.message || 'Beim Speichern des Bundeslandes ist ein Fehler aufgetreten.');
    }
  };

  const loadAvailableExams = async (state) => {
    try {
      setLoadingExams(true);
      setError('');

      const response = await examsAPI.getLebenAvailable({
          provider: 'Deutschland-in-Leben',
          state: state,
        });

      const exams = response.items || response || [];

      const examsWithId = exams.map(exam => ({
        ...exam,
        id: exam.id || exam._id,
      }));

      console.log('Available exams loaded:', examsWithId);
      setAvailableExams(examsWithId);
    } catch (err) {
      console.error('Error loading available exams:', err);
      setError(err.response?.data?.message || 'Beim Laden der verfügbaren Prüfungen ist ein Fehler aufgetreten.');
    } finally {
      setLoadingExams(false);
    }
  };

  const handleStartExam = async (examId) => {
    try {
      setError('');

      if (!examId) {
        throw new Error('Prüfungs-ID fehlt.');
      }

      if (!selectedState) {
        setError(t('leben_selectStateFirst'));
        return;
      }

      console.log('🚀 Starting Leben exam with:', { examId, state: selectedState });

      // بدء امتحان Leben in Deutschland مع الولاية - استخدام /exams/leben/start
      const response = await examsAPI.startLebenExam(examId, selectedState);

      console.log('✅ Leben exam response:', response);

      // Response format: { attemptId, exam, questions }
      const { attemptId, exam, questions } = response;

      if (!attemptId) {
        console.error('❌ No attemptId in response:', response);
        throw new Error('Vom Server wurde keine attemptId zurückgegeben.');
      }

      if (!Array.isArray(questions) || questions.length === 0) {
        console.warn('⚠️ لا توجد questions في الـ response');
        setError('In dieser Prüfung sind keine Fragen vorhanden. Bitte überprüfen Sie die Prüfung.');
        return;
      }

      console.log('✅ Exam has', questions.length, 'questions. Navigating to exam page...');

      // ✅ الانتقال إلى صفحة الامتحان مع تمرير البيانات وإضافة examId في query string
      navigate(`/student/exam/${attemptId}?examId=${examId}`, {
        state: {
          attemptId,
          exam,
          questions,
          examType: 'leben_test',
        },
      });
    } catch (err) {
      console.error('Error starting Leben exam:', err);

      let errorMessage = 'Beim Starten der Prüfung ist ein Fehler aufgetreten.';

      if (err.response?.status === 400) {
        const errorData = err.response?.data;
        errorMessage = errorData?.message || errorData?.error || 'Ungültige Daten.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Prüfung nicht gefunden.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Sie haben keine Berechtigung, diese Prüfung zu starten.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-red-600 mb-4"></div>
          <p className="text-slate-600">{t('leben_loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <button
          onClick={() => navigate('/')}
          className="text-base font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition mb-6 inline-flex items-center gap-1"
        >
          ← {t('leben_backHome')}
        </button>

        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Home className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0" style={{ color: BRAND.red }} strokeWidth={1.8} />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
              {t('leben_title')}
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            {t('leben_subtitle')}
          </p>
        </div>

        <div className="max-w-md mx-auto mb-10">
          <label htmlFor="state" className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2 text-center">
            {t('leben_chooseState')}
          </label>
          <select
            id="state"
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full px-4 py-3.5 text-center border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-base"
            style={{ borderColor: BRAND.red }}
          >
            <option value="">{t('leben_selectState')}</option>
            {GERMAN_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
            {t('leben_selectionSaved')}
          </p>
        </div>

        {/* رسالة خطأ */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 rounded-xl p-4 text-center border-2" style={{ backgroundColor: `${BRAND.red}12`, borderColor: BRAND.red }}>
            <p className="text-base font-medium" style={{ color: BRAND.red }}>{error}</p>
          </div>
        )}

        {/* البطاقات الثلاث */}
        <div className="max-w-6xl mx-auto mb-10">
          <div className="grid gap-5 md:grid-cols-3">
            {/* تعلم الأسئلة العامة */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4 mb-5">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${BRAND.gold}20` }}>
                  <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-slate-700 dark:text-slate-200" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                    {t('leben_learnGeneral')}
                  </h3>
                  <p className="text-base text-slate-600 dark:text-slate-400 font-medium">{t('leben_300Questions')}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/student/leben/learn', { state: { learningType: 'general' } })}
                className="w-full text-white py-3 rounded-xl font-semibold text-base transition shadow-md hover:shadow-lg"
                style={{ background: `linear-gradient(135deg, ${BRAND.black}, ${BRAND.red})` }}
              >
                {t('leben_jetztLernen')}
              </button>
            </div>

            {/* تعلم أسئلة الولاية */}
            <div className={`bg-white dark:bg-slate-800 border rounded-2xl p-6 shadow-lg transition ${
              selectedState ? 'border-slate-200 dark:border-slate-600 hover:shadow-xl' : 'border-slate-300 dark:border-slate-600 opacity-70'
            }`}>
              <div className="flex items-start gap-4 mb-5">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${BRAND.gold}25` }}>
                  <Home className="w-7 h-7 sm:w-8 sm:h-8 text-slate-700 dark:text-slate-200" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                    {t('leben_learnState')}
                  </h3>
                  <p className="text-base text-slate-600 dark:text-slate-400 font-medium">{t('leben_160Questions')}</p>
                  {!selectedState && (
                    <p className="text-sm mt-2 font-medium" style={{ color: BRAND.red }}>{t('leben_selectStateFirst')}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => selectedState && navigate('/student/leben/learn', { state: { learningType: 'state', state: selectedState } })}
                disabled={!selectedState}
                className={`w-full py-3 rounded-xl font-semibold text-base transition ${
                  selectedState ? 'text-white shadow-md hover:shadow-lg' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
                style={selectedState ? { background: `linear-gradient(135deg, ${BRAND.red}, ${BRAND.gold})` } : {}}
              >
                {t('leben_jetztLernen')}
              </button>
            </div>

            {/* امتحانات الولاية */}
            <div className="min-h-[200px] flex flex-col">
              {selectedState && (
                <p className="text-base font-medium text-slate-600 dark:text-slate-400 mb-2">
                  {t('leben_modelTests')} {selectedState}
                </p>
              )}
              {loadingExams && (
                <div className="flex-1 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600">
                  <p className="text-slate-500 text-base">{t('leben_loading')}</p>
                </div>
              )}
              {!selectedState && !loadingExams && (
                <div className="flex-1 flex items-center justify-center text-center text-slate-500 text-base rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-5">
                  {t('leben_selectStateFirst')}
                </div>
              )}
              {selectedState && !loadingExams && availableExams.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-center text-base rounded-2xl p-5 border" style={{ backgroundColor: `${BRAND.gold}15`, borderColor: `${BRAND.gold}40` }}>
                  <span className="font-medium" style={{ color: BRAND.red }}>{t('leben_noExams')}</span>
                </div>
              )}
              {!loadingExams && availableExams.length > 0 && (
                <div className="space-y-3">
                  {availableExams.map((exam) => {
                    if (!exam.id) return null;
                    return (
                      <div
                        key={exam.id}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl p-5 shadow-lg hover:shadow-xl transition text-left"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${BRAND.red}18` }}>
                            <ClipboardList className="w-5 h-5" style={{ color: BRAND.red }} strokeWidth={1.8} />
                          </div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 flex-1 min-w-0">
                            {exam.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
                          {exam.timeLimitMin > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-4 h-4" /> ca. {exam.timeLimitMin} {t('leben_min')}
                            </span>
                          )}
                          {exam.attemptLimit > 0 && <span>{exam.attemptLimit} {t('leben_attempts')}</span>}
                        </div>
                        <button
                          onClick={() => handleStartExam(exam.id)}
                          className="w-full text-white py-3 rounded-xl text-base font-semibold transition shadow-md hover:shadow-lg"
                          style={{ backgroundColor: BRAND.red }}
                        >
                          {t('leben_jetztStarten')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LebenInDeutschland;

