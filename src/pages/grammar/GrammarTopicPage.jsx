// src/pages/grammar/GrammarTopicPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGrammarTopic } from '../../services/api';
import { sanitizeHtml, normalizeWordHtml } from '../../utils/sanitizeHtml';
import { BRAND } from '../../constants/brand';
import { useTranslation } from '../../contexts/LanguageContext';
import './GrammarTopicPage.css';

/** إزالة وسوم HTML للحصول على النص فقط — لاستخدامه في كشف العنوان المكرر */
function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Exercise Block Component
const ExerciseBlock = ({ block }) => {
  const t = useTranslation();
  const exerciseData = block.data || {};
  const questions = exerciseData.questions || [];
  const showResultsImmediately = exerciseData.showResultsImmediately !== false;
  const allowRetry = exerciseData.allowRetry !== false;

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (questionIndex, answer) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleSubmitQuestion = (questionIndex) => {
    setSubmitted(prev => ({ ...prev, [questionIndex]: true }));
  };

  const handleRetry = (questionIndex) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: undefined }));
    setSubmitted(prev => ({ ...prev, [questionIndex]: false }));
  };

  const handleSubmitAll = () => {
    const allSubmitted = {};
    questions.forEach((_, i) => {
      allSubmitted[i] = true;
    });
    setSubmitted(allSubmitted);
    setShowResults(true);
  };

  const handleResetAll = () => {
    setAnswers({});
    setSubmitted({});
    setShowResults(false);
  };

  const isCorrect = (questionIndex) => {
    const question = questions[questionIndex];
    const answer = answers[questionIndex];
    if (!answer) return false;

    if (question.type === 'fill_blank') {
      return answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
    }
    if (question.type === 'word_order') {
      // For word_order, answer can be array (drag mode) or string (type mode)
      const userSentence = Array.isArray(answer)
        ? answer.join(' ').toLowerCase().trim()
        : (answer || '').toLowerCase().trim();
      return userSentence === question.correctAnswer.toLowerCase().trim();
    }
    return answer === question.correctAnswer;
  };

  const getScore = () => {
    let correct = 0;
    questions.forEach((_, i) => {
      if (isCorrect(i)) correct++;
    });
    return { correct, total: questions.length };
  };

  if (questions.length === 0) return null;

  return (
    <div key={block.id} className="mb-6 grammar-exercise-block" dir="ltr">
      <div className="rounded-xl p-6 border grammar-exercise-container" style={{ backgroundColor: '#FFF9EB', borderColor: '#F5EED9' }}>
        {/* عنوان التمرين */}
        {exerciseData.title && (
          <h3 className="grammar-exercise-title text-lg font-bold text-slate-900 mb-4 text-left">
            {exerciseData.title}
          </h3>
        )}

        {/* النتيجة الإجمالية */}
        {showResults && (
          <div className="mb-6 p-4 bg-white rounded-lg border" style={{ borderColor: `${BRAND.gold}99` }}>
            <div className="flex items-center justify-between">
              <div className="text-left">
                <span className="text-base text-slate-700">{t('grammatikQuiz_result')}:</span>
                <span className="text-2xl font-bold text-slate-900 ml-2">
                  {getScore().correct} {t('exam_of')} {getScore().total}
                </span>
              </div>
              {allowRetry && (
                <button
                  onClick={handleResetAll}
                  className="px-4 py-2 rounded-lg text-base font-medium transition-colors text-black"
                  style={{ backgroundColor: BRAND.gold }}
                >
                  {t('results_tryAgainButton')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* الأسئلة */}
        <div className="space-y-6">
          {questions.map((question, qIndex) => {
            const isSubmitted = submitted[qIndex];
            const questionIsCorrect = isCorrect(qIndex);
            const currentAnswer = answers[qIndex];

            return (
              <div
                key={qIndex}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  isSubmitted
                    ? questionIsCorrect
                      ? 'bg-green-50 border-green-300'
                      : 'bg-red-50 border-red-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* رقم السؤال — أصفر ذهبي ورقم أسود */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold"
                    style={{ backgroundColor: BRAND.gold, color: BRAND.black }}
                  >
                    {qIndex + 1}
                  </span>
                  {isSubmitted && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      questionIsCorrect
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {questionIsCorrect ? `✓ ${t('exam_correct')}` : `✗ ${t('exam_incorrect')}`}
                    </span>
                  )}
                </div>

                {/* نص السؤال — خط أكبر */}
                {question.type === 'word_order' ? (
                  /* عرض السؤال مع منطقة الإجابة inline */
                  <div className="grammar-question-text text-lg font-medium text-slate-900 mb-4 text-left">
                    {question.prompt.split(/\.{3,}|_{3,}/).map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          question.inputMode === 'type' ? (
                            /* وضع الكتابة - input field */
                            <input
                              type="text"
                              value={currentAnswer || ''}
                              onChange={(e) => handleAnswer(qIndex, e.target.value)}
                              disabled={isSubmitted && !allowRetry}
                              className={`inline-block min-w-52 mx-1 px-2 py-1.5 border-b-2 bg-transparent outline-none grammar-question-input text-base ${
                                isSubmitted
                                  ? questionIsCorrect
                                    ? 'border-green-500 text-green-700'
                                    : 'border-red-500 text-red-700'
                                  : 'focus:border-slate-500'
                              }`}
                              style={!isSubmitted ? { borderColor: `${BRAND.gold}cc` } : {}}
                              placeholder={t('grammar_writeAnswer')}
                            />
                          ) : (
                            /* وضع السحب - الكلمات المختارة inline */
                            <span
                              className={`inline-flex flex-wrap gap-1 min-w-52 mx-1 px-2 py-1.5 border-b-2 align-middle ${isSubmitted ? (questionIsCorrect ? 'border-green-500' : 'border-red-500') : ''}`}
                              style={!isSubmitted ? { borderColor: `${BRAND.gold}cc` } : {}}
                            >
                              {Array.isArray(currentAnswer) && currentAnswer.length > 0 ? (
                                currentAnswer.map((word, wordIndex) => (
                                  <button
                                    key={wordIndex}
                                    onClick={() => {
                                      if (!isSubmitted || allowRetry) {
                                        const newAnswer = [...currentAnswer];
                                        newAnswer.splice(wordIndex, 1);
                                        handleAnswer(qIndex, newAnswer.length > 0 ? newAnswer : undefined);
                                      }
                                    }}
                                    disabled={isSubmitted && !allowRetry}
                                    className={`px-2 py-0.5 rounded text-sm font-medium transition-colors ${isSubmitted && !allowRetry ? 'bg-slate-200 text-slate-600 cursor-not-allowed' : 'cursor-pointer text-black'}`}
                                    style={!(isSubmitted && !allowRetry) ? { backgroundColor: BRAND.gold } : {}}
                                  >
                                    {word} ×
                                  </button>
                                ))
                              ) : (
                                <span className="text-slate-400 text-base">...</span>
                              )}
                            </span>
                          )
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="grammar-question-text text-lg font-medium text-slate-900 mb-4 text-left">
                    {question.prompt}
                  </p>
                )}

                {/* الخيارات - اختيار من متعدد */}
                {question.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    {(question.options || []).map((option, optIndex) => {
                      const isSelected = currentAnswer === option;
                      const isCorrectOption = option === question.correctAnswer;

                      return (
                        <label
                          key={optIndex}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSubmitted
                              ? isCorrectOption
                                ? 'bg-green-100 border-green-400'
                                : isSelected
                                ? 'bg-red-100 border-red-400'
                                : 'bg-slate-50 border-slate-200'
                              : isSelected
                              ? 'border-slate-400'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-50'
                          }`}
                          style={!isSubmitted && isSelected ? { backgroundColor: `${BRAND.gold}30`, borderColor: BRAND.gold } : {}}
                        >
                          <input
                            type="radio"
                            name={`q-${block.id}-${qIndex}`}
                            value={option}
                            checked={isSelected}
                            onChange={() => handleAnswer(qIndex, option)}
                            disabled={isSubmitted && !allowRetry}
                            className="w-4 h-4"
                            style={{ accentColor: BRAND.gold }}
                          />
                          <span className="text-sm text-slate-800">{option}</span>
                          {isSubmitted && isCorrectOption && (
                            <span className="ml-auto text-green-600 text-xs font-semibold">✓</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* ملء الفراغ */}
                {question.type === 'fill_blank' && (
                  <div>
                    <input
                      type="text"
                      value={currentAnswer || ''}
                      onChange={(e) => handleAnswer(qIndex, e.target.value)}
                      disabled={isSubmitted && !allowRetry}
                      className={`w-full max-w-xs px-4 py-2 border-2 rounded-lg text-sm ${
                        isSubmitted
                          ? questionIsCorrect
                            ? 'border-green-400 bg-green-50'
                            : 'border-red-400 bg-red-50'
                          : 'border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-400'
                      }`}
                      placeholder={t('grammar_writeAnswer')}
                    />
                    {isSubmitted && !questionIsCorrect && (
                      <p className="mt-2 text-sm text-green-700">
                        {t('grammar_correct')} <span className="font-semibold">{question.correctAnswer}</span>
                      </p>
                    )}
                  </div>
                )}

                {question.type === 'true_false' && (
                  <div className="flex gap-4">
                    {[
                      { value: 'true', label: t('grammar_true') },
                      { value: 'false', label: t('grammar_false') }
                    ].map((opt) => {
                      const isSelected = currentAnswer === opt.value;
                      const isCorrectOption = opt.value === question.correctAnswer;

                      return (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                            isSubmitted
                              ? isCorrectOption
                                ? 'bg-green-100 border-green-400'
                                : isSelected
                                ? 'bg-red-100 border-red-400'
                                : 'bg-slate-50 border-slate-200'
                              : isSelected
                              ? 'bg-slate-100 border-slate-400'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-50'
                          }`}
                          style={!isSubmitted && isSelected ? { backgroundColor: `${BRAND.gold}30`, borderColor: BRAND.gold } : {}}
                        >
                          <input
                            type="radio"
                            name={`tf-${block.id}-${qIndex}`}
                            value={opt.value}
                            checked={isSelected}
                            onChange={() => handleAnswer(qIndex, opt.value)}
                            disabled={isSubmitted && !allowRetry}
                            className="w-4 h-4"
                            style={{ accentColor: BRAND.gold }}
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* ترتيب الكلمات */}
                {question.type === 'word_order' && (
                  <div>
                    {/* الكلمات المتاحة */}
                    <div className="flex flex-wrap gap-2">
                      {(question.words || []).map((word, wordIndex) => {
                        const isUsed = question.inputMode !== 'type' && Array.isArray(currentAnswer) && currentAnswer.includes(word);
                        return (
                          <button
                            key={wordIndex}
                            onClick={() => {
                              if (question.inputMode !== 'type' && !isUsed && (!isSubmitted || allowRetry)) {
                                const newAnswer = Array.isArray(currentAnswer) ? [...currentAnswer, word] : [word];
                                handleAnswer(qIndex, newAnswer);
                              }
                            }}
                            disabled={(isSubmitted && !allowRetry) || isUsed || question.inputMode === 'type'}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              question.inputMode === 'type'
                                ? 'bg-blue-100 text-blue-700 cursor-default'
                                : isUsed
                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                : isSubmitted && !allowRetry
                                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer border border-blue-300'
                            }`}
                          >
                            {word}
                          </button>
                        );
                      })}
                    </div>

                    {/* الإجابة الصحيحة عند الخطأ */}
                    {isSubmitted && !questionIsCorrect && (
                      <p className="mt-3 text-sm text-green-700">
                        {t('grammar_correct')} <span className="font-semibold">{question.correctAnswer}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* الشرح */}
                {isSubmitted && question.explanation && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">💡 Erklärung: </span>
                      {question.explanation}
                    </p>
                  </div>
                )}

                {/* زر التحقق للسؤال الفردي */}
                {showResultsImmediately && !isSubmitted && currentAnswer && (
                  <button
                    onClick={() => handleSubmitQuestion(qIndex)}
                    className="mt-4 px-4 py-2 rounded-lg text-base font-medium transition-colors text-black"
                    style={{ backgroundColor: BRAND.gold }}
                  >
                    {t('exam_check')}
                  </button>
                )}

                {/* زر إعادة المحاولة للسؤال الفردي */}
                {isSubmitted && allowRetry && !showResults && (
                  <button
                    onClick={() => handleRetry(qIndex)}
className="mt-4 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
                >
                  {t('results_tryAgainButton')}
                </button>
              )}
            </div>
          );
        })}
        </div>

        {/* زر إرسال الكل */}
        {!showResultsImmediately && !showResults && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSubmitAll}
              className="px-6 py-3 rounded-lg font-semibold text-base text-black transition-colors"
              style={{ backgroundColor: BRAND.gold }}
            >
              {t('grammar_submitAnswers')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function GrammarTopicPage() {
  const { level, topicSlug } = useParams();
  const navigate = useNavigate();
  const t = useTranslation();

  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadTopic() {
      try {
        setLoading(true);
        setError('');

        // جلب محتوى الموضوع
        const topicData = await getGrammarTopic(topicSlug, level);
        // Important: topicData is already response.data from getGrammarTopic
        console.log('📚 Topic data received:', topicData);
        console.log('📚 Topic examId:', topicData?.examId);
        console.log('📚 Topic contentHtml:', topicData?.contentHtml ? 'exists' : 'missing');
        setTopic(topicData);
      } catch (err) {
        console.error(err);

        // معالجة الأخطاء حسب النوع
        if (err.response?.status === 401) {
          // 401 = Token منتهي أو غير صالح
          console.error('🔒 401 Unauthorized - Token منتهي أو غير صالح');
          setError('Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.');

          // حذف tokens القديمة
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');

          // إعادة التوجيه للـ login
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else if (err.response?.status === 403) {
          // 403 = Forbidden - ما عندك صلاحية
          console.error('🚫 403 Forbidden - ليس لديك صلاحية');
          setError('Sie haben keine Berechtigung für diesen Inhalt.');
        } else {
          setError('Fehler beim Laden des Grammatikthemas. Bitte versuchen Sie es erneut.');
        }
      } finally {
        setLoading(false);
      }
    }

    if (level && topicSlug) {
      loadTopic();
    }
  }, [level, topicSlug, navigate]);

  const displayLevel = level?.toUpperCase();

  // Check if topic has content based on contentBlocks
  const hasContent =
    Array.isArray(topic?.contentBlocks) &&
    topic.contentBlocks.length > 0 &&
    topic.contentBlocks.some(b => {
      if (!b) return false;
      if (b.type === "intro" || b.type === "paragraph") return (b.data?.text ?? "").trim().length > 0;
      if (b.type === "table") return (b.data?.headers?.length ?? 0) > 0 || (b.data?.rows?.length ?? 0) > 0;
      if (b.type === "image") return !!b.data?.url;
      if (b.type === "youtube") return !!b.data?.videoId;
      if (b.type === "exercise") return (b.data?.questions?.length ?? 0) > 0;
      return false;
    });

  // Empty State Component
  const EmptyState = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 mb-4">
      <p className="text-slate-500 text-sm text-center">Kein Inhalt für dieses Thema verfügbar.</p>
    </div>
  );

  // Render content block based on type
  const renderContentBlock = (block) => {
    if (!block) return null;

    switch (block.type) {
      case "intro":
      case "paragraph": // للتوافق مع البيانات القديمة
        const text = block.data?.text || "";
        if (!text.trim()) return null;
        const bgColor = block.data?.bgColor || '#fefce8';
        const borderColor = block.data?.bgColor ? `${block.data.bgColor}cc` : '#fde68a';
        return (
          <div key={block.id} className="mb-6 rounded-xl p-3 sm:p-4" dir="ltr"
               style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
            <div className="leading-relaxed text-slate-900 text-left rich-text-content grammar-topic-content"
                 dangerouslySetInnerHTML={{ __html: sanitizeHtml(normalizeWordHtml(text)) }} />
          </div>
        );

      case "table":
        const headers = block.data?.headers || [];
        const rows = block.data?.rows || [];
        const title = block.data?.title;

        if (headers.length === 0 && rows.length === 0) return null;

        return (
          <div key={block.id} className="mb-6" dir="ltr">
            {title && (
              <h3 className="text-lg font-semibold text-slate-900 mb-3 text-left">{title}</h3>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300">
                {headers.length > 0 && (
                  <thead>
                    <tr>
                      {headers.map((header, i) => (
                        <th
                          key={i}
                          className="border border-slate-300 bg-slate-100 px-4 py-2 text-center font-semibold text-slate-900"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                {rows.length > 0 && (
                  <tbody>
                    {rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (
                          <td
                            key={c}
                            className="border border-slate-300 px-4 py-2 text-center text-slate-700"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          </div>
        );

      case "image":
        const imageUrl = block.data?.url;
        if (!imageUrl) return null;

        return (
          <div key={block.id} className="mb-6" dir="ltr">
            <div className="flex justify-center">
              <img
                src={imageUrl}
                alt={block.data?.alt || ""}
                className="max-w-full h-auto rounded-lg"
              />
            </div>
            {block.data?.caption && (
              <p className="text-sm text-slate-600 text-left mt-2">
                {block.data.caption}
              </p>
            )}
          </div>
        );

      case "youtube":
        const videoId = block.data?.videoId;
        if (!videoId) return null;

        return (
          <div key={block.id} className="mb-6" dir="ltr">
            <div className="aspect-video w-full">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}`}
                title={block.data?.title || "YouTube video"}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg"
              />
            </div>
            {block.data?.title && (
              <p className="text-sm text-slate-600 text-left mt-2">
                {block.data.title}
              </p>
            )}
          </div>
        );

      case "exercise":
        if (!block.data?.questions || block.data.questions.length === 0) return null;
        return <ExerciseBlock key={block.id} block={block} />;

      default:
        return null;
    }
  };

  // تخطي أول بلوك إذا كان عنواناً مكرراً (نفس عنوان الموضوع)
  const contentBlocksToRender = Array.isArray(topic?.contentBlocks) && topic.contentBlocks.length > 0
    ? topic.contentBlocks.filter((block, index) => {
        if (index !== 0) return true;
        if (block?.type !== 'intro' && block?.type !== 'paragraph') return true;
        const text = block?.data?.text ?? '';
        const plain = stripHtml(text);
        return plain !== (topic?.title ?? '').trim();
      })
    : [];

  return (
    <div className="grammar-topic-page">
      <div className="grammar-topic-inner max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        {/* الشريط العلوي — رجوع فقط على اليسار */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/grammatik')}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            ← {t('grammar_backToTopics')}
          </button>
        </div>

        {/* الهيدر — خط أكبر مثل صفحة الامتحانات؛ dir="ltr" لظهور النص الألماني من اليسار في النسخة العربية */}
        {!loading && topic && (
          <div className="mb-8 text-left grammar-topic-header" dir="ltr">
            <h1 className="grammar-topic-title text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
              {topic.title}{" "}
              <span style={{ color: BRAND.red }}>– {displayLevel}</span>
            </h1>
            <p className="grammar-topic-desc text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              {topic.shortDescription || topic.description || ""}
            </p>
          </div>
        )}

        {loading && (
          <div className="py-10 text-center text-slate-500 dark:text-slate-400 text-base">
            {t('grammar_loadingContent')}
          </div>
        )}

        {/* حالة الخطأ — نفس أسلوب Prüfungen */}
        {error && !loading && (
          <div className="rounded-xl py-4 px-4 border-2 mb-6" style={{ color: BRAND.red, backgroundColor: `${BRAND.red}12`, borderColor: BRAND.red }}>
            <p className="font-medium text-center">{error}</p>
          </div>
        )}

        {/* محتوى القاعدة */}
        {!loading && !error && topic && (
          <>
            {!hasContent && !topic.contentHtml && <EmptyState />}

            {/* Content Blocks — بدون العنوان المكرر */}
            {hasContent && contentBlocksToRender.length > 0 && (
              <div className="grammar-topic-page-content bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-lg p-6 md:p-8 mb-6">
                {contentBlocksToRender.map(renderContentBlock)}
              </div>
            )}

            {/* Legacy HTML Content (fallback) — إخفاء أول عنوان إذا كان مكرراً عبر CSS */}
            {!hasContent && topic.contentHtml && (
              <div className="grammar-topic-page-content bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-lg p-6 md:p-8 mb-6 grammar-topic-legacy-html">
                <div
                  className="prose prose-slate max-w-none grammar-topic-content"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(normalizeWordHtml(topic.contentHtml)) }}
                />
              </div>
            )}

            {/* زر ابدأ التمرين */}
            <div className="flex justify-center">
              <button
                onClick={() => navigate(`/grammatik/${level}/${topicSlug}/exercise`)}
                className="px-6 py-3 text-white text-base font-semibold rounded-xl shadow-md transition-colors hover:opacity-95"
                style={{ background: BRAND.red }}
              >
                → {t('grammar_startExercise')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
