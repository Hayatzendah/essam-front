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
          // استخدام promptSnapshot و optionsText (الحقول الصحيحة من الباك)
          const prompt = item.promptSnapshot || item.questionSnapshot?.text || item.questionSnapshot?.prompt || item.prompt || item.text;
          const options = item.optionsText || item.questionSnapshot?.options || item.options || [];
          const qType = item.qType || item.questionSnapshot?.qType || 'mcq';

          return {
            ...item,
            prompt,
            text: prompt,
            qType,
            options,
          };
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-slate-200 border-t-rose-500 rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-slate-600">جاري تحميل النتائج...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
            <div className="text-5xl mb-4">❌</div>
            <p className="text-rose-600 text-sm mb-6">{error || 'لا توجد بيانات للنتائج'}</p>
            <button
              onClick={() => navigate('/student/liden')}
              className="px-6 py-2.5 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors text-sm font-semibold"
            >
              العودة
            </button>
          </div>
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* الشريط العلوي */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← رجوع
          </button>
          <span className="text-xs font-semibold text-rose-500">
            نتيجة الامتحان
          </span>
        </div>

        {/* عنوان */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 mb-1">
            {attempt.exam?.title || 'امتحان'}
          </h1>
          <p className="text-sm text-slate-600">
            مراجعة النتيجة والإجابات
          </p>
        </div>

        {/* بطاقة النتيجة */}
        <div className={`bg-white rounded-2xl shadow-sm border-2 p-8 mb-6 ${
          isPassed ? 'border-emerald-200' : 'border-rose-200'
        }`}>
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">
              {isPassed ? '🎉' : '📝'}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {isPassed ? 'أحسنت! نجحت في الامتحان' : 'انتهى الامتحان'}
            </h2>
            <p className="text-sm text-slate-600">
              {isPassed ? 'استمري في التقدم الرائع' : 'يمكنك مراجعة الأسئلة والمحاولة مرة أخرى'}
            </p>
          </div>

          {/* الإحصائيات */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* النسبة المئوية */}
            <div className="md:col-span-1 flex items-center justify-center">
              <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center ${
                isPassed ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-rose-50 border-2 border-rose-200'
              }`}>
                <div className={`text-3xl font-bold ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {percentage}%
                </div>
                <div className="text-xs text-slate-500 mt-1">النسبة</div>
              </div>
            </div>

            {/* التفاصيل */}
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">الدرجة الكلية</div>
                <div className="text-2xl font-bold text-slate-900">{finalScore} / {totalMaxScore}</div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <div className="text-xs text-emerald-700 mb-1">إجابات صحيحة</div>
                <div className="text-2xl font-bold text-emerald-600">{correctCount}</div>
              </div>

              <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                <div className="text-xs text-rose-700 mb-1">إجابات خاطئة</div>
                <div className="text-2xl font-bold text-rose-600">{wrongCount}</div>
              </div>
            </div>
          </div>

          {/* تاريخ التسليم */}
          {attempt.submittedAt && (
            <div className="text-center text-xs text-slate-400 mt-6 pt-6 border-t border-slate-100">
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

        {/* مراجعة الأسئلة */}
        {attempt.items && attempt.items.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              مراجعة الأسئلة
            </h3>

            <div className="space-y-4">
              {attempt.items.map((item, index) => {
                const isCorrect = item.isCorrect === true || item.correct === true || item.isCorrect === 'true';
                const prompt = item.prompt || item.text || 'السؤال';
                const qType = item.qType || item.type;
                const options = item.options || [];
                const points = item.autoScore || item.points || 0;
                const maxPoints = item.points || 1;

                return (
                  <div
                    key={index}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
                  >
                    {/* رأس السؤال */}
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-1 bg-rose-100 text-rose-700 rounded">
                          سؤال {index + 1}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {isCorrect ? '✓ صحيح' : '✗ خطأ'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {points} / {maxPoints} نقطة
                      </span>
                    </div>

                    {/* نص السؤال */}
                    <div className="mb-4">
                      <h4 className="text-base font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap">
                        {prompt}
                      </h4>
                    </div>

                    {/* الخيارات للـ MCQ */}
                    {qType === 'mcq' && options && options.length > 0 && (
                      <div className="space-y-2">
                        {options.map((option, optIndex) => {
                          const studentAnswerIndexes = item.studentAnswerIndexes || [];
                          const correctAnswerIndexes = item.correctAnswerIndexes || [];

                          const isSelected = studentAnswerIndexes.includes(optIndex);
                          const isCorrectAnswer = correctAnswerIndexes.includes(optIndex);
                          const optionText = typeof option === 'string' ? option : (option.text || option);

                          return (
                            <div
                              key={optIndex}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                isSelected && isCorrectAnswer
                                  ? 'bg-emerald-50 border-emerald-200'
                                  : isSelected && !isCorrectAnswer
                                  ? 'bg-rose-50 border-rose-200'
                                  : isCorrectAnswer && !isSelected
                                  ? 'bg-emerald-50 border-emerald-200 border-dashed'
                                  : 'bg-slate-50 border-slate-100'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                isSelected
                                  ? isCorrectAnswer
                                    ? 'border-emerald-500 bg-emerald-500'
                                    : 'border-rose-500 bg-rose-500'
                                  : isCorrectAnswer
                                  ? 'border-emerald-400'
                                  : 'border-slate-300'
                              }`}>
                                {isSelected && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                                )}
                                {!isSelected && isCorrectAnswer && (
                                  <span className="text-[10px] text-emerald-600">✓</span>
                                )}
                              </div>

                              <span className="flex-1 text-sm text-slate-900">{optionText}</span>

                              {isSelected && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                  isCorrectAnswer
                                    ? 'bg-emerald-200 text-emerald-700'
                                    : 'bg-rose-200 text-rose-700'
                                }`}>
                                  إجابتك
                                </span>
                              )}
                              {isCorrectAnswer && !isSelected && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-200 text-emerald-700">
                                  الإجابة الصحيحة
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* True/False */}
                    {(qType === 'true_false' || qType === 'true/false') && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-sm text-slate-600">إجابتك:</span>
                          <span className="text-sm font-semibold text-slate-900">
                            {item.studentAnswerBoolean === true ? 'صحيح' : 'خطأ'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                          <span className="text-sm text-emerald-700">الإجابة الصحيحة:</span>
                          <span className="text-sm font-semibold text-emerald-700">
                            {item.answerKeyBoolean === true ? 'صحيح' : 'خطأ'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Fill */}
                    {(qType === 'fill' || qType === 'fill-in') && (
                      <div className="space-y-2">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="text-xs text-slate-500 mb-1">إجابتك:</div>
                          <div className="text-sm font-semibold text-slate-900">
                            {item.studentAnswerText || '(لم يتم الإجابة)'}
                          </div>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                          <div className="text-xs text-emerald-700 mb-1">الإجابة الصحيحة:</div>
                          <div className="text-sm font-semibold text-emerald-700">
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

        {/* الأزرار */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/student/liden')}
            className="px-6 py-2.5 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors text-sm font-semibold"
          >
            ← العودة إلى الامتحانات
          </button>
          {!isPassed && (
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm font-semibold"
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
