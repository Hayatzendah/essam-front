import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { examsAPI } from '../../services/examsAPI';

function ExamResults() {
  const navigate = useNavigate();
  const { attemptId } = useParams();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (attemptId) {
      loadAttempt();
    }
  }, [attemptId]);

  const loadAttempt = async () => {
    try {
      setLoading(true);
      const attemptData = await examsAPI.getAttempt(attemptId);

      console.log('📊 Attempt results (full):', JSON.stringify(attemptData, null, 2));

      if (!attemptData) {
        throw new Error('لم يتم إرجاع بيانات المحاولة');
      }

      // استخراج بيانات الأسئلة من questionSnapshot
      if (attemptData.items && attemptData.items.length > 0) {
        const formattedItems = attemptData.items.map((item) => {
          if (item.questionSnapshot) {
            return {
              ...item,
              prompt: item.questionSnapshot.text || item.questionSnapshot.prompt,
              text: item.questionSnapshot.text || item.questionSnapshot.prompt,
              qType: item.questionSnapshot.qType,
              options: item.questionSnapshot.options || [],
            };
          }
          if (item.question) {
            return {
              ...item,
              prompt: item.question.text || item.question.prompt,
              text: item.question.text || item.question.prompt,
              qType: item.question.qType,
              options: item.question.options || [],
            };
          }
          return item;
        });
        attemptData.items = formattedItems;
      }

      setAttempt(attemptData);
    } catch (err) {
      console.error('❌ Error loading attempt results:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'حدث خطأ أثناء تحميل النتائج'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md w-full">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-700 text-lg font-semibold">جاري تحميل النتائج...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md w-full">
          <div className="text-6xl mb-6">❌</div>
          <p className="text-rose-600 text-lg mb-6">{error || 'لا توجد بيانات للنتائج'}</p>
          <button
            onClick={() => navigate('/student/liden')}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  // حساب الإحصائيات
  const totalMaxScore = attempt.totalMaxScore ?? 0;
  const finalScore = attempt.finalScore ?? attempt.totalAutoScore ?? 0;

  let totalQuestions = 0;
  let correctCount = 0;
  let wrongCount = 0;

  if (attempt.items && Array.isArray(attempt.items) && attempt.items.length > 0) {
    totalQuestions = attempt.items.length;
    correctCount = attempt.items.filter(item =>
      item.isCorrect === true || item.isCorrect === 'true' || item.correct === true
    ).length;
    wrongCount = totalQuestions - correctCount;
  } else {
    totalQuestions = totalMaxScore;
    correctCount = finalScore;
    wrongCount = totalMaxScore - finalScore;
  }

  const percentage = totalMaxScore > 0 ? Math.round((finalScore / totalMaxScore) * 100) : 0;
  const isPassed = percentage >= 50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg">نتيجة الامتحان</h1>
          {attempt.exam?.title && (
            <p className="text-xl opacity-90">{attempt.exam.title}</p>
          )}
        </div>

        {/* Summary Card */}
        <div className={`bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8 border-4 ${
          isPassed ? 'border-emerald-500' : 'border-rose-500'
        }`}>
          <div className="text-center mb-8">
            <div className="text-7xl mb-4 animate-bounce">
              {isPassed ? '🎉' : '😔'}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              {isPassed ? 'نجحت في الامتحان!' : 'لم تنجح في الامتحان'}
            </h2>
            <p className="text-slate-600">
              {isPassed ? 'أحسنت! استمري في التقدم' : 'لا تقلقي، يمكنك المحاولة مرة أخرى'}
            </p>
          </div>

          {/* Score Display */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
            {/* Score Circle */}
            <div className="relative">
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center shadow-2xl">
                <div className="text-6xl font-bold text-white">{percentage}%</div>
                <div className="text-sm text-white opacity-90">النسبة المئوية</div>
              </div>
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-2xl shadow-lg">
                {isPassed ? '✨' : '💪'}
              </div>
            </div>

            {/* Score Details */}
            <div className="grid grid-cols-1 gap-4 w-full md:w-auto">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-5 border border-slate-200">
                <div className="text-sm text-slate-600 mb-1">الدرجة الكلية</div>
                <div className="text-3xl font-bold text-slate-900">{finalScore} / {totalMaxScore}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-2xl p-5 border-2 border-emerald-200">
                  <div className="text-xs text-emerald-700 mb-1">✓ صحيحة</div>
                  <div className="text-2xl font-bold text-emerald-600">{correctCount}</div>
                </div>

                <div className="bg-rose-50 rounded-2xl p-5 border-2 border-rose-200">
                  <div className="text-xs text-rose-700 mb-1">✗ خاطئة</div>
                  <div className="text-2xl font-bold text-rose-600">{wrongCount}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Submitted At */}
          {attempt.submittedAt && (
            <div className="text-center text-sm text-slate-500 pt-6 border-t border-slate-200">
              تم التسليم في: {new Date(attempt.submittedAt).toLocaleString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>

        {/* Questions Review */}
        {attempt.items && attempt.items.length > 0 && (
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8 text-center flex items-center justify-center gap-3">
              <span>📝</span>
              <span>مراجعة الأسئلة</span>
            </h3>

            <div className="space-y-6">
              {attempt.items.map((item, index) => {
                const isCorrect = item.isCorrect === true || item.correct === true || item.isCorrect === 'true';
                const prompt = item.prompt || item.text || 'السؤال';
                const qType = item.qType || item.type;
                const options = item.options || [];
                const points = item.points || 0;
                const maxPoints = item.maxPoints || 1;

                return (
                  <div
                    key={index}
                    className={`rounded-2xl p-6 border-2 transition-all ${
                      isCorrect
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-rose-50 border-rose-300'
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{isCorrect ? '✅' : '❌'}</span>
                        <span className="font-bold text-lg text-slate-900">
                          السؤال {index + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                          isCorrect
                            ? 'bg-emerald-500 text-white'
                            : 'bg-rose-500 text-white'
                        }`}>
                          {isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'}
                        </span>
                        <span className="text-sm font-semibold text-slate-600">
                          {points} / {maxPoints} نقطة
                        </span>
                      </div>
                    </div>

                    {/* Question Text */}
                    <div className="mb-4 p-4 bg-white rounded-xl border border-slate-200">
                      <p className="text-lg leading-relaxed text-slate-900 whitespace-pre-wrap">
                        {prompt}
                      </p>
                    </div>

                    {/* Options for MCQ */}
                    {qType === 'mcq' && options && options.length > 0 && (
                      <div className="space-y-3">
                        {options.map((option, optIndex) => {
                          const studentAnswerIndexes = item.studentAnswerIndexes || [];
                          const correctAnswerIndexes = item.correctAnswerIndexes || [];

                          const isSelected = studentAnswerIndexes.includes(optIndex);
                          const isCorrectAnswer = correctAnswerIndexes.includes(optIndex);
                          const optionText = typeof option === 'string' ? option : (option.text || option);

                          return (
                            <div
                              key={optIndex}
                              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                                isSelected && isCorrectAnswer
                                  ? 'bg-emerald-100 border-emerald-400'
                                  : isSelected && !isCorrectAnswer
                                  ? 'bg-rose-100 border-rose-400'
                                  : isCorrectAnswer && !isSelected
                                  ? 'bg-emerald-50 border-emerald-300 border-dashed'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                  isSelected
                                    ? isCorrectAnswer
                                      ? 'border-emerald-500 bg-emerald-500'
                                      : 'border-rose-500 bg-rose-500'
                                    : isCorrectAnswer
                                    ? 'border-emerald-400'
                                    : 'border-slate-300'
                                }`}>
                                  {isSelected && (
                                    <div className="w-3 h-3 rounded-full bg-white"></div>
                                  )}
                                  {!isSelected && isCorrectAnswer && (
                                    <span className="text-xs text-emerald-600">✓</span>
                                  )}
                                </div>
                                <span className="text-base text-slate-900">{optionText}</span>
                              </div>

                              <div className="flex gap-2">
                                {isSelected && (
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    isCorrectAnswer
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-rose-500 text-white'
                                  }`}>
                                    إجابتك
                                  </span>
                                )}
                                {isCorrectAnswer && !isSelected && (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white">
                                    الإجابة الصحيحة
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* True/False */}
                    {(qType === 'true_false' || qType === 'true/false') && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                          <span className="text-slate-600 font-semibold">إجابتك:</span>
                          <span className="font-bold text-slate-900">
                            {item.studentAnswerBoolean === true ? 'صحيح ✓' : 'خطأ ✗'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                          <span className="text-emerald-700 font-semibold">الإجابة الصحيحة:</span>
                          <span className="font-bold text-emerald-700">
                            {item.answerKeyBoolean === true ? 'صحيح ✓' : 'خطأ ✗'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Fill */}
                    {(qType === 'fill' || qType === 'fill-in') && (
                      <div className="space-y-3">
                        <div className="p-4 bg-white rounded-xl border border-slate-200">
                          <div className="text-sm text-slate-600 mb-1">إجابتك:</div>
                          <div className="text-base font-semibold text-slate-900">
                            {item.studentAnswerText || '(لم يتم الإجابة)'}
                          </div>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                          <div className="text-sm text-emerald-700 mb-1">الإجابة الصحيحة:</div>
                          <div className="text-base font-semibold text-emerald-700">
                            {item.fillExact || item.answerKeyText || '-'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/student/liden')}
            className="px-8 py-4 bg-white text-indigo-600 border-2 border-indigo-600 rounded-2xl font-bold text-lg hover:bg-indigo-600 hover:text-white transition-all shadow-lg hover:shadow-xl"
          >
            ← العودة إلى الامتحانات
          </button>
          {!isPassed && (
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl"
            >
              حاول مرة أخرى
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExamResults;
