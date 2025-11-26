import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { examsAPI } from '../../services/examsAPI';
import { authAPI } from '../../services/api';
import './ExamPage.css';

function ExamPage() {
  const navigate = useNavigate();
  const { attemptId } = useParams();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (attemptId) {
      loadAttempt();
    }
  }, [attemptId]);

  const loadAttempt = async () => {
    try {
      setLoading(true);
      const attemptData = await examsAPI.getAttempt(attemptId);
      
      console.log('📥 Attempt data received:', attemptData);
      console.log('📋 Attempt items:', attemptData.items);
      console.log('📊 Items count:', attemptData.items?.length || 0);
      
      // التحقق من structure الـ response
      if (!attemptData) {
        throw new Error('لم يتم إرجاع بيانات المحاولة');
      }
      
      // معالجة items - قد تكون في attemptData.items أو attemptData.data.items
      let items = attemptData.items || attemptData.data?.items || [];
      
      // إذا كان items مصفوفة فارغة أو غير موجودة
      if (!Array.isArray(items) || items.length === 0) {
        console.warn('⚠️ لا توجد items في الـ response');
        console.warn('   Response structure:', JSON.stringify(attemptData, null, 2));
        setError('لا توجد أسئلة في هذا الامتحان. تأكد من أن الامتحان يحتوي على أسئلة.');
        setAttempt({ ...attemptData, items: [] });
        return;
      }
      
      // تحديث attemptData مع items الصحيحة
      const attemptWithItems = {
        ...attemptData,
        items: items,
      };
      
      setAttempt(attemptWithItems);
      
      // تحميل الإجابات المحفوظة
      if (attemptData.answers) {
        const savedAnswers = {};
        attemptData.answers.forEach((answer) => {
          savedAnswers[answer.itemIndex] = answer;
        });
        setAnswers(savedAnswers);
      }
    } catch (err) {
      console.error('❌ Error loading attempt:', err);
      console.error('   Error response:', err.response?.data);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'حدث خطأ أثناء تحميل الامتحان'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (itemIndex, answer, questionType) => {
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      
      // بناء كائن الإجابة حسب نوع السؤال
      if (questionType === 'mcq') {
        newAnswers[itemIndex] = {
          studentAnswerIndexes: Array.isArray(answer) ? answer : [answer],
        };
      } else if (questionType === 'true_false') {
        newAnswers[itemIndex] = {
          studentAnswerBoolean: answer,
        };
      } else if (questionType === 'fill') {
        newAnswers[itemIndex] = {
          studentAnswerText: answer,
        };
      } else if (questionType === 'match') {
        newAnswers[itemIndex] = {
          studentAnswerMatch: answer,
        };
      } else if (questionType === 'reorder') {
        newAnswers[itemIndex] = {
          studentAnswerReorder: answer,
        };
      } else {
        // fallback - حفظ مباشر
        newAnswers[itemIndex] = answer;
      }
      
      return newAnswers;
    });
  };

  const saveAnswer = async (itemIndex, questionId, answer) => {
    try {
      // بناء answerData حسب نوع السؤال
      const answerData = {
        itemIndex,
        questionId,
      };

      // حسب نوع السؤال
      const question = attempt.items[itemIndex];
      if (question.qType === 'mcq') {
        answerData.studentAnswerIndexes = Array.isArray(answer) ? answer : [answer];
      } else if (question.qType === 'true_false') {
        answerData.studentAnswerBoolean = answer;
      } else if (question.qType === 'fill') {
        answerData.studentAnswerText = answer;
      } else if (question.qType === 'match') {
        answerData.studentAnswerMatch = answer;
      } else if (question.qType === 'reorder') {
        answerData.studentAnswerReorder = answer;
      }

      await examsAPI.saveAnswer(attemptId, answerData);
    } catch (err) {
      console.error('Error saving answer:', err);
      // لا نعرض خطأ للمستخدم، فقط نعرض في console
    }
  };

  const handleSubmit = async () => {
    // التحقق من أن المحاولة لم يتم تسليمها بالفعل
    if (attempt?.status === 'submitted') {
      setError('تم تسليم هذا الامتحان بالفعل');
      navigate(`/student/attempt/${attemptId}/results`);
      return;
    }

    // عرض تأكيد
    const confirmed = window.confirm(
      `هل أنت متأكد من تسليم الامتحان؟\n\n` +
      `عدد الأسئلة المجابة: ${Object.keys(answers).length} من ${attempt?.items?.length || 0}\n` +
      `بعد التسليم لن تتمكن من تعديل الإجابات.`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      console.log('📤 Submitting attempt:', attemptId);
      console.log('📋 Answers to submit:', answers);
      
      // إرسال طلب التسليم
      const result = await examsAPI.submitAttempt(attemptId);
      
      console.log('✅ Attempt submitted successfully:', result);
      console.log('📊 Score:', result.score, '/', result.totalPoints);
      console.log('📈 Percentage:', result.totalPoints > 0 ? Math.round((result.score / result.totalPoints) * 100) : 0, '%');
      
      // الانتقال إلى صفحة النتائج
      navigate(`/student/attempt/${attemptId}/results`);
    } catch (err) {
      console.error('❌ Error submitting exam:', err);
      console.error('   Error response:', err.response?.data);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'حدث خطأ أثناء تسليم الامتحان. يرجى المحاولة مرة أخرى.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-slate-200 border-t-rose-500 rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-slate-600">جاري تحميل الامتحان...</p>
        </div>
      </div>
    );
  }

  if (!attempt || !attempt.items || attempt.items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-6 mb-4">
            <p className="font-semibold mb-2">❌ لا توجد أسئلة في هذا الامتحان</p>
            <p className="text-xs text-slate-600">يرجى التواصل مع المدرس لإضافة الأسئلة</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors text-sm"
          >
            ← رجوع
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = attempt.items[currentQuestionIndex];
  const totalQuestions = attempt.items.length;
  const answeredCount = Object.keys(answers).length;
  
  // التحقق من أن المحاولة لم يتم تسليمها
  const isSubmitted = attempt.status === 'submitted';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* الشريط العلوي */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← رجوع
          </button>
          <span className="text-xs font-semibold text-rose-500">
            {attempt.exam?.title || 'امتحان'}
          </span>
        </div>

        {/* عنوان الامتحان */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 mb-1">
            {attempt.exam?.title || 'امتحان'}
          </h1>
          <p className="text-sm text-slate-600">
            {totalQuestions} سؤال • أجب على جميع الأسئلة ثم اضغط "تسليم الامتحان"
          </p>
        </div>

        {/* رسالة خطأ */}
        {error && (
          <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {/* رسالة إذا تم التسليم */}
        {isSubmitted && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4 mb-6 text-center">
            <p className="font-semibold mb-2">⚠️ تم تسليم هذا الامتحان</p>
            <p className="text-sm mb-3">لا يمكنك تعديل الإجابات</p>
            <button
              onClick={() => navigate(`/student/attempt/${attemptId}/results`)}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-semibold"
            >
              عرض النتائج
            </button>
          </div>
        )}

        {/* عرض كل الأسئلة */}
        <div className="space-y-6 mb-6">
          {attempt.items.map((item, itemIndex) => (
            <div key={itemIndex} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              {/* رقم السؤال */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold px-2 py-1 bg-rose-100 text-rose-700 rounded">
                  سؤال {itemIndex + 1}
                </span>
                {item.points && (
                  <span className="text-[10px] text-slate-400">
                    {item.points} نقطة
                  </span>
                )}
              </div>

              {/* نص السؤال */}
              <h3 className="text-base font-semibold text-slate-900 mb-3">
                {item.prompt}
              </h3>

              {/* Media (Audio/Image/Video) */}
              {item.mediaUrl && (
                <div className="mb-4">
                  {item.mediaType === 'audio' && (
                    <audio controls src={item.mediaUrl} className="w-full">
                      المتصفح لا يدعم تشغيل الملفات الصوتية
                    </audio>
                  )}
                  {item.mediaType === 'image' && (
                    <img src={item.mediaUrl} alt="Question" className="w-full max-w-md rounded-lg" />
                  )}
                  {item.mediaType === 'video' && (
                    <video controls src={item.mediaUrl} className="w-full">
                      المتصفح لا يدعم تشغيل الفيديو
                    </video>
                  )}
                </div>
              )}

              {/* MCQ */}
              {item.qType === 'mcq' && item.options && (
                <div className="space-y-2">
                  {item.options.map((option, optIdx) => {
                    const currentAnswer = answers[itemIndex];
                    const selectedIndexes = currentAnswer?.studentAnswerIndexes || [];
                    const isSelected = selectedIndexes.includes(optIdx);

                    return (
                      <button
                        key={optIdx}
                        onClick={() => {
                          const currentAnswers = currentAnswer?.studentAnswerIndexes || [];
                          let newAnswers;
                          if (isSelected) {
                            newAnswers = currentAnswers.filter((i) => i !== optIdx);
                          } else {
                            newAnswers = [...currentAnswers, optIdx];
                          }
                          handleAnswerChange(itemIndex, newAnswers, 'mcq');
                          saveAnswer(itemIndex, item.questionId, newAnswers);
                        }}
                        disabled={isSubmitted}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-sm transition text-right ${
                          isSelected
                            ? 'bg-rose-50 border-rose-400'
                            : 'bg-slate-50 border-slate-200 hover:border-rose-400'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-rose-500' : 'border-slate-300'
                        }`}>
                          {isSelected && (
                            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                          )}
                        </div>
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* True/False */}
              {item.qType === 'true_false' && (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      handleAnswerChange(itemIndex, true, 'true_false');
                      saveAnswer(itemIndex, item.questionId, true);
                    }}
                    disabled={isSubmitted}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-sm transition text-right ${
                      answers[itemIndex]?.studentAnswerBoolean === true
                        ? 'bg-rose-50 border-rose-400'
                        : 'bg-slate-50 border-slate-200 hover:border-rose-400'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      answers[itemIndex]?.studentAnswerBoolean === true
                        ? 'border-rose-500'
                        : 'border-slate-300'
                    }`}>
                      {answers[itemIndex]?.studentAnswerBoolean === true && (
                        <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                      )}
                    </div>
                    <span>صحيح</span>
                  </button>
                  <button
                    onClick={() => {
                      handleAnswerChange(itemIndex, false, 'true_false');
                      saveAnswer(itemIndex, item.questionId, false);
                    }}
                    disabled={isSubmitted}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-sm transition text-right ${
                      answers[itemIndex]?.studentAnswerBoolean === false
                        ? 'bg-rose-50 border-rose-400'
                        : 'bg-slate-50 border-slate-200 hover:border-rose-400'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      answers[itemIndex]?.studentAnswerBoolean === false
                        ? 'border-rose-500'
                        : 'border-slate-300'
                    }`}>
                      {answers[itemIndex]?.studentAnswerBoolean === false && (
                        <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                      )}
                    </div>
                    <span>خطأ</span>
                  </button>
                </div>
              )}

              {/* Fill */}
              {item.qType === 'fill' && (
                <div>
                  <textarea
                    value={answers[itemIndex]?.studentAnswerText || ''}
                    disabled={isSubmitted}
                    onChange={(e) => {
                      handleAnswerChange(itemIndex, e.target.value, 'fill');
                      clearTimeout(window.saveTimeout);
                      window.saveTimeout = setTimeout(() => {
                        saveAnswer(itemIndex, item.questionId, e.target.value);
                      }, 1000);
                    }}
                    placeholder="اكتب إجابتك هنا..."
                    className="w-full p-3 border-2 border-slate-200 rounded-lg text-sm resize-vertical min-h-[100px] focus:outline-none focus:border-rose-400"
                    rows={4}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* زر تسليم الامتحان */}
        <div className="flex justify-end mt-8">
          <button
            onClick={handleSubmit}
            disabled={submitting || isSubmitted}
            className="px-6 py-3 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-sm"
          >
            {submitting ? 'جاري التسليم…' : isSubmitted ? 'تم التسليم' : '✅ تسليم الامتحان'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExamPage;


