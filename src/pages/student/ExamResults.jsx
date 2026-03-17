import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { examsAPI } from '../../services/examsAPI';
import { BRAND } from '../../constants/brand';
import { useLanguage, useTranslation } from '../../contexts/LanguageContext';

function ExamResults() {
  const navigate = useNavigate();
  const { attemptId } = useParams();
  const { lang } = useLanguage();
  const t = useTranslation();
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
        throw new Error(t('results_noAttemptData'));
      }

      // استخراج بيانات الأسئلة من questionSnapshot
      if (attemptData.items && attemptData.items.length > 0) {
        const formattedItems = attemptData.items.map((item) => {
          // استخدام promptSnapshot و optionsText (الحقول الصحيحة من الباك)
          const prompt = item.promptSnapshot || item.questionSnapshot?.text || item.questionSnapshot?.prompt || item.prompt || item.text;
          const options = item.optionsText || item.questionSnapshot?.options || item.options || [];
          const qType = item.qType || item.questionSnapshot?.qType || 'mcq';
          
          // قراءة interactiveTextSnapshot و interactiveBlanksSnapshot لأسئلة interactive_text
          const interactiveText = item.interactiveTextSnapshot || item.interactiveText || '';
          const interactiveBlanks = item.interactiveBlanksSnapshot || item.interactiveBlanks || [];
          // قراءة interactiveReorderSnapshot لأسئلة Reorder
          const interactiveReorder = item.interactiveReorderSnapshot || item.interactiveReorder || null;

          return {
            ...item,
            prompt,
            text: prompt,
            qType,
            options,
            interactiveText,
            interactiveBlanks,
            interactiveReorder,
          };
        });
        
        // عرض كل الأسئلة المرسلة من الباكند (بدون إزالة حسب questionId حتى تظهر كل الإجابات في النتائج)
        attemptData.items = formattedItems;
      }

      setAttempt(attemptData);
    } catch (err) {
      console.error('❌ Error loading attempt results:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        t('results_errorLoad')
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-slate-200 rounded-full animate-spin mb-4" style={{ borderTopColor: BRAND.red }}></div>
          <p className="text-base text-slate-600 font-medium">{t('results_loading')}</p>
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
            <p className="text-base mb-6 font-medium" style={{ color: BRAND.red }}>{error || t('results_noData')}</p>
            <button
              onClick={() => navigate('/student/liden')}
              className="px-6 py-3 bg-slate-200 text-slate-800 rounded-xl hover:bg-slate-300 transition-colors text-base font-semibold"
            >
              {t('results_back')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // حساب الإحصائيات
  // ✅ حساب totalMaxScore بناءً على العدد الفريد من الأسئلة (بعد إزالة التكرارات)
  let totalMaxScore = attempt.totalMaxScore ?? attempt.totalPoints ?? 0;
  const finalScore = attempt.finalScore ?? attempt.totalAutoScore ?? attempt.score ?? 0;

  let totalQuestions = 0;
  let correctCount = 0;
  let wrongCount = 0;

  if (attempt.items && Array.isArray(attempt.items) && attempt.items.length > 0) {
    totalQuestions = attempt.items.length;
    
    // ✅ إعادة حساب totalMaxScore و finalScore بناءً على العدد الفريد من الأسئلة
    // نجمع maxPoints و points لكل سؤال فريد (بعد إزالة التكرارات)
    // ✅ استثناء أسئلة free_text و speaking من الحساب (تحتاج تقييم يدوي)
    let calculatedMaxScore = 0;
    let calculatedFinalScore = 0;
    
    attempt.items.forEach(item => {
      const qType = item.qType || item.type;
      
      // ✅ استثناء أسئلة free_text و speaking من حساب النقاط
      if (qType === 'free_text' || qType === 'speaking') {
        return; // لا نحسب نقاطهم في الإحصائيات
      }
      
      const maxPoints = item.maxPoints ?? item.points ?? 1; // افتراضي 1 نقطة لكل سؤال
      const points = item.points ?? item.autoScore ?? 0;
      calculatedMaxScore += maxPoints;
      calculatedFinalScore += points;
    });
    
    // ✅ استخدام القيمة المحسوبة إذا كانت مختلفة عن القيمة من الباك
    // (هذا يعني أن الباك كان يحسب التكرارات)
    if (calculatedMaxScore > 0 && calculatedMaxScore !== totalMaxScore) {
      console.log(`✅ Recalculating totalMaxScore: ${totalMaxScore} → ${calculatedMaxScore} (removed duplicates)`);
      totalMaxScore = calculatedMaxScore;
    }
    
    if (calculatedFinalScore > 0 && calculatedFinalScore !== finalScore) {
      console.log(`✅ Recalculating finalScore: ${finalScore} → ${calculatedFinalScore} (removed duplicates)`);
      // لا نحدث finalScore هنا لأن الباك قد يكون أعطى قيمة صحيحة
      // لكن يمكن استخدامها للتحقق
    }
    
    // حساب الإجابات الصحيحة والخاطئة من items
    attempt.items.forEach(item => {
      const qType = item.qType || item.type;
      
      // ✅ استثناء أسئلة free_text و speaking من الحساب التلقائي (تحتاج تقييم يدوي)
      if (qType === 'free_text' || qType === 'speaking') {
        return; // لا نحسبها في الإحصائيات التلقائية
      }
      
      // ✅ التحقق من isCorrect بطرق مختلفة
      // ✅ التأكد من أن أسئلة free_text و speaking لا تُحسب كخاطئة حتى لو كان autoScore = 0
      const isCorrect = 
        item.isCorrect === true || 
        item.isCorrect === 'true' || 
        item.correct === true ||
        item.correct === 'true' ||
        (item.autoScore !== undefined && item.autoScore > 0) ||
        (item.points !== undefined && item.maxPoints !== undefined && item.points === item.maxPoints && item.points > 0);
      
      if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
      }
    });
    
    // Debug: طباعة الإحصائيات
    console.log('📊 Statistics:', {
      totalQuestions,
      correctCount,
      wrongCount,
      finalScore,
      totalMaxScore,
      items: attempt.items.map((item, idx) => ({
        index: idx,
        isCorrect: item.isCorrect,
        correct: item.correct,
        autoScore: item.autoScore,
        points: item.points,
        maxPoints: item.maxPoints,
      }))
    });
  } else {
    // Fallback: استخدام النقاط إذا لم تكن items متاحة
    totalQuestions = totalMaxScore;
    correctCount = finalScore;
    wrongCount = totalMaxScore - finalScore;
  }

  // التحقق من نوع الامتحان
  const isLebenExam = attempt.exam?.provider === 'Leben in Deutschland' || 
                      attempt.exam?.provider === 'LiD' ||
                      attempt.exam?.examType === 'leben_test' ||
                      attempt.exam?.type === 'leben_test';

  // حساب النسبة والنجاح حسب نوع الامتحان
  let percentage = 0;
  let isPassed = false;

  if (isLebenExam) {
    // امتحان Leben: النتيجة من 33، النجاح عند ≥ 17
    const lebenTotal = 33;
    const lebenPassingScore = 17;
    percentage = lebenTotal > 0 ? Math.round((correctCount / lebenTotal) * 100) : 0;
    isPassed = correctCount >= lebenPassingScore;
  } else {
    // امتحانات أخرى: النسبة المئوية العادية
    percentage = totalMaxScore > 0 ? Math.round((finalScore / totalMaxScore) * 100) : 0;
    isPassed = percentage >= 50;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* الشريط العلوي */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-base text-slate-500 hover:text-slate-700 transition-colors font-medium"
          >
            ← {t('results_back')}
          </button>
          <span className="text-base font-semibold" style={{ color: BRAND.red }}>
            {t('results_examResult')}
          </span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            {attempt.exam?.title || t('exam_exam')}
          </h1>
          <p className="text-base sm:text-lg text-slate-600">
            {t('results_reviewResult')}
          </p>
        </div>

        {/* بطاقة النتيجة */}
        <div className={`bg-white rounded-2xl shadow-sm border-2 p-8 sm:p-10 mb-6 ${
          isPassed ? 'border-emerald-200' : ''
        }`} style={!isPassed ? { borderColor: BRAND.red } : {}}>
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">
              {isPassed ? '🎉' : '📝'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              {isPassed ? t('results_passed') : t('results_examFinished')}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto">
              {isLebenExam 
                ? (isPassed ? `${t('results_passedPrefix')} ${t('results_youHave')} ${correctCount} ${t('exam_of')} 33 (${t('results_minScoreLabel')}: 17)` : `${t('results_youHave')} ${correctCount} ${t('exam_of')} 33 (${t('results_minScoreLabel')}: 17)`)
                : (isPassed ? t('results_wellDone') : t('results_tryAgain'))
              }
            </p>
          </div>

          {/* الإحصائيات */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* النسبة المئوية */}
            <div className="md:col-span-1 flex items-center justify-center">
              <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center ${
                isPassed ? 'bg-emerald-50 border-2 border-emerald-200' : ''
              }`} style={!isPassed ? { backgroundColor: 'rgba(221, 0, 0, 0.08)', borderWidth: 2, borderColor: BRAND.red } : {}}>
                <div className={`text-4xl font-bold ${isPassed ? 'text-emerald-600' : ''}`} style={!isPassed ? { color: BRAND.red } : {}}>
                  {percentage}%
                </div>
                <div className="text-sm text-slate-500 mt-1 font-medium">{t('results_percent')}</div>
              </div>
            </div>

            {/* التفاصيل */}
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <div className="text-sm text-slate-500 mb-2 font-medium">{t('results_totalScore')}</div>
                <div className="text-3xl font-bold text-slate-900">{finalScore} {t('exam_of')} {totalMaxScore}</div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                <div className="text-sm text-emerald-700 mb-2 font-medium">{t('exam_correct')}</div>
                <div className="text-3xl font-bold text-emerald-600">{correctCount}</div>
              </div>

              <div className="rounded-xl p-5 border" style={{ backgroundColor: 'rgba(221, 0, 0, 0.06)', borderColor: 'rgba(221, 0, 0, 0.25)' }}>
                <div className="text-sm font-medium mb-2" style={{ color: BRAND.red }}>{t('exam_incorrect')}</div>
                <div className="text-3xl font-bold" style={{ color: BRAND.red }}>{wrongCount}</div>
              </div>
            </div>
          </div>

          {/* تاريخ التسليم */}
          {attempt.submittedAt && (
            <div className="text-center text-sm text-slate-400 mt-8 pt-6 border-t border-slate-100">
              {t('results_submittedOn')} {new Date(attempt.submittedAt).toLocaleString(
                lang === 'fr' ? 'fr-FR' : lang === 'de' ? 'de-DE' : lang === 'ru' ? 'ru-RU' : lang === 'uk' ? 'uk-UA' : lang === 'tr' ? 'tr-TR' : 'en-GB',
                { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
              )}
            </div>
          )}
        </div>

        {/* مراجعة الأسئلة */}
        {attempt.items && attempt.items.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-5">
              {t('results_reviewQuestions')}
            </h3>

            <div className="space-y-4">
              {attempt.items.map((item, index) => {
                const prompt = item.promptSnapshot || item.prompt || item.text || t('exam_question');
                const qType = item.qType || item.type;
                const options = item.optionsText || item.options || [];
                const points = item.autoScore || item.points || 0;
                const maxPoints = item.maxPoints || item.points || 1;
                
                // ✅ لأسئلة free_text و speaking: لا نحسب isCorrect (تحتاج تقييم يدوي)
                // ✅ حتى لو كان الباك يعتبرهم خاطئين (autoScore = 0 أو isCorrect = false)، نعاملهم كـ "بانتظار التقييم"
                // ✅ هذا مهم لأن الباك قد يحاول تصحيح أسئلة الكتابة تلقائياً بشكل خاطئ
                const needsManualGrading = qType === 'free_text' || qType === 'speaking';
                
                // ✅ استخدام isCorrect من الباك أولاً (الباك هو المصدر الموثوق)
                // ✅ للأسئلة التي تحتاج تقييم يدوي، نستخدم null دائماً (حتى لو كان الباك يعطي false)
                // ✅ للأسئلة الأخرى، نستخدم isCorrect من الباك
                // ✅ ملاحظة: للأسئلة المعقدة (match, reorder)، الحساب المحلي داخل JSX قد يعدل isCorrect
                // ✅ نستخدم متغير يمكن تحديثه من داخل JSX
                let isCorrectValue = null;
                let isCorrectCalculated = false;
                
                if (needsManualGrading) {
                  // ✅ أسئلة الكتابة والمحادثة دائماً "بانتظار التقييم"
                  // ✅ حتى لو كان الباك يعطي isCorrect = false أو autoScore = 0
                  // ✅ لأن هذه الأسئلة تحتاج تقييم يدوي من المعلم
                  isCorrectValue = null; // بانتظار التقييم - دائماً
                } else {
                  // ✅ استخدام isCorrect من الباك أولاً (الأولوية للباك)
                  if (item.isCorrect === true || item.isCorrect === 'true' || 
                      item.correct === true || item.correct === 'true') {
                    isCorrectValue = true;
                  } else if (item.isCorrect === false || item.isCorrect === 'false' || 
                            item.correct === false || item.correct === 'false') {
                    // ✅ للأسئلة المعقدة (match, reorder)، قد يكون الحساب المحلي صحيح
                    // ✅ لذلك نترك false هنا، والحساب المحلي داخل JSX سيعرض الحالة الصحيحة
                    isCorrectValue = false;
                  } else {
                    // ✅ إذا لم يكن isCorrect موجوداً، نستخدم autoScore أو points
                    if (item.autoScore !== undefined && item.autoScore > 0) {
                      isCorrectValue = true;
                    } else if (item.points !== undefined && item.maxPoints !== undefined && 
                              item.points === item.maxPoints && item.points > 0) {
                      isCorrectValue = true;
                    } else if (item.autoScore === 0 && item.maxPoints !== undefined && item.maxPoints > 0) {
                      isCorrectValue = false;
                    } else {
                      // ✅ افتراضي: إذا لم نستطع تحديد، نعتبره خاطئ (لكن يمكن تعديله لاحقاً)
                      isCorrectValue = false;
                    }
                  }
                }
                
                // ✅ استخدام isCorrectValue كـ isCorrect (يمكن تحديثه من داخل JSX)
                // ✅ التأكد من أن أسئلة free_text و speaking دائماً null
                let isCorrect = needsManualGrading ? null : isCorrectValue;

                return (
                  <div
                    key={index}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
                  >
                    {/* رأس السؤال */}
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold px-2.5 py-1 rounded" style={{ backgroundColor: 'rgba(221, 0, 0, 0.12)', color: BRAND.red }}>
                          {t('exam_question')} {index + 1}
                        </span>
                        <span className={`text-sm font-semibold px-2.5 py-1 rounded ${
                          isCorrect === null
                            ? 'bg-amber-100 text-amber-700'
                            : isCorrect
                            ? 'bg-emerald-100 text-emerald-700'
                            : ''
                        }`} style={isCorrect === false ? { backgroundColor: 'rgba(221, 0, 0, 0.12)', color: BRAND.red } : {}}>
                          {isCorrect === null 
                            ? `⏳ ${t('results_pending')}` 
                            : isCorrect 
                            ? `✓ ${t('exam_correct')}`
                            : `✗ ${t('exam_incorrect')}`}
                        </span>
                      </div>
                      <span className="text-sm text-slate-500 font-medium">
                        {needsManualGrading 
                          ? t('results_pending') 
                          : `${isCorrect ? points : 0} ${t('exam_of')} ${maxPoints} ${maxPoints !== 1 ? t('exam_points') : t('exam_point')}`}
                      </span>
                    </div>

                    {/* نص السؤال */}
                    <div className="mb-4" dir="ltr">
                      <h4 className="text-lg font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap text-left">
                        {prompt}
                      </h4>
                    </div>

                    {/* Interactive Text: عرض interactiveText مع الإجابات أو Reorder */}
                    {qType === 'interactive_text' && (() => {
                      // ✅ التحقق من نوع المهمة: Reorder أو Fill-in-the-blanks
                      const interactiveReorder = item.interactiveReorder || item.interactiveReorderSnapshot;
                      const taskType = item.taskType || (interactiveReorder ? 'reorder' : 'fill_blanks');
                      
                      // ✅ Reorder Task
                      if (taskType === 'reorder' && interactiveReorder?.parts && interactiveReorder.parts.length > 0) {
                        // ✅ استخدام isCorrect المحسوب محلياً لتحديث isCorrect العام للسؤال
                        // ✅ هذا لحل مشاكل التصحيح في الباك
                        const parts = interactiveReorder.parts;
                        
                        // ✅ قراءة reorderAnswer من جميع الأماكن المحتملة
                        const studentReorderAnswer = 
                          item.reorderAnswer ||                    // من item مباشرة
                          item.studentAnswer?.reorderAnswer ||     // من studentAnswer
                          item.answer?.reorderAnswer ||            // من answer
                          item.studentAnswerReorder ||             // fallback
                          item.answers?.reorderAnswer ||           // من answers
                          (Array.isArray(item.studentAnswer) && item.studentAnswer.length > 0 ? item.studentAnswer : null) || // إذا كان studentAnswer هو array مباشرة
                          (Array.isArray(item.answer) && item.answer.length > 0 ? item.answer : null) || // إذا كان answer هو array مباشرة
                          [];
                        
                        // ✅ حساب الترتيب الصحيح من parts (حسب order)
                        const correctOrder = [...parts].sort((a, b) => (a.order || 0) - (b.order || 0)).map(p => p.id);
                        const studentOrder = Array.isArray(studentReorderAnswer) && studentReorderAnswer.length > 0 
                          ? studentReorderAnswer 
                          : [];
                        
                        // ✅ التحقق من وجود إجابة (يجب أن يكون عدد IDs مساوياً لعدد parts)
                        const hasAnswer = studentOrder.length === parts.length && 
                                         studentOrder.every(id => parts.some(p => p.id === id));
                        
                        // ✅ حساب صحة الترتيب محلياً
                        const localIsCorrect = hasAnswer && 
                                              studentOrder.length === correctOrder.length && 
                                              studentOrder.every((id, index) => id === correctOrder[index]);
                        
                        // ✅ استخدام isCorrect من الباك أولاً (الباك هو المصدر الموثوق)
                        // ✅ إذا كان الباك يقول false لكن الحساب المحلي يقول true، نستخدم الحساب المحلي (لحل مشاكل التصحيح في الباك)
                        let reorderIsCorrect = localIsCorrect;
                        
                        if (item.isCorrect === true || item.isCorrect === 'true' || 
                            item.correct === true || item.correct === 'true' ||
                            (item.autoScore !== undefined && item.autoScore > 0) ||
                            (item.points !== undefined && item.maxPoints !== undefined && item.points === item.maxPoints && item.points > 0)) {
                          // ✅ الباك يقول صحيح - نستخدم الحساب المحلي
                          reorderIsCorrect = localIsCorrect;
                        } else if (localIsCorrect) {
                          // ✅ الحساب المحلي يقول صحيح - نستخدمه حتى لو الباك قال false
                          // ✅ هذا لحل مشاكل التصحيح في الباك
                          reorderIsCorrect = true;
                        }
                        
                        // ✅ تحديث isCorrect العام للسؤال بناءً على الحساب المحلي
                        if (reorderIsCorrect !== isCorrectValue && !isCorrectCalculated) {
                          isCorrect = reorderIsCorrect;
                          isCorrectCalculated = true;
                        }
                        
                        const reorderIsCorrectFinal = reorderIsCorrect;
                        
                        // ✅ ترتيب parts حسب إجابة الطالب
                        const studentOrderedParts = hasAnswer
                          ? studentOrder.map(id => parts.find(p => p.id === id)).filter(Boolean)
                          : parts; // إذا لم تكن هناك إجابة، نعرض الترتيب الأصلي
                        
                        // ✅ ترتيب parts حسب الترتيب الصحيح
                        const correctOrderedParts = [...parts].sort((a, b) => (a.order || 0) - (b.order || 0));
                        
                        console.log('🔍 Reorder Results Debug:', {
                          itemIndex: index,
                          qType,
                          taskType,
                          partsCount: parts.length,
                          studentOrder,
                          correctOrder,
                          isCorrect,
                          hasAnswer,
                          studentReorderAnswer,
                          itemKeys: Object.keys(item),
                          itemStudentAnswer: item.studentAnswer,
                          itemReorderAnswer: item.reorderAnswer,
                        });
                        
                        return (
                          <div className="mb-4 space-y-4">
                            {/* عرض ترتيب الطالب */}
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                              <div className="text-sm font-semibold text-slate-700 mb-3">
                                {t('exam_yourOrder')}
                              </div>
                              <div className="space-y-2">
                                {studentOrderedParts.map((part, partIndex) => {
                                  const isInCorrectPosition = correctOrder[partIndex] === part.id;
                                  return (
                                    <div
                                      key={part.id}
                                      className={`p-3 rounded-lg border-2 ${
                                        isInCorrectPosition
                                          ? 'bg-emerald-50 border-emerald-200'
                                          : 'bg-red-50 border-red-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                          isInCorrectPosition
                                            ? 'bg-emerald-200 text-emerald-800'
                                            : 'bg-red-200 text-red-800'
                                        }`}>
                                          {partIndex + 1}
                                        </div>
                                        <div className="flex-1 text-base text-slate-900">
                                          {part.text}
                                        </div>
                                        {isInCorrectPosition ? (
                                          <span className="text-xs text-emerald-600 font-semibold">
                                            ✓ {t('exam_correct')}
                                          </span>
                                        ) : (
                                          <span className="text-xs text-red-600 font-semibold">
                                            ✗ {t('exam_incorrect')}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            
                            {/* عرض الترتيب الصحيح (إذا كان هناك خطأ) */}
                            {!isCorrect && (
                              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                <div className="text-sm font-semibold text-emerald-700 mb-3">
                                  {t('exam_correctOrder')}
                                </div>
                                <div className="space-y-2">
                                  {correctOrderedParts.map((part, partIndex) => (
                                    <div
                                      key={part.id}
                                      className="p-3 rounded-lg border-2 bg-white border-emerald-200"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-semibold">
                                          {partIndex + 1}
                                        </div>
                                        <div className="flex-1 text-base text-slate-900">
                                          {part.text}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      // ✅ Fill-in-the-blanks Task
                      const interactiveText = item.interactiveText || item.interactiveTextSnapshot || '';
                      const interactiveBlanks = item.interactiveBlanks || item.interactiveBlanksSnapshot || [];
                      
                      // ✅ قراءة interactiveAnswers من جميع الأماكن المحتملة
                      const studentAnswers = 
                        item.interactiveAnswers ||           // من item مباشرة
                        item.studentAnswer?.interactiveAnswers ||  // من studentAnswer
                        item.answer?.interactiveAnswers ||   // من answer
                        item.studentAnswerInteractive ||     // fallback
                        item.studentAnswers ||               // fallback
                        (typeof item.studentAnswer === 'object' && item.studentAnswer ? item.studentAnswer : {}) || // إذا كان studentAnswer هو object مباشرة
                        {};
                      
                      // Debug: طباعة البيانات
                      console.log('🔍 Interactive Text Results Debug:', {
                        itemIndex: index,
                        qType,
                        taskType,
                        hasInteractiveText: !!interactiveText,
                        interactiveBlanksLength: interactiveBlanks.length,
                        studentAnswers,
                        studentAnswersKeys: Object.keys(studentAnswers),
                        itemKeys: Object.keys(item),
                        hasInteractiveAnswers: !!item.interactiveAnswers,
                        hasStudentAnswer: !!item.studentAnswer,
                        studentAnswerType: typeof item.studentAnswer,
                        studentAnswerValue: item.studentAnswer,
                        hasAnswer: !!item.answer,
                        fullItem: item, // للتحقق من البنية الكاملة
                      });
                      
                      if (!interactiveText || interactiveBlanks.length === 0) {
                        return null;
                      }
                      
                      // تقسيم النص على placeholders {{a}}, {{b}}, إلخ
                      const parts = [];
                      const placeholderRegex = /\{\{([a-j])\}\}/g;
                      let match;
                      let lastIndex = 0;
                      
                      while ((match = placeholderRegex.exec(interactiveText)) !== null) {
                        // إضافة النص قبل placeholder
                        if (match.index > lastIndex) {
                          parts.push({
                            type: 'text',
                            content: interactiveText.substring(lastIndex, match.index),
                          });
                        }
                        
                        // إضافة placeholder مع الإجابة
                        const blankId = match[1];
                        const blank = interactiveBlanks.find(b => b.id === blankId);
                        
                        // ✅ قراءة الإجابة من جميع الأماكن المحتملة
                        const studentAnswer = 
                          studentAnswers[blankId] ||           // من interactiveAnswers object
                          studentAnswers[String(blankId)] ||   // كـ string
                          item[`answer_${blankId}`] ||         // من item مباشرة
                          item[`studentAnswer_${blankId}`] ||  // من item مباشرة
                          '';
                        
                        const correctAnswers = blank?.correctAnswers || [];
                        const isCorrect = studentAnswer && correctAnswers.some(correct => 
                          correct.toLowerCase().trim() === studentAnswer.toLowerCase().trim()
                        );
                        
                        if (blank) {
                          parts.push({
                            type: 'blank',
                            id: blankId,
                            blank: blank,
                            studentAnswer: studentAnswer,
                            isCorrect: isCorrect,
                            correctAnswers: correctAnswers,
                            hasAnswer: !!studentAnswer, // للتحقق من وجود إجابة
                          });
                        } else {
                          parts.push({
                            type: 'text',
                            content: match[0],
                          });
                        }
                        
                        lastIndex = match.index + match[0].length;
                      }
                      
                      // إضافة النص المتبقي
                      if (lastIndex < interactiveText.length) {
                        parts.push({
                          type: 'text',
                          content: interactiveText.substring(lastIndex),
                        });
                      }
                      
                      return (
                        <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="text-sm font-semibold text-slate-700 mb-3">{t('exam_textWithAnswers')}</div>
                          <div className="text-base text-slate-900 leading-relaxed" dir="ltr">
                            <div className="inline-flex flex-wrap items-center gap-1">
                              {parts.map((part, partIndex) => {
                                if (part.type === 'text') {
                                  return <span key={partIndex}>{part.content}</span>;
                                } else {
                                  const blank = part.blank;
                                  const studentAnswer = part.studentAnswer || '';
                                  const isCorrect = part.isCorrect;
                                  const correctAnswers = part.correctAnswers;
                                  const hasAnswer = part.hasAnswer;
                                  
                                  // ✅ عرض الإجابة دائماً (إذا لم تكن موجودة، نعرض الإجابة الصحيحة فقط)
                                  if (!hasAnswer) {
                                    // إذا لم تكن هناك إجابة، نعرض فقط الإجابة الصحيحة بدون "لم يتم الإجابة"
                                    return (
                                      <span key={partIndex} className="inline-flex items-center gap-1">
                                        {correctAnswers.length > 0 && (
                                          <span className="px-2 py-1 rounded border bg-emerald-100 border-emerald-300 text-emerald-800 font-medium">
                                            {correctAnswers[0]}
                                          </span>
                                        )}
                                      </span>
                                    );
                                  }
                                  
                                  // ✅ إذا كانت هناك إجابة، نعرضها مع التلوين
                                  return (
                                    <span key={partIndex} className="inline-flex items-center gap-1">
                                      <span className={`px-2 py-1 rounded border font-medium ${
                                        isCorrect
                                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                                          : 'bg-red-100 border-red-300 text-red-800'
                                      }`}>
                                        {studentAnswer}
                                      </span>
                                      {isCorrect ? (
                                        <span className="text-xs text-emerald-600 font-semibold">
                                          ✓ {t('exam_correct')}
                                        </span>
                                      ) : correctAnswers.length > 0 && (
                                        <span className="text-xs text-emerald-600" title={`${t('life_solution')}: ${correctAnswers.join(` ${t('exam_or')} `)}`}>
                                          (✓ {correctAnswers[0]})
                                        </span>
                                      )}
                                    </span>
                                  );
                                }
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* الخيارات للـ MCQ */}
                    {qType === 'mcq' && options && options.length > 0 && (
                      <div className="space-y-2" dir="ltr">
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
                                  ? 'bg-red-50 border-red-200'
                                  : isCorrectAnswer && !isSelected
                                  ? 'bg-emerald-50 border-emerald-200 border-dashed'
                                  : 'bg-slate-50 border-slate-100'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                isSelected
                                  ? isCorrectAnswer
                                    ? 'border-emerald-500 bg-emerald-500'
                                    : 'border-red-500 bg-red-500'
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

                              <span className="flex-1 text-sm text-slate-900 text-left">{optionText}</span>

                              {isSelected && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                  isCorrectAnswer
                                    ? 'bg-emerald-200 text-emerald-700'
                                    : 'bg-red-200 text-red-700'
                                }`}>
                                  {t('exam_yourAnswer')}
                                </span>
                              )}
                              {isCorrectAnswer && !isSelected && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-200 text-emerald-700">
                                  {t('life_solution')}
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
                          <span className="text-sm text-slate-600">{t('exam_yourAnswer')}:</span>
                          <span className="text-sm font-semibold text-slate-900">
                            {item.studentAnswerBoolean === true ? t('exam_correct') : t('exam_incorrect')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                          <span className="text-sm text-emerald-700">{t('life_solution')}:</span>
                          <span className="text-sm font-semibold text-emerald-700">
                            {item.answerKeyBoolean === true ? t('exam_correct') : t('exam_incorrect')}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Fill */}
                    {(qType === 'fill' || qType === 'fill-in') && (
                      <div className="space-y-2">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="text-xs text-slate-500 mb-1">{t('exam_yourAnswer')}:</div>
                          <div className="text-sm font-semibold text-slate-900">
                            {item.studentAnswerText || `(${t('exam_notAnswered')})`}
                          </div>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                          <div className="text-xs text-emerald-700 mb-1">{t('life_solution')}:</div>
                          <div className="text-sm font-semibold text-emerald-700">
                            {item.fillExact || item.answerKeyText || '-'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Match */}
                    {qType === 'match' && (() => {
                      // ✅ قراءة matchPairs و studentAnswerMatch من item
                      const matchPairs = item.matchPairs || 
                                       item.answerKeyMatch || 
                                       item.questionSnapshot?.answerKeyMatch || 
                                       [];
                      
                      const studentAnswerMatch = item.studentAnswerMatch || {};
                      
                      console.log('🔍 Match question in results:', {
                        matchPairs,
                        studentAnswerMatch,
                        item
                      });
                      
                      // ✅ تحويل matchPairs إلى قائمتين (إذا كانت tuples)
                      let pairs = [];
                      if (Array.isArray(matchPairs) && matchPairs.length > 0) {
                        if (Array.isArray(matchPairs[0])) {
                          // tuples: [[left, right], ...]
                          pairs = matchPairs.map(([left, right]) => ({
                            left: String(left || '').trim(),
                            right: String(right || '').trim()
                          }));
                        } else if (typeof matchPairs[0] === 'object') {
                          // objects: [{left, right}, ...]
                          pairs = matchPairs.map(pair => ({
                            left: String(pair.left || pair[0] || '').trim(),
                            right: String(pair.right || pair[1] || '').trim()
                          }));
                        }
                      }
                      
                      if (pairs.length === 0) {
                        return (
                          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="text-xs text-yellow-800">
                              ⚠️ {t('exam_noMatchPairs')}
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-3">
                          <div className="text-xs font-semibold text-slate-700 mb-2">
                            {t('exam_matchPairs')}
                          </div>
                          {pairs.map((pair, pairIndex) => {
                            // ✅ قراءة إجابة الطالب (قد تكون object أو array)
                            let studentAnswer = '';
                            if (typeof studentAnswerMatch === 'object' && studentAnswerMatch !== null) {
                              if (Array.isArray(studentAnswerMatch)) {
                                // array: [answer1, answer2, ...]
                                studentAnswer = String(studentAnswerMatch[pairIndex] || '').trim();
                              } else {
                                // object: {0: answer1, 1: answer2, ...}
                                studentAnswer = String(studentAnswerMatch[pairIndex] || studentAnswerMatch[String(pairIndex)] || '').trim();
                              }
                            } else {
                              studentAnswer = String(studentAnswerMatch || '').trim();
                            }
                            
                            const correctAnswer = pair.right;
                            
                            // ✅ حساب صحة كل pair محلياً
                            const localIsCorrect = studentAnswer === correctAnswer;
                            
                            // ✅ استخدام isCorrect من الباك أولاً (الباك هو المصدر الموثوق)
                            // ✅ إذا كان السؤال ككل صحيح من الباك، نعتبر كل pairs صحيحة
                            // ✅ إذا كان الباك يقول false لكن الحساب المحلي يقول true، نستخدم الحساب المحلي (لحل مشاكل التصحيح في الباك)
                            let pairIsCorrect = localIsCorrect;
                            
                            if (item.isCorrect === true || item.isCorrect === 'true' || 
                                item.correct === true || item.correct === 'true' ||
                                (item.autoScore !== undefined && item.autoScore > 0) ||
                                (item.points !== undefined && item.maxPoints !== undefined && item.points === item.maxPoints && item.points > 0)) {
                              // ✅ الباك يقول صحيح - نستخدم الحساب المحلي لكل pair
                              pairIsCorrect = localIsCorrect;
                            } else if (localIsCorrect) {
                              // ✅ الحساب المحلي يقول صحيح - نستخدمه حتى لو الباك قال false
                              // ✅ هذا لحل مشاكل التصحيح في الباك
                              pairIsCorrect = true;
                            }
                            
                            const isCorrect = pairIsCorrect;
                            
                            return (
                              <div
                                key={pairIndex}
                                className={`p-3 rounded-lg border ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : 'bg-red-50 border-red-200'
                                }`}
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-sm font-semibold text-slate-900 flex-1">
                                    {pair.left}
                                  </span>
                                  <span className="text-slate-400">→</span>
                                  <span className={`text-sm font-semibold flex-1 ${
                                    isCorrect ? 'text-emerald-700' : 'text-red-700'
                                  }`}>
                                    {studentAnswer || `(${t('exam_notAnswered')})`}
                                  </span>
                                </div>
                                {!isCorrect && (
                                  <div className="mt-2 pt-2 border-t border-emerald-200">
                                    <div className="text-xs text-emerald-700">
                                      {t('life_solution')}: <span className="font-semibold">{correctAnswer}</span>
                                    </div>
                                  </div>
                                )}
                                {isCorrect && (
                                  <div className="mt-2 pt-2 border-t border-emerald-200">
                                    <div className="text-xs text-emerald-700 font-semibold">
                                      ✓ {t('exam_correct')}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Free Text */}
                    {qType === 'free_text' && (
                      <div className="space-y-2">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="text-xs text-slate-500 mb-2 font-semibold">{t('exam_yourTextAnswer')}</div>
                          <div className="text-sm text-slate-900 whitespace-pre-wrap leading-relaxed">
                            {item.textAnswer || item.studentAnswerText || `(${t('results_noAnswer')})`}
                          </div>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-600">⚠️</span>
                            <span className="text-xs font-semibold text-amber-800">
                              {t('results_manuallyGraded')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Speaking */}
                    {qType === 'speaking' && (
                      <div className="space-y-2">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="text-xs text-slate-500 mb-2 font-semibold">{t('exam_yourAudioAnswer')}</div>
                          {(() => {
                            const audioUrl = item.audioAnswerUrl || item.studentAudioAnswerUrl || item.audioAnswer || item.studentAudioAnswer || item.studentRecording?.url;
                            
                            return audioUrl ? (
                              <audio 
                                src={audioUrl} 
                                controls 
                                className="w-full"
                              />
                            ) : (
                              <div className="text-sm text-slate-500 italic">{t('results_noAudio')}</div>
                            );
                          })()}
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-600">⚠️</span>
                            <span className="text-xs font-semibold text-amber-800">
                              {t('results_manuallyGraded')}
                            </span>
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

        {/* نتائج نموذج الكتابة (Schreiben) */}
        {attempt.schreibenFormResults && Object.keys(attempt.schreibenFormResults).length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-5">
              {t('results_schreibenFormResults')}
            </h3>

            {/* درجة النموذج */}
            {(attempt.schreibenFormScore !== undefined || attempt.schreibenFormMaxScore !== undefined) && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-slate-700">{t('results_formScore')}</span>
                  <span className="text-2xl font-bold text-slate-900">
                    {attempt.schreibenFormScore ?? 0} {t('exam_of')} {attempt.schreibenFormMaxScore ?? 0}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {Object.entries(attempt.schreibenFormResults).map(([fieldId, result]) => (
                <div
                  key={fieldId}
                  className={`bg-white rounded-2xl shadow-sm border-2 p-5 ${
                    result.isCorrect
                      ? 'border-emerald-200'
                      : ''
                  }`} style={!result.isCorrect ? { borderColor: BRAND.red } : {}}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-slate-800 text-base">
                      {result.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold px-2.5 py-1 rounded ${
                        result.isCorrect
                          ? 'bg-emerald-100 text-emerald-700'
                          : ''
                      }`} style={!result.isCorrect ? { backgroundColor: 'rgba(221, 0, 0, 0.12)', color: BRAND.red } : {}}>
                        {result.isCorrect ? `✓ ${t('exam_correct')}` : `✗ ${t('exam_incorrect')}`}
                      </span>
                      <span className="text-xs text-slate-400">
                        {result.points ?? 0} {t('exam_of')} 1
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-xs text-slate-500 block mb-1">{t('exam_yourAnswer')}:</span>
                      <span className="text-slate-900 font-medium">
                        {Array.isArray(result.studentAnswer)
                          ? result.studentAnswer.join(', ')
                          : (result.studentAnswer || `(${t('exam_notAnswered')})`)}
                      </span>
                    </div>
                    {!result.isCorrect && (
                      <div className="p-3 bg-emerald-50 rounded-lg">
                        <span className="text-xs text-emerald-700 block mb-1">{t('life_solution')}:</span>
                        <span className="text-emerald-800 font-medium">
                          {Array.isArray(result.correctAnswer)
                            ? result.correctAnswer.join(', ')
                            : result.correctAnswer}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* الأزرار */}
        {!isPassed && (
          <div className="flex justify-center">
            <button
              onClick={() => navigate(-1)}
              className="px-8 py-3 text-white rounded-xl transition-colors text-base font-semibold shadow-md hover:opacity-90"
              style={{ backgroundColor: BRAND.red }}
            >
              {t('results_tryAgainButton')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExamResults;
