// src/pages/grammar/GrammarExercisePage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGrammarTopic, getGrammarQuestions } from '../../services/api';
import api from '../../services/api';

export default function GrammarExercisePage() {
  const { level, topicSlug } = useParams();
  const navigate = useNavigate();

  const [topic, setTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [attemptItems, setAttemptItems] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function initializeExercise() {
      try {
        setLoading(true);
        setError('');

        // 1. جلب معلومات الموضوع
        const topicData = await getGrammarTopic(topicSlug, level);
        setTopic(topicData);
        console.log('📚 Full Topic Response:', topicData);
        console.log('📚 Topic keys:', Object.keys(topicData || {}));
        console.log('🔍 Topic examId:', topicData?.examId);
        console.log('🔍 Topic exam:', topicData?.exam);
        console.log('🔍 All topic fields:', JSON.stringify(topicData, null, 2));

        // 2. التحقق من وجود examId في الموضوع
        if (!topicData.examId) {
          setError('عذراً، التمرين لهذا الموضوع قيد الإعداد من قبل المدرس. يرجى المحاولة لاحقاً.');
          setLoading(false);
          return;
        }

        // 3. بدء محاولة على الامتحان الموجود - استخدام POST /exams/:examId/attempts
        console.log('📤 Starting attempt for exam:', topicData.examId);

        const attemptRes = await api.post(`/exams/${topicData.examId}/attempts`, {});

        console.log('✅ Attempt started successfully:', attemptRes.data);
        console.log('🔍 Attempt Response Full Object:', attemptRes.data);
        console.log('🔍 Attempt Response Keys:', Object.keys(attemptRes.data || {}));
        console.log('🔍 Attempt Response _id:', attemptRes.data?._id);
        console.log('🔍 Attempt Response id:', attemptRes.data?.id);
        console.log('🔍 Attempt Response Details:', {
          hasData: !!attemptRes.data,
          attemptId_underscore: attemptRes.data?._id,
          attemptId_noUnderscore: attemptRes.data?.id,
          hasItems: !!attemptRes.data?.items,
          itemsLength: attemptRes.data?.items?.length || 0
        });

        // ⚠️ الـ Backend بيرجع attemptId (مش _id)
        const receivedAttemptId = attemptRes.data?.attemptId || attemptRes.data?._id;
        const receivedItems = attemptRes.data?.items || [];

        console.log('💾 Raw items:', receivedItems);

        // استخراج بيانات الأسئلة من questionSnapshot
        const formattedItems = receivedItems.map((item) => ({
          id: item._id || item.questionId,
          questionId: item.questionId,
          points: item.points,
          // البيانات المهمة من questionSnapshot
          text: item.questionSnapshot?.text,
          prompt: item.questionSnapshot?.prompt,
          qType: item.questionSnapshot?.qType,
          options: item.questionSnapshot?.options || [],
        }));

        console.log('💾 Formatted items:', formattedItems);
        console.log('💾 Setting state:', {
          attemptId: receivedAttemptId,
          itemsCount: formattedItems.length
        });

        setAttemptId(receivedAttemptId);
        setAttemptItems(formattedItems);

        console.log('✅ State should be updated now');
      } catch (err) {
        console.error('❌ Exercise initialization error:', err);
        console.error('❌ Error details:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message,
          config: {
            url: err.config?.url,
            method: err.config?.method,
            headers: err.config?.headers
          }
        });

        // معالجة الأخطاء حسب النوع
        if (err.response?.status === 401) {
          // 401 = Token منتهي أو غير صالح
          console.error('🔒 401 Unauthorized - Token منتهي أو غير صالح');
          setError('انتهت صلاحية جلسة الدخول. يرجى تسجيل الدخول مرة أخرى.');

          // حذف tokens القديمة
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');

          // إعادة التوجيه للـ login
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else if (err.response?.status === 403) {
          // 403 = Forbidden - ما عندك صلاحية (لكن مسجل دخول)
          console.error('🚫 403 Forbidden - ليس لديك صلاحية لإنشاء امتحانات');
          console.error('💡 Hint: يبدو أن حسابك كطالب لا يملك صلاحية إنشاء الامتحانات');
          setError('عذراً، لا يمكنك إنشاء تمارين كطالب. تواصل مع المدرس للحصول على الصلاحيات المطلوبة.');
        } else if (err.response?.status === 400) {
          // 400 = Bad Request - خطأ في البيانات المرسلة
          console.error('⚠️ 400 Bad Request - خطأ في البيانات المرسلة');
          console.error('📋 Response data:', err.response?.data);
          setError(`خطأ في البيانات: ${err.response?.data?.message || err.response?.data?.error || 'تحقق من الـ Console'}`);
        } else {
          setError('حدث خطأ أثناء تحميل التمرين. جرّبي مرة أخرى.');
        }
      } finally {
        setLoading(false);
      }
    }

    if (level && topicSlug) {
      initializeExercise();
    }
  }, [level, topicSlug, navigate]);

  // Debug: تتبع تغييرات attemptId و attemptItems
  useEffect(() => {
    console.log('🔄 State changed:', {
      attemptId: attemptId,
      attemptItemsLength: attemptItems.length,
      hasAttemptId: !!attemptId,
      hasAttemptItems: attemptItems.length > 0
    });
  }, [attemptId, attemptItems]);

  const handleAnswer = async (itemIndex, answer) => {
    console.log('🎯 handleAnswer called with:', { itemIndex, answer });

    if (!attemptId) {
      console.error('❌ Cannot handle answer - missing attemptId');
      return;
    }

    if (!attemptItems[itemIndex]) {
      console.error('❌ Cannot handle answer - missing item at index:', itemIndex);
      return;
    }

    const currentItem = attemptItems[itemIndex];
    const body = { itemIndex };

    // حسب نوع السؤال
    if (currentItem.qType === 'true_false') {
      body.studentAnswerBoolean = answer;
    } else if (currentItem.qType === 'fill') {
      body.studentAnswerText = answer;
    } else if (currentItem.qType === 'mcq') {
      body.studentAnswerIndexes = [answer];
    }

    try {
      await api.patch(`/attempts/${attemptId}/answer`, body);
      console.log('✅ Answer saved for item:', itemIndex);

      // حفظ الإجابة محلياً
      setAnswers((prev) => ({
        ...prev,
        [itemIndex]: answer,
      }));
    } catch (err) {
      console.error('Error saving answer:', err);
      alert('حدث خطأ أثناء حفظ الإجابة');
    }
  };

  const handleSubmit = async () => {
    if (!attemptId) return;

    // التحقق من أن جميع الأسئلة محلولة
    const unansweredQuestions = [];
    attemptItems.forEach((item, index) => {
      const answer = answers[index];

      // للأسئلة true/false: نتحقق إذا الإجابة boolean (true أو false)
      if (item.qType === 'true_false') {
        if (typeof answer !== 'boolean') {
          unansweredQuestions.push(index + 1);
        }
      }
      // للأسئلة الأخرى: نتحقق إذا الإجابة موجودة
      else {
        if (answer === undefined || answer === null || answer === '') {
          unansweredQuestions.push(index + 1);
        }
      }
    });

    if (unansweredQuestions.length > 0) {
      alert(`⚠️ يرجى الإجابة على جميع الأسئلة قبل التسليم.\n\nالأسئلة غير المحلولة: ${unansweredQuestions.join(', ')}`);
      return;
    }

    try {
      setSubmitting(true);

      // تحضير الإجابات بصيغة Backend المطلوبة
      const answersArray = attemptItems.map((item, index) => {
        const userAnswer = answers[index];

        // تحويل الإجابة حسب النوع
        let formattedAnswer;
        if (item.qType === 'mcq') {
          // MCQ: إرسال index أو النص
          formattedAnswer = userAnswer;
        } else if (item.qType === 'true_false') {
          // True/False: تحويل boolean إلى نص
          formattedAnswer = userAnswer === true ? 'صح' : 'خطأ';
        } else if (item.qType === 'fill') {
          // Fill: إرسال النص مباشرة
          formattedAnswer = userAnswer;
        }

        return {
          itemIndex: index,
          userAnswer: formattedAnswer
        };
      });

      console.log('📤 Sending submit request to:', `/attempts/${attemptId}/submit`);
      console.log('📤 Request body:', { answers: answersArray });

      const resultRes = await api.post(`/attempts/${attemptId}/submit`, {
        answers: answersArray
      });

      console.log('✅ Attempt submitted:', resultRes.data);
      console.log('📊 Result Details:', {
        totalAutoScore: resultRes.data?.totalAutoScore,
        score: resultRes.data?.score,
        totalQuestions: resultRes.data?.totalQuestions,
        percentage: resultRes.data?.percentage,
        items: resultRes.data?.items,
        itemsLength: resultRes.data?.items?.length,
        fullResponse: resultRes.data
      });

      // طباعة كل سؤال مع نتيجته
      console.log('📝 تفاصيل كل سؤال:');
      resultRes.data?.items?.forEach((item, idx) => {
        console.log(`سؤال ${idx + 1}:`, {
          questionId: item.questionId,
          isCorrect: item.isCorrect,
          autoScore: item.autoScore,
          studentAnswer: item.studentAnswerBoolean ?? item.studentAnswerText ?? item.studentAnswerIndexes,
          correctAnswer: item.correctAnswerBoolean ?? item.correctAnswerText ?? item.correctAnswerIndexes
        });
      });

      setResults(resultRes.data);
    } catch (err) {
      console.error('Error submitting attempt:', err);
      alert('حدث خطأ أثناء تسليم التمرين');
    } finally {
      setSubmitting(false);
    }
  };


  // دالة لعرض السؤال مع inline input للفراغ
  const renderFillQuestion = (text, value, onChange) => {
    if (!text) return null;

    // البحث عن الفراغ ___ في النص
    const blankPattern = /_{2,}/; // يبحث عن _ متكررة (مثل __ أو ___ أو ____)

    if (!blankPattern.test(text)) {
      // إذا ما في فراغ، نعرض النص عادي
      return <span>{text}</span>;
    }

    // تقسيم النص عند الفراغ
    const parts = text.split(blankPattern);

    return (
      <span className="inline-flex items-baseline gap-0" style={{ display: 'inline' }}>
        <span>{parts[0]}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="inline-input-fill"
          style={{
            display: 'inline-block',
            border: 'none',
            borderBottom: '2px solid #e63946',
            padding: '2px 8px',
            margin: '0 4px',
            fontSize: 'inherit',
            lineHeight: 'inherit',
            minWidth: '60px',
            maxWidth: '200px',
            width: `${Math.max(60, (value.length + 1) * 12)}px`,
            backgroundColor: 'transparent',
            outline: 'none',
            textAlign: 'center',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => {
            e.target.style.borderBottomColor = '#dc2626';
            e.target.style.borderBottomWidth = '3px';
          }}
          onBlur={(e) => {
            e.target.style.borderBottomColor = '#e63946';
            e.target.style.borderBottomWidth = '2px';
          }}
          autoFocus
        />
        <span>{parts[1]}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-slate-500">جاري تحضير التمرين…</div>
        </div>
      </div>
    );
  }

  // التأكد من أن attemptId موجود قبل عرض الأسئلة
  // ⚠️ فقط نعرض الخطأ إذا خلص الـ loading وما في error وما في attemptId
  if (!loading && !error && !attemptId && attemptItems.length === 0) {
    console.warn('⚠️ Showing error: No attemptId after loading finished');
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-4 mb-4 max-w-md">
            ⚠️ لم يتم تحميل التمرين بشكل صحيح. يرجى المحاولة مرة أخرى.
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-slate-600 hover:text-slate-800"
          >
            ← رجوع
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-4 mb-4">
            {error}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-slate-600 hover:text-slate-800"
          >
            ← رجوع
          </button>
        </div>
      </div>
    );
  }

  // عرض النتائج
  if (results) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h1 className="text-xl font-bold text-slate-900 mb-4">
              🎉 انتهى التمرين!
            </h1>

            <div className="mb-6">
              <div className="text-lg font-semibold text-slate-900">
                النتيجة: {results.finalScore || results.totalAutoScore || 0} / {results.totalMaxScore || attemptItems.length}
              </div>
              <div className="text-sm text-slate-600">
                النسبة: {results.percentage || 0}%
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {results.items?.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border ${
                    item.isCorrect
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-rose-50 border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold">
                      سؤال {idx + 1}
                    </span>
                    <span className="text-xs">
                      {item.isCorrect ? '✅ صحيح' : '❌ خطأ'}
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    {questions.find((q) => q._id === item.questionId)?.prompt ||
                      'سؤال'}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/grammatik/${level}/${topicSlug}`)}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
              >
                رجوع للموضوع
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
              >
                إعادة التمرين
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // عرض الأسئلة - التأكد من وجود البيانات المطلوبة
  if (!attemptId || attemptItems.length === 0) {
    console.warn('⚠️ Cannot render questions - missing data:', {
      hasAttemptId: !!attemptId,
      attemptItemsLength: attemptItems.length
    });
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-slate-500">جاري تحميل الأسئلة…</div>
        </div>
      </div>
    );
  }

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
            {topic?.title}
          </span>
        </div>

        {/* عنوان التمرين */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 mb-1">
            تمارين {topic?.title}
          </h1>
          <p className="text-sm text-slate-600">
            {attemptItems.length} سؤال • أجيبي على جميع الأسئلة ثم اضغطي "إرسال الإجابات"
          </p>
        </div>

        {/* عرض كل الأسئلة */}
        <div className="space-y-6 mb-6">
          {attemptItems.map((item, itemIndex) => {
            console.log(`📝 Item ${itemIndex}:`, item);

            return (
              <div key={itemIndex} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                {/* رقم السؤال */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold px-2 py-1 bg-rose-100 text-rose-700 rounded">
                    سؤال {itemIndex + 1}
                  </span>
                  {item.qType && (
                    <span className="text-[10px] text-slate-400">
                      {item.qType === 'mcq' && 'اختيار من متعدد'}
                      {item.qType === 'fill' && 'املأ الفراغ'}
                      {item.qType === 'true_false' && 'صح أو خطأ'}
                    </span>
                  )}
                </div>

                {/* MCQ */}
                {item.qType === 'mcq' && (
                  <>
                    <h3 className="text-base font-semibold text-slate-900 mb-3">
                      {item.text || item.prompt || item.question?.text || 'نص السؤال'}
                    </h3>
                    <div className="space-y-2">
                      {item.options?.map((opt, optIdx) => (
                        <button
                          key={optIdx}
                          onClick={() => handleAnswer(itemIndex, optIdx)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border text-sm transition text-right ${
                            answers[itemIndex] === optIdx
                              ? 'bg-rose-50 border-rose-400'
                              : 'bg-slate-50 border-slate-200 hover:border-rose-400'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            answers[itemIndex] === optIdx
                              ? 'border-rose-500'
                              : 'border-slate-300'
                          }`}>
                            {answers[itemIndex] === optIdx && (
                              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                            )}
                          </div>
                          <span>{opt.text || opt}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* True/False */}
                {item.qType === 'true_false' && (
                  <>
                    <h3 className="text-base font-semibold text-slate-900 mb-3">
                      {item.text || item.prompt || 'نص السؤال'}
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleAnswer(itemIndex, true)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-sm transition text-right ${
                          answers[itemIndex] === true
                            ? 'bg-rose-50 border-rose-400'
                            : 'bg-slate-50 border-slate-200 hover:border-rose-400'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          answers[itemIndex] === true
                            ? 'border-rose-500'
                            : 'border-slate-300'
                        }`}>
                          {answers[itemIndex] === true && (
                            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                          )}
                        </div>
                        <span>صح</span>
                      </button>
                      <button
                        onClick={() => handleAnswer(itemIndex, false)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-sm transition text-right ${
                          answers[itemIndex] === false
                            ? 'bg-rose-50 border-rose-400'
                            : 'bg-slate-50 border-slate-200 hover:border-rose-400'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          answers[itemIndex] === false
                            ? 'border-rose-500'
                            : 'border-slate-300'
                        }`}>
                          {answers[itemIndex] === false && (
                            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                          )}
                        </div>
                        <span>خطأ</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Fill */}
                {item.qType === 'fill' && (
                  <div>
                    <div className="text-base text-slate-900 mb-4">
                      {renderFillQuestion(
                        item.text || item.prompt || 'نص السؤال',
                        answers[itemIndex] || '',
                        (value) => {
                          setAnswers((prev) => ({
                            ...prev,
                            [itemIndex]: value,
                          }));
                          // حفظ تلقائي عند الكتابة
                          handleAnswer(itemIndex, value);
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* زر إرسال الإجابات */}
        <div className="flex justify-end mt-8">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-3 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-sm"
          >
            {submitting ? 'جاري الإرسال…' : '✅ إرسال الإجابات'}
          </button>
        </div>
      </div>
    </div>
  );
}
