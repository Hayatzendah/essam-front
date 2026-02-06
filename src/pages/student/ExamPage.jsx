import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { examsAPI } from '../../services/examsAPI';
import { authAPI } from '../../services/api';
import './ExamPage.css';

// ✅ دالة لـ shuffle array (ترتيب عشوائي)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ✅ Component منفصل لـ Reorder Task
function ReorderTask({ parts, prompt, itemIndex, answers, setAnswers, saveAnswer, isSubmitted, questionId }) {
  // ✅ استخدام state محلي للترتيب (مع shuffle عند التحميل)
  const [reorderParts, setReorderParts] = useState(() => {
    // قراءة الترتيب المحفوظ أو shuffle
    const savedOrder = answers[itemIndex]?.reorderAnswer;
    if (savedOrder && Array.isArray(savedOrder) && savedOrder.length === parts.length) {
      // استخدام الترتيب المحفوظ
      return savedOrder.map(id => parts.find(p => p.id === id)).filter(Boolean);
    }
    // shuffle عند التحميل الأول
    return shuffleArray([...parts]);
  });
  
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // ✅ تحديث reorderParts عند تحميل الإجابات المحفوظة
  useEffect(() => {
    if (!isInitialized) {
      const savedOrder = answers[itemIndex]?.reorderAnswer;
      if (savedOrder && Array.isArray(savedOrder) && savedOrder.length === parts.length) {
        const orderedParts = savedOrder.map(id => parts.find(p => p.id === id)).filter(Boolean);
        if (orderedParts.length === parts.length) {
          setReorderParts(orderedParts);
        }
      }
      setIsInitialized(true);
    }
  }, [answers, itemIndex, parts, isInitialized]);
  
  // ✅ Drag handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedIndex(null);
  };
  
  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    const newParts = [...reorderParts];
    const draggedPart = newParts[draggedIndex];
    newParts.splice(draggedIndex, 1);
    newParts.splice(dropIndex, 0, draggedPart);
    
    setReorderParts(newParts);
    
    // ✅ حفظ الترتيب كـ array من IDs
    const reorderAnswer = newParts.map(p => p.id);
    const newAnswers = { ...answers };
    newAnswers[itemIndex] = { reorderAnswer };
    setAnswers(newAnswers);
    saveAnswer(itemIndex, questionId, { reorderAnswer });
  };
  
  return (
    <div className="mb-4">
      {/* عرض prompt أولاً */}
      {prompt && (
        <h3 className="text-lg font-semibold text-slate-900 mb-3 mt-2" dir="ltr">
          {prompt}
        </h3>
      )}
      
      {/* عرض Reorder list */}
      <div className="space-y-2">
        <p className="text-sm text-slate-600 mb-3">
          اسحب وأعد ترتيب الأجزاء بالترتيب الصحيح:
        </p>
        {reorderParts.map((part, index) => (
          <div
            key={part.id}
            draggable={!isSubmitted}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, index)}
            className={`p-3 rounded-lg border-2 cursor-move transition-all ${
              draggedIndex === index
                ? 'border-blue-400 bg-blue-50 opacity-50'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
            } ${isSubmitted ? 'cursor-default' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
                {index + 1}
              </div>
              <div className="flex-1 text-base text-slate-900">
                {part.text}
              </div>
              {!isSubmitted && (
                <div className="flex-shrink-0 text-slate-400">
                  ⋮⋮
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ✅ API Base URL للـ media URLs
// استخدام VITE_API_BASE_URL (أو VITE_API_URL كـ fallback)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://api.deutsch-tests.com';

// ✅ دالة لتحويل URL النسبي إلى full URL
const toApiUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // ✅ الحفاظ على الحالة الأصلية للـ path (لا نغير الحروف)
  // الباك قد يحفظ الملف بحرف صغير أو كبير، يجب استخدام نفس الحالة
  return `${API_BASE_URL}${path}`;
};

// ✅ دالة لبناء URL من key
// الـ key يكون مثل: "images/ولايات/Rheinland-Pfalz1سؤال صورة.jpeg"
// نستخدم الـ key مباشرة - المتصفح هيعمل encoding تلقائياً عند إرسال الطلب
// لكن نعمل encoding يدوي علشان نتأكد إن الـ URL صحيح في الـ img src
const buildImageUrlFromKey = (key) => {
  if (!key) return '';
  // ✅ تقسيم الـ key على / وعمل encoding على كل جزء
  // ده يضمن إن الأحرف العربية والألمانية تتحول لـ URL encoding صحيح
  // لكن نحافظ على الـ / في المسار
  const segments = key.split('/');
  const encodedSegments = segments.map(segment => encodeURIComponent(segment));
  const encodedPath = encodedSegments.join('/');
  return `${API_BASE_URL}/uploads/${encodedPath}`;
};

// ✅ دالة لإصلاح mime type لملفات .opus
const getCorrectMimeType = (url, mime) => {
  if (!url) return mime || 'audio/mpeg';
  
  // إذا كان الملف .opus، نستخدم audio/ogg أو audio/opus
  if (url.toLowerCase().endsWith('.opus')) {
    return 'audio/ogg'; // المتصفحات تدعم audio/ogg لملفات .opus
  }
  
  // إذا كان mime موجود وصحيح، نستخدمه
  if (mime && mime !== 'audio/mpeg' && !url.toLowerCase().endsWith('.opus')) {
    return mime;
  }
  
  // تحديد mime type بناءً على extension
  const ext = url.toLowerCase().split('.').pop();
  const mimeMap = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'opus': 'audio/ogg',
    'm4a': 'audio/mp4',
    'aac': 'audio/aac'
  };
  
  return mimeMap[ext] || mime || 'audio/mpeg';
};

// Component لتسجيل الصوت
function SpeakingAnswerComponent({ itemIndex, item, answer, isSubmitted, onAnswerChange, minDuration, maxDuration }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(answer || null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          // التحقق من الحد الأقصى
          if (maxDuration && newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording, maxDuration]);

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const localUrl = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(localUrl);
        stream.getTracks().forEach(track => track.stop());
        
        // رفع الملف للباك
        try {
          setUploading(true);
          setError('');
          const response = await examsAPI.uploadAudio(blob);
          // response.audioUrl أو response.url حسب ما يرجع الباك
          const uploadedUrl = response.audioUrl || response.url || response.data?.audioUrl || response.data?.url;
          if (uploadedUrl) {
            // تحديث audioUrl بالـ URL من الباك
            setAudioUrl(uploadedUrl);
            // إرسال URL للـ parent component
            onAnswerChange(uploadedUrl);
          } else {
            throw new Error('لم يتم إرجاع URL من الباك');
          }
        } catch (err) {
          console.error('Error uploading audio:', err);
          setError('حدث خطأ أثناء رفع الملف الصوتي. يرجى المحاولة مرة أخرى.');
          // إزالة التسجيل المحلي في حالة فشل الرفع
          URL.revokeObjectURL(localUrl);
          setAudioUrl(null);
          setAudioBlob(null);
        } finally {
          setUploading(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('لا يمكن الوصول إلى الميكروفون. يرجى التحقق من الصلاحيات.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      
      // التحقق من الحد الأدنى
      if (minDuration && recordingTime < minDuration) {
        setError(`يجب أن تكون مدة التسجيل على الأقل ${minDuration} ثانية`);
        setAudioUrl(null);
        setAudioBlob(null);
      }
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingTime(0);
    onAnswerChange(null);
    setError('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
          {error}
        </div>
      )}

      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-xs text-blue-700">جاري رفع الملف الصوتي...</p>
        </div>
      )}

      {audioUrl && !isRecording && !uploading && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">🎤 التسجيل المحفوظ</span>
            {!isSubmitted && (
              <button
                onClick={deleteRecording}
                className="text-xs text-red-600 hover:text-red-700"
              >
                حذف
              </button>
            )}
          </div>
          <audio src={audioUrl} controls className="w-full" />
        </div>
      )}

      {!audioUrl && !isRecording && !uploading && (
        <div className="text-center py-4">
          <p className="text-sm text-slate-600 mb-3">لم يتم تسجيل إجابة صوتية بعد</p>
          {!isSubmitted && (
            <button
              onClick={startRecording}
              disabled={uploading}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🎤 بدء التسجيل
            </button>
          )}
        </div>
      )}

      {isRecording && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-red-700">جاري التسجيل...</span>
          </div>
          <div className="text-2xl font-bold text-red-600 mb-3">
            {formatTime(recordingTime)}
            {maxDuration && ` / ${formatTime(maxDuration)}`}
          </div>
          <button
            onClick={stopRecording}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
          >
            ⏹ إيقاف التسجيل
          </button>
        </div>
      )}

      {(minDuration || maxDuration) && (
        <div className="text-xs text-slate-500">
          {minDuration && <span>الحد الأدنى: {minDuration} ثانية</span>}
          {minDuration && maxDuration && <span> • </span>}
          {maxDuration && <span>الحد الأقصى: {maxDuration} ثانية</span>}
        </div>
      )}
    </div>
  );
}

function ExamPage() {
  const navigate = useNavigate();
  const { attemptId } = useParams();
  const [searchParams] = useSearchParams();
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

  // ✅ التأكد من أن attempt.items دائماً فريدة (حماية إضافية)
  useEffect(() => {
    if (attempt && attempt.items && attempt.items.length > 0) {
      const seenQuestions = new Set();
      const uniqueItems = attempt.items.filter((item, idx) => {
        const questionId = item.questionId || item.id || item._id || item.question?.id || item.question?._id || item.questionSnapshot?.id || item.questionSnapshot?._id;
        const uniqueId = questionId ? `q-${questionId}` : `idx-${idx}`;
        
        if (seenQuestions.has(uniqueId)) {
          console.warn(`⚠️ Duplicate question detected in attempt.items at index ${idx}:`, {
            questionId,
            uniqueId,
            prompt: item.prompt || item.text,
          });
          return false;
        }
        
        seenQuestions.add(uniqueId);
        return true;
      });
      
      // ✅ إذا كان هناك تكرارات، نحدث attempt.items
      if (uniqueItems.length !== attempt.items.length) {
        console.log(`✅ Removing ${attempt.items.length - uniqueItems.length} duplicate questions from attempt.items`);
        setAttempt({ ...attempt, items: uniqueItems });
      }
    }
  }, [attempt]);

  const loadAttempt = async () => {
    try {
      setLoading(true);
      // ✅ استخراج examId من query string
      const examId = searchParams.get('examId');
      
      // ✅ إرسال examId في query string عند جلب المحاولة للتحقق من أن المحاولة تنتمي للامتحان
      const attemptData = await examsAPI.getAttempt(attemptId, examId);
      
      console.log('📥 Loading attempt with:', { attemptId, examId });
      
      // ✅ تحقق أمني: التأكد من أن المحاولة تنتمي للامتحان المحدد (إذا كان examId موجود)
      if (examId && attemptData.examId && attemptData.examId !== examId) {
        console.error('❌ Security: Attempt examId mismatch!', {
          expectedExamId: examId,
          actualExamId: attemptData.examId,
          attemptId
        });
        setError('⚠️ خطأ أمني: المحاولة لا تنتمي للامتحان المحدد. يرجى المحاولة مرة أخرى.');
        setLoading(false);
        return;
      }
      
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

      // استخراج بيانات الأسئلة من questionSnapshot
      console.log('🔍 Raw items from API:', items);
      console.log('🔍 First item structure:', JSON.stringify(items[0], null, 2));
      
      // ✅ Debug شامل: التحقق من جميع الحقول في items (خاصة لأسئلة match)
      items.forEach((item, idx) => {
        const qType = item.qType || item.type || item.questionSnapshot?.qType || item.question?.qType;
        
        if (qType === 'match') {
          console.log(`🔍 MATCH QUESTION ${idx} - FULL INSPECTION:`, {
            'item keys': Object.keys(item),
            'item.answerKeyMatch': item.answerKeyMatch,
            'item.questionSnapshot': item.questionSnapshot,
            'item.questionSnapshot keys': item.questionSnapshot ? Object.keys(item.questionSnapshot) : null,
            'item.questionSnapshot.answerKeyMatch': item.questionSnapshot?.answerKeyMatch,
            'item.question': item.question,
            'item.question keys': item.question ? Object.keys(item.question) : null,
            'item.question.answerKeyMatch': item.question?.answerKeyMatch,
            'item.promptSnapshot': item.promptSnapshot,
            'item.promptSnapshot keys': item.promptSnapshot ? Object.keys(item.promptSnapshot) : null,
            'item.promptSnapshot.answerKeyMatch': item.promptSnapshot?.answerKeyMatch,
            'FULL item JSON': JSON.stringify(item, null, 2)
          });
        }
        
        if (item.mediaSnapshot) {
          console.log(`🎵 Item ${idx} has mediaSnapshot:`, item.mediaSnapshot);
        }
        if (item.listeningClip) {
          console.log(`🎧 Item ${idx} has listeningClip:`, item.listeningClip);
        }
        if (item.listeningClipId) {
          console.log(`🎧 Item ${idx} has listeningClipId:`, item.listeningClipId);
        }
      });

      const formattedItems = items.map((item, idx) => {
        console.log(`📝 Item ${idx}:`, {
          hasQuestionSnapshot: !!item.questionSnapshot,
          hasQuestion: !!item.question,
          questionSnapshot: item.questionSnapshot,
          question: item.question,
          rawItem: item,
          sectionId: item.sectionId,
          section: item.section
        });

        // إذا كان في questionSnapshot، استخرج البيانات منه
        if (item.questionSnapshot) {
          const formatted = {
            ...item,
            prompt: item.questionSnapshot.text || item.questionSnapshot.prompt,
            text: item.questionSnapshot.text || item.questionSnapshot.prompt,
            qType: item.questionSnapshot.qType,
            type: item.questionSnapshot.qType,
            options: item.questionSnapshot.options || [],
            question: item.questionSnapshot,
            // ✅ إضافة answerKeyMatch من questionSnapshot (مهم لأسئلة match)
            // فحص جميع الأماكن المحتملة
            answerKeyMatch: item.questionSnapshot.answerKeyMatch || 
                           item.answerKeyMatch || 
                           item.promptSnapshot?.answerKeyMatch,
            // ✅ إضافة promptSnapshot أيضاً (قد يحتوي على answerKeyMatch)
            promptSnapshot: item.promptSnapshot || item.questionSnapshot,
            // ✅ إضافة media من questionSnapshot (مهم للصور)
            // الاحتفاظ بـ listeningClip و listeningClipId من item الأصلي أو من questionSnapshot
            listeningClip: item.listeningClip || item.questionSnapshot.listeningClip,
            listeningClipId: item.listeningClipId || item.questionSnapshot.listeningClipId,
            // الاحتفاظ بمعلومات Section
            sectionId: item.sectionId,
            section: item.section,
          };
          console.log(`✅ Formatted item ${idx} (from questionSnapshot):`, {
            ...formatted,
            'answerKeyMatch found': !!formatted.answerKeyMatch,
            'answerKeyMatch value': formatted.answerKeyMatch
          });
          return formatted;
        }

        // إذا كان في question، استخدمه
        if (item.question) {
          const formatted = {
            ...item,
            prompt: item.question.text || item.question.prompt,
            text: item.question.text || item.question.prompt,
            qType: item.question.qType,
            type: item.question.qType,
            options: item.question.options || [],
            // ✅ إضافة answerKeyMatch من question (مهم لأسئلة match)
            answerKeyMatch: item.question.answerKeyMatch || item.answerKeyMatch,
            // الاحتفاظ بـ listeningClip و listeningClipId من item الأصلي أو من question
            listeningClip: item.listeningClip || item.question.listeningClip,
            listeningClipId: item.listeningClipId || item.question.listeningClipId,
            // الاحتفاظ بمعلومات Section
            sectionId: item.sectionId,
            section: item.section,
          };
          console.log(`✅ Formatted item ${idx} (from question):`, formatted);
          return formatted;
        }

        // إذا مافيش questionSnapshot ولا question، استخدم البيانات الموجودة
        console.log(`⚠️ Item ${idx} has no questionSnapshot or question, using raw item`);
        return item;
      });

      // تجميع الأسئلة حسب Section
      const sectionsMap = new Map();
      formattedItems.forEach((item, idx) => {
        const sectionId = item.sectionId || 'default';
        const section = item.section || { title: 'أسئلة عامة', listeningAudioId: null, listeningAudioUrl: null };
        
        if (!sectionsMap.has(sectionId)) {
          sectionsMap.set(sectionId, {
            id: sectionId,
            title: section.title || section.name || 'أسئلة عامة',
            listeningAudioId: section.listeningAudioId || null,
            listeningAudioUrl: section.listeningAudioUrl || null,
            items: []
          });
        }
        sectionsMap.get(sectionId).items.push({ ...item, originalIndex: idx });
      });

      // ✅ إزالة التكرارات من formattedItems (خاصة لأسئلة الاستماع)
      // استخدام Set لتتبع الأسئلة الفريدة بناءً على questionId أو id
      const seenQuestions = new Set();
      const uniqueItems = formattedItems.filter((item, idx) => {
        const questionId = item.questionId || item.id || item._id || item.question?.id || item.question?._id || item.questionSnapshot?.id || item.questionSnapshot?._id;
        const uniqueId = questionId ? `q-${questionId}` : `idx-${idx}`;
        
        if (seenQuestions.has(uniqueId)) {
          console.warn(`⚠️ Duplicate question detected at index ${idx}:`, {
            questionId,
            uniqueId,
            prompt: item.prompt || item.text,
            item
          });
          return false; // إزالة السؤال المكرر
        }
        
        seenQuestions.add(uniqueId);
        return true;
      });
      
      console.log(`✅ Removed ${formattedItems.length - uniqueItems.length} duplicate questions`);
      console.log(`✅ Total unique questions: ${uniqueItems.length}`);
      
      // تحديث attemptData مع items الصحيحة و sections
      const attemptWithItems = {
        ...attemptData,
        items: uniqueItems,
        sections: Array.from(sectionsMap.values()),
      };
      
      setAttempt(attemptWithItems);
      
      // تحميل الإجابات المحفوظة
      if (attemptData.answers) {
        const savedAnswers = {};
        attemptData.answers.forEach((answer) => {
          // ✅ استخدام uniqueItems بدلاً من formattedItems بعد إزالة التكرارات
          // ✅ البحث عن السؤال باستخدام questionId أولاً، ثم الفهرس
          let item = null;
          let newItemIndex = answer.itemIndex;
          
          if (answer.questionId) {
            // البحث عن السؤال باستخدام questionId في uniqueItems
            const foundIndex = uniqueItems.findIndex(item => 
              item.questionId === answer.questionId || 
              item.id === answer.questionId || 
              item._id === answer.questionId ||
              item.question?.id === answer.questionId ||
              item.questionSnapshot?.id === answer.questionId
            );
            if (foundIndex !== -1) {
              item = uniqueItems[foundIndex];
              newItemIndex = foundIndex;
            }
          }
          
          // إذا لم نجد السؤال باستخدام questionId، نستخدم الفهرس (إذا كان صالحاً)
          if (!item && answer.itemIndex < uniqueItems.length) {
            item = uniqueItems[answer.itemIndex];
            newItemIndex = answer.itemIndex;
          }
          
          if (!item) {
            console.warn(`⚠️ Could not find item for answer:`, answer);
            return; // تخطي هذه الإجابة
          }
          
          const qType = item?.qType || item?.type || 'mcq';
          
          if (qType === 'mcq' && answer.studentAnswerIndexes && Array.isArray(answer.studentAnswerIndexes)) {
            // تحويل array إلى selectedIndex واحد (آخر عنصر أو الأول)
            savedAnswers[newItemIndex] = {
              selectedIndex: answer.studentAnswerIndexes.length > 0 ? answer.studentAnswerIndexes[0] : null,
            };
          } else if (qType === 'interactive_text') {
            // Interactive Text: حفظ reorderAnswer أو interactiveAnswers
            if (answer.reorderAnswer) {
              savedAnswers[newItemIndex] = { reorderAnswer: answer.reorderAnswer };
            } else if (answer.interactiveAnswers) {
              savedAnswers[newItemIndex] = { interactiveAnswers: answer.interactiveAnswers };
            } else {
              savedAnswers[newItemIndex] = answer;
            }
          } else {
            // للأنواع الأخرى، احفظ كما هي
            savedAnswers[newItemIndex] = answer;
          }
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
        // حفظ آخر اختيار واحد فقط (وليس array)
        newAnswers[itemIndex] = {
          selectedIndex: typeof answer === 'number' ? answer : (Array.isArray(answer) ? answer[0] : answer),
        };
      } else if (questionType === 'true_false') {
        newAnswers[itemIndex] = {
          studentAnswerBoolean: answer,
        };
      } else if (questionType === 'fill') {
        console.log('✏️ handleAnswerChange for fill:', { itemIndex, answer, questionType });
        newAnswers[itemIndex] = {
          studentAnswerText: answer,
        };
        console.log('✏️ Updated answers:', newAnswers);
      } else if (questionType === 'free_text') {
        newAnswers[itemIndex] = {
          textAnswer: answer,
        };
      } else if (questionType === 'speaking') {
        newAnswers[itemIndex] = {
          audioAnswerUrl: answer, // URL من الباك بعد الرفع
        };
      } else if (questionType === 'match') {
        newAnswers[itemIndex] = {
          studentAnswerMatch: answer,
        };
      } else if (questionType === 'reorder') {
        newAnswers[itemIndex] = {
          studentAnswerReorder: answer,
        };
      } else if (questionType === 'interactive_text') {
        // Interactive Text: الإجابة هي object يحتوي على interactiveAnswers
        newAnswers[itemIndex] = answer; // answer هو object كامل مع interactiveAnswers
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

      // حسب نوع السؤال - معالجة structure مختلف
      const item = attempt.items[itemIndex];
      const question = item.question || item;
      const qType = question.qType || question.type || item.qType || item.type || 'mcq';
      
      if (qType === 'mcq') {
        // تحويل selectedIndex إلى array عند الحفظ
        answerData.studentAnswerIndexes = typeof answer === 'number' ? [answer] : (Array.isArray(answer) ? answer : [answer]);
      } else if (qType === 'true_false') {
        answerData.studentAnswerBoolean = answer;
      } else if (qType === 'fill') {
        // ✅ Fill: إرسال answerText (الباك يتوقع هذا الاسم)
        // إذا كان fillAnswers array، نأخذ أول قيمة أو نجمعها
        if (answer?.fillAnswers && Array.isArray(answer.fillAnswers)) {
          const fillExact = item.fillExact || item.questionSnapshot?.fillExact || item.question?.fillExact || [];
          if (fillExact.length === 1) {
            answerData.answerText = answer.fillAnswers[0] || '';
          } else {
            answerData.answerText = answer.fillAnswers.filter(a => a && a.trim()).join(', ') || '';
          }
        } else if (answer?.fillAnswer) {
          answerData.answerText = answer.fillAnswer;
        } else if (typeof answer === 'string') {
          answerData.answerText = answer;
        } else if (answer?.studentAnswerText) {
          answerData.answerText = answer.studentAnswerText;
        } else if (answer?.answerText) {
          answerData.answerText = answer.answerText;
        }
      } else if (qType === 'free_text') {
        answerData.textAnswer = answer;
      } else if (qType === 'speaking') {
        answerData.audioAnswerUrl = answer; // URL من الباك بعد الرفع
      } else if (qType === 'match') {
        answerData.studentAnswerMatch = answer;
      } else if (qType === 'reorder') {
        answerData.studentAnswerReorder = answer;
      } else if (qType === 'interactive_text') {
        // Interactive Text: إرسال interactiveAnswers أو reorderAnswer حسب نوع المهمة
        if (answer?.reorderAnswer) {
          // Reorder: إرسال reorderAnswer كـ array من IDs
          answerData.reorderAnswer = answer.reorderAnswer;
        } else if (answer?.interactiveAnswers) {
          // Fill-in-the-blanks: إرسال interactiveAnswers
          answerData.interactiveAnswers = answer.interactiveAnswers;
        } else if (typeof answer === 'object') {
          answerData.interactiveAnswers = answer;
        }
      }

      await examsAPI.saveAnswer(attemptId, answerData);
    } catch (err) {
      console.error('Error saving answer:', err);
      // لا نعرض خطأ للمستخدم، فقط نعرض في console
    }
  };

  const handleSubmit = async () => {
    // ✅ التحقق من أن المحاولة لم يتم تسليمها بالفعل
    if (attempt?.status === 'submitted') {
      setError('تم تسليم هذا الامتحان بالفعل');
      navigate(`/student/attempt/${attemptId}/results`);
      return;
    }

    // ✅ إعادة تحميل المحاولة للتأكد من أحدث status (خاصة لقسم Schreiben)
    try {
      const examId = searchParams.get('examId');
      const latestAttempt = await examsAPI.getAttempt(attemptId, examId);
      
      if (latestAttempt?.status === 'submitted') {
        console.warn('⚠️ Attempt was already submitted - refreshing state');
        setAttempt(latestAttempt);
        setError('تم تسليم هذا الامتحان بالفعل');
        navigate(`/student/attempt/${attemptId}/results`);
        return;
      }
    } catch (refreshErr) {
      console.warn('⚠️ Could not refresh attempt status before submit:', refreshErr);
      // نستمر في submit حتى لو فشل refresh
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
      
      // تحضير الإجابات بصيغة Backend المطلوبة (array)
      const answersArray = attempt.items.map((item, index) => {
        const userAnswer = answers[index];
        const questionId = item.questionId || item.question?.id || item.question?._id;
        
        console.log(`📝 Question ${index + 1}:`, {
          questionId,
          qType: item.qType || item.type,
          rawAnswer: userAnswer,
        });

        const answerObj = {
          questionId: questionId,
        };

        // تحويل الإجابة حسب النوع
        const qType = item.qType || item.type || 'mcq';
        
        if (qType === 'mcq') {
          // ✅ MCQ: إرسال selectedOptionIndexes (الباك يتوقع هذا الاسم)
          if (userAnswer?.selectedIndex !== null && userAnswer?.selectedIndex !== undefined) {
            answerObj.selectedOptionIndexes = [userAnswer.selectedIndex];
          } else {
            answerObj.selectedOptionIndexes = [];
          }
        } else if (qType === 'true_false') {
          // ✅ True/False: إرسال selectedOptionIndexes كـ array (true → [0], false → [1])
          if (userAnswer?.studentAnswerBoolean !== undefined) {
            // true → [0], false → [1]
            answerObj.selectedOptionIndexes = userAnswer.studentAnswerBoolean ? [0] : [1];
          } else if (userAnswer !== undefined && userAnswer !== null) {
            // fallback: إذا كان boolean مباشرة
            const boolValue = typeof userAnswer === 'boolean' ? userAnswer : userAnswer.studentAnswerBoolean;
            answerObj.selectedOptionIndexes = boolValue ? [0] : [1];
          } else {
            answerObj.selectedOptionIndexes = [];
          }
        } else if (qType === 'fill') {
          // ✅ Fill: إرسال answerText (الباك يتوقع هذا الاسم)
          // إذا كان fillAnswers array، نأخذ أول قيمة (أو نجمعها)
          if (userAnswer?.fillAnswers && Array.isArray(userAnswer.fillAnswers)) {
            // ✅ إذا كان هناك عدة إجابات، نجمعها بفاصلة أو نأخذ الأولى
            // بناءً على fillExact.length، إذا كان 1 نأخذ الأولى، وإلا نجمع
            const fillExact = item.fillExact || item.questionSnapshot?.fillExact || item.question?.fillExact || [];
            if (fillExact.length === 1) {
              // فراغ واحد: نأخذ الإجابة الأولى
              answerObj.answerText = userAnswer.fillAnswers[0] || '';
            } else {
              // عدة فراغات: نجمع الإجابات بفاصلة
              answerObj.answerText = userAnswer.fillAnswers.filter(a => a && a.trim()).join(', ') || '';
            }
          } else if (userAnswer?.fillAnswer) {
            answerObj.answerText = userAnswer.fillAnswer;
          } else if (userAnswer?.studentAnswerText) {
            answerObj.answerText = userAnswer.studentAnswerText;
          } else if (typeof userAnswer === 'string') {
            answerObj.answerText = userAnswer;
          }
        } else if (qType === 'free_text') {
          // Free Text: إرسال النص
          if (userAnswer?.textAnswer) {
            answerObj.textAnswer = userAnswer.textAnswer;
          } else if (typeof userAnswer === 'string') {
            answerObj.textAnswer = userAnswer;
          }
        } else if (qType === 'speaking') {
          // Speaking: إرسال URL الصوت من الباك
          if (userAnswer?.audioAnswerUrl) {
            answerObj.audioAnswerUrl = userAnswer.audioAnswerUrl;
          } else if (userAnswer?.audioAnswer) {
            // fallback للشكل القديم
            answerObj.audioAnswerUrl = userAnswer.audioAnswer;
          } else if (typeof userAnswer === 'string') {
            answerObj.audioAnswerUrl = userAnswer;
          }
        } else if (qType === 'match') {
          // Match: إرسال object
          if (userAnswer?.studentAnswerMatch) {
            answerObj.studentAnswerMatch = userAnswer.studentAnswerMatch;
          } else if (userAnswer) {
            answerObj.studentAnswerMatch = userAnswer;
          }
        } else if (qType === 'reorder') {
          // Reorder: إرسال array
          if (userAnswer?.studentAnswerReorder) {
            answerObj.studentAnswerReorder = userAnswer.studentAnswerReorder;
          } else if (Array.isArray(userAnswer)) {
            answerObj.studentAnswerReorder = userAnswer;
          }
        } else if (qType === 'interactive_text') {
          // Interactive Text: إرسال interactiveAnswers أو reorderAnswer حسب نوع المهمة
          if (userAnswer?.reorderAnswer) {
            // Reorder: إرسال reorderAnswer كـ array من IDs
            answerObj.reorderAnswer = userAnswer.reorderAnswer;
          } else if (userAnswer?.interactiveAnswers) {
            // Fill-in-the-blanks: إرسال interactiveAnswers
            answerObj.interactiveAnswers = userAnswer.interactiveAnswers;
          } else if (typeof userAnswer === 'object') {
            answerObj.interactiveAnswers = userAnswer;
          }
        }

        console.log(`✅ Formatted answer ${index + 1}:`, answerObj);
        return answerObj;
      });

      console.log('📤 Sending submit request with answers array:', answersArray);
      
      // إرسال طلب التسليم مع answers array
      const result = await examsAPI.submitAttempt(attemptId, answersArray);
      
      console.log('✅ Attempt submitted successfully:', result);
      console.log('📊 Score:', result.finalScore || result.score, '/', result.totalMaxScore || result.totalPoints);
      console.log('📈 Percentage:', (result.totalMaxScore || result.totalPoints) > 0 
        ? Math.round(((result.finalScore || result.score) / (result.totalMaxScore || result.totalPoints)) * 100) 
        : 0, '%');
      
      // الانتقال إلى صفحة النتائج
      navigate(`/student/attempt/${attemptId}/results`);
    } catch (err) {
      console.error('❌ Error submitting exam:', err);
      console.error('   Error response:', err.response?.data);
      console.error('   Error status:', err.response?.status);
      
      // ✅ معالجة خاصة لخطأ "Attempt is already submitted" (403)
      if (err.response?.status === 403) {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Attempt is already submitted';
        
        if (errorMessage.toLowerCase().includes('already submitted') || 
            errorMessage.toLowerCase().includes('submitted')) {
          console.error('⚠️ Attempt already submitted - this may indicate a caching or state issue');
          console.error('⚠️ Attempt ID:', attemptId);
          console.error('⚠️ Current attempt status:', attempt?.status);
          
          // ✅ إعادة تحميل المحاولة للتأكد من status
          try {
            const examId = searchParams.get('examId');
            const refreshedAttempt = await examsAPI.getAttempt(attemptId, examId);
            setAttempt(refreshedAttempt);
            
            if (refreshedAttempt?.status === 'submitted') {
              // المحاولة مقدمه بالفعل - الانتقال للنتائج
              alert('⚠️ تم تسليم هذا الامتحان مسبقاً. سيتم عرض النتائج.');
              navigate(`/student/attempt/${attemptId}/results`);
              return;
            }
          } catch (refreshErr) {
            console.error('❌ Could not refresh attempt after submit error:', refreshErr);
          }
          
          // إذا لم نتمكن من refresh، نعرض رسالة خطأ
          setError(
            '⚠️ يبدو أن المحاولة مقدمه مسبقاً.\n\n' +
            'إذا كنت طالب جديد أو لم تقدم هذا الامتحان من قبل، يرجى:\n' +
            '1. تسجيل الخروج والدخول مرة أخرى\n' +
            '2. مسح الـ cache والـ cookies\n' +
            '3. المحاولة مرة أخرى\n\n' +
            'إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني.'
          );
        } else {
          setError(errorMessage);
        }
      } else {
        // معالجة أخطاء أخرى
        setError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          'حدث خطأ أثناء تسليم الامتحان. يرجى المحاولة مرة أخرى.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-slate-600">جاري تحميل الامتحان...</p>
        </div>
      </div>
    );
  }

  // Schreiben exams don't have items - they have schreibenTaskId
  const isSchreibenExam = attempt?.mainSkill === 'schreiben' && attempt?.schreibenTaskId;

  if (!attempt || (!isSchreibenExam && (!attempt.items || attempt.items.length === 0))) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-6 mb-4">
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

  // Handle Schreiben exams - redirect to Schreiben page
  if (isSchreibenExam) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-4">
            <p className="font-semibold mb-2 text-blue-800">✍️ امتحان كتابة (Schreiben)</p>
            <p className="text-sm text-slate-600 mb-4">
              {attempt.examTitle || 'مهمة كتابة'}
            </p>
            <button
              onClick={() => navigate(`/student/schreiben/${attempt.schreibenTaskId}?attemptId=${attempt.attemptId}`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              ابدأ مهمة الكتابة →
            </button>
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
          <span className="text-xs font-semibold text-red-600">
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
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {/* رسالة إذا تم التسليم - إظهار فقط الرسالة بدون الأسئلة */}
        {isSubmitted ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-6 text-center">
            <p className="font-semibold mb-2 text-lg">⚠️ تم تسليم هذا الامتحان</p>
            <p className="text-sm mb-4">لا يمكنك تعديل الإجابات</p>
            <button
              onClick={() => navigate(`/student/attempt/${attemptId}/results`)}
              className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-semibold"
            >
              عرض النتائج
            </button>
          </div>
        ) : (
          <>
            {/* ✅ مشغل الصوت الواحد - يعرض مرة واحدة في الأعلى من attempt.listeningClip.audioUrl */}
            {(() => {
              // ✅ الحصول على audioUrl من attempt.listeningClip
              const audioPath = attempt?.listeningClip?.audioUrl;
              
              if (!audioPath) {
                console.warn('⚠️ No audioPath found in attempt.listeningClip:', attempt?.listeningClip);
                return null;
              }
              
              // ✅ استخدام toApiUrl لتحويل URL النسبي إلى full URL
              // هذا يضمن أن المسار النسبي مثل "/uploads/audio/..." 
              // يتم تحويله إلى "https://api.deutsch-tests.com/uploads/audio/..."
              // ✅ مهم: الحفاظ على نفس الحالة (case) التي يرجعها الباك
              const audioSrc = toApiUrl(audioPath);
              
              // ✅ Debug: التأكد من أن audioPath و audioSrc متطابقان في الحالة
              if (audioPath && audioSrc) {
                const pathAfterBase = audioSrc.replace(API_BASE_URL, '');
                if (pathAfterBase !== audioPath) {
                  console.warn('⚠️ URL case mismatch detected:', {
                    originalPath: audioPath,
                    constructedPath: pathAfterBase,
                    fullUrl: audioSrc
                  });
                }
              }
              
              // ✅ Debug: طباعة معلومات الصوت للتأكد من أن URL صحيح
              console.log('🎵 Audio Player Debug:', {
                originalAudioPath: audioPath,
                API_BASE_URL: API_BASE_URL,
                finalAudioSrc: audioSrc,
                isFullUrl: audioSrc.startsWith('http'),
                willRequestFrom: audioSrc.startsWith('http') ? 'API Server ✅' : 'localhost ❌ (WRONG!)',
                envVars: {
                  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
                  VITE_API_URL: import.meta.env.VITE_API_URL
                },
                attemptListeningClip: attempt?.listeningClip
              });
              
              // ✅ التحقق من أن audioSrc هو full URL
              if (!audioSrc || !audioSrc.startsWith('http')) {
                console.error('❌ CRITICAL ERROR: audioSrc is not a full URL!', {
                  audioSrc,
                  API_BASE_URL,
                  audioPath,
                  message: 'المتصفح سيحاول طلب الملف من localhost بدلاً من السيرفر!'
                });
                return null; // لا نعرض audio player إذا كان URL غير صحيح
              }
              
              return (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-blue-700">
                      🎵 {attempt.listeningClip?.teil ? `Teil ${attempt.listeningClip.teil}` : 'ملف الاستماع'}
                    </span>
                  </div>
                  <audio 
                    controls 
                    preload="metadata" 
                    src={audioSrc} 
                    className="w-full"
                    onError={(e) => {
                      const audioEl = e.target;
                      const error = audioEl.error;
                      let errorMessage = 'Unknown error';
                      let errorCode = null;
                      
                      if (error) {
                        switch (error.code) {
                          case error.MEDIA_ERR_ABORTED:
                            errorMessage = 'The user aborted the audio';
                            errorCode = 'MEDIA_ERR_ABORTED';
                            break;
                          case error.MEDIA_ERR_NETWORK:
                            errorMessage = 'A network error occurred while fetching the audio';
                            errorCode = 'MEDIA_ERR_NETWORK';
                            break;
                          case error.MEDIA_ERR_DECODE:
                            errorMessage = 'An error occurred while decoding the audio';
                            errorCode = 'MEDIA_ERR_DECODE';
                            break;
                          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                            errorMessage = 'The audio format is not supported by your browser';
                            errorCode = 'MEDIA_ERR_SRC_NOT_SUPPORTED';
                            break;
                          default:
                            errorMessage = `Unknown error (code: ${error.code})`;
                            errorCode = error.code;
                        }
                      }
                      
                      // ✅ محاولة إصلاح مشكلة الحالة (case) - إذا كان الملف بحرف كبير
                      if (errorCode === error.MEDIA_ERR_NETWORK || errorCode === error.MEDIA_ERR_SRC_NOT_SUPPORTED) {
                        const pathAfterBase = audioSrc.replace(API_BASE_URL, '');
                        const filename = pathAfterBase.split('/').pop() || '';
                        if (filename && filename.toLowerCase().startsWith('listening')) {
                          // محاولة استخدام الحرف الكبير
                          const correctedPath = pathAfterBase.replace(/listening/i, (match) => {
                            return match.charAt(0).toUpperCase() + match.slice(1);
                          });
                          const correctedSrc = `${API_BASE_URL}${correctedPath}`;
                          console.warn('⚠️ Attempting to fix case sensitivity:', {
                            original: audioSrc,
                            corrected: correctedSrc
                          });
                          // تحديث src
                          audioEl.src = correctedSrc;
                          return; // لا نطبع الخطأ بعد
                        }
                      }
                      
                      console.error('❌ Audio playback error:', {
                        errorMessage,
                        errorCode,
                        audioSrc,
                        originalAudioPath: audioPath,
                        audioElement: audioEl,
                        networkState: audioEl.networkState,
                        readyState: audioEl.readyState,
                        error: error,
                        suggestion: 'تحقق من: 1) CORS على السيرفر 2) الملف موجود 3) MIME type صحيح 4) حالة الحروف في اسم الملف'
                      });
                    }}
                    onLoadStart={() => {
                      console.log('✅ Audio loading started:', audioSrc);
                    }}
                    onCanPlay={() => {
                      console.log('✅ Audio can play:', audioSrc);
                    }}
                    onLoadedMetadata={(e) => {
                      console.log('✅ Audio metadata loaded:', {
                        duration: e.target.duration,
                        src: audioSrc
                      });
                    }}
                  >
                    المتصفح لا يدعم تشغيل الملفات الصوتية
                  </audio>
                </div>
              );
            })()}

            {/* نص القراءة - يظهر مرة واحدة فوق الأسئلة */}
            {attempt.readingText && (
              <div className="reading-text-card bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
                <h3 className="text-base font-bold text-amber-800 mb-3 flex items-center gap-2">
                  📖 نص القراءة {attempt.readingText.teil && `(Teil ${attempt.readingText.teil})`}
                </h3>
                <div 
                  className="text-sm text-slate-700 leading-relaxed bg-white rounded-lg p-4 border border-amber-100"
                  style={{ whiteSpace: 'pre-line' }}
                >
                  {attempt.readingText.content}
                </div>
              </div>
            )}

            {/* عرض كل الأسئلة */}
            <div className="space-y-6 mb-6">
          {attempt.items.map((item, itemIndex) => {
            // ✅ قاعدة عرض بسيطة: لا نعرض audio للسؤال إلا إذا كان مختلف عن صوت القسم
            // 1. صوت القسم (section audio)
            const sectionAudio = attempt?.listeningClip?.audioUrl || null;
            
            // 2. صوت السؤال (من question.media.url مباشرة - الحل الصحيح)
            // ✅ استخدام question.media.url مباشرة بدلاً من mediaSnapshot
            const questionMedia = item.question?.media || item.questionSnapshot?.media;
            const questionMediaUrl = questionMedia?.url;
            const questionMediaType = questionMedia?.type || (questionMediaUrl ? 'audio' : null);
            
            const questionAudio = (questionMediaType === "audio") 
              ? questionMediaUrl
              : (item.mediaSnapshot?.type === "audio" 
                ? (item.mediaSnapshot.url || item.mediaSnapshot.key || null)
                : null);
            
            // 3. شرط العرض: نعرض صوت السؤال فقط إذا كان موجود ومختلف عن صوت القسم
            const shouldShowQuestionAudio = !!questionAudio && questionAudio !== sectionAudio;
            
            // Debug: طباعة معلومات الصوت لكل سؤال
            console.log(`🎵 Question ${itemIndex + 1} Audio Logic:`, {
              sectionAudio,
              questionAudio,
              shouldShowQuestionAudio,
              questionMediaUrl,
              questionMediaType,
              mediaSnapshot: item.mediaSnapshot
            });
            
            // قراءة prompt من promptSnapshot أولاً (الحقل الصحيح من الباك)
            const qType = item.qType || item.question?.qType || item.questionSnapshot?.qType || item.type || 'mcq';
            // ✅ قراءة prompt من promptSnapshot (قد يكون string مباشرة أو object)
            const promptSnapshotValue = typeof item.promptSnapshot === 'string' 
              ? item.promptSnapshot 
              : (item.promptSnapshot?.text || item.promptSnapshot?.prompt || item.promptSnapshot);
            const prompt =
              promptSnapshotValue ||           // الحقل الصحيح من الباك
              item.prompt ||                   // fallback للشكل القديم
              item.text ||                     // fallback
              'لا يوجد نص للسؤال';             // fallback نهائي
            
            // قراءة options من optionsText و optionOrder (الحقل الصحيح من الباك)
            let options = [];
            if (item.optionsText && item.optionOrder) {
              // optionsText هو object، و optionOrder هو array من indexes
              options = item.optionOrder.map((idx) => {
                const optionText = item.optionsText[idx] || item.optionsText[String(idx)];
                return typeof optionText === 'string' ? optionText : (optionText?.text || optionText);
              });
            } else if (item.optionsText && typeof item.optionsText === 'object') {
              // لو optionsText موجود لكن optionOrder مش موجود، نستخدم keys
              options = Object.values(item.optionsText).map(opt => 
                typeof opt === 'string' ? opt : (opt?.text || opt)
              );
            } else if (Array.isArray(item.optionsText)) {
              // لو optionsText هو array مباشرة
              options = item.optionsText.map(opt => 
                typeof opt === 'string' ? opt : (opt?.text || opt)
              );
            } else if (item.options) {
              // fallback للشكل القديم
              options = (item.options || []).map(opt => 
                typeof opt === 'string' ? opt : (opt.text || opt)
              );
            }

            // ✅ استخدام معرف فريد للسؤال (questionId أو id) بدلاً من itemIndex
            // ✅ إضافة itemIndex للتأكد من التفرد حتى لو كان questionId متكرراً
            const questionId = item.questionId || item.id || item._id || item.question?.id || item.question?._id || item.questionSnapshot?.id || item.questionSnapshot?._id;
            const uniqueKey = questionId ? `${questionId}-${itemIndex}` : `item-${itemIndex}`;
            
            return (
              <div key={uniqueKey} className="space-y-4">
                {/* ✅ Audio Player - فقط إذا كان السؤال له صوت خاص به (مختلف عن صوت الـ Section) */}
                {shouldShowQuestionAudio && (() => {
                  // ✅ استخدام questionAudio (من question.media.url مباشرة)
                  const audioUrlToUse = questionAudio;
                  if (!audioUrlToUse) return null;
                  
                  // ✅ إذا كان من question.media.url، استخدمه مباشرة (لا حاجة لتحويل)
                  // ✅ إذا كان من mediaSnapshot، استخدم toApiUrl للتحويل
                  const isFromQuestionMedia = questionMediaUrl && questionMediaType === "audio";
                  const mediaSrc = isFromQuestionMedia 
                    ? audioUrlToUse  // ✅ استخدام question.media.url مباشرة
                    : toApiUrl(audioUrlToUse);  // Fallback: تحويل mediaSnapshot
                  
                  // ✅ إصلاح mime type لملفات .opus
                  const correctMime = getCorrectMimeType(
                    audioUrlToUse, 
                    isFromQuestionMedia ? questionMedia?.mime : item.mediaSnapshot?.mime
                  );
                  
                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-blue-700">
                          🎵 ملف صوتي خاص بالسؤال
                        </span>
                      </div>
                      <audio src={mediaSrc} controls className="w-full">
                        <source src={mediaSrc} type={correctMime} />
                        المتصفح لا يدعم تشغيل الملفات الصوتية
                      </audio>
                    </div>
                  );
                })()}

                {/* عرض السؤال */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                      {/* رقم السؤال */}
                      <div className="flex items-center gap-2 mb-4 justify-end">
                        <span className="text-xs font-semibold px-2 py-1 bg-red-600 text-white rounded">
                          سؤال {itemIndex + 1}
                        </span>
                        {item.points && (
                          <span className="text-[10px] text-slate-400">
                            {item.points} نقطة
                          </span>
                        )}
                      </div>

                      {/* Media (Audio/Image/Video) - من question.media.url مباشرة */}
                      {/* ✅ لا نعرض audio داخل السؤال إذا كان نفس listeningClip.audioUrl */}
                      {(() => {
                        // ✅ استخدام question.media.url مباشرة (الحل الصحيح)
                        // أولوية: question.media.url > questionSnapshot.media.url > بناء من mediaSnapshot.key > mediaSnapshot.url (fallback) > mediaUrl (قديم)
                        const questionMedia = item.question?.media || item.questionSnapshot?.media;
                        let questionMediaUrl = questionMedia?.url;
                        const questionMediaType = questionMedia?.type;
                        
                        // ✅ إذا لم يكن question.media.url موجود، نحاول بناء اللينك من mediaSnapshot.key
                        // لأن mediaSnapshot.key يحتوي على المسار الصحيح: "images/questions/....jpg"
                        // واللينك الصحيح يكون: "https://api.deutsch-tests.com/uploads/images/questions/....jpg"
                        if (!questionMediaUrl && item.mediaSnapshot?.key) {
                          const mediaKey = item.mediaSnapshot.key;
                          // ✅ بناء اللينك الصحيح من key مع encoding صحيح
                          // mediaKey يكون مثل: "images/questions/سؤال 70 عام.jpg"
                          // اللينك الصحيح: "https://api.deutsch-tests.com/uploads/images/questions/%D8%B3%D8%A4%D8%A7%D9%84%2070%20%D8%B9%D8%A7%D9%85.jpg"
                          questionMediaUrl = buildImageUrlFromKey(mediaKey);
                          console.log('✅ Built URL from mediaSnapshot.key:', {
                            key: mediaKey,
                            builtUrl: questionMediaUrl
                          });
                        }
                        
                        const finalMediaType = questionMediaType || item.mediaSnapshot?.type || (questionMediaUrl ? 'image' : null);
                        
                        // Debug: طباعة معلومات media المتاحة
                        console.log(`🖼️ Question ${itemIndex + 1} Media Debug:`, {
                          hasQuestion: !!item.question,
                          hasQuestionSnapshot: !!item.questionSnapshot,
                          questionMedia: item.question?.media,
                          questionSnapshotMedia: item.questionSnapshot?.media,
                          questionMediaUrl: questionMedia?.url,
                          finalQuestionMediaUrl: questionMediaUrl,
                          finalMediaType,
                          mediaSnapshot: item.mediaSnapshot,
                          itemKeys: Object.keys(item)
                        });
                        
                        // ✅ قاعدة عرض بسيطة: لا نعرض audio للسؤال إلا إذا كان مختلف عن صوت القسم
                        const sectionAudioForOldLogic = attempt?.listeningClip?.audioUrl || null;
                        const questionAudioForOldLogic = (finalMediaType === "audio") 
                          ? questionMediaUrl
                          : null;
                        const shouldShowQuestionAudioForOldLogic = !!questionAudioForOldLogic && questionAudioForOldLogic !== sectionAudioForOldLogic;
                        
                        // Fallback للشكل القديم (mediaSnapshot.url أو mediaUrl) - فقط إذا لم يكن هناك question.media.url ولا يمكن بناءه من key
                        const mediaSnapshot = item.mediaSnapshot;
                        // ✅ hasMediaSnapshot: فقط إذا كان mediaSnapshot موجود ولم نتمكن من بناء اللينك من key أو question.media
                        const hasMediaSnapshot = mediaSnapshot && mediaSnapshot.type && mediaSnapshot.url && !questionMediaUrl;
                        const hasOldMedia = item.mediaUrl && !sectionAudioForOldLogic && !questionMediaUrl;
                        
                        // ✅ لا نعرض audio إذا كان نفس صوت القسم
                        if (finalMediaType === 'audio' && !shouldShowQuestionAudioForOldLogic && !hasOldMedia && !hasMediaSnapshot) {
                          return null;
                        }
                        
                        // ✅ معالجة imagesSnapshot - إذا كان هناك عدة صور
                        // نستخدم متغير خارجي لحفظ الصور لعرضها بعد نص السؤال
                        const imagesSnapshot = item.imagesSnapshot || [];
                        const hasMultipleImages = imagesSnapshot.length > 0;
                        
                        console.log('🖼️ Processing images for question:', {
                          itemIndex,
                          hasImagesSnapshot: !!item.imagesSnapshot,
                          imagesSnapshotLength: imagesSnapshot.length,
                          imagesSnapshot: imagesSnapshot,
                          hasQuestionMedia: !!questionMedia,
                          hasMediaSnapshot: !!item.mediaSnapshot
                        });
                        
                        // ✅ بناء map من جميع المصادر المحتملة للبحث عن description
                        // 1. question.images أو questionSnapshot.images
                        // 2. item.images مباشرة
                        // 3. item.question.media أو item.questionSnapshot.media
                        const questionImagesMap = new Map(); // key -> image object with description
                        
                        // المصدر 1: question.images أو questionSnapshot.images
                        const questionImages = item.question?.images || item.questionSnapshot?.images || [];
                        
                        // المصدر 2: item.images مباشرة (قد يكون موجود في محاولة الامتحان)
                        const itemImages = item.images || [];
                        
                        // المصدر 3: item.question.media أو item.questionSnapshot.media (لصورة واحدة)
                        // ✅ questionMedia تم تعريفه بالفعل في السطر 1223، لا نحتاج لإعادة تعريفه
                        
                        console.log('🔍 Looking for description sources:', {
                          itemIndex,
                          hasQuestion: !!item.question,
                          hasQuestionSnapshot: !!item.questionSnapshot,
                          questionImages: item.question?.images,
                          questionSnapshotImages: item.questionSnapshot?.images,
                          itemImages: item.images,
                          questionMedia: questionMedia,
                          questionImagesArray: questionImages,
                          questionImagesLength: questionImages.length,
                          itemImagesLength: itemImages.length
                        });
                        
                        // إضافة من question.images
                        if (Array.isArray(questionImages) && questionImages.length > 0) {
                          questionImages.forEach((img) => {
                            const imgKey = img.key || img.url;
                            if (imgKey) {
                              questionImagesMap.set(imgKey, img);
                              console.log('✅ Added from question.images:', {
                                key: imgKey,
                                hasDescription: !!img.description,
                                description: img.description
                              });
                            }
                          });
                        }
                        
                        // إضافة من item.images (إذا لم يكن موجود بالفعل)
                        if (Array.isArray(itemImages) && itemImages.length > 0) {
                          itemImages.forEach((img) => {
                            const imgKey = img.key || img.url;
                            if (imgKey && !questionImagesMap.has(imgKey)) {
                              questionImagesMap.set(imgKey, img);
                              console.log('✅ Added from item.images:', {
                                key: imgKey,
                                hasDescription: !!img.description,
                                description: img.description
                              });
                            }
                          });
                        }
                        
                        // إضافة من question.media (لصورة واحدة)
                        if (questionMedia && questionMedia.type === 'image' && questionMedia.key) {
                          const mediaKey = questionMedia.key;
                          if (!questionImagesMap.has(mediaKey)) {
                            questionImagesMap.set(mediaKey, questionMedia);
                            console.log('✅ Added from question.media:', {
                              key: mediaKey,
                              hasDescription: !!questionMedia.description,
                              description: questionMedia.description
                            });
                          }
                        }
                        
                        console.log('📝 Final questionImagesMap:', {
                          questionImagesMapSize: questionImagesMap.size,
                          questionImagesMapKeys: Array.from(questionImagesMap.keys()),
                          allDescriptions: Array.from(questionImagesMap.values()).map(img => ({
                            key: img.key || img.url,
                            description: img.description
                          }))
                        });
                        
                        // ✅ بناء قائمة بجميع الصور بالأولوية الصحيحة:
                        // 1. imagesSnapshot (إذا كان موجود وله طول > 0) - الأولوية الأولى
                        // 2. images (إذا كان موجود وله طول > 0)
                        // 3. mediaSnapshot
                        // 4. media (questionMediaUrl)
                        const imageMap = new Map(); // key -> image object
                        
                        // ✅ الأولوية الأولى: imagesSnapshot
                        if (hasMultipleImages && imagesSnapshot.length > 0) {
                          imagesSnapshot.forEach((imgSnapshot, idx) => {
                            console.log(`🖼️ Processing image ${idx} from imagesSnapshot (RAW FROM API):`, {
                              imgSnapshot,
                              isString: typeof imgSnapshot === 'string',
                              isObject: typeof imgSnapshot === 'object',
                              type: imgSnapshot?.type,
                              hasKey: !!imgSnapshot?.key,
                              hasUrl: !!imgSnapshot?.url,
                              key: imgSnapshot?.key,
                              url: imgSnapshot?.url,
                              fullSnapshot: JSON.stringify(imgSnapshot)
                            });
                            
                            // ✅ معالجة الحالات المختلفة: string, object بدون type, object مع type
                            let imgKey, imgUrl, imgMime;
                            
                            if (typeof imgSnapshot === 'string') {
                              // إذا كان string، نعتبره key مباشرة
                              imgKey = imgSnapshot;
                              // ✅ استخدام دالة buildImageUrlFromKey لعمل encoding صحيح
                              imgUrl = buildImageUrlFromKey(imgKey);
                              imgMime = 'image/jpeg';
                              console.log('✅ Building URL from string key:', {
                                key: imgKey,
                                builtUrl: imgUrl
                              });
                            } else if (typeof imgSnapshot === 'object' && imgSnapshot !== null) {
                              // ✅ التحقق من type - قد يكون 'image' أو غير موجود (نعتبره image افتراضياً)
                              const isImage = !imgSnapshot.type || imgSnapshot.type === 'image';
                              if (!isImage) {
                                console.log(`⏭️ Skipping non-image type: ${imgSnapshot.type}`);
                                return; // تخطي إذا لم يكن image
                              }
                              
                              // ✅ استخدام key مباشرة من imagesSnapshot بدون أي تعديل
                              // هذا هو key الصحيح من API: "images/ولايات/Thüringenسؤال1صورة1.jpeg"
                              imgKey = imgSnapshot.key;
                              if (!imgKey) {
                                console.warn('⚠️ Image snapshot missing key:', imgSnapshot);
                                return; // تخطي إذا لم يكن هناك key
                              }
                              
                              // ✅ التحقق من أن key لم يتم تعديله
                              console.log(`🔑 Using key DIRECTLY from imagesSnapshot[${idx}]:`, {
                                originalKey: imgSnapshot.key,
                                keyToUse: imgKey,
                                areEqual: imgSnapshot.key === imgKey,
                                keyLength: imgKey.length
                              });
                              
                              imgMime = imgSnapshot.mime || 'image/jpeg';
                              
                              // ✅ التحقق من صحة url - يجب أن ينتهي بامتداد صورة صحيح
                              const isValidUrl = (url) => {
                                if (!url) return false;
                                // التحقق من أن URL ينتهي بامتداد صورة صحيح
                                const imageExtensions = ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'];
                                const hasValidExtension = imageExtensions.some(ext => 
                                  url.toLowerCase().endsWith(ext)
                                );
                                // التحقق من أن URL يبدأ بـ http أو https
                                const hasValidProtocol = url.startsWith('http://') || url.startsWith('https://');
                                // التحقق من أن URL ليس مقطوعاً (أطول من 50 حرف على الأقل)
                                const isNotTruncated = url.length > 50;
                                
                                return hasValidExtension && hasValidProtocol && isNotTruncated;
                              };
                              
                              // ✅ إذا كان url موجوداً وصحيحاً، استخدمه
                              // وإلا بني URL من key (key أكثر موثوقية من url المشوه)
                              if (imgSnapshot.url && isValidUrl(imgSnapshot.url)) {
                                imgUrl = toApiUrl(imgSnapshot.url);
                                console.log('✅ Using valid url from imagesSnapshot:', imgUrl);
                              } else {
                                // ✅ بناء URL من key مع encoding صحيح
                                // key يكون مثل: "images/ولايات/Rheinland-Pfalz1سؤال صورة.jpeg"
                                // URL الصحيح: "https://api.deutsch-tests.com/uploads/images/%D9%88%D9%84%D8%A7%D9%8A%D8%A7%D8%AA/..."
                                // ✅ استخدام دالة buildImageUrlFromKey لعمل encoding صحيح على كل segment
                                imgUrl = buildImageUrlFromKey(imgKey);
                                console.log('✅ Building URL from key (url was invalid/truncated):', {
                                  key: imgKey,
                                  builtUrl: imgUrl,
                                  originalUrl: imgSnapshot.url
                                });
                              }
                            } else {
                              // حالة غير متوقعة
                              console.warn('⚠️ Unexpected image snapshot format:', imgSnapshot);
                              return;
                            }
                            
                            // ✅ تجنب إضافة الصورة إذا كانت موجودة بالفعل
                            if (!imageMap.has(imgKey)) {
                              // ✅ البحث عن description في question.images أو questionSnapshot.images
                              // لأن imagesSnapshot قد لا يحتوي على description
                              const questionImage = questionImagesMap.get(imgKey);
                              const imageDescription = imgSnapshot.description || questionImage?.description || null;
                              
                              console.log(`📝 Description lookup for image ${idx}:`, {
                                key: imgKey,
                                fromSnapshot: imgSnapshot.description,
                                questionImageFound: !!questionImage,
                                questionImage: questionImage,
                                fromQuestion: questionImage?.description,
                                finalDescription: imageDescription,
                                questionImagesMapSize: questionImagesMap.size,
                                questionImagesMapKeys: Array.from(questionImagesMap.keys())
                              });
                              
                              imageMap.set(imgKey, {
                                url: imgUrl,
                                key: imgKey,
                                type: 'image',
                                mime: imgMime,
                                description: imageDescription // ✅ استخدام description من imagesSnapshot أو question.images
                              });
                            }
                          });
                        }
                        
                        // ✅ الأولوية الثانية: images (إذا لم يكن imagesSnapshot موجود أو فارغ)
                        if (imageMap.size === 0 && item.images && Array.isArray(item.images) && item.images.length > 0) {
                          console.log('📸 Using images array (imagesSnapshot was empty):', item.images);
                          item.images.forEach((img, idx) => {
                            const imgKey = img.key || img.url || `image_${idx}`;
                            const imgUrl = img.url || (img.key ? buildImageUrlFromKey(img.key) : null);
                            if (imgUrl && !imageMap.has(imgKey)) {
                              // ✅ البحث عن description في question.images
                              const questionImage = questionImagesMap.get(imgKey);
                              const imageDescription = img.description || questionImage?.description || null;
                              
                              imageMap.set(imgKey, {
                                url: imgUrl,
                                key: imgKey,
                                type: 'image',
                                mime: img.mime || 'image/jpeg',
                                description: imageDescription // ✅ استخدام description من images أو question.images
                              });
                            }
                          });
                        }
                        
                        // ✅ الأولوية الثالثة: mediaSnapshot (إذا لم يكن هناك صور بعد)
                        if (imageMap.size === 0 && item.mediaSnapshot?.type === 'image' && item.mediaSnapshot?.key) {
                          console.log('📸 Using mediaSnapshot (no imagesSnapshot or images):', item.mediaSnapshot);
                          const mediaKey = item.mediaSnapshot.key;
                          const builtUrl = buildImageUrlFromKey(mediaKey);
                          // ✅ البحث عن description في question.images أو question.media
                          const questionImage = questionImagesMap.get(mediaKey);
                          const questionMedia = item.question?.media || item.questionSnapshot?.media;
                          const imageDescription = item.mediaSnapshot.description || questionImage?.description || questionMedia?.description || null;
                          
                          imageMap.set(mediaKey, {
                            url: builtUrl,
                            key: mediaKey,
                            type: 'image',
                            mime: item.mediaSnapshot.mime,
                            description: imageDescription // ✅ استخدام description من mediaSnapshot أو question.images أو question.media
                          });
                        }
                        
                        // ✅ الأولوية الرابعة: media (questionMediaUrl) - إذا لم يكن هناك صور بعد
                        if (imageMap.size === 0 && questionMediaUrl && finalMediaType === 'image') {
                          console.log('📸 Using questionMediaUrl (no other images found):', questionMediaUrl);
                          const mediaKey = questionMedia?.key || item.mediaSnapshot?.key;
                          if (mediaKey) {
                            // ✅ البحث عن description في question.images أو question.media
                            const questionImage = questionImagesMap.get(mediaKey);
                            const imageDescription = questionMedia?.description || questionImage?.description || item.mediaSnapshot?.description || null;
                            
                            imageMap.set(mediaKey, {
                              url: questionMediaUrl,
                              key: mediaKey,
                              type: 'image',
                              mime: questionMedia?.mime || item.mediaSnapshot?.mime,
                              description: imageDescription // ✅ استخدام description من questionMedia أو question.images أو mediaSnapshot
                            });
                          }
                        }
                        
                        // تحويل Map إلى array وحفظه في item للاستخدام لاحقاً
                        const allImages = Array.from(imageMap.values());
                        // ✅ حفظ الصور في item للاستخدام بعد نص السؤال
                        item._allImages = allImages;
                        
                        console.log('📸 Final images resolution:', {
                          itemIndex,
                          source: hasMultipleImages && imagesSnapshot.length > 0 ? 'imagesSnapshot' :
                                  (item.images && item.images.length > 0 ? 'images' :
                                  (item.mediaSnapshot?.type === 'image' ? 'mediaSnapshot' : 'media')),
                          allImagesCount: allImages.length
                        });
                        
                        console.log('📸 All images processed for question:', {
                          itemIndex,
                          allImagesCount: allImages.length,
                          allImages: allImages,
                          imagesSnapshotCount: imagesSnapshot.length
                        });
                        
                        // ✅ استخدام question.media.url مباشرة (الحل الصحيح)
                        if (questionMediaUrl) {
                          // ✅ استخدام question.media.url مباشرة - لا حاجة لتحويل أو معالجة
                          const mediaSrc = questionMediaUrl;
                          
                          console.log('✅ Using question.media.url (or built from key):', {
                            url: mediaSrc,
                            type: finalMediaType,
                            source: questionMedia?.url ? 'question.media' : 'built from mediaSnapshot.key',
                            allImagesCount: allImages.length,
                            imagesSnapshotCount: imagesSnapshot.length
                          });
                          
                          if (finalMediaType === 'audio' && mediaSrc) {
                            // ✅ إصلاح mime type لملفات .opus
                            const correctMime = getCorrectMimeType(mediaSrc, questionMedia?.mime || item.mediaSnapshot?.mime);
                            return (
                              <div className="mb-4">
                                <audio controls style={{ width: '100%' }}>
                                  <source src={mediaSrc} type={correctMime} />
                                  متصفحك لا يدعم تشغيل الصوت.
                                </audio>
                              </div>
                            );
                          } else if (finalMediaType === 'image' && mediaSrc) {
                            // ✅ الصور سنعرضها بعد نص السؤال، لا هنا
                            // نرجع null هنا لأننا سنعرض الصور لاحقاً
                            return null;
                          } else if (finalMediaType === 'video' && mediaSrc) {
                            return (
                              <div className="mb-4">
                                <video controls className="w-full">
                                  <source src={mediaSrc} type={questionMedia?.mime || item.mediaSnapshot?.mime || 'video/mp4'} />
                                  متصفحك لا يدعم تشغيل الفيديو.
                                </video>
                              </div>
                            );
                          }
                        }
                        
                        // ✅ إذا لم يكن questionMediaUrl موجود لكن imagesSnapshot موجود
                        // الصور سنعرضها بعد نص السؤال، لا هنا
                        if (allImages.length > 0 && !questionMediaUrl) {
                          console.log('✅ Using images from imagesSnapshot (will show after question text):', {
                            allImagesCount: allImages.length,
                            imagesSnapshotCount: imagesSnapshot.length
                          });
                          // نرجع null هنا لأننا سنعرض الصور لاحقاً
                          return null;
                        }
                        
                        // Fallback: استخدام mediaSnapshot (من محاولة الامتحان) - فقط إذا لم يكن هناك question.media
                        // ✅ للصور والفيديو: نعرضها دائماً إذا كانت موجودة
                        // ✅ للصوت: نعرضها فقط إذا كانت مختلفة عن صوت القسم
                        const shouldShowMediaSnapshot = hasMediaSnapshot && (
                          mediaSnapshot.type === 'image' || 
                          mediaSnapshot.type === 'video' || 
                          (mediaSnapshot.type === 'audio' && shouldShowQuestionAudioForOldLogic)
                        );
                        
                        if (shouldShowMediaSnapshot) {
                          // الحصول على المسار من url أو key
                          const rawMediaPath = mediaSnapshot.url || mediaSnapshot.key || '';
                          
                          // ✅ استخدام toApiUrl لتحويل URL النسبي إلى full URL
                          const mediaSrc = toApiUrl(rawMediaPath);
                          
                          console.log('⚠️ Fallback to mediaSnapshot:', {
                            raw: rawMediaPath,
                            resolved: mediaSrc,
                            type: mediaSnapshot.type
                          });
                          
                          if (mediaSnapshot.type === 'audio' && mediaSrc) {
                            // ✅ إصلاح mime type لملفات .opus
                            const correctMime = getCorrectMimeType(rawMediaPath, mediaSnapshot.mime);
                            return (
                              <div className="mb-4">
                                <audio controls style={{ width: '100%' }}>
                                  <source src={mediaSrc} type={correctMime} />
                                  متصفحك لا يدعم تشغيل الصوت.
                                </audio>
                              </div>
                            );
                          } else if (mediaSnapshot.type === 'image' && mediaSrc) {
                            // ✅ الصور سنعرضها بعد نص السؤال، لا هنا
                            // نضيف الصورة إلى allImages إذا لم تكن موجودة
                            if (!item._allImages) {
                              item._allImages = [];
                            }
                            const imgKey = mediaSnapshot.key || rawMediaPath;
                            if (!item._allImages.find(img => img.key === imgKey)) {
                              // ✅ البحث عن description في question.images أو question.media
                              const questionImage = questionImagesMap.get(imgKey);
                              const questionMedia = item.question?.media || item.questionSnapshot?.media;
                              const imageDescription = mediaSnapshot.description || questionImage?.description || questionMedia?.description || null;
                              
                              item._allImages.push({
                                url: mediaSrc,
                                key: imgKey,
                                type: 'image',
                                mime: mediaSnapshot.mime,
                                description: imageDescription // ✅ استخدام description من mediaSnapshot أو question.images أو question.media
                              });
                            }
                            return null;
                          } else if (mediaSnapshot.type === 'video' && mediaSrc) {
                            return (
                              <div className="mb-4">
                                <video controls className="w-full">
                                  <source src={mediaSrc} type={mediaSnapshot.mime || 'video/mp4'} />
                                  متصفحك لا يدعم تشغيل الفيديو.
                                </video>
                              </div>
                            );
                          }
                        }
                        
                        // Fallback للشكل القديم (mediaUrl)
                        if (hasOldMedia) {
                          // ✅ استخدام toApiUrl لتحويل URL النسبي إلى full URL
                          const oldMediaSrc = toApiUrl(item.mediaUrl);
                          // ✅ إصلاح mime type لملفات .opus
                          const correctMime = getCorrectMimeType(item.mediaUrl, item.mediaType === 'audio' ? 'audio/mpeg' : null);
                          
                          return (
                            <div className="mb-4">
                              {item.mediaType === 'audio' && (
                                <audio controls src={oldMediaSrc} className="w-full" style={{ width: '100%' }}>
                                  المتصفح لا يدعم تشغيل الملفات الصوتية
                                </audio>
                              )}
                              {item.mediaType === 'image' && (
                                <img src={oldMediaSrc} alt="Question" className="w-full max-w-md rounded-lg" />
                              )}
                              {item.mediaType === 'video' && (
                                <video controls src={oldMediaSrc} className="w-full">
                                  المتصفح لا يدعم تشغيل الفيديو
                                </video>
                              )}
                            </div>
                          );
                        }
                        
                        return null;
                      })()}

                      {/* نص السؤال */}
                      {/* ✅ Interactive Text: عرض interactiveText مع placeholders أو Reorder */}
                      {qType === 'interactive_text' && (() => {
                        // ✅ التحقق من نوع المهمة: Reorder أو Fill-in-the-blanks
                        const interactiveReorderSnapshot = item.interactiveReorderSnapshot || item.interactiveReorder;
                        const taskType = item.taskType || (interactiveReorderSnapshot ? 'reorder' : 'fill_blanks');
                        
                        // ✅ Reorder Task
                        if (taskType === 'reorder' && interactiveReorderSnapshot?.parts && interactiveReorderSnapshot.parts.length > 0) {
                          return (
                            <ReorderTask
                              parts={interactiveReorderSnapshot.parts}
                              prompt={prompt}
                              itemIndex={itemIndex}
                              answers={answers}
                              setAnswers={setAnswers}
                              saveAnswer={saveAnswer}
                              isSubmitted={isSubmitted}
                              questionId={item.questionId}
                            />
                          );
                        }
                        
                        // ✅ Fill-in-the-blanks Task
                        // ✅ قراءة interactiveTextSnapshot و interactiveBlanksSnapshot من item (من الباك)
                        // ⚠️ مهم: نقرأ فقط من interactiveTextSnapshot و interactiveBlanksSnapshot (من الباك)
                        // لا نستخدم fallback إلى item.text لأن هذا قد يسبب عرض السؤال مرتين
                        const interactiveText = 
                          item.interactiveTextSnapshot ||  // الحقل الأساسي من الباك
                          item.interactiveText || 
                          item.question?.interactiveText || 
                          item.questionSnapshot?.interactiveText ||
                          '';
                        
                        // ✅ قراءة interactiveBlanksSnapshot من item (من الباك)
                        const interactiveBlanks = 
                          item.interactiveBlanksSnapshot ||  // الحقل الأساسي من الباك
                          item.interactiveBlanks || 
                          item.question?.interactiveBlanks || 
                          item.questionSnapshot?.interactiveBlanks ||
                          [];
                        
                        // Debug: طباعة البيانات
                        console.log('🔍 Interactive Text Debug:', {
                          itemIndex,
                          qType,
                          taskType,
                          prompt,
                          interactiveText,
                          interactiveBlanks,
                          hasInteractiveTextSnapshot: !!item.interactiveTextSnapshot,
                          hasInteractiveBlanksSnapshot: !!item.interactiveBlanksSnapshot,
                          hasInteractiveReorderSnapshot: !!item.interactiveReorderSnapshot,
                          itemKeys: Object.keys(item),
                        });
                        
                        // ⚠️ إذا لم يكن هناك interactiveTextSnapshot أو interactiveBlanksSnapshot، نعرض رسالة خطأ واضحة
                        if (!item.interactiveTextSnapshot && !item.interactiveBlanksSnapshot) {
                          console.error('❌ Interactive Text missing snapshots from backend:', {
                            itemIndex,
                            hasInteractiveTextSnapshot: !!item.interactiveTextSnapshot,
                            hasInteractiveBlanksSnapshot: !!item.interactiveBlanksSnapshot,
                            itemKeys: Object.keys(item),
                          });
                          return (
                            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                              <h3 className="text-lg font-semibold text-slate-900 mb-2" dir="ltr">
                                {prompt}
                              </h3>
                              <p className="text-sm text-yellow-800">
                                ⚠️ البيانات التفاعلية غير متوفرة. يرجى التحقق من إعدادات السؤال في لوحة التحكم.
                              </p>
                            </div>
                          );
                        }
                        
                        // عرض prompt أولاً (فقط إذا كان interactiveText موجود)
                        const promptElement = prompt && interactiveText ? (
                          <h3 className="text-lg font-semibold text-slate-900 mb-3 mt-2" dir="ltr">
                            {prompt}
                          </h3>
                        ) : null;
                        
                        if (!interactiveText || interactiveBlanks.length === 0) {
                          // Fallback: عرض prompt فقط
                          console.warn('⚠️ Interactive Text missing data:', {
                            hasInteractiveText: !!interactiveText,
                            interactiveBlanksLength: interactiveBlanks.length,
                            hasInteractiveTextSnapshot: !!item.interactiveTextSnapshot,
                            hasInteractiveBlanksSnapshot: !!item.interactiveBlanksSnapshot,
                          });
                          return (
                            <div className="mb-4">
                              {prompt && (
                                <h3 className="text-lg font-semibold text-slate-900 mb-3 mt-2" dir="ltr">
                                  {prompt}
                                </h3>
                              )}
                              <p className="text-sm text-slate-600">
                                ⚠️ لا يوجد نص تفاعلي متاح
                              </p>
                            </div>
                          );
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
                          
                          // إضافة placeholder
                          const blankId = match[1];
                          const blank = interactiveBlanks.find(b => b.id === blankId);
                          if (blank) {
                            parts.push({
                              type: 'blank',
                              id: blankId,
                              blank: blank,
                            });
                          } else {
                            // إذا لم نجد blank، نعرض placeholder كما هو
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
                          <div className="mb-4">
                            {/* ✅ عرض prompt فقط إذا كان مختلفاً عن interactiveText */}
                            {/* ⚠️ لا نعرض promptElement إذا كان interactiveText موجوداً لأنه يحتوي على السؤال بالفعل */}
                            {prompt && prompt !== interactiveText && promptElement}
                            
                            {/* عرض interactiveText مع placeholders */}
                            <div className="text-lg font-semibold text-slate-900 mb-3 mt-2" dir="ltr">
                              <div className="inline-flex flex-wrap items-center gap-1 leading-relaxed">
                                {parts.map((part, partIndex) => {
                                if (part.type === 'text') {
                                  return <span key={partIndex}>{part.content}</span>;
                                } else {
                                  const blank = part.blank;
                                  // ✅ إصلاح: value لازم يكون دايمًا string (لا undefined)
                                  const currentAnswer = answers[itemIndex]?.interactiveAnswers?.[blank.id] ?? '';
                                  
                                  // ✅ استخدام options بدلاً من choices (حسب البنية الصحيحة من API)
                                  const blankOptions = blank.options || blank.choices || [];
                                  
                                  if (blank.type === 'dropdown' && blankOptions.length > 0) {
                                    return (
                                      <select
                                        key={partIndex}
                                        value={currentAnswer}
                                        disabled={isSubmitted}
                                        onChange={(e) => {
                                          const newAnswers = { ...answers };
                                          if (!newAnswers[itemIndex]) {
                                            newAnswers[itemIndex] = { interactiveAnswers: {} };
                                          }
                                          if (!newAnswers[itemIndex].interactiveAnswers) {
                                            newAnswers[itemIndex].interactiveAnswers = {};
                                          }
                                          newAnswers[itemIndex].interactiveAnswers[blank.id] = e.target.value;
                                          setAnswers(newAnswers);
                                          saveAnswer(itemIndex, item.questionId, {
                                            ...newAnswers[itemIndex],
                                            interactiveAnswers: newAnswers[itemIndex].interactiveAnswers,
                                          });
                                        }}
                                        className="mx-1 px-2 py-1 border border-slate-300 rounded bg-white text-slate-900 min-w-[100px]"
                                      >
                                        <option value="">-- اختر --</option>
                                        {blankOptions.map((option, optionIndex) => (
                                          <option key={optionIndex} value={option}>
                                            {option}
                                          </option>
                                        ))}
                                      </select>
                                    );
                                  } else {
                                    return (
                                      <input
                                        key={partIndex}
                                        type="text"
                                        value={currentAnswer ?? ""}
                                        disabled={isSubmitted}
                                        onChange={(e) => {
                                          const newAnswers = { ...answers };
                                          if (!newAnswers[itemIndex]) {
                                            newAnswers[itemIndex] = { interactiveAnswers: {} };
                                          }
                                          if (!newAnswers[itemIndex].interactiveAnswers) {
                                            newAnswers[itemIndex].interactiveAnswers = {};
                                          }
                                          newAnswers[itemIndex].interactiveAnswers[blank.id] = e.target.value;
                                          setAnswers(newAnswers);
                                          saveAnswer(itemIndex, item.questionId, {
                                            ...newAnswers[itemIndex],
                                            interactiveAnswers: newAnswers[itemIndex].interactiveAnswers,
                                          });
                                        }}
                                        placeholder={blank.hint || `فراغ ${blank.id.toUpperCase()}`}
                                        className="mx-1 px-2 py-1 border border-slate-300 rounded bg-white text-slate-900 min-w-[120px]"
                                      />
                                    );
                                  }
                                }
                              })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* ✅ Fill in the Blank: استخدام fillExact لتحديد عدد الفراغات */}
                      {qType === 'fill' ? (
                        <div className="text-lg font-semibold text-slate-900 mb-3 mt-2" dir="ltr">
                          {(() => {
                            // ✅ قراءة fillExact من item (من الباك)
                            const fillExact = item.fillExact || item.questionSnapshot?.fillExact || item.question?.fillExact || [];
                            // ✅ تحديد عدد الفراغات بناءً على fillExact.length
                            const inputsCount = fillExact?.length || 1;
                            
                            // ✅ قراءة الإجابات المحفوظة (fillAnswer أو fillAnswers)
                            const savedAnswers = answers[itemIndex]?.fillAnswers || 
                                               (answers[itemIndex]?.fillAnswer ? [answers[itemIndex].fillAnswer] : []);
                            
                            // ✅ تقسيم النص على ___ (3 underscores) أو استخدام fillExact.length
                            // نحاول تقسيم على ___ أولاً، وإذا لم نجد نستخدم fillExact.length
                            const blankPattern = /_{2,}/; // يبحث عن _ متكررة (2 أو أكثر)
                            let parts = [];
                            
                            if (blankPattern.test(prompt)) {
                              // إذا وجدنا ___ في النص، نقسم عليه
                              parts = prompt.split(blankPattern);
                            } else {
                              // إذا لم نجد ___، نستخدم fillExact.length لتقسيم النص
                              // نقسم النص إلى inputsCount + 1 جزء
                              const textLength = prompt.length;
                              const partLength = Math.floor(textLength / (inputsCount + 1));
                              parts = [];
                              for (let i = 0; i < inputsCount + 1; i++) {
                                parts.push(prompt.substring(i * partLength, (i + 1) * partLength));
                              }
                            }
                            
                            // ✅ التأكد من أن parts.length = inputsCount + 1
                            while (parts.length < inputsCount + 1) {
                              parts.push('');
                            }
                            
                            return (
                              <span className="inline-flex items-baseline gap-0 flex-wrap" style={{ display: 'inline' }}>
                                {parts.map((part, partIndex) => (
                                  <React.Fragment key={`${uniqueKey}-part-${partIndex}`}>
                                    <span>{part}</span>
                                    {partIndex < inputsCount && (
                                      <input
                                        key={`${uniqueKey}-fill-input-${partIndex}`}
                                        type="text"
                                        value={savedAnswers[partIndex] ?? ""}
                                        disabled={isSubmitted}
                                        onChange={(e) => {
                                          const newValue = e.target.value;
                                          // ✅ حفظ الإجابة في fillAnswers array
                                          const newAnswers = { ...answers };
                                          if (!newAnswers[itemIndex]) {
                                            newAnswers[itemIndex] = { fillAnswers: [] };
                                          }
                                          if (!newAnswers[itemIndex].fillAnswers) {
                                            newAnswers[itemIndex].fillAnswers = [];
                                          }
                                          // ✅ تحديث الإجابة في الفهرس المحدد
                                          newAnswers[itemIndex].fillAnswers[partIndex] = newValue;
                                          // ✅ التأكد من أن array بنفس طول fillExact
                                          while (newAnswers[itemIndex].fillAnswers.length < inputsCount) {
                                            newAnswers[itemIndex].fillAnswers.push('');
                                          }
                                          setAnswers(newAnswers);
                                          
                                          // ✅ حفظ الإجابة
                                          clearTimeout(window.saveTimeout);
                                          window.saveTimeout = setTimeout(() => {
                                            saveAnswer(itemIndex, item.questionId, {
                                              fillAnswers: newAnswers[itemIndex].fillAnswers
                                            });
                                          }, 1000);
                                        }}
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
                                          width: `${Math.max(60, ((savedAnswers[partIndex] || '').length + 1) * 12)}px`,
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
                                      />
                                    )}
                                  </React.Fragment>
                                ))}
                              </span>
                            );
                          })()}
                        </div>
                      ) : qType === 'interactive_text' ? null : (
                        // ✅ لا نعرض prompt هنا لـ interactive_text لأنه يعرض داخل كود interactive_text
                        <h3 className="text-lg font-semibold text-slate-900 mb-3 mt-2" dir="ltr">
                          {prompt}
                        </h3>
                      )}

                      {/* ✅ عرض الصور بعد نص السؤال وقبل الخيارات */}
                      {(() => {
                        const imagesToShow = item._allImages || [];
                        console.log('🖼️ Rendering images for question:', {
                          itemIndex,
                          hasAllImages: !!item._allImages,
                          imagesCount: imagesToShow.length,
                          images: imagesToShow,
                          imagesWithDescriptions: imagesToShow.map(img => ({
                            key: img.key,
                            url: img.url,
                            hasDescription: !!img.description,
                            description: img.description
                          }))
                        });
                        
                        if (imagesToShow.length > 0) {
                          return (
                            <div className="mb-4" dir="ltr">
                              {imagesToShow.length > 1 ? (
                                <div className="flex flex-wrap gap-4 justify-center">
                                  {imagesToShow.map((img, imgIndex) => {
                                    // ✅ الـ URL تم بناءه بالفعل مع encoding صحيح من buildImageUrlFromKey
                                    // لا نحتاج encoding إضافي هنا
                                    return (
                                    <div key={imgIndex} className="flex flex-col items-center">
                                      <img 
                                        src={img.url} 
                                        alt={`Question image ${imgIndex + 1}`} 
                                        className="max-w-[120px] w-auto h-auto rounded-lg border border-slate-200 object-contain" 
                                        onError={(e) => {
                                          const imgElement = e.target;
                                          const error = imgElement.error;
                                          let errorMessage = 'Unknown error';
                                          let errorCode = null;
                                          
                                          if (error) {
                                            switch (error.code) {
                                              case error.MEDIA_ERR_ABORTED:
                                                errorMessage = 'The user aborted the image load';
                                                errorCode = 'MEDIA_ERR_ABORTED';
                                                break;
                                              case error.MEDIA_ERR_NETWORK:
                                                errorMessage = 'A network error occurred while fetching the image';
                                                errorCode = 'MEDIA_ERR_NETWORK';
                                                break;
                                              case error.MEDIA_ERR_DECODE:
                                                errorMessage = 'An error occurred while decoding the image';
                                                errorCode = 'MEDIA_ERR_DECODE';
                                                break;
                                              case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                                                errorMessage = 'The image format is not supported';
                                                errorCode = 'MEDIA_ERR_SRC_NOT_SUPPORTED';
                                                break;
                                              default:
                                                errorMessage = `Unknown error (code: ${error.code})`;
                                                errorCode = error.code;
                                            }
                                          }
                                          
                                          console.error('❌ Image failed to load:', {
                                            url: img.url,
                                            key: img.key,
                                            errorMessage,
                                            errorCode,
                                            imgElement: {
                                              src: imgElement.src,
                                              naturalWidth: imgElement.naturalWidth,
                                              naturalHeight: imgElement.naturalHeight,
                                              complete: imgElement.complete
                                            },
                                            fullImgObject: img
                                          });
                                        }}
                                        onLoad={() => {
                                          console.log('✅ Image loaded successfully:', img.url);
                                        }}
                                      />
                                      {/* عرض الوصف إذا كان موجوداً */}
                                      {(() => {
                                        console.log(`📝 Checking description for image ${imgIndex}:`, {
                                          hasDescription: !!img.description,
                                          description: img.description,
                                          img: img
                                        });
                                        return img.description ? (
                                          <p className="mt-2 text-xs text-slate-600 text-center max-w-[120px] px-2">
                                            {img.description}
                                          </p>
                                        ) : null;
                                      })()}
                                    </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <img 
                                    src={imagesToShow[0].url} 
                                    alt="Question" 
                                    className="max-w-md w-full rounded-lg" 
                                    onError={(e) => {
                                      console.error('❌ Image failed to load:', {
                                        url: imagesToShow[0].url,
                                        img: imagesToShow[0],
                                        error: e
                                      });
                                    }}
                                    onLoad={() => {
                                      console.log('✅ Image loaded successfully:', imagesToShow[0].url);
                                    }}
                                  />
                                  {/* عرض الوصف إذا كان موجوداً */}
                                  {(() => {
                                    console.log(`📝 Checking description for single image:`, {
                                      hasDescription: !!imagesToShow[0].description,
                                      description: imagesToShow[0].description,
                                      img: imagesToShow[0]
                                    });
                                    return imagesToShow[0].description ? (
                                      <p className="mt-3 text-sm text-slate-600 text-center max-w-md px-4">
                                        {imagesToShow[0].description}
                                      </p>
                                    ) : null;
                                  })()}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* MCQ */}
                      {qType === 'mcq' && options && options.length > 0 && (
                        <div className="space-y-2">
                          {options.map((option, optIdx) => {
                            // optionsText من الباك هو array of strings مباشرة
                            const optionText = typeof option === 'string' ? option : (option.text || option);
                            const currentAnswer = answers[itemIndex];
                            const selectedIndex = currentAnswer?.selectedIndex;
                            const isSelected = selectedIndex === optIdx;

                            return (
                              <button
                                key={optIdx}
                                onClick={() => {
                                  // لكل سؤال، خزني خيار واحد فقط (يحل محل القديم)
                                  handleAnswerChange(itemIndex, optIdx, 'mcq');
                                  saveAnswer(itemIndex, item.questionId, optIdx);
                                }}
                                disabled={isSubmitted}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-base transition ${
                                  isSelected
                                    ? 'bg-red-50 border-red-500'
                                    : 'bg-slate-50 border-slate-200 hover:border-red-500'
                                }`}
                                dir="ltr"
                              >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                  isSelected ? 'border-red-600' : 'border-slate-300'
                                }`}>
                                  {isSelected && (
                                    <div className="w-3 h-3 rounded-full bg-red-600"></div>
                                  )}
                                </div>
                                <span className="text-left flex-1">{optionText}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* True/False */}
                      {qType === 'true_false' && (
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              handleAnswerChange(itemIndex, true, 'true_false');
                              saveAnswer(itemIndex, item.questionId, true);
                            }}
                            disabled={isSubmitted}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border text-base transition ${
                              answers[itemIndex]?.studentAnswerBoolean === true
                                ? 'bg-red-50 border-red-500'
                                : 'bg-slate-50 border-slate-200 hover:border-red-500'
                            }`}
                            dir="rtl"
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              answers[itemIndex]?.studentAnswerBoolean === true
                                ? 'border-red-600'
                                : 'border-slate-300'
                            }`}>
                              {answers[itemIndex]?.studentAnswerBoolean === true && (
                                <div className="w-3 h-3 rounded-full bg-red-600"></div>
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
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border text-base transition ${
                              answers[itemIndex]?.studentAnswerBoolean === false
                                ? 'bg-red-50 border-red-500'
                                : 'bg-slate-50 border-slate-200 hover:border-red-500'
                            }`}
                            dir="rtl"
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              answers[itemIndex]?.studentAnswerBoolean === false
                                ? 'border-red-600'
                                : 'border-slate-300'
                            }`}>
                              {answers[itemIndex]?.studentAnswerBoolean === false && (
                                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                              )}
                            </div>
                            <span>خطأ</span>
                          </button>
                        </div>
                      )}

                      {/* Match */}
                      {qType === 'match' && (() => {
                        // ✅ قراءة answerKeyMatch من جميع الأماكن المحتملة
                        // فحص شامل لجميع الأماكن المحتملة (بما في ذلك promptSnapshot)
                        // ✅ قراءة answerKeyMatch من جميع الأماكن المحتملة
                        // ترتيب الأولوية: item مباشرة → questionSnapshot → promptSnapshot → question → أماكن أخرى
                        const pairs = 
                          item.answerKeyMatch ?? 
                          item.questionSnapshot?.answerKeyMatch ?? 
                          item.promptSnapshot?.answerKeyMatch ??
                          item.question?.answerKeyMatch ??
                          item.questionSnapshot?.answerKey ??
                          item.answerKey ??
                          item.pairs ??
                          item.matchPairs ??
                          [];
                        
                        // ✅ Debug شامل: طباعة كامل item object
                        console.log('🔍 Match question FULL DEBUG:', {
                          'item keys': Object.keys(item),
                          'item.answerKeyMatch': item.answerKeyMatch,
                          'item.questionSnapshot': item.questionSnapshot,
                          'item.questionSnapshot keys': item.questionSnapshot ? Object.keys(item.questionSnapshot) : null,
                          'item.questionSnapshot.answerKeyMatch': item.questionSnapshot?.answerKeyMatch,
                          'item.promptSnapshot': item.promptSnapshot,
                          'item.promptSnapshot keys': item.promptSnapshot ? Object.keys(item.promptSnapshot) : null,
                          'item.promptSnapshot.answerKeyMatch': item.promptSnapshot?.answerKeyMatch,
                          'item.question': item.question,
                          'item.question keys': item.question ? Object.keys(item.question) : null,
                          'item.question.answerKeyMatch': item.question?.answerKeyMatch,
                          'item.answerKey': item.answerKey,
                          'item.pairs': item.pairs,
                          'item.matchPairs': item.matchPairs,
                          'FOUND pairs': pairs,
                          'pairs type': Array.isArray(pairs) ? 'array' : typeof pairs,
                          'pairs length': Array.isArray(pairs) ? pairs.length : 'N/A',
                          'FULL item object': JSON.stringify(item, null, 2)
                        });
                        
                        // ✅ تحويل tuples إلى قائمتين
                        let leftItems = [];
                        let rightItems = [];
                        
                        console.log('🔍 Processing pairs:', {
                          'pairs': pairs,
                          'pairs is array': Array.isArray(pairs),
                          'pairs length': Array.isArray(pairs) ? pairs.length : 'N/A',
                          'first pair': Array.isArray(pairs) && pairs.length > 0 ? pairs[0] : 'N/A',
                          'first pair type': Array.isArray(pairs) && pairs.length > 0 ? typeof pairs[0] : 'N/A',
                          'first pair is array': Array.isArray(pairs) && pairs.length > 0 ? Array.isArray(pairs[0]) : 'N/A'
                        });
                        
                        if (Array.isArray(pairs) && pairs.length > 0) {
                          // التحقق من الشكل: tuples [[left, right], ...] أو objects [{left, right}, ...]
                          if (Array.isArray(pairs[0])) {
                            // tuples: [[left, right], ...]
                            console.log('✅ Detected tuples format');
                            leftItems = pairs.map(([l]) => {
                              const val = String(l || '').trim();
                              console.log('  Left item:', val);
                              return val;
                            }).filter(Boolean);
                            rightItems = pairs.map(([, r]) => {
                              const val = String(r || '').trim();
                              console.log('  Right item:', val);
                              return val;
                            }).filter(Boolean);
                          } else if (typeof pairs[0] === 'object' && pairs[0] !== null) {
                            // objects: [{left, right}, ...]
                            console.log('✅ Detected objects format');
                            leftItems = pairs.map(pair => {
                              const val = String(pair.left || pair[0] || '').trim();
                              console.log('  Left item:', val);
                              return val;
                            }).filter(Boolean);
                            rightItems = pairs.map(pair => {
                              const val = String(pair.right || pair[1] || '').trim();
                              console.log('  Right item:', val);
                              return val;
                            }).filter(Boolean);
                          } else {
                            console.warn('⚠️ Unknown pairs format:', pairs[0]);
                          }
                        } else {
                          console.warn('⚠️ pairs is not a valid array or is empty:', pairs);
                        }
                        
                        console.log('📊 Extracted items:', {
                          leftItems,
                          rightItems,
                          'leftItems length': leftItems.length,
                          'rightItems length': rightItems.length
                        });
                        
                        // ✅ Shuffle القائمة اليمنى
                        const shuffledRight = [...rightItems].sort(() => Math.random() - 0.5);
                        
                        // ✅ تحذير إذا لم يتم العثور على pairs
                        if (leftItems.length === 0 || rightItems.length === 0) {
                          console.warn('⚠️ Match question has no pairs!', {
                            pairs,
                            leftItems,
                            rightItems,
                            'pairs type': typeof pairs,
                            'pairs is array': Array.isArray(pairs),
                            'pairs length': Array.isArray(pairs) ? pairs.length : 'N/A',
                            item
                          });
                          return (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-800">
                                ⚠️ لا توجد أزواج مطابقة متاحة. يرجى التحقق من البيانات.
                              </p>
                            </div>
                          );
                        }
                        
                        // ✅ قراءة الإجابة الحالية
                        const currentAnswer = answers[itemIndex]?.studentAnswerMatch || {};
                        
                        return (
                          <div className="space-y-4">
                            {/* Dropdowns للربط */}
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold text-slate-700 mb-2">ربط المطابقة:</h4>
                              {leftItems.map((leftItem, leftIdx) => {
                                const selectedRight = currentAnswer[leftIdx] || '';
                                
                                return (
                                  <div key={leftIdx} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                                    <span className="flex-1 text-sm font-medium">{leftItem}</span>
                                    <span className="text-slate-400">→</span>
                                    <select
                                      value={selectedRight}
                                      disabled={isSubmitted}
                                      onChange={(e) => {
                                        const newAnswer = { ...currentAnswer, [leftIdx]: e.target.value };
                                        handleAnswerChange(itemIndex, newAnswer, 'match');
                                        clearTimeout(window.saveTimeout);
                                        window.saveTimeout = setTimeout(() => {
                                          saveAnswer(itemIndex, item.questionId, newAnswer);
                                        }, 500);
                                      }}
                                      className="flex-1 p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-red-500"
                                    >
                                      <option value="">اختر...</option>
                                      {shuffledRight.map((rightItem, rightIdx) => (
                                        <option key={rightIdx} value={rightItem}>
                                          {rightItem}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* ✅ Fill - تم نقل input inline داخل نص السؤال أعلاه */}
                      {/* لا حاجة لـ textarea منفصل بعد الآن */}

                      {/* Free Text */}
                      {qType === 'free_text' && (
                        <div>
                          <textarea
                            value={answers[itemIndex]?.textAnswer || ''}
                            disabled={isSubmitted}
                            onChange={(e) => {
                              handleAnswerChange(itemIndex, e.target.value, 'free_text');
                              clearTimeout(window.saveTimeout);
                              window.saveTimeout = setTimeout(() => {
                                saveAnswer(itemIndex, item.questionId, e.target.value);
                              }, 1000);
                            }}
                            placeholder="اكتب إجابتك النصية هنا..."
                            className="w-full p-3 border-2 border-slate-200 rounded-lg text-sm resize-vertical min-h-[150px] focus:outline-none focus:border-red-500"
                            rows={8}
                          />
                          {item.minWords && (
                            <p className="text-xs text-slate-500 mt-2">
                              الحد الأدنى: {item.minWords} كلمة
                            </p>
                          )}
                          {item.maxWords && (
                            <p className="text-xs text-slate-500">
                              الحد الأقصى: {item.maxWords} كلمة
                            </p>
                          )}
                        </div>
                      )}

                      {/* Speaking */}
                      {qType === 'speaking' && (
                        <SpeakingAnswerComponent
                          itemIndex={itemIndex}
                          item={item}
                          answer={answers[itemIndex]?.audioAnswerUrl}
                          isSubmitted={isSubmitted}
                          onAnswerChange={(audioUrl) => {
                            handleAnswerChange(itemIndex, audioUrl, 'speaking');
                            saveAnswer(itemIndex, item.questionId, audioUrl);
                          }}
                          minDuration={item.minDuration}
                          maxDuration={item.maxDuration}
                        />
                      )}
                </div>
              </div>
            );
          })}
            </div>

            {/* زر تسليم الامتحان - فقط إذا لم يتم التسليم */}
            <div className="flex justify-end mt-8">
              <button
                onClick={handleSubmit}
                disabled={submitting || isSubmitted}
                className="px-6 py-3 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-sm"
              >
                {submitting ? 'جاري التسليم…' : isSubmitted ? 'تم التسليم' : '✅ تسليم الامتحان'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ExamPage;


