import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { examsAPI } from '../../services/examsAPI';
import './ExamResults.css';

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
      console.log('📊 Attempt items:', attemptData.items);
      console.log('📊 Attempt finalScore:', attemptData.finalScore);
      console.log('📊 Attempt totalMaxScore:', attemptData.totalMaxScore);
      console.log('📊 Attempt totalAutoScore:', attemptData.totalAutoScore);
      
      if (!attemptData) {
        throw new Error('لم يتم إرجاع بيانات المحاولة');
      }
      
      // معالجة items - قد تكون structure مختلف
      if (attemptData.items && attemptData.items.length > 0) {
        console.log('📋 First item structure:', JSON.stringify(attemptData.items[0], null, 2));
      }
      
      setAttempt(attemptData);
    } catch (err) {
      console.error('❌ Error loading attempt results:', err);
      console.error('   Error response:', err.response?.data);
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
      <div className="results-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>جاري تحميل النتائج...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-page">
        <div className="error-container">
          <p>❌ {error}</p>
          <button onClick={() => navigate('/student/liden')} className="back-btn">
            العودة
          </button>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="results-page">
        <div className="error-container">
          <p>❌ لا توجد بيانات للنتائج</p>
          <button onClick={() => navigate('/student/liden')} className="back-btn">
            العودة
          </button>
        </div>
      </div>
    );
  }

  // حساب الإحصائيات
  // ملاحظة: الـ API يرجع finalScore و totalMaxScore (وليس score و totalPoints)
  
  // قراءة القيم من الـ response الصحيح
  const totalMaxScore = attempt.totalMaxScore ?? 0;
  const finalScore = attempt.finalScore ?? attempt.totalAutoScore ?? 0;
  
  // حساب الإجابات الصحيحة والخاطئة
  // إذا كان items موجود، نستخدمه للحساب الدقيق
  // وإلا نستخدم totalMaxScore و finalScore (نفترض أن كل سؤال = 1 نقطة)
  let totalQuestions = 0;
  let correctCount = 0;
  let wrongCount = 0;
  
  if (attempt.items && Array.isArray(attempt.items) && attempt.items.length > 0) {
    // حساب من items (دقيق)
    totalQuestions = attempt.items.length;
    correctCount = attempt.items.filter(item => 
      item.isCorrect === true || item.isCorrect === 'true' || item.correct === true
    ).length;
    wrongCount = totalQuestions - correctCount;
  } else {
    // حساب من totalMaxScore و finalScore (تقريبي - نفترض أن كل سؤال = 1 نقطة)
    // إذا كانت النقاط مختلفة، قد لا يكون دقيقاً 100%
    totalQuestions = totalMaxScore;
    correctCount = finalScore; // نفترض أن كل نقطة = إجابة صحيحة
    wrongCount = totalMaxScore - finalScore;
  }
  
  const percentage = totalMaxScore > 0 ? Math.round((finalScore / totalMaxScore) * 100) : 0;
  const isPassed = percentage >= 50; // يمكن تعديل النسبة حسب متطلبات الامتحان
  
  console.log('📊 Calculated values:', {
    finalScore,
    totalMaxScore,
    percentage,
    isPassed,
    correctCount,
    wrongCount,
    totalQuestions,
    hasItems: !!attempt.items,
    itemsLength: attempt.items?.length || 0
  });

  return (
    <div className="results-page">
      <div className="results-container">
        {/* Header */}
        <div className="results-header">
          <h1>نتيجة الامتحان</h1>
          {attempt.exam?.title && (
            <p className="exam-title">{attempt.exam.title}</p>
          )}
        </div>

        {/* Summary Card */}
        <div className={`summary-card ${isPassed ? 'passed' : 'failed'}`}>
          <div className="summary-icon">
            {isPassed ? '✅' : '❌'}
          </div>
          <div className="summary-content">
            <h2>{isPassed ? 'نجحت في الامتحان!' : 'لم تنجح في الامتحان'}</h2>
            <div className="score-display">
              <div className="score-circle">
                <span className="score-value">{percentage}%</span>
                <span className="score-label">النسبة المئوية</span>
              </div>
              <div className="score-details">
                <div className="score-item">
                  <span className="score-label">الدرجة:</span>
                  <span className="score-value">{finalScore} / {totalMaxScore}</span>
                </div>
                <div className="score-item">
                  <span className="score-label">الإجابات الصحيحة:</span>
                  <span className="score-value correct">{correctCount}</span>
                </div>
                <div className="score-item">
                  <span className="score-label">الإجابات الخاطئة:</span>
                  <span className="score-value wrong">{wrongCount}</span>
                </div>
                <div className="score-item">
                  <span className="score-label">إجمالي الأسئلة:</span>
                  <span className="score-value">{totalQuestions}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submitted At */}
        {attempt.submittedAt && (
          <div className="submitted-info">
            <p>تم التسليم في: {new Date(attempt.submittedAt).toLocaleString('ar-SA')}</p>
          </div>
        )}

        {/* Questions Review */}
        {attempt.items && attempt.items.length > 0 && (
          <div className="questions-review">
            <h3>مراجعة الأسئلة</h3>
            <div className="questions-list">
              {attempt.items.map((item, index) => {
                // معالجة structure مختلف - قد يكون item.question أو item مباشرة
                const question = item.question || item;
                const qType = question.qType || question.type || item.qType || item.type;
                const prompt = question.prompt || question.text || item.prompt || 'السؤال';
                const options = question.options || item.options || [];
                
                // حساب isCorrect - قد يكون في item.isCorrect أو item.correct
                const isCorrect = item.isCorrect === true || item.correct === true || item.isCorrect === 'true';
                const points = item.points || 0;
                const maxPoints = item.maxPoints || question.points || 1;
                
                // معالجة studentAnswer و correctAnswer
                const studentAnswer = item.studentAnswer || {};
                const correctAnswer = item.correctAnswer || {};
                
                console.log(`📝 Question ${index + 1}:`, {
                  isCorrect,
                  points,
                  maxPoints,
                  qType,
                  studentAnswer,
                  correctAnswer,
                  options: options.length
                });
                
                return (
                  <div key={index} className={`question-review-card ${isCorrect ? 'correct' : 'wrong'}`}>
                    <div className="question-review-header">
                      <span className="question-number">السؤال {index + 1}</span>
                      <span className={`question-status ${isCorrect ? 'correct' : 'wrong'}`}>
                        {isCorrect ? '✅ صحيح' : '❌ خاطئ'}
                      </span>
                      <span className="question-points">
                        {points} / {maxPoints} نقطة
                      </span>
                    </div>
                    
                    <div className="question-review-body">
                      <p className="question-text">{prompt}</p>
                      
                      {/* Options for MCQ */}
                      {options && options.length > 0 && (
                        <div className="question-options">
                          {options.map((option, optIndex) => {
                            // معالجة الإجابة المختارة - قد تكون في studentAnswerIndexes أو studentAnswer
                            const studentIndexes = studentAnswer.studentAnswerIndexes || 
                                                  studentAnswer.answerIndexes || 
                                                  (Array.isArray(studentAnswer) ? studentAnswer : []);
                            const isSelected = Array.isArray(studentIndexes) && studentIndexes.includes(optIndex);
                            
                            // معالجة الإجابة الصحيحة - قد تكون في answerKeyIndexes أو answerKey
                            const correctIndexes = correctAnswer.answerKeyIndexes || 
                                                  correctAnswer.answerIndexes ||
                                                  correctAnswer.correctIndexes ||
                                                  (Array.isArray(correctAnswer) ? correctAnswer : []);
                            const isCorrectAnswer = Array.isArray(correctIndexes) && correctIndexes.includes(optIndex);
                            
                            // إذا كان option كائن (مثل { text: "...", id: "..." })
                            const optionText = typeof option === 'string' ? option : (option.text || option.label || option);
                            
                            return (
                              <div
                                key={optIndex}
                                className={`option-review ${
                                  isSelected && isCorrectAnswer ? 'correct-selected' :
                                  isSelected && !isCorrectAnswer ? 'wrong-selected' :
                                  isCorrectAnswer && !isSelected ? 'correct-not-selected' :
                                  ''
                                }`}
                              >
                                <span className="option-text">{optionText}</span>
                                {isSelected && <span className="option-label">إجابتك</span>}
                                {isCorrectAnswer && !isSelected && <span className="option-label correct">الإجابة الصحيحة</span>}
                                {isSelected && isCorrectAnswer && <span className="option-label correct">إجابتك الصحيحة</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* True/False */}
                      {(qType === 'true_false' || qType === 'true/false') && (
                        <div className="answer-review">
                          <div className="answer-item">
                            <span className="answer-label">إجابتك:</span>
                            <span className="answer-value">
                              {studentAnswer.studentAnswerBoolean === true || studentAnswer.answerBoolean === true ? 'صحيح' : 'خطأ'}
                            </span>
                          </div>
                          <div className="answer-item">
                            <span className="answer-label">الإجابة الصحيحة:</span>
                            <span className="answer-value correct">
                              {correctAnswer.answerKeyBoolean === true || correctAnswer.answerBoolean === true ? 'صحيح' : 'خطأ'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Fill */}
                      {(qType === 'fill' || qType === 'fill-in') && (
                        <div className="answer-review">
                          <div className="answer-item">
                            <span className="answer-label">إجابتك:</span>
                            <span className="answer-value">{studentAnswer.studentAnswerText || studentAnswer.answerText || '(لم يتم الإجابة)'}</span>
                          </div>
                          <div className="answer-item">
                            <span className="answer-label">الإجابة الصحيحة:</span>
                            <span className="answer-value correct">{correctAnswer.answerKeyText || correctAnswer.answerText || '-'}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Match */}
                      {qType === 'match' && (
                        <div className="answer-review">
                          <div className="answer-item">
                            <span className="answer-label">إجابتك:</span>
                            <span className="answer-value">
                              {JSON.stringify(studentAnswer.studentAnswerMatch || studentAnswer.answerMatch || {})}
                            </span>
                          </div>
                          <div className="answer-item">
                            <span className="answer-label">الإجابة الصحيحة:</span>
                            <span className="answer-value correct">
                              {JSON.stringify(correctAnswer.answerKeyMatch || correctAnswer.answerMatch || {})}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Reorder */}
                      {qType === 'reorder' && (
                        <div className="answer-review">
                          <div className="answer-item">
                            <span className="answer-label">إجابتك:</span>
                            <span className="answer-value">
                              {Array.isArray(studentAnswer.studentAnswerReorder) 
                                ? studentAnswer.studentAnswerReorder.join(', ') 
                                : JSON.stringify(studentAnswer.studentAnswerReorder || {})}
                            </span>
                          </div>
                          <div className="answer-item">
                            <span className="answer-label">الإجابة الصحيحة:</span>
                            <span className="answer-value correct">
                              {Array.isArray(correctAnswer.answerKeyReorder) 
                                ? correctAnswer.answerKeyReorder.join(', ') 
                                : JSON.stringify(correctAnswer.answerKeyReorder || {})}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="results-actions">
          <button onClick={() => navigate('/student/liden')} className="back-btn">
            العودة إلى الامتحانات
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExamResults;

