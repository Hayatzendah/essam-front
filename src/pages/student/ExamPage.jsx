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
      <div className="exam-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>جاري تحميل الامتحان...</p>
        </div>
      </div>
    );
  }

  if (!attempt || !attempt.items || attempt.items.length === 0) {
    return (
      <div className="exam-page">
        <div className="error-container">
          <p>❌ لا توجد أسئلة في هذا الامتحان</p>
          <button onClick={() => navigate('/student/liden')} className="back-btn">
            العودة
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
    <div className="exam-page">
      <div className="exam-header">
        <div className="exam-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
          <p className="progress-text">
            السؤال {currentQuestionIndex + 1} من {totalQuestions}
          </p>
        </div>
        <div className="exam-actions">
          <button onClick={() => navigate('/student/liden')} className="back-btn">
            ← العودة
          </button>
          <button 
            onClick={handleSubmit} 
            className="submit-btn" 
            disabled={submitting || isSubmitted}
          >
            {submitting ? 'جاري التسليم...' : isSubmitted ? 'تم التسليم' : 'تسليم الامتحان'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {isSubmitted && (
        <div className="info-banner" style={{ 
          background: '#fef3c7', 
          color: '#92400e', 
          padding: '15px', 
          borderRadius: '10px', 
          margin: '20px 0',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          ⚠️ تم تسليم هذا الامتحان. لا يمكنك تعديل الإجابات. 
          <button 
            onClick={() => navigate(`/student/attempt/${attemptId}/results`)}
            style={{
              marginLeft: '15px',
              padding: '8px 15px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            عرض النتائج
          </button>
        </div>
      )}

      <div className="exam-content">
        <div className="question-card">
          <div className="question-header">
            <span className="question-number">السؤال {currentQuestionIndex + 1}</span>
            {currentQuestion.points && (
              <span className="question-points">{currentQuestion.points} نقطة</span>
            )}
          </div>

          <div className="question-body">
            <p className="question-text">{currentQuestion.prompt}</p>

            {/* Media (Audio/Image/Video) */}
            {currentQuestion.mediaUrl && (
              <div className="question-media">
                {currentQuestion.mediaType === 'audio' && (
                  <audio controls src={currentQuestion.mediaUrl} className="media-player">
                    المتصفح لا يدعم تشغيل الملفات الصوتية
                  </audio>
                )}
                {currentQuestion.mediaType === 'image' && (
                  <img src={currentQuestion.mediaUrl} alt="Question" className="media-image" />
                )}
                {currentQuestion.mediaType === 'video' && (
                  <video controls src={currentQuestion.mediaUrl} className="media-player">
                    المتصفح لا يدعم تشغيل الفيديو
                  </video>
                )}
              </div>
            )}

            {/* Answer Options */}
            <div className="answer-options">
              {currentQuestion.qType === 'mcq' && currentQuestion.options && (
                <div className="mcq-options">
                  {currentQuestion.options.map((option, index) => {
                    const currentAnswer = answers[currentQuestionIndex];
                    const selectedIndexes = currentAnswer?.studentAnswerIndexes || [];
                    const isSelected = Array.isArray(selectedIndexes) && selectedIndexes.includes(index);
                    
                    return (
                      <label key={index} className={`option-label ${isSelected ? 'selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isSubmitted}
                          onChange={(e) => {
                            const currentAnswers = currentAnswer?.studentAnswerIndexes || [];
                            let newAnswers;
                            if (e.target.checked) {
                              // إضافة الخيار المحدد
                              newAnswers = [...currentAnswers, index];
                            } else {
                              // إزالة الخيار غير المحدد
                              newAnswers = currentAnswers.filter((i) => i !== index);
                            }
                            
                            console.log('🔘 Checkbox changed:', {
                              index,
                              checked: e.target.checked,
                              currentAnswers,
                              newAnswers,
                            });
                            
                            handleAnswerChange(currentQuestionIndex, newAnswers, 'mcq');
                            saveAnswer(currentQuestionIndex, currentQuestion.questionId, newAnswers);
                          }}
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {currentQuestion.qType === 'true_false' && (
                <div className="true-false-options">
                  <label className={`option-label ${answers[currentQuestionIndex]?.studentAnswerBoolean === true ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name={`question-${currentQuestionIndex}`}
                      checked={answers[currentQuestionIndex]?.studentAnswerBoolean === true}
                      disabled={isSubmitted}
                      onChange={() => {
                        handleAnswerChange(currentQuestionIndex, true, 'true_false');
                        saveAnswer(currentQuestionIndex, currentQuestion.questionId, true);
                      }}
                    />
                    <span>صحيح</span>
                  </label>
                  <label className={`option-label ${answers[currentQuestionIndex]?.studentAnswerBoolean === false ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name={`question-${currentQuestionIndex}`}
                      checked={answers[currentQuestionIndex]?.studentAnswerBoolean === false}
                      disabled={isSubmitted}
                      onChange={() => {
                        handleAnswerChange(currentQuestionIndex, false, 'true_false');
                        saveAnswer(currentQuestionIndex, currentQuestion.questionId, false);
                      }}
                    />
                    <span>خطأ</span>
                  </label>
                </div>
              )}

              {currentQuestion.qType === 'fill' && (
                <div className="fill-answer">
                  <textarea
                    value={answers[currentQuestionIndex]?.studentAnswerText || ''}
                    disabled={isSubmitted}
                    onChange={(e) => {
                      handleAnswerChange(currentQuestionIndex, e.target.value, 'fill');
                      // حفظ تلقائي بعد 1 ثانية من التوقف عن الكتابة
                      clearTimeout(window.saveTimeout);
                      window.saveTimeout = setTimeout(() => {
                        saveAnswer(currentQuestionIndex, currentQuestion.questionId, e.target.value);
                      }, 1000);
                    }}
                    placeholder="اكتب إجابتك هنا..."
                    className="fill-input"
                    rows={4}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="question-navigation">
          <button
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="nav-btn prev-btn"
          >
            ← السابق
          </button>

          <div className="question-dots">
            {attempt.items.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`question-dot ${
                  index === currentQuestionIndex ? 'active' : ''
                } ${answers[index] ? 'answered' : ''}`}
                title={`السؤال ${index + 1}`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
            disabled={currentQuestionIndex === totalQuestions - 1}
            className="nav-btn next-btn"
          >
            التالي →
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExamPage;


