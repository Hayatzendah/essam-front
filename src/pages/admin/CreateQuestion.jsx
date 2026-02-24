import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionsAPI } from '../../services/questionsAPI';
import { examsAPI } from '../../services/examsAPI';
import { getGrammarTopics } from '../../services/api';
import api from '../../services/api';
import axios from 'axios';
import './CreateQuestion.css';

// API Base URL - استخدام https://api.deutsch-tests.com مباشرة لرفع الملفات
const API_BASE_URL = 'https://api.deutsch-tests.com';

// Providers constant - lowercase values for backend, capitalized labels for display
const PROVIDERS = [
  { value: 'goethe', label: 'Goethe' },
  { value: 'telc', label: 'TELC' },
  { value: 'osd', label: 'ÖSD' },
  { value: 'ecl', label: 'ECL' },
  { value: 'dtb', label: 'DTB' },
  { value: 'dtz', label: 'DTZ' },
  { value: 'deutschland-in-leben', label: 'Deutschland-in-Leben' },
  { value: 'grammatik', label: 'Grammatik' },
  { value: 'wortschatz', label: 'Wortschatz' },
];

// المستويات حسب المزود
const getLevelsForProvider = (provider) => {
  const p = (provider || '').toLowerCase();
  if (p === 'dtz') return ['B1'];
  if (p === 'dtb') return ['A2', 'B1', 'B2', 'C1'];
  return ['A1', 'A2', 'B1', 'B2', 'C1'];
};

function CreateQuestion() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    // Common fields
    prompt: '',
    qType: 'mcq',
    options: [{ text: '', isCorrect: false }],
    fillExact: '',
    regexList: [],
    answerKeyBoolean: true,
    trueFalseOptions: [
      { text: 'صحيح', isCorrect: true },
      { text: 'خطأ', isCorrect: false }
    ],
    answerKeyMatch: [{ left: '', right: '' }],
    answerKeyReorder: [],
    points: 1,
    explanation: '',

    // Free text fields
    sampleAnswer: '',
    minWords: undefined,
    maxWords: undefined,

    // Speaking fields
    minDuration: undefined, // بالثواني
    maxDuration: undefined, // بالثواني

    // Interactive Text fields
    interactiveTextType: 'fill_blanks', // 'fill_blanks' | 'reorder'
    text: '', // النص مع placeholders مثل {{a}}, {{b}}
    interactiveBlanks: [], // Array of { id, type, correctAnswers, choices?, hint? }
    interactiveReorder: { parts: [] }, // { parts: Array<{ id, text, order }> }

    // Usage Category
    usageCategory: '', // 'grammar' | 'provider' | 'vocab'

    // Grammar metadata
    grammarTopic: '',
    grammarLevel: 'A1',
    grammarTags: '',

    // Provider metadata
    provider: 'goethe', // ✅ lowercase value للباك
    providerLevel: 'A1',
    skill: 'hoeren',
    mainSkill: '', // للأسئلة من نوع Leben in Deutschland
    teilNumber: 1,
    sourceName: '',

    // Common metadata
    level: 'A1',
    tags: [],
    status: 'draft',
    section: '',
    sectionKey: '', // ✅ مفتاح القسم من الامتحان (مثل hoeren_teil1)

    // Exam linking (optional)
    examId: '',

    // Legacy fields (for backward compatibility)
    questionType: 'general',
    selectedState: '',

    // Leben in Deutschland specific fields
    images: [], // Array of image objects for state-specific questions
  });

  const [newTag, setNewTag] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [listeningClip, setListeningClip] = useState(null); // { _id, audioUrl } - للعرض والمعاينة
  const [listeningClipId, setListeningClipId] = useState(null); // _id فقط - للاستخدام في API
  const [audioUrl, setAudioUrl] = useState(null); // audioUrl للعرض
  const [grammarTopics, setGrammarTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [examSections, setExamSections] = useState([]);
  const [loadingExamSections, setLoadingExamSections] = useState(false);

  // ✅ تم إزالة multiple mode بالكامل - نستخدم single mode فقط

  // Available listening clips for picker
  const [availableListeningClips, setAvailableListeningClips] = useState([]);
  const [loadingListeningClips, setLoadingListeningClips] = useState(false);

  // Section clips (from exam section endpoint)
  const [sectionClips, setSectionClips] = useState([]);
  const [loadingSectionClips, setLoadingSectionClips] = useState(false);

  // قائمة الولايات الألمانية
  const germanStates = [
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

  // Grammar topics fetching removed - topic, level, and tags are now from the exam

  // ✅ New: Fetch available Enums on mount
  const [globalEnums, setGlobalEnums] = useState({
    skills: [],
    statuses: [],
    providers: [],
    levels: []
  });

  useEffect(() => {
    const fetchGlobalEnums = async () => {
      try {
        const enums = await api.getEnums();
        console.log('🌍 Fetched Enums for Selects:', enums);
        if (enums) {
          setGlobalEnums({
            skills: enums.skills || [],
            statuses: enums.statuses || [],
            providers: enums.providers || [],
            levels: enums.levels || []
          });
        }
      } catch (err) {
        console.error('❌ Error fetching enums:', err);
        // Fallback or just log error - user can still try to submit but might fail validation
      }
    };
    fetchGlobalEnums();
  }, []);

  // ✅ Fetch exams for linking - الباك يفلتر تلقائياً حسب المستخدم
  useEffect(() => {
    const fetchExams = async () => {
      setLoadingExams(true);
      try {
        // ✅ الباك يجب أن يفلتر الامتحانات حسب المستخدم تلقائياً
        // لكن نضيف تحقق إضافي في الفرونت للأمان
        console.log('🔍 Fetching exams for linking...');
        const response = await examsAPI.getAll({ simple: true });

        console.log('📥 Raw response from examsAPI.getAll:', response);
        console.log('📥 Response type:', typeof response);
        console.log('📥 Is array:', Array.isArray(response));

        // ✅ معالجة الـ response بشكل أفضل
        let examsArray = [];
        if (Array.isArray(response)) {
          examsArray = response;
        } else if (response?.items && Array.isArray(response.items)) {
          examsArray = response.items;
        } else if (response?.data && Array.isArray(response.data)) {
          examsArray = response.data;
        } else if (response && typeof response === 'object') {
          // محاولة استخراج الامتحانات من object
          examsArray = Object.values(response).filter(item =>
            item && typeof item === 'object' && (item._id || item.id || item.title)
          );
        }

        // ✅ التحقق من أن الامتحانات تحتوي على معلومات المستخدم (إذا كان الباك يرسلها)
        // الباك يجب أن يفلتر تلقائياً، لكن نضيف تحقق إضافي
        console.log('📋 Processed exams array:', examsArray);
        console.log('📋 Number of exams:', examsArray.length);
        if (examsArray.length > 0) {
          console.log('📋 First exam sample:', examsArray[0]);
        }

        setExams(examsArray);

        if (examsArray.length === 0) {
          console.warn('⚠️ No exams found! Response structure:', JSON.stringify(response, null, 2));
        }
      } catch (err) {
        console.error('❌ Error fetching exams:', err);
        console.error('❌ Error response:', err.response?.data);
        console.error('❌ Error status:', err.response?.status);
        setExams([]);
        // ✅ إذا كان الخطأ 403 (Forbidden)، يعني المستخدم لا يملك صلاحية
        if (err.response?.status === 403) {
          setError('ليس لديك صلاحية للوصول إلى الامتحانات');
        } else if (err.response?.status === 401) {
          setError('يرجى تسجيل الدخول أولاً');
        } else {
          setError(`خطأ في جلب الامتحانات: ${err.message || 'خطأ غير معروف'}`);
        }
      } finally {
        setLoadingExams(false);
      }
    };
    fetchExams();
  }, []);

  // ✅ جلب بيانات الامتحان واستخراج listeningAudioId من الـ section عند اختيار examId
  useEffect(() => {
    const loadExamData = async () => {
      // ✅ جلب listeningClipId إذا كان examId موجود و skill === 'hoeren'
      // لا ننتظر usageCategory لأن المستخدم قد يختار examId أولاً
      if (formData.examId && formData.skill === 'hoeren') {
        try {
          console.log('🔍 جلب بيانات الامتحان لاستخراج listeningAudioId...', {
            examId: formData.examId,
            skill: formData.skill,
            teilNumber: formData.teilNumber
          });

          const examData = await examsAPI.getById(formData.examId);
          console.log('📋 بيانات الامتحان:', examData);

          // البحث عن الـ section المناسب بناءً على skill و teilNumber
          if (examData?.sections && Array.isArray(examData.sections)) {
            // أولاً: البحث عن section مطابق تماماً (skill + teilNumber)
            let matchingSection = examData.sections.find((section) => {
              const sectionSkill = section.skill?.toLowerCase();
              const sectionTeil = section.teil || section.teilNumber;
              const formTeil = formData.teilNumber;

              // ✅ إذا كان sectionTeil undefined، نقبل أي section بـ hoeren
              if (sectionSkill === 'hoeren') {
                if (sectionTeil === undefined || sectionTeil === formTeil) {
                  return true;
                }
              }
              return false;
            });

            // إذا لم نجد section مطابق، نبحث عن أي section بـ skill === 'hoeren'
            if (!matchingSection) {
              matchingSection = examData.sections.find((section) => {
                const sectionSkill = section.skill?.toLowerCase();
                return sectionSkill === 'hoeren';
              });

              if (matchingSection) {
                console.log('⚠️ تم العثور على section بـ hoeren لكن teilNumber غير متطابق', {
                  sectionTeil: matchingSection.teil || matchingSection.teilNumber,
                  formTeil: formData.teilNumber
                });
              }
            }

            console.log('🔎 مقارنة section:', {
              found: !!matchingSection,
              sectionSkill: matchingSection?.skill?.toLowerCase(),
              sectionTeil: matchingSection?.teil || matchingSection?.teilNumber,
              formTeil: formData.teilNumber
            });

            // ✅ البحث عن listeningAudioId في الحقول المحتملة
            // جرب جميع الأسماء المحتملة للحقل
            const clipId = matchingSection?.listeningAudioId
              || matchingSection?.listeningClipId
              || matchingSection?.listeningAudio?._id
              || matchingSection?.listeningAudio?.id
              || matchingSection?.audioId
              || matchingSection?.audio?._id
              || matchingSection?.audio?.id;

            console.log('🔎 تفاصيل matchingSection:', {
              matchingSection,
              listeningAudioId: matchingSection?.listeningAudioId,
              listeningClipId: matchingSection?.listeningClipId,
              listeningAudio: matchingSection?.listeningAudio,
              audio: matchingSection?.audio,
              clipId,
              allSectionKeys: matchingSection ? Object.keys(matchingSection) : [],
              fullSection: matchingSection
            });

            if (clipId) {
              console.log('✅ تم العثور على listeningAudioId من الامتحان:', clipId);
              setListeningClipId(clipId);

              // تحديث listeningClipId في formData أيضاً
              setFormData(prev => ({
                ...prev,
                listeningClipId: clipId
              }));
            } else {
              console.warn('⚠️ لم يتم العثور على listeningAudioId في الامتحان', {
                matchingSection,
                sections: examData.sections,
                searchedSkill: 'hoeren',
                searchedTeil: formData.teilNumber,
                examId: formData.examId
              });
              // ✅ إذا لم يتم العثور على listeningAudioId، نزيل أي listeningClipId موجود
              // لأن الصوت يجب أن يأتي من الامتحان فقط
              setListeningClipId(null);
              setFormData(prev => ({
                ...prev,
                listeningClipId: null
              }));
              // ✅ لا نعرض error هنا - سنعرضه في UI بشكل أفضل
            }
          } else {
            console.warn('⚠️ الامتحان لا يحتوي على sections:', examData);
          }
        } catch (err) {
          console.error('❌ خطأ في جلب بيانات الامتحان:', err);
        }
      } else if (formData.examId && formData.skill !== 'hoeren') {
        // إذا تغير skill إلى غير hoeren، إزالة listeningClipId
        setListeningClipId(null);
        setFormData(prev => ({
          ...prev,
          listeningClipId: null
        }));
      }
    };

    loadExamData();
  }, [formData.examId, formData.skill, formData.teilNumber, formData.usageCategory]);

  // ✅ جلب التسجيلات المتاحة تلقائياً لما skill = hoeren مع provider + level + teil
  useEffect(() => {
    if (formData.skill === 'hoeren' && formData.provider && formData.providerLevel && formData.teilNumber) {
      fetchListeningClips(formData.provider, formData.providerLevel, formData.teilNumber);
    }
  }, [formData.skill, formData.provider, formData.providerLevel, formData.teilNumber]);

  // ✅ جلب أقسام الامتحان عند اختيار examId
  useEffect(() => {
    const fetchSections = async () => {
      if (!formData.examId) {
        setExamSections([]);
        setFormData(prev => ({ ...prev, sectionKey: '' }));
        return;
      }

      setLoadingExamSections(true);
      try {
        console.log('📋 جلب أقسام الامتحان:', formData.examId);
        const response = await examsAPI.getSections(formData.examId);
        const sections = Array.isArray(response) ? response : (response?.sections || response?.data || []);
        console.log('✅ أقسام الامتحان:', sections);
        setExamSections(sections);

        // إذا كان هناك قسم واحد فقط، اختره تلقائياً
        if (sections.length === 1) {
          const key = sections[0].key || sections[0].sectionKey || '';
          setFormData(prev => ({ ...prev, sectionKey: key }));
        }
      } catch (err) {
        console.error('❌ خطأ في جلب أقسام الامتحان:', err);
        setExamSections([]);
      } finally {
        setLoadingExamSections(false);
      }
    };

    fetchSections();
  }, [formData.examId]);

  // ✅ جلب clips القسم عند اختيار examId + sectionKey
  useEffect(() => {
    if (!formData.examId || !formData.sectionKey) {
      setSectionClips([]);
      return;
    }

    const fetchClips = async () => {
      setLoadingSectionClips(true);
      try {
        const data = await examsAPI.getSectionClips(formData.examId, formData.sectionKey);
        setSectionClips(data?.clips || data || []);
      } catch (err) {
        console.error('❌ خطأ في جلب clips القسم:', err);
        setSectionClips([]);
      } finally {
        setLoadingSectionClips(false);
      }
    };

    fetchClips();
  }, [formData.examId, formData.sectionKey]);

  // Fetch available listening clips for picker
  const fetchListeningClips = async (provider, level, teil) => {
    if (!provider || !level || !teil) return;

    setLoadingListeningClips(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${API_BASE_URL}/listeningclips`,
        {
          params: { provider, level, teil },
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        }
      );
      setAvailableListeningClips(response.data?.items || response.data || []);
    } catch (err) {
      console.error('Error fetching listening clips:', err);
      setAvailableListeningClips([]);
    } finally {
      setLoadingListeningClips(false);
    }
  };

  // ✅ تم إزالة multiple mode - لا حاجة لـ sharedFields أو handleModeChange

  // Add new question in multiple mode
  const handleAddQuestion = () => {
    // Save current question data first (only question-specific fields)
    const updatedQuestions = questions.map(q =>
      q.id === currentQuestionIndex
        ? {
          ...q,
          prompt: formData.prompt,
          qType: formData.qType,
          options: formData.options,
          fillExact: formData.fillExact,
          regexList: formData.regexList,
          answerKeyBoolean: formData.answerKeyBoolean,
          answerKeyMatch: formData.answerKeyMatch,
          answerKeyReorder: formData.answerKeyReorder,
          points: formData.points,
          explanation: formData.explanation,
          grammarTopic: formData.grammarTopic,
          grammarTags: formData.grammarTags,
          sourceName: formData.sourceName,
        }
        : q
    );

    const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 0;
    const newQuestion = {
      id: newId,
      // Question-specific fields only
      prompt: '',
      qType: 'mcq',
      options: [{ text: '', isCorrect: false }],
      fillExact: '',
      regexList: [],
      answerKeyBoolean: true,
      trueFalseOptions: [
        { text: 'صحيح', isCorrect: true },
        { text: 'خطأ', isCorrect: false }
      ],
      answerKeyMatch: [{ left: '', right: '' }],
      answerKeyReorder: [],
      points: 1,
      explanation: '',
      grammarTopic: '',
      grammarTags: '',
      sourceName: '',
      // Shared fields (from sharedFields state)
      usageCategory: sharedFields.usageCategory || formData.usageCategory,
      grammarLevel: sharedFields.grammarLevel || formData.grammarLevel || 'A1',
      provider: sharedFields.provider || formData.provider || 'Goethe',
      providerLevel: sharedFields.providerLevel || formData.providerLevel || 'A1',
      skill: sharedFields.skill || formData.skill || 'hoeren',
      teilNumber: sharedFields.teilNumber || formData.teilNumber || 1,
      status: sharedFields.status || formData.status || 'draft',
      examId: sharedFields.examId || formData.examId || '',
      // Share listening clip from shared state
      listeningClipId: listeningClipId || null,
      listeningClip: listeningClip || null,
      audioFileName: listeningClip?.audioUrl?.split('/').pop() || null,
    };
    setQuestions([...updatedQuestions, newQuestion]);
    setCurrentQuestionIndex(newId);
    // Set formData with shared fields + new question fields
    setFormData({
      ...newQuestion,
      // Keep shared fields in formData for display
      usageCategory: sharedFields.usageCategory || formData.usageCategory,
      grammarLevel: sharedFields.grammarLevel || formData.grammarLevel || 'A1',
      provider: sharedFields.provider || formData.provider || 'Goethe',
      providerLevel: sharedFields.providerLevel || formData.providerLevel || 'A1',
      skill: sharedFields.skill || formData.skill || 'hoeren',
      teilNumber: sharedFields.teilNumber || formData.teilNumber || 1,
      status: sharedFields.status || formData.status || 'draft',
      examId: sharedFields.examId || formData.examId || '',
    });
  };

  // Remove question in multiple mode
  const handleRemoveQuestion = (questionId) => {
    if (questions.length <= 1) {
      setError('يجب أن يكون هناك سؤال واحد على الأقل');
      return;
    }
    const updatedQuestions = questions.filter(q => q.id !== questionId);
    setQuestions(updatedQuestions);
    if (currentQuestionIndex === questionId) {
      const newIndex = updatedQuestions[0].id;
      setCurrentQuestionIndex(newIndex);
      setFormData(updatedQuestions[0]);
    }
  };

  // ✅ تم إزالة handleSwitchQuestion - لا حاجة لـ multiple mode


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Log examId selection for debugging
    if (name === 'examId') {
      console.log('📝 Exam selected:', value);
      // ✅ إعادة تعيين sectionKey عند تغيير الامتحان
      setFormData(prev => ({ ...prev, examId: value, sectionKey: '' }));
      // مسح حالة الصوت عند تغيير الامتحان
      handleRemoveAudio();
      return;
    }

    // ✅ مسح حالة الصوت عند تغيير القسم
    if (name === 'sectionKey') {
      handleRemoveAudio();
    }

    // ✅ تم إزالة multiple mode - لا حاجة لـ shared fields

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      // إذا تغير نوع السؤال (qType)، نعيد تعيين الحقول
      if (name === 'qType') {
        // إعادة تعيين الحقول حسب نوع السؤال الجديد
        if (value === 'mcq') {
          updated.options = [{ text: '', isCorrect: false }];
        } else if (value === 'true_false') {
          updated.answerKeyBoolean = true;
          updated.trueFalseOptions = [
            { text: 'صحيح', isCorrect: true },
            { text: 'خطأ', isCorrect: false }
          ];
        } else if (value === 'fill') {
          updated.fillExact = '';
          updated.regexList = [];
        } else if (value === 'match') {
          updated.answerKeyMatch = [{ left: '', right: '' }];
        } else if (value === 'reorder') {
          updated.answerKeyReorder = [];
        } else if (value === 'free_text') {
          updated.sampleAnswer = '';
          updated.minWords = undefined;
          updated.maxWords = undefined;
        } else if (value === 'speaking') {
          updated.sampleAnswer = '';
          updated.minDuration = undefined;
          updated.maxDuration = undefined;
        } else if (value === 'interactive_text') {
          updated.interactiveTextType = 'fill_blanks';
          updated.text = '';
          updated.interactiveBlanks = [];
          updated.interactiveReorder = { parts: [] };
        }
      }

      // إذا تغير usageCategory إلى leben، فرض qType = 'mcq'
      if (name === 'usageCategory' && (value === 'common' || value === 'state_specific')) {
        updated.qType = 'mcq';
        updated.options = [{ text: '', isCorrect: false }];
        updated.provider = 'leben_in_deutschland';
        // لا نستخدم skill بل mainSkill
        if (!updated.mainSkill) {
          updated.mainSkill = 'leben_test';
        }
        // إعادة تعيين الصور عند تغيير النوع
        if (value === 'common') {
          updated.images = [];
          updated.selectedState = '';
        }
      }

      // إذا تغير نوع السؤال (questionType)، نحدث الـ tags تلقائياً
      if (name === 'questionType') {
        if (value === 'general') {
          // إزالة أي tags للولايات وإضافة 300-Fragen إذا كان provider هو Deutschland-in-Leben
          const filteredTags = prev.tags.filter(
            (tag) => !germanStates.includes(tag)
          );
          if (prev.provider === 'Deutschland-in-Leben' && !filteredTags.includes('300-Fragen')) {
            updated.tags = [...filteredTags, '300-Fragen'];
          } else {
            updated.tags = filteredTags;
          }
          updated.selectedState = '';
        } else if (value === 'state') {
          // إزالة 300-Fragen tag
          updated.tags = prev.tags.filter((tag) => tag !== '300-Fragen');
        }
      }

      // إذا تغيرت الولاية المختارة، نحدث الـ tags
      if (name === 'selectedState' && value) {
        // إزالة أي tags للولايات السابقة
        const filteredTags = prev.tags.filter(
          (tag) => !germanStates.includes(tag)
        );
        // إضافة الولاية الجديدة
        updated.tags = [...filteredTags, value];
      }

      // إذا تغير الـ provider، نحدث الـ tags بناءً على نوع السؤال
      if (name === 'provider') {
        if (prev.questionType === 'general') {
          // إزالة 300-Fragen tag
          const filteredTags = prev.tags.filter((tag) => tag !== '300-Fragen');
          // إضافة 300-Fragen فقط إذا كان provider هو Deutschland-in-Leben
          if (value === 'Deutschland-in-Leben') {
            updated.tags = [...filteredTags, '300-Fragen'];
          } else {
            updated.tags = filteredTags;
          }
        }
      }

      return updated;
    });
  };

  const handleAddOption = () => {
    // إضافة خيار فارغ جديد مباشرة
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, { text: '', isCorrect: false }],
    }));
  };

  const handleRemoveOption = (index) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateOption = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt
      ),
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Handlers for fill type
  const handleAddRegex = () => {
    setFormData((prev) => ({
      ...prev,
      regexList: [...prev.regexList, ''],
    }));
  };

  const handleUpdateRegex = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      regexList: prev.regexList.map((regex, i) => (i === index ? value : regex)),
    }));
  };

  const handleRemoveRegex = (index) => {
    setFormData((prev) => ({
      ...prev,
      regexList: prev.regexList.filter((_, i) => i !== index),
    }));
  };

  // Handlers for match type
  const handleAddMatchPair = () => {
    setFormData((prev) => ({
      ...prev,
      answerKeyMatch: [...prev.answerKeyMatch, { left: '', right: '' }],
    }));
  };

  const handleUpdateMatchPair = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      answerKeyMatch: prev.answerKeyMatch.map((pair, i) =>
        i === index ? { ...pair, [field]: value } : pair
      ),
    }));
  };

  const handleRemoveMatchPair = (index) => {
    setFormData((prev) => ({
      ...prev,
      answerKeyMatch: prev.answerKeyMatch.filter((_, i) => i !== index),
    }));
  };

  // Handlers for reorder type
  const handleAddReorderItem = () => {
    setFormData((prev) => ({
      ...prev,
      answerKeyReorder: [...prev.answerKeyReorder, ''],
    }));
  };

  const handleUpdateReorderItem = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      answerKeyReorder: prev.answerKeyReorder.map((item, i) => (i === index ? value : item)),
    }));
  };

  const handleRemoveReorderItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      answerKeyReorder: prev.answerKeyReorder.filter((_, i) => i !== index),
    }));
  };

  // Handlers for Interactive Text - Fill-in-the-blanks
  const handleAddInteractiveBlank = () => {
    const nextId = String.fromCharCode(97 + formData.interactiveBlanks.length); // a, b, c, ... حتى j (10 فراغات)
    if (formData.interactiveBlanks.length >= 10) {
      setError('الحد الأقصى للفراغات هو 10');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      interactiveBlanks: [
        ...prev.interactiveBlanks,
        {
          id: nextId,
          type: 'textInput',
          correctAnswers: [],
          choices: [],
          hint: '',
        },
      ],
    }));
  };

  const handleUpdateInteractiveBlank = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      interactiveBlanks: prev.interactiveBlanks.map((blank, i) =>
        i === index ? { ...blank, [field]: value } : blank
      ),
    }));
  };

  const handleRemoveInteractiveBlank = (index) => {
    setFormData((prev) => ({
      ...prev,
      interactiveBlanks: prev.interactiveBlanks.filter((_, i) => i !== index),
    }));
  };

  const handleAddCorrectAnswer = (blankIndex) => {
    setFormData((prev) => {
      const updated = { ...prev };
      if (!updated.interactiveBlanks[blankIndex].correctAnswers) {
        updated.interactiveBlanks[blankIndex].correctAnswers = [];
      }
      updated.interactiveBlanks[blankIndex].correctAnswers.push('');
      return updated;
    });
  };

  const handleUpdateCorrectAnswer = (blankIndex, answerIndex, value) => {
    setFormData((prev) => {
      const updated = { ...prev };
      updated.interactiveBlanks[blankIndex].correctAnswers[answerIndex] = value;
      return updated;
    });
  };

  const handleRemoveCorrectAnswer = (blankIndex, answerIndex) => {
    setFormData((prev) => {
      const updated = { ...prev };
      updated.interactiveBlanks[blankIndex].correctAnswers = updated.interactiveBlanks[blankIndex].correctAnswers.filter(
        (_, i) => i !== answerIndex
      );
      return updated;
    });
  };

  const handleAddChoice = (blankIndex) => {
    setFormData((prev) => {
      const updated = { ...prev };
      if (!updated.interactiveBlanks[blankIndex].choices) {
        updated.interactiveBlanks[blankIndex].choices = [];
      }
      updated.interactiveBlanks[blankIndex].choices.push('');
      return updated;
    });
  };

  const handleUpdateChoice = (blankIndex, choiceIndex, value) => {
    setFormData((prev) => {
      const updated = { ...prev };
      updated.interactiveBlanks[blankIndex].choices[choiceIndex] = value;
      return updated;
    });
  };

  const handleRemoveChoice = (blankIndex, choiceIndex) => {
    setFormData((prev) => {
      const updated = { ...prev };
      updated.interactiveBlanks[blankIndex].choices = updated.interactiveBlanks[blankIndex].choices.filter(
        (_, i) => i !== choiceIndex
      );
      return updated;
    });
  };

  // Handlers for Interactive Text - Reorder
  const handleAddReorderPart = () => {
    setFormData((prev) => {
      const newId = String(prev.interactiveReorder.parts.length + 1);
      return {
        ...prev,
        interactiveReorder: {
          parts: [
            ...prev.interactiveReorder.parts,
            {
              id: newId,
              text: '',
              order: prev.interactiveReorder.parts.length + 1,
            },
          ],
        },
      };
    });
  };

  const handleUpdateReorderPart = (index, field, value) => {
    setFormData((prev) => {
      const updated = { ...prev };
      updated.interactiveReorder.parts[index][field] = value;
      // إذا تم تحديث order، نحدث order لجميع الأجزاء
      if (field === 'order') {
        const newOrder = parseInt(value) || 1;
        updated.interactiveReorder.parts[index].order = newOrder;
        // إعادة ترتيب الأجزاء حسب order
        updated.interactiveReorder.parts.sort((a, b) => a.order - b.order);
      }
      return updated;
    });
  };

  const handleRemoveReorderPart = (index) => {
    setFormData((prev) => {
      const updated = { ...prev };
      updated.interactiveReorder.parts = updated.interactiveReorder.parts.filter((_, i) => i !== index);
      // إعادة ترقيم order
      updated.interactiveReorder.parts.forEach((part, i) => {
        part.order = i + 1;
      });
      return updated;
    });
  };

  const handleAudioFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // التحقق من نوع الملف
      if (!file.type.startsWith('audio/')) {
        setError('الرجاء اختيار ملف صوتي فقط');
        return;
      }

      // التحقق من حجم الملف (50MB كحد أقصى)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        setError('حجم الملف كبير جداً. الحد الأقصى هو 50MB');
        return;
      }

      setAudioFile(file);
      setError('');

      // إنشاء معاينة صوتية
      const audioUrl = URL.createObjectURL(file);
      setAudioPreview(audioUrl);
    }
  };

  const handleRemoveAudio = () => {
    if (audioPreview) {
      URL.revokeObjectURL(audioPreview);
    }
    setAudioFile(null);
    setAudioPreview(null);
    setListeningClip(null); // إزالة listeningClip أيضاً
    setListeningClipId(null); // إزالة listeningClipId أيضاً
    setAudioUrl(null); // إزالة audioUrl أيضاً

    // ✅ تم إزالة multiple mode
  };

  // Handle selecting existing listening clip
  const handleSelectListeningClip = (clip) => {
    const clipId = clip._id || clip.id;
    const audioUrlValue = clip.audioUrl;

    setListeningClipId(clipId);
    setListeningClip(clip);
    setAudioUrl(audioUrlValue);
    setAudioFile(null);
    setAudioPreview(null);

    // ✅ تحديث formData أيضاً
    setFormData(prev => ({
      ...prev,
      listeningClipId: clipId
    }));

    setSuccess('تم اختيار ملف الاستماع بنجاح ✅');
  };

  // رفع ملف الصوت وإنشاء ListeningClip
  const handleUploadAudio = async () => {
    if (!audioFile) return;

    // التحقق من وجود provider, level, teil
    if (!formData.provider || !formData.providerLevel || !formData.teilNumber) {
      setError('يرجى ملء جميع حقول Provider metadata (Provider, Level, Teil) قبل رفع الملف');
      return;
    }

    try {
      setUploadingAudio(true);
      setError('');

      const formDataToSend = new FormData();
      formDataToSend.append('file', audioFile);
      formDataToSend.append('provider', formData.provider);
      formDataToSend.append('level', formData.providerLevel);
      formDataToSend.append('teil', formData.teilNumber.toString());

      // استخدام axios مباشرة مع URL كامل لـ https://api.deutsch-tests.com
      const token = localStorage.getItem('accessToken');
      const res = await axios.post(
        `${API_BASE_URL}/listeningclips/upload-audio`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: token ? `Bearer ${token}` : '',
          },
        }
      );

      // 👈 هنا المهم: حفظ listeningClipId و audioUrl من الرد
      // ✅ التأكد من وجود listeningClipId في response
      const clipId = res.data.listeningClipId || res.data._id || res.data.id;

      if (!clipId) {
        console.error('❌ ERROR: Response does not contain listeningClipId!', res.data);
        throw new Error('لم يتم إرجاع معرف ملف الصوت من الخادم');
      }

      console.log('✅ Uploaded audio clip ID:', clipId);
      const clipData = res.data;
      const audioUrlValue = res.data.audioUrl;

      setListeningClipId(clipId);
      setAudioUrl(audioUrlValue);
      setListeningClip(clipData); // للعرض والمعاينة

      // ✅ تحديث formData
      setFormData(prev => ({
        ...prev,
        listeningClipId: clipId
      }));

      // ✅ تم إزالة multiple mode

      // Refresh available listening clips
      if (formData.provider && formData.providerLevel && formData.teilNumber) {
        fetchListeningClips(formData.provider, formData.providerLevel, formData.teilNumber);
      }

      setSuccess('تم رفع ملف الاستماع بنجاح ✅');
    } catch (err) {
      console.error('Error uploading audio:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'حدث خطأ أثناء رفع الملف الصوتي'
      );
    } finally {
      setUploadingAudio(false);
    }
  };

  // رفع الصور لأسئلة Leben in Deutschland (State Specific)
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (formData.usageCategory !== 'state_specific' && formData.usageCategory !== 'common') {
      setError('يمكن رفع الصور فقط لأسئلة Leben in Deutschland (Common أو State Specific)');
      return;
    }

    try {
      setUploadingImages(true);
      setError('');

      const uploadedImages = [];

      // رفع كل صورة على حدة
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          setError(`الملف ${file.name} ليس صورة`);
          continue;
        }

        const response = await questionsAPI.uploadMedia(file);

        // بناء كائن الصورة حسب بنية API
        const imageObject = {
          type: 'image',
          key: response.key,
          mime: response.mime || file.type,
          provider: 's3',
          url: response.url || `${API_BASE_URL}/uploads/${response.key}`,
          description: '' // حقل الوصف - يمكن إضافته لاحقاً
        };

        uploadedImages.push(imageObject);
      }

      // إضافة الصور المرفوعة إلى formData
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedImages]
      }));

      setSuccess(`تم رفع ${uploadedImages.length} صورة بنجاح ✅`);

      // إعادة تعيين input
      e.target.value = '';
    } catch (err) {
      console.error('Error uploading images:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'حدث خطأ أثناء رفع الصور'
      );
    } finally {
      setUploadingImages(false);
    }
  };

  // حذف صورة من القائمة
  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setSuccess('تم حذف الصورة');
  };

  // تحديث وصف الصورة
  const handleUpdateImageDescription = (index, description) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) =>
        i === index ? { ...img, description } : img
      )
    }));
  };

  // Helper function to validate a single question
  // Helper function to validate a single question
  const validateQuestion = (questionData) => {
    // ✅ Check against fetched enums if available
    if (globalEnums.statuses.length > 0 && questionData.status) {
      if (!globalEnums.statuses.some(s => s.value === questionData.status)) {
        return `حالة السؤال "${questionData.status}" غير صالحة.`;
      }
    }

    if (questionData.usageCategory === 'provider') {
      if (globalEnums.providers.length > 0 && questionData.provider) {
        if (!globalEnums.providers.some(p => p.value === questionData.provider)) {
          return `المعهد "${questionData.provider}" غير صالح (غير موجود في القائمة).`;
        }
      }
      if (globalEnums.levels.length > 0 && questionData.providerLevel) {
        if (!globalEnums.levels.some(l => l.value === questionData.providerLevel)) {
          return `المستوى "${questionData.providerLevel}" غير صالح.`;
        }
      }
      if (globalEnums.skills.length > 0 && questionData.skill) {
        if (!globalEnums.skills.some(s => s.value === questionData.skill)) {
          return `المهارة "${questionData.skill}" غير صالحة.`;
        }
      }
    }

    if (!questionData.prompt?.trim()) {
      return 'نص السؤال مطلوب';
    }

    if (questionData.qType === 'mcq') {
      if (!questionData.options || questionData.options.length < 2) {
        return 'يجب إضافة خيارين على الأقل للأسئلة من نوع MCQ';
      }
      if (!questionData.options.some((opt) => opt.isCorrect)) {
        return 'يجب تحديد إجابة صحيحة واحدة على الأقل للأسئلة من نوع MCQ';
      }
      const emptyOptions = questionData.options.filter((opt) => !opt.text?.trim());
      if (emptyOptions.length > 0) {
        return 'جميع الخيارات يجب أن تحتوي على نص';
      }
    } else if (questionData.qType === 'fill') {
      if (!questionData.fillExact?.trim() && (!questionData.regexList || questionData.regexList.length === 0)) {
        return 'يجب إدخال الإجابة الصحيحة (fillExact) أو قائمة regex للأسئلة من نوع Fill';
      }
    } else if (questionData.qType === 'match') {
      if (!questionData.answerKeyMatch || questionData.answerKeyMatch.length < 2) {
        return 'يجب إضافة زوجين على الأقل للأسئلة من نوع Match';
      }
      const emptyPairs = questionData.answerKeyMatch.filter(
        (pair) => !pair.left?.trim() || !pair.right?.trim()
      );
      if (emptyPairs.length > 0) {
        return 'جميع أزواج المطابقة يجب أن تحتوي على قيم';
      }
    } else if (questionData.qType === 'reorder') {
      if (!questionData.answerKeyReorder || questionData.answerKeyReorder.length < 2) {
        return 'يجب إضافة عنصرين على الأقل للأسئلة من نوع Reorder';
      }
      const emptyItems = questionData.answerKeyReorder.filter((item) => !item?.trim());
      if (emptyItems.length > 0) {
        return 'جميع عناصر إعادة الترتيب يجب أن تحتوي على نص';
      }
    } else if (questionData.qType === 'interactive_text') {
      if (!questionData.prompt?.trim()) {
        return 'نص السؤال (prompt) مطلوب';
      }

      if (questionData.interactiveTextType === 'fill_blanks') {
        if (!questionData.text?.trim()) {
          return 'النص مع الفراغات (text) مطلوب';
        }
        if (!questionData.interactiveBlanks || questionData.interactiveBlanks.length < 3) {
          return 'يجب إضافة 3 فراغات على الأقل';
        }
        if (questionData.interactiveBlanks.length > 10) {
          return 'الحد الأقصى للفراغات هو 10';
        }

        // التحقق من أن كل placeholder موجود في النص
        for (const blank of questionData.interactiveBlanks) {
          if (!questionData.text.includes(`{{${blank.id}}}`)) {
            return `الفراغ ${blank.id.toUpperCase()} يجب أن يظهر في النص كـ {{${blank.id}}}`;
          }
          if (!blank.correctAnswers || blank.correctAnswers.length === 0 || blank.correctAnswers.every(a => !a?.trim())) {
            return `يجب إضافة إجابة صحيحة واحدة على الأقل للفراغ ${blank.id.toUpperCase()}`;
          }
          if (blank.type === 'dropdown') {
            if (!blank.choices || blank.choices.length < 2 || blank.choices.every(c => !c?.trim())) {
              return `يجب إضافة خيارين على الأقل للفراغ ${blank.id.toUpperCase()} (dropdown)`;
            }
          }
        }
      } else if (questionData.interactiveTextType === 'reorder') {
        if (!questionData.interactiveReorder?.parts || questionData.interactiveReorder.parts.length < 2) {
          return 'يجب إضافة جزئين على الأقل للأسئلة من نوع Reorder';
        }

        // التحقق من أن كل جزء له text و order
        for (let i = 0; i < questionData.interactiveReorder.parts.length; i++) {
          const part = questionData.interactiveReorder.parts[i];
          if (!part.text?.trim()) {
            return `يجب إدخال نص للجزء ${i + 1}`;
          }
          if (!part.id || !part.id.trim()) {
            return `يجب إدخال id للجزء ${i + 1}`;
          }
          if (!part.order || part.order < 1) {
            return `يجب إدخال order صحيح (>= 1) للجزء ${i + 1}`;
          }
        }

        // التحقق من أن order متسلسل (1, 2, 3, ...)
        const orders = questionData.interactiveReorder.parts.map(p => p.order).sort((a, b) => a - b);
        for (let i = 0; i < orders.length; i++) {
          if (orders[i] !== i + 1) {
            return 'يجب أن يكون order متسلسلاً (1, 2, 3, ...)';
          }
        }
      }
    }

    if (!questionData.usageCategory) {
      return 'يجب اختيار نوع الاستخدام (Grammar / Provider)';
    }

    // Grammar topic validation removed - topic is selected via exam

    if (questionData.usageCategory === 'provider') {
      if (!questionData.provider || !questionData.providerLevel || !questionData.skill) {
        return 'يجب ملء جميع حقول Provider metadata';
      }
      // تم إزالة validation الصوت: الصوت يُرفع الآن في فورم الامتحان (Section level)
      // if (questionData.skill === 'hoeren' && !listeningClipId) {
      //   return 'يجب رفع ملف الاستماع أولاً قبل حفظ السؤال (Hören)';
      // }
    }

    if (questionData.usageCategory === 'state_specific' && !questionData.selectedState) {
      return 'يجب اختيار الولاية لأسئلة Leben State Specific';
    }

    if ((questionData.usageCategory === 'common' || questionData.usageCategory === 'state_specific') && questionData.qType !== 'mcq') {
      return 'امتحان Leben in Deutschland يدعم فقط أسئلة MCQ';
    }

    return null;
  };

  // Helper function to parse tags from string to array
  const parseTags = (tagsString) => {
    if (!tagsString?.trim()) return [];
    return tagsString.split(',').map(t => t.trim()).filter(t => t.length > 0);
  };

  // ✅ Normalizer function واحد قبل الإرسال
  const ALLOWED_QTYPES = new Set([
    "mcq",
    "fill",
    "true_false",
    "match",
    "reorder",
    "listen",
    "free_text",
    "speaking",
    "interactive_text",
  ]);

  const UI_TO_QTYPE = {
    "MCQ": "mcq",
    "اختيار متعدد": "mcq",
    "اختيار متعدد (MCQ)": "mcq",
    "multiple choice": "mcq",
    "Fill": "fill",
    "فراغات": "fill",
    "ملء الفراغ (Fill)": "fill",
    "True/False": "true_false",
    "صحيح/خطأ (True/False)": "true_false",
    "صح وغلط": "true_false",
    "Matching": "match",
    "مطابقة (Match)": "match",
    "Reorder": "reorder",
    "إعادة ترتيب (Reorder)": "reorder",
    "Listening": "listen",
    "Free Text": "free_text",
    "إجابة نصية (كتابة / Schreiben)": "free_text",
    "Speaking": "speaking",
    "إجابة صوتية (تحدث / Sprechen)": "speaking",
  };

  // ✅ Normalizer function واحد قبل الإرسال
  const normalizeQuestionPayload = (payload) => {
    // 1) احذف type نهائياً - نرسل qType فقط
    if ("type" in payload) {
      delete payload.type;
    }

    // 2) استخرج qType من أي مكان وبعدين طبّعه
    const raw =
      payload.qType ??
      payload.questionType ??
      payload.formType ??
      payload.kind;

    const mapped =
      UI_TO_QTYPE[String(raw ?? "").trim()] ??
      String(raw ?? "").trim().toLowerCase();

    payload.qType = mapped || 'mcq';

    // 3) حماية: لو مش من الenum اوقف الإرسال
    if (!ALLOWED_QTYPES.has(payload.qType)) {
      throw new Error(`Invalid qType sent: "${payload.qType}". Allowed values: ${Array.from(ALLOWED_QTYPES).join(', ')}`);
    }

    // 4) ✅ إزالة type نهائياً مرة أخرى للتأكد
    delete payload.type;

    return payload;
  };

  // Helper function to build question data for API
  const buildQuestionData = (questionData, listeningClipIdValue = null) => {
    const data = {
      text: questionData.prompt, // Backend requires "text" field, not "prompt" - must not be empty
      qType: questionData.qType || 'mcq', // سيتم normalize لاحقاً
      status: questionData.status || 'draft',
    };

    // ❌ ممنوع إرسال type نهائياً - نرسل qType فقط

    if (questionData.points && questionData.points > 0) {
      data.points = questionData.points;
    }

    if (questionData.explanation?.trim()) {
      data.explanation = questionData.explanation;
    }

    data.usageCategory = questionData.usageCategory;

    if (questionData.usageCategory === 'grammar') {
      data.provider = 'Grammatik';
      // Level is required for grammar questions - comes from grammarLevel select
      data.level = questionData.grammarLevel || 'A1';
      // For grammar questions, always add skill and teilNumber
      data.skill = 'GRAMMAR';
      data.teilNumber = 1;
      // Tags will come from the exam, not from question form
      data.tags = [];
      data.section = 'grammar';
    } else if (questionData.usageCategory === 'provider') {
      // ✅ Fix provider mapping: تأكد من أن value هو lowercase (goethe وليس Goethe)
      const providerValue = questionData.provider?.toLowerCase() || 'goethe';
      data.provider = providerValue;
      data.level = questionData.providerLevel;
      data.skill = questionData.skill;
      data.teilNumber = questionData.teilNumber;
      // ✅ إزالة teil - الباك لا يقبله (نرسل teilNumber فقط)
      // section: 'Hoeren' (capitalized)
      data.section = questionData.skill.charAt(0).toUpperCase() + questionData.skill.slice(1);

      const providerTags = [
        questionData.provider,
        questionData.providerLevel,
        questionData.skill,
        `Teil-${questionData.teilNumber}`,
      ];
      if (questionData.sourceName?.trim()) {
        providerTags.push(questionData.sourceName);
      }
      data.tags = providerTags;
    } else if (questionData.usageCategory === 'common') {
      // Leben General 300 (common questions)
      data.provider = 'leben_in_deutschland';
      data.mainSkill = 'leben_test';
      data.usageCategory = 'common';
      data.level = questionData.level || 'A1';
      data.tags = ['300-Fragen'];

      // إضافة الصور إذا كانت موجودة
      if (questionData.images && questionData.images.length > 0) {
        data.images = questionData.images;
        // إذا كانت هناك صورة واحدة، نضيفها كـ media أيضاً
        if (questionData.images.length === 1) {
          data.media = questionData.images[0];
        }
      }
    } else if (questionData.usageCategory === 'state_specific') {
      // Leben State Specific
      data.provider = 'leben_in_deutschland';
      data.mainSkill = 'leben_test';
      data.usageCategory = 'state_specific';
      data.state = questionData.selectedState;
      data.level = questionData.level || 'A1';
      data.tags = [questionData.selectedState];

      // إضافة الصور إذا كانت موجودة
      if (questionData.images && questionData.images.length > 0) {
        data.images = questionData.images;
        // إذا كانت هناك صورة واحدة، نضيفها كـ media أيضاً
        if (questionData.images.length === 1) {
          data.media = questionData.images[0];
        }
      }
    } else {
      data.provider = questionData.provider;
      data.level = questionData.level;
      data.tags = questionData.tags || [];
    }

    if (questionData.qType === 'mcq') {
      data.options = questionData.options.map((opt) => ({
        text: opt.text,
        isCorrect: opt.isCorrect,
      }));
    } else if (questionData.qType === 'true_false') {
      // ✅ للباك: فقط answerKeyBoolean بدون options
      data.answerKeyBoolean = questionData.answerKeyBoolean;
      // ❌ لا نرسل options لأسئلة true_false - الباك لا يقبلها
    } else if (questionData.qType === 'free_text') {
      // ✅ للباك: فقط sampleAnswer, minWords, maxWords - بدون options و answerKeyBoolean
      if (questionData.sampleAnswer?.trim()) {
        data.sampleAnswer = questionData.sampleAnswer;
      }
      if (questionData.minWords !== undefined && questionData.minWords !== null) {
        data.minWords = questionData.minWords;
      }
      if (questionData.maxWords !== undefined && questionData.maxWords !== null) {
        data.maxWords = questionData.maxWords;
      }
      // ❌ لا نرسل options أو answerKeyBoolean لأسئلة free_text
    } else if (questionData.qType === 'speaking') {
      // ✅ للباك: فقط sampleAnswer, minDuration, maxDuration - بدون options و answerKeyBoolean
      if (questionData.sampleAnswer?.trim()) {
        data.sampleAnswer = questionData.sampleAnswer;
      }
      if (questionData.minDuration !== undefined && questionData.minDuration !== null) {
        data.minDuration = questionData.minDuration;
      }
      if (questionData.maxDuration !== undefined && questionData.maxDuration !== null) {
        data.maxDuration = questionData.maxDuration;
      }
      // ❌ لا نرسل options أو answerKeyBoolean لأسئلة speaking
    } else if (questionData.qType === 'fill') {
      // For fill questions, backend requires fillExact as an array: ["answer"]
      // fillExact must be an array, not a string or empty
      if (questionData.fillExact?.trim()) {
        data.fillExact = [questionData.fillExact.trim()]; // Must be array: ["answer"]
      }
      if (questionData.regexList && questionData.regexList.length > 0) {
        data.regexList = questionData.regexList.filter((regex) => regex?.trim());
      }
    } else if (questionData.qType === 'match') {
      // ✅ تحويل answerKeyMatch من [{left, right}] إلى [[left, right]] (tuples)
      data.answerKeyMatch = (questionData.answerKeyMatch ?? []).map((item) => {
        // دعم كلا الشكلين (objects أو arrays) للتوافق
        if (Array.isArray(item)) {
          return [String(item[0] ?? '').trim(), String(item[1] ?? '').trim()];
        }
        return [String(item.left ?? '').trim(), String(item.right ?? '').trim()];
      });
    } else if (questionData.qType === 'reorder') {
      data.answerKeyReorder = questionData.answerKeyReorder.filter((item) => item?.trim());
    } else if (questionData.qType === 'interactive_text') {
      // Interactive Text: إرسال prompt و interactiveText
      if (questionData.prompt?.trim()) {
        data.prompt = questionData.prompt.trimStart(); /* الاحتفاظ بالأسطر الفارغة تحت السؤال */
      }

      // إرسال النوع الفرعي
      if (questionData.interactiveTextType === 'fill_blanks') {
        // Fill-in-the-blanks: استخدام interactiveText (أو text كـ fallback للتوافق)
        // ✅ المطلوب: استخدام interactiveText (الحقل الأساسي من الباك)
        const interactiveTextValue = questionData.interactiveText?.trim() || questionData.text?.trim();
        if (interactiveTextValue) {
          // ✅ إرسال interactiveText (الحقل الأساسي المطلوب من الباك)
          data.interactiveText = interactiveTextValue;
          // إرسال text أيضاً للتوافق مع الباك إذا كان يستخدمه
          data.text = interactiveTextValue;
        }
        if (questionData.interactiveBlanks && questionData.interactiveBlanks.length >= 3 && questionData.interactiveBlanks.length <= 10) {
          data.interactiveBlanks = questionData.interactiveBlanks.map((blank) => {
            const blankData = {
              id: blank.id,
              type: blank.type,
              correctAnswers: blank.correctAnswers.filter((ans) => ans?.trim()),
            };
            // ✅ استخدام options بدلاً من choices (حسب البنية الصحيحة من API)
            if (blank.type === 'dropdown' && blank.choices && blank.choices.length >= 2) {
              blankData.options = blank.choices.filter((choice) => choice?.trim());
            }
            if (blank.hint?.trim()) {
              blankData.hint = blank.hint.trim();
            }
            return blankData;
          });
        }
      } else if (questionData.interactiveTextType === 'reorder') {
        // Reorder
        if (questionData.interactiveReorder?.parts && questionData.interactiveReorder.parts.length >= 2) {
          data.interactiveReorder = {
            parts: questionData.interactiveReorder.parts
              .filter((part) => part.text?.trim())
              .map((part) => ({
                id: part.id,
                text: part.text.trim(),
                order: part.order || 1,
              })),
          };
        }
      }
    }

    if (questionData.section && questionData.section.trim() && !data.section) {
      data.section = questionData.section;
    }

    // ✅ Fix: للأسئلة من نوع hoeren مع usageCategory = provider: يجب إرسال listeningClipId دائماً
    // حتى لو كان examId موجود (الباك يطلب listeningClipId is required)
    if (questionData.usageCategory === 'provider' && questionData.skill === 'hoeren') {
      // ✅ إرسال listeningClipId دائماً للأسئلة من نوع hoeren مع provider
      // جرب من listeningClipIdValue أولاً، ثم من questionData
      const clipId = listeningClipIdValue || questionData.listeningClipId;

      // ✅ إضافة listeningClipId - يجب أن يكون موجوداً دائماً
      if (clipId) {
        data.listeningClipId = clipId;
        console.log('✅ Added listeningClipId to payload in buildQuestionData:', clipId);
      } else {
        // ⚠️ هذا خطأ - يجب أن يكون clipId موجوداً قبل استدعاء buildQuestionData
        console.error('❌ CRITICAL ERROR in buildQuestionData: listeningClipId is missing!', {
          listeningClipIdValue,
          questionDataListeningClipId: questionData.listeningClipId,
          usageCategory: questionData.usageCategory,
          skill: questionData.skill,
          examId: questionData.examId
        });
        // لا نضيف listeningClipId إذا كان null - سيتم رفضه في handleSubmit
      }
    } else if (listeningClipIdValue || questionData.listeningClipId) {
      // للأنواع الأخرى: إرسال listeningClipId إذا كان موجوداً
      data.listeningClipId = listeningClipIdValue || questionData.listeningClipId;
    }

    // Add examId if provided
    if (questionData.examId) {
      data.examId = questionData.examId;
    }

    // ✅ التأكد من إرسال teilNumber للأسئلة المرتبطة بامتحان (بدون teil)
    if (questionData.examId && questionData.usageCategory === 'provider') {
      if (questionData.teilNumber) {
        data.teilNumber = questionData.teilNumber;
      }
    }

    // ✅ إزالة teil نهائياً إذا كان موجوداً (محظور من الباك - يجب استخدام teilNumber فقط)
    if (data.teil) {
      delete data.teil;
    }

    // ✅ إزالة type نهائياً (نرسل qType فقط)
    if (data.type) {
      delete data.type;
    }

    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setSuccess('');

    // ✅ في وضع single: تأكد من إضافة listeningClipId إلى formData
    const finalListeningClipId = listeningClipId || formData.listeningClipId;
    console.log('🔍 Building questionsToSubmit for single mode:', {
      stateListeningClipId: listeningClipId,
      formDataListeningClipId: formData.listeningClipId,
      finalListeningClipId,
      formDataKeys: Object.keys(formData),
      usageCategory: formData.usageCategory,
      skill: formData.skill
    });

    const questionsToSubmit = [{
      ...formData,
      listeningClipId: finalListeningClipId, // ✅ إضافة listeningClipId من state أو formData
    }];

    // Validate all questions
    for (let i = 0; i < questionsToSubmit.length; i++) {
      const q = questionsToSubmit[i];
      const validationError = validateQuestion(q);
      if (validationError) {
        setError(`سؤال ${i + 1}: ${validationError}`);
        setLoading(false);
        return;
      }

      // تم إزالة validation الصوت: الصوت يُرفع الآن في فورم الامتحان (Section level)
      // التحقق من listeningClipId للأسئلة من نوع hoeren
      // if (q.usageCategory === 'provider' && q.skill === 'hoeren') {
      //   const clipId = questionMode === 'multiple' ? q.listeningClipId : listeningClipId;
      //   if (!clipId) {
      //     setError(`سؤال ${i + 1}: يجب رفع ملف الاستماع أولاً`);
      //     if (questionMode === 'multiple') {
      //       setCurrentQuestionIndex(q.id);
      //       setFormData(q);
      //     }
      //     return;
      //   }
      // }
    }

    setLoading(true);

    try {
      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < questionsToSubmit.length; i++) {
        const questionData = questionsToSubmit[i];
        let clipId = null;

        // ✅ Fix: للأسئلة من نوع hoeren مع usageCategory = provider: يجب إرسال listeningClipId دائماً
        // حتى لو كان examId موجود (الباك يطلب: listeningClipId is required)
        if (questionData.usageCategory === 'provider' && questionData.skill === 'hoeren') {
          // ✅ إرسال listeningClipId دائماً للأسئلة من نوع hoeren مع provider
          // ✅ نستخدم single mode فقط - من state أو questionData
          clipId = listeningClipId || questionData.listeningClipId;

          // ✅ إذا لم يكن clipId موجوداً وكان examId موجوداً، حاول جلب البيانات من الامتحان
          if (!clipId && questionData.examId) {
            try {
              console.log('🔍 محاولة جلب listeningClipId من الامتحان قبل الحفظ...', {
                examId: questionData.examId,
                skill: questionData.skill,
                teilNumber: questionData.teilNumber
              });

              const examData = await examsAPI.getById(questionData.examId);

              if (examData?.sections && Array.isArray(examData.sections)) {
                // ✅ البحث المرن عن section
                let matchingSection = examData.sections.find((section) => {
                  const sectionSkill = section.skill?.toLowerCase();
                  const sectionTeil = section.teil || section.teilNumber;
                  const formTeil = questionData.teilNumber;

                  // ✅ إذا كان sectionTeil undefined، نقبل أي section بـ hoeren
                  if (sectionSkill === 'hoeren') {
                    if (sectionTeil === undefined || sectionTeil === formTeil) {
                      return true;
                    }
                  }
                  return false;
                });

                // إذا لم نجد، نبحث عن أي section بـ hoeren
                if (!matchingSection) {
                  matchingSection = examData.sections.find((section) => {
                    return section.skill?.toLowerCase() === 'hoeren';
                  });
                }

                // ✅ البحث عن listeningAudioId في جميع الحقول المحتملة
                const foundClipId = matchingSection?.listeningAudioId
                  || matchingSection?.listeningClipId
                  || matchingSection?.listeningAudio?._id
                  || matchingSection?.listeningAudio?.id
                  || matchingSection?.audioId
                  || matchingSection?.audio?._id
                  || matchingSection?.audio?.id;

                if (foundClipId) {
                  console.log('✅ تم العثور على listeningClipId من الامتحان قبل الحفظ:', foundClipId);
                  clipId = foundClipId;

                  // تحديث state أيضاً
                  setListeningClipId(foundClipId);
                  setFormData(prev => ({ ...prev, listeningClipId: foundClipId }));
                  // ✅ تحديث questionData مباشرة أيضاً
                  questionData.listeningClipId = foundClipId;
                } else {
                  console.warn('⚠️ لم يتم العثور على listeningClipId في الامتحان', {
                    examData,
                    sections: examData?.sections,
                    searchedSkill: 'hoeren',
                    searchedTeil: questionData.teilNumber
                  });
                }
              } else {
                console.warn('⚠️ الامتحان لا يحتوي على sections:', examData);
              }
            } catch (err) {
              console.error('❌ خطأ في جلب listeningClipId من الامتحان:', err);
            }
          }

          if (!clipId) {
            // ✅ listeningClipId مطلوب دائماً للأسئلة من نوع hoeren مع provider
            // حتى لو كان examId موجوداً، يجب أن يكون listeningClipId موجوداً
            console.error(`❌ CRITICAL: listeningClipId is missing for Hören question!`, {
              examId: questionData.examId,
              skill: questionData.skill,
              teilNumber: questionData.teilNumber,
              questionDataListeningClipId: questionData.listeningClipId,
              stateListeningClipId: listeningClipId,
            });
            setError(`سؤال ${i + 1}: يرجى اختيار ملف الاستماع أولاً (listeningClipId مطلوب) 🚨`);
            setLoading(false);
            return;
          }
          console.log(`✅ Using ListeningClipId for Hören question ${i + 1}:`, clipId);
          console.log(`📋 Source: fromState=${!!listeningClipId}, fromQuestionData=${!!questionData.listeningClipId}`);
        }

        // ✅ Debug: Log قبل استدعاء buildQuestionData
        console.log(`🔍 Before buildQuestionData for Question ${i + 1}:`, {
          clipId,
          questionDataListeningClipId: questionData.listeningClipId,
          questionDataKeys: Object.keys(questionData),
          usageCategory: questionData.usageCategory,
          skill: questionData.skill
        });

        const apiQuestionData = buildQuestionData(questionData, clipId);

        // ✅ Debug: Log question data after buildQuestionData - التأكد من وجود listeningClipId
        console.log(`📋 Question ${i + 1} data after buildQuestionData:`, {
          examId: questionData.examId,
          usageCategory: questionData.usageCategory,
          skill: questionData.skill,
          clipIdPassed: clipId,
          listeningClipIdInPayload: apiQuestionData.listeningClipId,
          hasListeningClipId: !!apiQuestionData.listeningClipId,
          fullPayloadKeys: Object.keys(apiQuestionData)
        });

        // ✅ التحقق من وجود listeningClipId في payload للأسئلة من نوع hoeren
        if (questionData.usageCategory === 'provider' && questionData.skill === 'hoeren') {
          if (!apiQuestionData.listeningClipId) {
            console.error('❌ CRITICAL ERROR: listeningClipId is missing in payload!', {
              clipId,
              questionDataListeningClipId: questionData.listeningClipId,
              questionData: { ...questionData, options: '...' },
              apiQuestionData: { ...apiQuestionData, options: '...' }
            });
            setError(`سؤال ${i + 1}: يرجى اختيار ملف الاستماع أولاً (listeningClipId مطلوب) 🚨`);
            setLoading(false);
            return;
          } else {
            console.log(`✅ listeningClipId موجود في apiQuestionData: ${apiQuestionData.listeningClipId}`);
          }
        }

        try {
          if (questionData.examId) {
            // ✅ تحقق أمني: التأكد من أن examId موجود في قائمة الامتحانات التي يملكها المستخدم
            const examExists = exams.some(exam => {
              const examId = exam._id || exam.id || '';
              return examId === questionData.examId;
            });

            if (!examExists) {
              console.error('❌ Security: examId not found in user\'s exams list:', questionData.examId);
              setError('⚠️ خطأ أمني: الامتحان المحدد غير موجود في قائمة امتحاناتك. يرجى اختيار امتحان صحيح.');
              setLoading(false);
              return;
            }

            // ✅ سؤال مربوط بامتحان → /questions/with-exam
            // ✅ استخدام sectionKey من الـ dropdown بدلاً من sectionTitle
            const selectedSectionKey = questionData.sectionKey || formData.sectionKey || '';

            // ✅ جلب sectionTitle كـ fallback من القسم المختار
            let sectionTitle = 'Default Section';
            if (selectedSectionKey && examSections.length > 0) {
              const matchedSec = examSections.find(s => (s.key || s.sectionKey) === selectedSectionKey);
              if (matchedSec) {
                sectionTitle = matchedSec.title || matchedSec.name || selectedSectionKey;
              }
            } else if (questionData.usageCategory === 'grammar') {
              sectionTitle = 'Grammar Section';
            }

            // Build question payload (without grammarTopic and grammarLevel for grammar questions)
            const questionPayload = { ...apiQuestionData };

            // For grammar questions with exam: remove grammarTopic and tags from question
            // But keep level (from grammarLevel select) as it's required
            const isGrammar = questionData.usageCategory === 'grammar';
            if (isGrammar) {
              delete questionPayload.grammarTopic;
              delete questionPayload.grammarLevel;
              // Keep level - it's required and comes from grammarLevel select
              questionPayload.level = questionData.grammarLevel || 'A1';
              // Remove tags as they come from exam
              delete questionPayload.tags;
              // Ensure skill and teilNumber are set
              // ✅ FIX: Use 'grammar' (lowercase) directly or from enums if available
              // User confirmed backend expects 'grammar'
              questionPayload.skill = 'grammar';
              questionPayload.teilNumber = 1;
            }

            const payloadWithExam = {
              ...questionPayload,
              examId: questionData.examId, // ✅ مطلوب - تم التحقق من أنه موجود في قائمة المستخدم
              sectionTitle: sectionTitle, // ✅ fallback
            };

            // ✅ إضافة sectionKey إذا كان موجوداً (الأولوية لـ sectionKey)
            if (selectedSectionKey) {
              payloadWithExam.sectionKey = selectedSectionKey;
            }

            // ✅ Debug: التأكد من أن sectionKey و teilNumber صحيحين
            console.log(`📋 Question ${i + 1} payload with exam:`, {
              examId: payloadWithExam.examId,
              sectionKey: payloadWithExam.sectionKey,
              sectionTitle: payloadWithExam.sectionTitle,
              teilNumber: payloadWithExam.teilNumber,
              skill: payloadWithExam.skill,
              status: payloadWithExam.status,
              qType: payloadWithExam.qType
            });

            // For grammar questions: do NOT include "exam" object, only examId
            // The exam object should NOT be sent for grammar questions
            // examId is already included above

            // ✅ Fix: للأسئلة من نوع hoeren مع usageCategory = provider: يجب إرسال listeningClipId دائماً
            // حتى لو كان examId موجود (الباك يطلب: listeningClipId is required)
            // لا نحذف listeningClipId - يجب إرساله

            // ✅ إزالة teil إذا كان موجوداً (محظور من الباك - يجب استخدام teilNumber فقط)
            if (payloadWithExam.teil) {
              delete payloadWithExam.teil;
            }

            // ✅ استخدام normalizer function واحد قبل الإرسال
            const finalPayload = normalizeQuestionPayload({ ...payloadWithExam });

            // ✅ التأكد من وجود الحقول المطلوبة
            if (!finalPayload.examId) {
              throw new Error('examId is required');
            }
            if (questionData.skill === 'hoeren' && !finalPayload.teilNumber) {
              console.warn('⚠️ Listening question missing teilNumber');
            }
            if (!finalPayload.text && !finalPayload.prompt) {
              throw new Error('text/prompt is required');
            }
            if (!finalPayload.qType) {
              throw new Error('qType is required');
            }

            // ✅ console.log للـ payload قبل الإرسال - التأكد من وجود listeningClipId
            console.log('📤 FINAL /questions/with-exam payload:', JSON.stringify(finalPayload, null, 2));

            // ✅ التحقق النهائي من وجود listeningClipId للأسئلة من نوع hoeren
            // ✅ منطق صحيح: إذا كان examId موجود، يجب أن يكون listeningClipId موجوداً من الامتحان
            if (questionData.usageCategory === 'provider' && questionData.skill === 'hoeren') {
              if (!finalPayload.listeningClipId) {
                // ✅ إذا كان examId موجود، يعني أن الصوت يجب أن يأتي من الامتحان
                if (finalPayload.examId) {
                  console.error('❌ CRITICAL ERROR: listeningClipId is missing but examId exists!', {
                    examId: finalPayload.examId,
                    finalPayload,
                    message: 'الصوت يجب أن يكون موجوداً في الامتحان أولاً'
                  });
                  setError(`سؤال ${i + 1}: لم يتم العثور على ملف صوتي في الامتحان المحدد. يرجى التأكد من رفع ملف الصوت في فورم الامتحان (في الـ Section المناسب) أولاً. 🚨`);
                } else {
                  // إذا لم يكن examId موجود، يمكن اختيار الصوت يدوياً (لكن هذا السيناريو نادر)
                  console.error('❌ CRITICAL ERROR: listeningClipId is missing!', {
                    finalPayload,
                    clipId,
                    questionDataListeningClipId: questionData.listeningClipId
                  });
                  setError(`سؤال ${i + 1}: يرجى اختيار ملف الاستماع أولاً (listeningClipId مطلوب) 🚨`);
                }
                setLoading(false);
                return;
              } else {
                console.log('✅ listeningClipId موجود في final payload:', finalPayload.listeningClipId);
              }
            }

            // Debug: Verify payload contains all required fields for grammar fill questions
            if (questionData.usageCategory === 'grammar' && questionData.qType === 'fill') {
              console.log('✅ Grammar Fill Question Payload Verification:', {
                hasText: !!payloadWithExam.text,
                text: payloadWithExam.text,
                hasQType: !!payloadWithExam.qType,
                qType: payloadWithExam.qType,
                hasFillExact: !!payloadWithExam.fillExact,
                fillExact: payloadWithExam.fillExact,
                hasUsageCategory: !!payloadWithExam.usageCategory,
                usageCategory: payloadWithExam.usageCategory,
                hasLevel: !!payloadWithExam.level,
                level: payloadWithExam.level,
                hasSkill: !!payloadWithExam.skill,
                skill: payloadWithExam.skill,
                hasTeilNumber: !!payloadWithExam.teilNumber,
                teilNumber: payloadWithExam.teilNumber,
                hasExamId: !!payloadWithExam.examId,
                examId: payloadWithExam.examId,
              });
            }

            // ✅ console.log للـ payload قبل الإرسال
            console.log('📤 payload before send:', JSON.stringify(payloadWithExam, null, 2));

            await questionsAPI.createWithExam(finalPayload);
          } else {
            // ✅ سؤال بدون امتحان → /questions
            // ✅ استخدام normalizer function واحد قبل الإرسال
            const finalPayload = normalizeQuestionPayload({ ...apiQuestionData });
            console.log('📤 FINAL /questions payload:', JSON.stringify(finalPayload, null, 2));
            await questionsAPI.create(finalPayload);
          }
          successCount++;
        } catch (err) {
          console.error(`Error creating question ${i + 1}:`, err);
          errorCount++;
          if (errorCount === 1) {
            setError(
              `سؤال ${i + 1}: ${err.response?.data?.message ||
              err.response?.data?.error ||
              'حدث خطأ أثناء إنشاء السؤال'}`
            );
          }
        }
      }

      if (successCount > 0) {
        setSuccess('تم إنشاء السؤال بنجاح!');

        // Reset form after 2 seconds
        setTimeout(() => {
          const resetData = {
            prompt: '',
            qType: 'mcq',
            options: [{ text: '', isCorrect: false }],
            fillExact: '',
            regexList: [],
            answerKeyBoolean: true,
            trueFalseOptions: [
              { text: 'صحيح', isCorrect: true },
              { text: 'خطأ', isCorrect: false }
            ],
            answerKeyMatch: [{ left: '', right: '' }],
            answerKeyReorder: [],
            points: 1,
            explanation: '',
            sampleAnswer: '',
            minWords: undefined,
            maxWords: undefined,
            minDuration: undefined,
            maxDuration: undefined,
            usageCategory: formData.usageCategory || '',
            grammarTopic: '',
            grammarLevel: formData.grammarLevel || 'A1',
            grammarTags: '',
            provider: formData.provider || 'Goethe',
            providerLevel: formData.providerLevel || 'A1',
            skill: formData.skill || 'hoeren',
            teilNumber: formData.teilNumber || 1,
            sourceName: '',
            level: 'A1',
            tags: [],
            status: formData.status || 'draft',
            section: '',
            sectionKey: formData.sectionKey || '', // ✅ الاحتفاظ بـ sectionKey المختار
            examId: formData.examId || '',
            questionType: 'general',
            selectedState: '',
          };
          setFormData(resetData);
          setAudioFile(null);
          setAudioPreview(null);
          setListeningClip(null); // إعادة تعيين listeningClip
          setListeningClipId(null); // إعادة تعيين listeningClipId
          setAudioUrl(null); // إعادة تعيين audioUrl
          setSuccess('');
        }, 2000);
      } else {
        setError('فشل إنشاء جميع الأسئلة');
      }
    } catch (err) {
      console.error('Create question error:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'حدث خطأ أثناء إنشاء السؤال'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-question-page">
      <div className="page-header">
        <button
          onClick={() => navigate('/welcome')}
          className="back-btn create-question-back-btn"
          title="العودة للوحة التحكم"
          style={{ background: 'white', border: '1px solid #DEE2E6', padding: '10px', borderRadius: '8px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg fill="none" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
              stroke="#000000"
              fill="none"
              style={{ stroke: '#000000' }}
            />
          </svg>
        </button>
      </div>

      <div className="create-question-container">
        <form onSubmit={handleSubmit} className="question-form">
          {/* ✅ تم إزالة Mode Selection - نستخدم single mode فقط */}

          {/* ✅ تم إزالة Multiple Questions Navigation */}
          {false && (
            <div className="form-group" style={{
              backgroundColor: '#f9fafb',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontWeight: 'bold' }}>
                  الأسئلة ({questions.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  + إضافة سؤال جديد
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleSwitchQuestion(q.id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: currentQuestionIndex === q.id ? '#3b82f6' : '#fff',
                      color: currentQuestionIndex === q.id ? 'white' : '#374151',
                      border: `2px solid ${currentQuestionIndex === q.id ? '#3b82f6' : '#e5e7eb'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: currentQuestionIndex === q.id ? '600' : '400',
                      position: 'relative',
                      minWidth: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '4px'
                    }}
                  >
                    <span>سؤال {idx + 1}</span>
                    {q.audioFileName && (
                      <span style={{
                        fontSize: '10px',
                        opacity: 0.8,
                        maxWidth: '100px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        🎵 {q.audioFileName}
                      </span>
                    )}
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveQuestion(q.id);
                        }}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold'
                        }}
                      >
                        ×
                      </button>
                    )}
                  </button>
                ))}
              </div>
              {questions.length > 0 && (
                <p style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280' }}>
                  السؤال الحالي: {questions.findIndex(q => q.id === currentQuestionIndex) + 1} من {questions.length}
                </p>
              )}
            </div>
          )}

          {/* Question-Specific Fields Section for Multiple Questions Mode - تم إزالته */}
          {false && questionMode === 'multiple' && (
            <div className="form-group" style={{
              backgroundColor: '#f0f9ff',
              padding: '20px',
              borderRadius: '8px',
              border: '2px solid #3b82f6',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold', color: '#1e40af' }}>
                📝 بيانات السؤال الحالي (سؤال {questions.findIndex(q => q.id === currentQuestionIndex) + 1})
              </h3>

              {/* Prompt */}
              <div className="form-group">
                <label htmlFor="prompt">نص السؤال *</label>
                <textarea
                  id="prompt"
                  name="prompt"
                  value={formData.prompt}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="أدخل نص السؤال..."
                />
              </div>

              {/* Question Type */}
              <div className="form-group">
                <label htmlFor="qType">نوع السؤال *</label>
                <select
                  id="qType"
                  name="qType"
                  value={formData.qType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="mcq">اختيار متعدد (MCQ)</option>
                  <option value="true_false">صحيح/خطأ (True/False)</option>
                  <option value="fill">ملء الفراغ (Fill)</option>
                  <option value="match">مطابقة (Match)</option>
                  <option value="interactive_text">نص تفاعلي (Interactive Text)</option>
                </select>
              </div>

              {/* Options - MCQ only */}
              {formData.qType === 'mcq' && (
                <div className="form-group">
                  <label>الخيارات *</label>
                  {formData.options.map((option, index) => (
                    <div key={index} className="option-item">
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) =>
                          handleUpdateOption(index, 'text', e.target.value)
                        }
                        placeholder={`الخيار ${index + 1}`}
                        className="option-input"
                      />
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={option.isCorrect}
                          onChange={(e) =>
                            handleUpdateOption(index, 'isCorrect', e.target.checked)
                          }
                        />
                        صحيح
                      </label>
                      {formData.options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="remove-btn"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="add-option-btn"
                  >
                    + إضافة خيار
                  </button>
                </div>
              )}

              {/* True/False Answer */}
              {formData.qType === 'true_false' && (
                <div className="form-group">
                  <label>الإجابات * (اكتب الإجابتين واختر الصحيحة)</label>
                  <div className="options-container">
                    {formData.trueFalseOptions.map((option, index) => (
                      <div key={index} className="option-item">
                        <input
                          type="radio"
                          name="trueFalseCorrect"
                          checked={option.isCorrect}
                          onChange={() => {
                            setFormData((prev) => ({
                              ...prev,
                              trueFalseOptions: prev.trueFalseOptions.map((opt, i) => ({
                                ...opt,
                                isCorrect: i === index
                              })),
                              answerKeyBoolean: index === 0
                            }));
                          }}
                        />
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => {
                            const newOptions = [...formData.trueFalseOptions];
                            newOptions[index].text = e.target.value;
                            setFormData((prev) => ({ ...prev, trueFalseOptions: newOptions }));
                          }}
                          placeholder={`الإجابة ${index + 1}`}
                          className="option-input"
                        />
                        {option.isCorrect && <span className="correct-badge">✓ صحيحة</span>}
                      </div>
                    ))}
                  </div>
                  <small>اختر الإجابة الصحيحة بالنقر على الدائرة بجانبها</small>
                </div>
              )}

              {/* Free Text Answer */}
              {formData.qType === 'free_text' && (
                <div className="form-group">
                  <label htmlFor="sampleAnswer">نموذج إجابة (اختياري - للمدرس فقط)</label>
                  <textarea
                    id="sampleAnswer"
                    name="sampleAnswer"
                    value={formData.sampleAnswer}
                    onChange={handleInputChange}
                    placeholder="اكتب نموذج إجابة مرجعي للمدرس (لن يظهر للطالب)..."
                    rows={5}
                    className="option-input"
                  />
                  <small>نموذج إجابة مرجعي للمدرس عند التصحيح (لن يظهر للطالب)</small>

                  <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label htmlFor="minWords" style={{ fontSize: '12px', color: '#6b7280' }}>
                        الحد الأدنى للكلمات (اختياري)
                      </label>
                      <input
                        type="number"
                        id="minWords"
                        name="minWords"
                        value={formData.minWords || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseInt(e.target.value) || undefined;
                          setFormData((prev) => ({ ...prev, minWords: value }));
                        }}
                        min="0"
                        placeholder="مثال: 50"
                        className="option-input"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label htmlFor="maxWords" style={{ fontSize: '12px', color: '#6b7280' }}>
                        الحد الأقصى للكلمات (اختياري)
                      </label>
                      <input
                        type="number"
                        id="maxWords"
                        name="maxWords"
                        value={formData.maxWords || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseInt(e.target.value) || undefined;
                          setFormData((prev) => ({ ...prev, maxWords: value }));
                        }}
                        min="0"
                        placeholder="مثال: 200"
                        className="option-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Speaking Answer */}
              {formData.qType === 'speaking' && (
                <div className="form-group">
                  <label htmlFor="sampleAnswer">نموذج إجابة / ملاحظات للمعلم (اختياري - للمدرس فقط)</label>
                  <textarea
                    id="sampleAnswer"
                    name="sampleAnswer"
                    value={formData.sampleAnswer}
                    onChange={handleInputChange}
                    placeholder="اكتب نموذج إجابة أو ملاحظات مرجعية للمدرس (لن يظهر للطالب)..."
                    rows={5}
                    className="option-input"
                  />
                  <small>نموذج إجابة أو ملاحظات مرجعية للمدرس عند التصحيح (لن يظهر للطالب)</small>

                  <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label htmlFor="minDuration" style={{ fontSize: '12px', color: '#6b7280' }}>
                        الحد الأدنى لمدة التسجيل (بالثواني) - اختياري
                      </label>
                      <input
                        type="number"
                        id="minDuration"
                        name="minDuration"
                        value={formData.minDuration || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseInt(e.target.value) || undefined;
                          setFormData((prev) => ({ ...prev, minDuration: value }));
                        }}
                        min="0"
                        placeholder="مثال: 30"
                        className="option-input"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label htmlFor="maxDuration" style={{ fontSize: '12px', color: '#6b7280' }}>
                        الحد الأقصى لمدة التسجيل (بالثواني) - اختياري
                      </label>
                      <input
                        type="number"
                        id="maxDuration"
                        name="maxDuration"
                        value={formData.maxDuration || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseInt(e.target.value) || undefined;
                          setFormData((prev) => ({ ...prev, maxDuration: value }));
                        }}
                        min="0"
                        placeholder="مثال: 120"
                        className="option-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Fill Answer */}
              {formData.qType === 'fill' && (
                <div className="form-group">
                  <label htmlFor="fillExact">الإجابة الصحيحة (fillExact) *</label>
                  <input
                    type="text"
                    id="fillExact"
                    name="fillExact"
                    value={formData.fillExact}
                    onChange={handleInputChange}
                    placeholder="مثال: برلين"
                    className="option-input"
                  />
                  <small>الإجابة الصحيحة المطلوبة (مطابقة تامة)</small>

                  <div style={{ marginTop: '16px' }}>
                    <label>قائمة Regex (اختياري)</label>
                    {formData.regexList.map((regex, index) => (
                      <div key={index} className="option-item">
                        <input
                          type="text"
                          value={regex}
                          onChange={(e) => handleUpdateRegex(index, e.target.value)}
                          placeholder={`Regex ${index + 1}`}
                          className="option-input"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveRegex(index)}
                          className="remove-btn"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddRegex}
                      className="add-option-btn"
                    >
                      + إضافة Regex
                    </button>
                    <small>قائمة من التعبيرات النمطية للتحقق من الإجابة</small>
                  </div>
                </div>
              )}

              {/* Match Pairs */}
              {formData.qType === 'match' && (
                <div className="form-group">
                  <label>أزواج المطابقة *</label>
                  {formData.answerKeyMatch.map((pair, index) => (
                    <div key={index} className="option-item">
                      <input
                        type="text"
                        value={pair.left}
                        onChange={(e) => handleUpdateMatchPair(index, 'left', e.target.value)}
                        placeholder={`اليسار ${index + 1}`}
                        className="option-input"
                      />
                      <span style={{ margin: '0 8px' }}>↔</span>
                      <input
                        type="text"
                        value={pair.right}
                        onChange={(e) => handleUpdateMatchPair(index, 'right', e.target.value)}
                        placeholder={`اليمين ${index + 1}`}
                        className="option-input"
                      />
                      {formData.answerKeyMatch.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMatchPair(index)}
                          className="remove-btn"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddMatchPair}
                    className="add-option-btn"
                  >
                    + إضافة زوج
                  </button>
                </div>
              )}

              {/* Reorder Items */}
              {formData.qType === 'reorder' && (
                <div className="form-group">
                  <label>ترتيب العناصر الصحيح *</label>
                  <small style={{ display: 'block', marginBottom: '8px' }}>
                    أدخل العناصر بالترتيب الصحيح (من الأعلى إلى الأسفل)
                  </small>
                  {formData.answerKeyReorder.map((item, index) => (
                    <div key={index} className="option-item">
                      <span style={{ marginRight: '8px', fontWeight: 'bold' }}>{index + 1}.</span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleUpdateReorderItem(index, e.target.value)}
                        placeholder={`العنصر ${index + 1}`}
                        className="option-input"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveReorderItem(index)}
                        className="remove-btn"
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddReorderItem}
                    className="add-option-btn"
                  >
                    + إضافة عنصر
                  </button>
                </div>
              )}

              {/* Interactive Text */}
              {formData.qType === 'interactive_text' && (
                <div className="form-group">
                  <label>نوع المهمة التفاعلية *</label>
                  <select
                    value={formData.interactiveTextType}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        interactiveTextType: e.target.value,
                        interactiveBlanks: e.target.value === 'fill_blanks' ? prev.interactiveBlanks : [],
                        interactiveReorder: e.target.value === 'reorder' ? prev.interactiveReorder : { parts: [] },
                      }));
                    }}
                    className="option-input"
                    style={{ marginBottom: '16px' }}
                  >
                    <option value="fill_blanks">Fill-in-the-blanks (فراغات متعددة)</option>
                    <option value="reorder">Reorder (ترتيب الأجزاء)</option>
                  </select>

                  {/* Fill-in-the-blanks */}
                  {formData.interactiveTextType === 'fill_blanks' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        النص مع الفراغات *
                      </label>
                      <small style={{ display: 'block', marginBottom: '8px', color: '#6b7280' }}>
                        استخدم placeholders مثل {'{{a}}'}, {'{{b}}'}, {'{{c}}'} للفراغات
                      </small>
                      <textarea
                        value={formData.text}
                        onChange={(e) => setFormData((prev) => ({ ...prev, text: e.target.value }))}
                        placeholder="مثال: Guten Tag! Ich {{a}} Anna. Ich {{b}} aus {{c}}."
                        rows={5}
                        className="option-input"
                        style={{ marginBottom: '16px' }}
                      />

                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        الفراغات (3-10 فراغات) *
                      </label>
                      {formData.interactiveBlanks.map((blank, blankIndex) => (
                        <div
                          key={blankIndex}
                          style={{
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            padding: '16px',
                            marginBottom: '12px',
                            backgroundColor: '#f9fafb',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                              فراغ {blank.id.toUpperCase()} ({'{{' + blank.id + '}}'})
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleRemoveInteractiveBlank(blankIndex)}
                              className="remove-btn"
                            >
                              حذف
                            </button>
                          </div>

                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                              نوع الإدخال *
                            </label>
                            <select
                              value={blank.type}
                              onChange={(e) => handleUpdateInteractiveBlank(blankIndex, 'type', e.target.value)}
                              className="option-input"
                            >
                              <option value="textInput">Text Input (إدخال نص)</option>
                              <option value="dropdown">Dropdown (قائمة منسدلة)</option>
                            </select>
                          </div>

                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                              الإجابات الصحيحة * (يمكن إضافة أكثر من إجابة)
                            </label>
                            {blank.correctAnswers.map((answer, answerIndex) => (
                              <div key={answerIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <input
                                  type="text"
                                  value={answer}
                                  onChange={(e) => handleUpdateCorrectAnswer(blankIndex, answerIndex, e.target.value)}
                                  placeholder="إجابة صحيحة"
                                  className="option-input"
                                  style={{ flex: 1 }}
                                />
                                {blank.correctAnswers.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCorrectAnswer(blankIndex, answerIndex)}
                                    className="remove-btn"
                                  >
                                    حذف
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleAddCorrectAnswer(blankIndex)}
                              className="add-option-btn"
                              style={{ fontSize: '12px', padding: '6px 12px' }}
                            >
                              + إضافة إجابة صحيحة
                            </button>
                          </div>

                          {blank.type === 'dropdown' && (
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                                الخيارات * (حد أدنى 2 خيارات)
                              </label>
                              {blank.choices.map((choice, choiceIndex) => (
                                <div key={choiceIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                  <input
                                    type="text"
                                    value={choice}
                                    onChange={(e) => handleUpdateChoice(blankIndex, choiceIndex, e.target.value)}
                                    placeholder="خيار"
                                    className="option-input"
                                    style={{ flex: 1 }}
                                  />
                                  {blank.choices.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveChoice(blankIndex, choiceIndex)}
                                      className="remove-btn"
                                    >
                                      حذف
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => handleAddChoice(blankIndex)}
                                className="add-option-btn"
                                style={{ fontSize: '12px', padding: '6px 12px' }}
                              >
                                + إضافة خيار
                              </button>
                            </div>
                          )}

                          <div>
                            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                              تلميح (اختياري)
                            </label>
                            <input
                              type="text"
                              value={blank.hint || ''}
                              onChange={(e) => handleUpdateInteractiveBlank(blankIndex, 'hint', e.target.value)}
                              placeholder="مثال: Verb: sein oder heißen"
                              className="option-input"
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddInteractiveBlank}
                        className="add-option-btn"
                        disabled={formData.interactiveBlanks.length >= 10}
                      >
                        + إضافة فراغ ({formData.interactiveBlanks.length}/10)
                      </button>
                    </div>
                  )}

                  {/* Reorder */}
                  {formData.interactiveTextType === 'reorder' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        أجزاء النص (2+ أجزاء) *
                      </label>
                      <small style={{ display: 'block', marginBottom: '8px', color: '#6b7280' }}>
                        أدخل الأجزاء بالترتيب الصحيح (order يبدأ من 1)
                      </small>
                      {formData.interactiveReorder.parts.map((part, index) => (
                        <div
                          key={index}
                          style={{
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            padding: '16px',
                            marginBottom: '12px',
                            backgroundColor: '#f9fafb',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                              جزء {part.id} - Order: {part.order}
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleRemoveReorderPart(index)}
                              className="remove-btn"
                            >
                              حذف
                            </button>
                          </div>

                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                              Order (الترتيب) *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={part.order}
                              onChange={(e) => handleUpdateReorderPart(index, 'order', parseInt(e.target.value) || 1)}
                              className="option-input"
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                              النص *
                            </label>
                            <textarea
                              value={part.text}
                              onChange={(e) => handleUpdateReorderPart(index, 'text', e.target.value)}
                              placeholder="مثال: Guten Tag!"
                              rows={3}
                              className="option-input"
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddReorderPart}
                        className="add-option-btn"
                      >
                        + إضافة جزء
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Points */}
              <div className="form-group">
                <label htmlFor="points">النقاط (اختياري)</label>
                <input
                  type="number"
                  id="points"
                  name="points"
                  value={formData.points}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="1"
                />
              </div>

              {/* Explanation */}
              <div className="form-group">
                <label htmlFor="explanation">الشرح / Explanation (اختياري)</label>
                <textarea
                  id="explanation"
                  name="explanation"
                  value={formData.explanation}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="شرح الإجابة الصحيحة..."
                />
              </div>
            </div>
          )}

          {/* Prompt */}
          {(
            <>
              {/* Prompt */}
              <div className="form-group">
                <label htmlFor="prompt">نص السؤال *</label>
                <textarea
                  id="prompt"
                  name="prompt"
                  value={formData.prompt}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="أدخل نص السؤال..."
                />
              </div>

              {/* Question Type */}
              <div className="form-group">
                <label htmlFor="qType">نوع السؤال *</label>
                <select
                  id="qType"
                  name="qType"
                  value={formData.qType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="mcq">اختيار متعدد (MCQ)</option>
                  <option value="true_false">صحيح/خطأ (True/False)</option>
                  <option value="fill">ملء الفراغ (Fill)</option>
                  <option value="match">مطابقة (Match)</option>
                  <option value="interactive_text">نص تفاعلي (Interactive Text)</option>
                </select>
              </div>

              {/* Options - MCQ only */}
              {formData.qType === 'mcq' && (
                <div className="form-group">
                  <label>الخيارات *</label>
                  {formData.options.map((option, index) => (
                    <div key={index} className="option-item">
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) =>
                          handleUpdateOption(index, 'text', e.target.value)
                        }
                        placeholder={`الخيار ${index + 1}`}
                        className="option-input"
                      />
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={option.isCorrect}
                          onChange={(e) =>
                            handleUpdateOption(index, 'isCorrect', e.target.checked)
                          }
                        />
                        صحيح
                      </label>
                      {formData.options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="remove-btn"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="add-option-btn"
                  >
                    + إضافة خيار
                  </button>
                </div>
              )}

              {/* True/False Answer */}
              {formData.qType === 'true_false' && (
                <div className="form-group">
                  <label>الإجابات * (اكتب الإجابتين واختر الصحيحة)</label>
                  <div className="options-container">
                    {formData.trueFalseOptions.map((option, index) => (
                      <div key={index} className="option-item">
                        <input
                          type="radio"
                          name="trueFalseCorrect"
                          checked={option.isCorrect}
                          onChange={() => {
                            setFormData((prev) => ({
                              ...prev,
                              trueFalseOptions: prev.trueFalseOptions.map((opt, i) => ({
                                ...opt,
                                isCorrect: i === index
                              })),
                              answerKeyBoolean: index === 0
                            }));
                          }}
                        />
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => {
                            const newOptions = [...formData.trueFalseOptions];
                            newOptions[index].text = e.target.value;
                            setFormData((prev) => ({ ...prev, trueFalseOptions: newOptions }));
                          }}
                          placeholder={`الإجابة ${index + 1}`}
                          className="option-input"
                        />
                        {option.isCorrect && <span className="correct-badge">✓ صحيحة</span>}
                      </div>
                    ))}
                  </div>
                  <small>اختر الإجابة الصحيحة بالنقر على الدائرة بجانبها</small>
                </div>
              )}

              {/* Free Text Answer */}
              {formData.qType === 'free_text' && (
                <div className="form-group">
                  <label htmlFor="sampleAnswer">نموذج إجابة (اختياري - للمدرس فقط)</label>
                  <textarea
                    id="sampleAnswer"
                    name="sampleAnswer"
                    value={formData.sampleAnswer}
                    onChange={handleInputChange}
                    placeholder="اكتب نموذج إجابة مرجعي للمدرس (لن يظهر للطالب)..."
                    rows={5}
                    className="option-input"
                  />
                  <small>نموذج إجابة مرجعي للمدرس عند التصحيح (لن يظهر للطالب)</small>

                  <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label htmlFor="minWords" style={{ fontSize: '12px', color: '#6b7280' }}>
                        الحد الأدنى للكلمات (اختياري)
                      </label>
                      <input
                        type="number"
                        id="minWords"
                        name="minWords"
                        value={formData.minWords || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseInt(e.target.value) || undefined;
                          setFormData((prev) => ({ ...prev, minWords: value }));
                        }}
                        min="0"
                        placeholder="مثال: 50"
                        className="option-input"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label htmlFor="maxWords" style={{ fontSize: '12px', color: '#6b7280' }}>
                        الحد الأقصى للكلمات (اختياري)
                      </label>
                      <input
                        type="number"
                        id="maxWords"
                        name="maxWords"
                        value={formData.maxWords || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseInt(e.target.value) || undefined;
                          setFormData((prev) => ({ ...prev, maxWords: value }));
                        }}
                        min="0"
                        placeholder="مثال: 200"
                        className="option-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Speaking Answer */}
              {formData.qType === 'speaking' && (
                <div className="form-group">
                  <label htmlFor="sampleAnswer">نموذج إجابة / ملاحظات للمعلم (اختياري - للمدرس فقط)</label>
                  <textarea
                    id="sampleAnswer"
                    name="sampleAnswer"
                    value={formData.sampleAnswer}
                    onChange={handleInputChange}
                    placeholder="اكتب نموذج إجابة أو ملاحظات مرجعية للمدرس (لن يظهر للطالب)..."
                    rows={5}
                    className="option-input"
                  />
                  <small>نموذج إجابة أو ملاحظات مرجعية للمدرس عند التصحيح (لن يظهر للطالب)</small>

                  <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label htmlFor="minDuration" style={{ fontSize: '12px', color: '#6b7280' }}>
                        الحد الأدنى لمدة التسجيل (بالثواني) - اختياري
                      </label>
                      <input
                        type="number"
                        id="minDuration"
                        name="minDuration"
                        value={formData.minDuration || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseInt(e.target.value) || undefined;
                          setFormData((prev) => ({ ...prev, minDuration: value }));
                        }}
                        min="0"
                        placeholder="مثال: 30"
                        className="option-input"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label htmlFor="maxDuration" style={{ fontSize: '12px', color: '#6b7280' }}>
                        الحد الأقصى لمدة التسجيل (بالثواني) - اختياري
                      </label>
                      <input
                        type="number"
                        id="maxDuration"
                        name="maxDuration"
                        value={formData.maxDuration || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseInt(e.target.value) || undefined;
                          setFormData((prev) => ({ ...prev, maxDuration: value }));
                        }}
                        min="0"
                        placeholder="مثال: 120"
                        className="option-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Fill Answer */}
              {formData.qType === 'fill' && (
                <div className="form-group">
                  <label htmlFor="fillExact">الإجابة الصحيحة (fillExact) *</label>
                  <input
                    type="text"
                    id="fillExact"
                    name="fillExact"
                    value={formData.fillExact}
                    onChange={handleInputChange}
                    placeholder="مثال: برلين"
                    className="option-input"
                  />
                  <small>الإجابة الصحيحة المطلوبة (مطابقة تامة)</small>

                  <div style={{ marginTop: '16px' }}>
                    <label>قائمة Regex (اختياري)</label>
                    {formData.regexList.map((regex, index) => (
                      <div key={index} className="option-item">
                        <input
                          type="text"
                          value={regex}
                          onChange={(e) => handleUpdateRegex(index, e.target.value)}
                          placeholder={`Regex ${index + 1}`}
                          className="option-input"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveRegex(index)}
                          className="remove-btn"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddRegex}
                      className="add-option-btn"
                    >
                      + إضافة Regex
                    </button>
                    <small>قائمة من التعبيرات النمطية للتحقق من الإجابة</small>
                  </div>
                </div>
              )}

              {/* Match Pairs */}
              {formData.qType === 'match' && (
                <div className="form-group">
                  <label>أزواج المطابقة *</label>
                  {formData.answerKeyMatch.map((pair, index) => (
                    <div key={index} className="option-item">
                      <input
                        type="text"
                        value={pair.left}
                        onChange={(e) => handleUpdateMatchPair(index, 'left', e.target.value)}
                        placeholder={`اليسار ${index + 1}`}
                        className="option-input"
                      />
                      <span style={{ margin: '0 8px' }}>↔</span>
                      <input
                        type="text"
                        value={pair.right}
                        onChange={(e) => handleUpdateMatchPair(index, 'right', e.target.value)}
                        placeholder={`اليمين ${index + 1}`}
                        className="option-input"
                      />
                      {formData.answerKeyMatch.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMatchPair(index)}
                          className="remove-btn"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddMatchPair}
                    className="add-option-btn"
                  >
                    + إضافة زوج
                  </button>
                </div>
              )}

              {/* Reorder Items */}
              {formData.qType === 'reorder' && (
                <div className="form-group">
                  <label>ترتيب العناصر الصحيح *</label>
                  <small style={{ display: 'block', marginBottom: '8px' }}>
                    أدخل العناصر بالترتيب الصحيح (من الأعلى إلى الأسفل)
                  </small>
                  {formData.answerKeyReorder.map((item, index) => (
                    <div key={index} className="option-item">
                      <span style={{ marginRight: '8px', fontWeight: 'bold' }}>{index + 1}.</span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleUpdateReorderItem(index, e.target.value)}
                        placeholder={`العنصر ${index + 1}`}
                        className="option-input"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveReorderItem(index)}
                        className="remove-btn"
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddReorderItem}
                    className="add-option-btn"
                  >
                    + إضافة عنصر
                  </button>
                </div>
              )}

              {/* Interactive Text */}
              {formData.qType === 'interactive_text' && (
                <div className="form-group">
                  <label>نوع المهمة التفاعلية *</label>
                  <select
                    value={formData.interactiveTextType}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        interactiveTextType: e.target.value,
                        interactiveBlanks: e.target.value === 'fill_blanks' ? prev.interactiveBlanks : [],
                        interactiveReorder: e.target.value === 'reorder' ? prev.interactiveReorder : { parts: [] },
                      }));
                    }}
                    className="option-input"
                    style={{ marginBottom: '16px' }}
                  >
                    <option value="fill_blanks">Fill-in-the-blanks (فراغات متعددة)</option>
                    <option value="reorder">Reorder (ترتيب الأجزاء)</option>
                  </select>

                  {/* Fill-in-the-blanks */}
                  {formData.interactiveTextType === 'fill_blanks' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        النص مع الفراغات *
                      </label>
                      <small style={{ display: 'block', marginBottom: '8px', color: '#6b7280' }}>
                        استخدم placeholders مثل {'{{a}}'}, {'{{b}}'}, {'{{c}}'} للفراغات
                      </small>
                      <textarea
                        value={formData.text}
                        onChange={(e) => setFormData((prev) => ({ ...prev, text: e.target.value }))}
                        placeholder="مثال: Guten Tag! Ich {{a}} Anna. Ich {{b}} aus {{c}}."
                        rows={5}
                        className="option-input"
                        style={{ marginBottom: '16px' }}
                      />

                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        الفراغات (3-10 فراغات) *
                      </label>
                      {formData.interactiveBlanks.map((blank, blankIndex) => (
                        <div
                          key={blankIndex}
                          style={{
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            padding: '16px',
                            marginBottom: '12px',
                            backgroundColor: '#f9fafb',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                              فراغ {blank.id.toUpperCase()} ({'{{' + blank.id + '}}'})
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleRemoveInteractiveBlank(blankIndex)}
                              className="remove-btn"
                            >
                              حذف
                            </button>
                          </div>

                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                              نوع الإدخال *
                            </label>
                            <select
                              value={blank.type}
                              onChange={(e) => handleUpdateInteractiveBlank(blankIndex, 'type', e.target.value)}
                              className="option-input"
                            >
                              <option value="textInput">Text Input (إدخال نص)</option>
                              <option value="dropdown">Dropdown (قائمة منسدلة)</option>
                            </select>
                          </div>

                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                              الإجابات الصحيحة * (يمكن إضافة أكثر من إجابة)
                            </label>
                            {blank.correctAnswers.map((answer, answerIndex) => (
                              <div key={answerIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <input
                                  type="text"
                                  value={answer}
                                  onChange={(e) => handleUpdateCorrectAnswer(blankIndex, answerIndex, e.target.value)}
                                  placeholder="إجابة صحيحة"
                                  className="option-input"
                                  style={{ flex: 1 }}
                                />
                                {blank.correctAnswers.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCorrectAnswer(blankIndex, answerIndex)}
                                    className="remove-btn"
                                  >
                                    حذف
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleAddCorrectAnswer(blankIndex)}
                              className="add-option-btn"
                              style={{ fontSize: '12px', padding: '6px 12px' }}
                            >
                              + إضافة إجابة صحيحة
                            </button>
                          </div>

                          {blank.type === 'dropdown' && (
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                                الخيارات * (حد أدنى 2 خيارات)
                              </label>
                              {blank.choices.map((choice, choiceIndex) => (
                                <div key={choiceIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                  <input
                                    type="text"
                                    value={choice}
                                    onChange={(e) => handleUpdateChoice(blankIndex, choiceIndex, e.target.value)}
                                    placeholder="خيار"
                                    className="option-input"
                                    style={{ flex: 1 }}
                                  />
                                  {blank.choices.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveChoice(blankIndex, choiceIndex)}
                                      className="remove-btn"
                                    >
                                      حذف
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => handleAddChoice(blankIndex)}
                                className="add-option-btn"
                                style={{ fontSize: '12px', padding: '6px 12px' }}
                              >
                                + إضافة خيار
                              </button>
                            </div>
                          )}

                          <div>
                            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                              تلميح (اختياري)
                            </label>
                            <input
                              type="text"
                              value={blank.hint || ''}
                              onChange={(e) => handleUpdateInteractiveBlank(blankIndex, 'hint', e.target.value)}
                              placeholder="مثال: Verb: sein oder heißen"
                              className="option-input"
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddInteractiveBlank}
                        className="add-option-btn"
                        disabled={formData.interactiveBlanks.length >= 10}
                      >
                        + إضافة فراغ ({formData.interactiveBlanks.length}/10)
                      </button>
                    </div>
                  )}

                  {/* Reorder */}
                  {formData.interactiveTextType === 'reorder' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        أجزاء النص (2+ أجزاء) *
                      </label>
                      <small style={{ display: 'block', marginBottom: '8px', color: '#6b7280' }}>
                        أدخل الأجزاء بالترتيب الصحيح (order يبدأ من 1)
                      </small>
                      {formData.interactiveReorder.parts.map((part, index) => (
                        <div
                          key={index}
                          style={{
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            padding: '16px',
                            marginBottom: '12px',
                            backgroundColor: '#f9fafb',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                              جزء {part.id} - Order: {part.order}
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleRemoveReorderPart(index)}
                              className="remove-btn"
                            >
                              حذف
                            </button>
                          </div>

                          <div style={{ marginBottom: '12px' }}>
                            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                              Order (الترتيب) *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={part.order}
                              onChange={(e) => handleUpdateReorderPart(index, 'order', parseInt(e.target.value) || 1)}
                              className="option-input"
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                              النص *
                            </label>
                            <textarea
                              value={part.text}
                              onChange={(e) => handleUpdateReorderPart(index, 'text', e.target.value)}
                              placeholder="مثال: Guten Tag!"
                              rows={3}
                              className="option-input"
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddReorderPart}
                        className="add-option-btn"
                      >
                        + إضافة جزء
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Points */}
              <div className="form-group">
                <label htmlFor="points">النقاط (اختياري)</label>
                <input
                  type="number"
                  id="points"
                  name="points"
                  value={formData.points}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="1"
                />
              </div>

              {/* Explanation */}
              <div className="form-group">
                <label htmlFor="explanation">الشرح / Explanation (اختياري)</label>
                <textarea
                  id="explanation"
                  name="explanation"
                  value={formData.explanation}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="شرح الإجابة الصحيحة..."
                />
              </div>
            </>
          )}

          {/* Usage Category */}
          {true && (
            <div className="form-group" style={{ borderTop: '2px solid #e5e7eb', paddingTop: '20px', marginTop: '20px' }}>
              <label htmlFor="usageCategory">🔧 نوع الاستخدام / Question Usage *</label>
              <select
                id="usageCategory"
                name="usageCategory"
                value={formData.usageCategory}
                onChange={handleInputChange}
                required
              >
                <option value="">-- اختر نوع الاستخدام --</option>
                <option value="grammar">Grammar question (قواعد)</option>
                <option value="provider">Provider exam question (Prüfungen)</option>
                <option value="common">Leben in Deutschland - Common (300-Fragen)</option>
                <option value="state_specific">Leben in Deutschland - State Specific (أسئلة الولاية)</option>
              </select>
            </div>
          )}

          {/* Leben Metadata */}
          {(formData.usageCategory === 'common' || formData.usageCategory === 'state_specific') && (
            <div className="form-group" style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '8px', border: '2px solid #fbbf24' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold', color: '#92400e' }}>
                إعدادات سؤال Leben in Deutschland
              </h3>

              {formData.usageCategory === 'state_specific' && (
                <div className="form-group">
                  <label htmlFor="selectedState">الولاية / State *</label>
                  <select
                    id="selectedState"
                    name="selectedState"
                    value={formData.selectedState}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- اختر الولاية --</option>
                    {germanStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* رفع الصور لأسئلة Leben in Deutschland (Common و State Specific) */}
              {(formData.usageCategory === 'common' || formData.usageCategory === 'state_specific') && (
                <div className="form-group" style={{ marginTop: '20px', padding: '16px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  <label htmlFor="images" style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    📷 الصور / Images {formData.usageCategory === 'state_specific' ? '(لأسئلة الولاية)' : '(للأسئلة العامة)'}
                  </label>

                  <div style={{ marginBottom: '12px' }}>
                    <input
                      type="file"
                      id="images"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploadingImages}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: uploadingImages ? 'not-allowed' : 'pointer',
                        backgroundColor: uploadingImages ? '#f3f4f6' : '#fff'
                      }}
                    />
                  </div>

                  {uploadingImages && (
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '6px',
                      color: '#92400e',
                      fontSize: '14px',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>⏳</span>
                      <span>جاري رفع الصور...</span>
                    </div>
                  )}

                  {formData.images && formData.images.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        marginBottom: '12px',
                        color: '#374151'
                      }}>
                        ✅ الصور المرفوعة ({formData.images.length}):
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '20px'
                      }}>
                        {formData.images.map((img, idx) => (
                          <div
                            key={idx}
                            style={{
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              backgroundColor: '#fff',
                              transition: 'all 0.2s',
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                          >
                            {/* معاينة الصورة */}
                            <div style={{ position: 'relative', width: '100%', height: '200px', backgroundColor: '#f9fafb' }}>
                              <img
                                src={img.url || (typeof img === 'string' ? img : '')}
                                alt={`صورة ${idx + 1}`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  display: 'block'
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const errorDiv = e.target.nextElementSibling;
                                  if (errorDiv) errorDiv.style.display = 'flex';
                                }}
                              />
                              <div
                                style={{
                                  display: 'none',
                                  width: '100%',
                                  height: '100%',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: '#f3f4f6',
                                  flexDirection: 'column',
                                  gap: '8px'
                                }}
                              >
                                <span style={{ fontSize: '24px' }}>⚠️</span>
                                <span style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', padding: '0 8px' }}>
                                  خطأ في تحميل الصورة
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  backgroundColor: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '28px',
                                  height: '28px',
                                  cursor: 'pointer',
                                  fontSize: '18px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                  transition: 'all 0.2s',
                                  zIndex: 10
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = '#dc2626';
                                  e.target.style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = '#ef4444';
                                  e.target.style.transform = 'scale(1)';
                                }}
                                title="حذف الصورة"
                              >
                                ×
                              </button>
                              <div style={{
                                position: 'absolute',
                                bottom: '0',
                                left: '0',
                                right: '0',
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                padding: '4px 8px',
                                fontSize: '11px',
                                textAlign: 'center',
                                fontWeight: '500'
                              }}>
                                Bild {idx + 1}
                              </div>
                            </div>

                            {/* حقل الوصف */}
                            <div style={{ padding: '12px', backgroundColor: '#fafafa' }}>
                              <label
                                htmlFor={`image-description-${idx}`}
                                style={{
                                  display: 'block',
                                  marginBottom: '6px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  color: '#374151'
                                }}
                              >
                                📝 وصف الصورة (اختياري):
                              </label>
                              <textarea
                                id={`image-description-${idx}`}
                                value={img.description || ''}
                                onChange={(e) => handleUpdateImageDescription(idx, e.target.value)}
                                placeholder={`مثال: Bild ${idx + 1}: Das offizielle Wappen von Baden-Württemberg zeigt drei schwarze Löwen auf goldenem Grund.`}
                                rows={3}
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontFamily: 'inherit',
                                  resize: 'vertical',
                                  minHeight: '60px'
                                }}
                              />
                              {img.description && (
                                <div style={{
                                  marginTop: '6px',
                                  fontSize: '11px',
                                  color: '#6b7280',
                                  fontStyle: 'italic'
                                }}>
                                  💡 سيظهر هذا الوصف تحت الصورة عند عرض السؤال
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <small style={{
                    display: 'block',
                    marginTop: '12px',
                    color: '#6b7280',
                    fontSize: '13px',
                    lineHeight: '1.5'
                  }}>
                    💡 يمكنك رفع عدة صور {formData.usageCategory === 'state_specific' ? 'لأسئلة الولاية (مثل الأعلام، الشعارات، أو أي صور أخرى متعلقة بالولاية)' : 'للأسئلة العامة (300-Fragen)'}
                  </small>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="qType">نوع السؤال *</label>
                <select
                  id="qType"
                  name="qType"
                  value={formData.qType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="mcq">اختيار متعدد (MCQ) - الوحيد المسموح</option>
                </select>
                <small style={{ display: 'block', marginTop: '4px', color: '#92400e' }}>
                  ⚠️ امتحان Leben in Deutschland يدعم فقط أسئلة MCQ
                </small>
              </div>
            </div>
          )}

          {/* Grammar Metadata */}
          {formData.usageCategory === 'grammar' && (
            <div className="form-group" style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold' }}>
                إعدادات سؤال القواعد
              </h3>

              <div className="form-group">
                <label htmlFor="grammarLevel">مستوى القواعد / Grammar Level *</label>
                <select
                  id="grammarLevel"
                  name="grammarLevel"
                  value={formData.grammarLevel}
                  onChange={handleInputChange}
                  required
                >
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                </select>
              </div>
            </div>
          )}

          {/* Provider Metadata - Active */}
          {formData.usageCategory === 'provider' && (
            <div className="form-group" style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold', color: '#166534' }}>
                إعدادات سؤال الامتحانات (Provider)
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {/* Provider */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="active-provider">المعهد / Provider *</label>
                  <select
                    id="active-provider"
                    name="provider"
                    value={formData.provider}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- اختر المعهد --</option>
                    {PROVIDERS.filter(p => ['goethe', 'telc', 'osd', 'ecl', 'dtb', 'dtz'].includes(p.value)).map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="active-providerLevel">المستوى / Level *</label>
                  <select
                    id="active-providerLevel"
                    name="providerLevel"
                    value={formData.providerLevel}
                    onChange={handleInputChange}
                    required
                  >
                    {getLevelsForProvider(formData.provider).map(lvl => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>

                {/* Skill */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="active-skill">المهارة / Skill *</label>
                  <select
                    id="active-skill"
                    name="skill"
                    value={formData.skill}
                    onChange={(e) => {
                      // Update skill
                      handleInputChange(e);
                      // If skill is not hoeren, clear listening clips
                      if (e.target.value !== 'hoeren') {
                        setListeningClipId(null);
                        setListeningClip(null);
                      }
                    }}
                    required
                  >
                    {globalEnums.skills.length > 0 ? (
                      globalEnums.skills.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="hoeren">Hören/Listening</option>
                        <option value="lesen">Lesen/Reading</option>
                        <option value="schreiben">Schreiben/Writing</option>
                        <option value="sprechen">Sprechen/Speaking</option>
                        <option value="sprachbausteine">Sprachbausteine</option>
                        <option value="grammar">Grammar</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Teil Number */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="active-teilNumber">رقم Teil *</label>
                  <input
                    type="number"
                    id="active-teilNumber"
                    name="teilNumber"
                    value={formData.teilNumber}
                    onChange={handleInputChange}
                    min="1"
                    required
                    placeholder="1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ✅ تم إزالة Shared Fields Section for Multiple Questions Mode */}
          {false && (
            <div className="form-group" style={{
              backgroundColor: '#fff7ed',
              padding: '20px',
              borderRadius: '8px',
              border: '2px solid #fb923c',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold', color: '#c2410c' }}>
                🔗 الحقول المشتركة (تطبق على جميع الأسئلة)
              </h3>

              {/* Usage Category */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="shared-usageCategory">نوع الاستخدام / Question Usage *</label>
                <select
                  id="shared-usageCategory"
                  name="usageCategory"
                  value={sharedFields.usageCategory || formData.usageCategory}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setSharedFields(prev => ({ ...prev, usageCategory: newValue }));
                    setFormData(prev => ({ ...prev, usageCategory: newValue }));
                    setQuestions(prev => prev.map(q => ({ ...q, usageCategory: newValue })));
                  }}
                  required
                >
                  <option value="">-- اختر نوع الاستخدام --</option>
                  <option value="grammar">Grammar question (قواعد)</option>
                  <option value="provider">Provider exam question (Prüfungen)</option>
                  <option value="leben_general">Leben General 300 (أسئلة عامة)</option>
                  <option value="leben_state">Leben State Specific (أسئلة الولاية)</option>
                </select>
              </div>

              {/* Provider Metadata Fields - Only show if usageCategory is provider */}
              {formData.usageCategory === 'provider' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="shared-provider">المعهد / Provider *</label>
                    <select
                      id="shared-provider"
                      name="provider"
                      value={sharedFields.provider || formData.provider}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setSharedFields(prev => ({ ...prev, provider: newValue }));
                        setFormData(prev => ({ ...prev, provider: newValue }));
                        // Update all questions with new provider
                        setQuestions(prev => prev.map(q => ({ ...q, provider: newValue })));
                      }}
                      required
                    >
                      <option value="goethe">Goethe</option>
                      <option value="telc">TELC</option>
                      <option value="ÖSD">ÖSD</option>
                      <option value="ECL">ECL</option>
                      <option value="DTB">DTB</option>
                      <option value="DTZ">DTZ</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="shared-providerLevel">المستوى / Level *</label>
                    <select
                      id="shared-providerLevel"
                      name="providerLevel"
                      value={sharedFields.providerLevel || formData.providerLevel}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setSharedFields(prev => ({ ...prev, providerLevel: newValue }));
                        setFormData(prev => ({ ...prev, providerLevel: newValue }));
                        setQuestions(prev => prev.map(q => ({ ...q, providerLevel: newValue })));
                        // Refresh listening clips when level changes
                        if (sharedFields.skill === 'hoeren' && sharedFields.provider && sharedFields.teilNumber) {
                          fetchListeningClips(sharedFields.provider, newValue, sharedFields.teilNumber);
                        }
                      }}
                      required
                    >
                      {getLevelsForProvider(sharedFields.provider || formData.provider).map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="shared-skill">المهارة / Skill *</label>
                    <select
                      id="shared-skill"
                      name="skill"
                      value={sharedFields.skill || formData.skill}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setSharedFields(prev => ({ ...prev, skill: newValue }));
                        setFormData(prev => ({ ...prev, skill: newValue }));
                        setQuestions(prev => prev.map(q => ({ ...q, skill: newValue })));
                        if (newValue !== 'hoeren') {
                          // Remove listening clips from all questions if skill changes
                          setQuestions(prev => prev.map(q => ({
                            ...q,
                            listeningClipId: null,
                            listeningClip: null,
                            audioFileName: null
                          })));
                          handleRemoveAudio();
                        } else if (sharedFields.provider && sharedFields.providerLevel && sharedFields.teilNumber) {
                          // Fetch listening clips when skill changes to hoeren
                          fetchListeningClips(sharedFields.provider, sharedFields.providerLevel, sharedFields.teilNumber);
                        }
                      }}
                      required
                    >
                      <option value="hoeren">Hören (الاستماع)</option>
                      <option value="lesen">Lesen (القراءة)</option>
                      <option value="schreiben">Schreiben (الكتابة)</option>
                      <option value="sprechen">Sprechen (التحدث)</option>
                      <option value="sprachbausteine">Sprachbausteine (القواعد اللغوية)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="shared-teilNumber">رقم Teil *</label>
                    <input
                      type="number"
                      id="shared-teilNumber"
                      name="teilNumber"
                      value={sharedFields.teilNumber || formData.teilNumber}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || 1;
                        setSharedFields(prev => ({ ...prev, teilNumber: newValue }));
                        setFormData(prev => ({ ...prev, teilNumber: newValue }));
                        setQuestions(prev => prev.map(q => ({ ...q, teilNumber: newValue })));
                        // Refresh listening clips when teil changes
                        if (sharedFields.skill === 'hoeren' && sharedFields.provider && sharedFields.providerLevel) {
                          fetchListeningClips(sharedFields.provider, sharedFields.providerLevel, newValue);
                        }
                      }}
                      min="1"
                      required
                      placeholder="1"
                    />
                  </div>
                  <small style={{ display: 'block', marginTop: '12px', color: '#c2410c', fontSize: '12px' }}>
                    ⚠️ تغيير هذه الحقول سيؤثر على جميع الأسئلة في القائمة
                  </small>
                </div>
              )}
            </div>
          )}

          {/* Provider Metadata - Only show in single mode or for non-shared fields in multiple mode */}
          {formData.usageCategory === 'provider' && (
            <div className="form-group" style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold' }}>
                🔹 Provider metadata
              </h3>

              {true && (
                <>
                  <div className="form-group">
                    <label htmlFor="provider">المعهد / Provider *</label>
                    <select
                      id="provider"
                      name="provider"
                      value={formData.provider}
                      onChange={handleInputChange}
                      required
                    >
                      {PROVIDERS.filter(p => ['goethe', 'telc', 'osd', 'ecl', 'dtb', 'dtz'].includes(p.value)).map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="providerLevel">المستوى / Level *</label>
                    <select
                      id="providerLevel"
                      name="providerLevel"
                      value={formData.providerLevel}
                      onChange={handleInputChange}
                      required
                    >
                      {getLevelsForProvider(formData.provider).map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="skill">المهارة / Skill *</label>
                    <select
                      id="skill"
                      name="skill"
                      value={formData.skill}
                      onChange={(e) => {
                        handleInputChange(e);
                        // إزالة الملف الصوتي عند تغيير المهارة إلى غير Hören
                        if (e.target.value !== 'hoeren') {
                          handleRemoveAudio();
                        }
                      }}
                      required
                    >
                      <option value="hoeren">Hören (الاستماع)</option>
                      <option value="lesen">Lesen (القراءة)</option>
                      <option value="schreiben">Schreiben (الكتابة)</option>
                      <option value="sprechen">Sprechen (التحدث)</option>
                      <option value="sprachbausteine">Sprachbausteine (القواعد اللغوية)</option>
                    </select>
                  </div>
                </>
              )}

              {/* ✅ إدارة ملفات الصوت (Listening Clips) */}
              {formData.skill === 'hoeren' && (
                <div className="form-group" style={{
                  padding: '16px',
                  backgroundColor: '#f0f9ff',
                  border: '2px solid #0ea5e9',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 'bold', color: '##0369a1' }}>
                    🎵 ملف الاستماع (Listening Clip)
                  </h4>

                  {/* حالة 1: examId موجود لكن لم يتم اختيار sectionKey */}
                  {formData.examId && !formData.sectionKey && (
                    <p style={{ margin: '0', color: '#92400e', fontSize: '14px' }}>
                      ⚠️ اختر القسم (Section) أولاً لإدارة ملفات الصوت
                    </p>
                  )}

                  {/* حالة 2: تم اختيار clip بالفعل */}
                  {listeningClipId && (
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#dbeafe',
                      border: '1px solid #93c5fd',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ margin: '0', color: '#1e40af', fontSize: '14px', fontWeight: '600' }}>
                          ✅ تم اختيار ملف الاستماع
                        </p>
                        <button
                          type="button"
                          onClick={handleRemoveAudio}
                          style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: '1px solid #fca5a5',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          ✕ إزالة
                        </button>
                      </div>
                      {(audioUrl || listeningClip?.audioUrl) && (
                        <audio
                          controls
                          preload="metadata"
                          src={`${API_BASE_URL}${audioUrl || listeningClip?.audioUrl}`}
                          style={{ width: '100%', marginTop: '8px' }}
                        >
                          المتصفح لا يدعم تشغيل الملفات الصوتية
                        </audio>
                      )}
                      <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '11px' }}>
                        ID: {listeningClipId}
                      </p>
                    </div>
                  )}

                  {/* حالة 3: لم يتم اختيار clip - عرض خيارات الاختيار/الرفع */}
                  {!listeningClipId && (formData.sectionKey || !formData.examId) && (
                    <>
                      {/* اختيار من clips القسم الموجودة */}
                      {formData.examId && formData.sectionKey && (
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#334155' }}>
                            اختر من التسجيلات الموجودة في القسم:
                          </label>
                          {loadingSectionClips ? (
                            <p style={{ fontSize: '12px', color: '#666' }}>جاري تحميل التسجيلات...</p>
                          ) : sectionClips.length > 0 ? (
                            <select
                              onChange={(e) => {
                                const selectedClip = sectionClips.find(c => (c.listeningClipId || c._id || c.id) === e.target.value);
                                if (selectedClip) {
                                  handleSelectListeningClip({
                                    _id: selectedClip.listeningClipId || selectedClip._id || selectedClip.id,
                                    audioUrl: selectedClip.audioUrl,
                                    title: selectedClip.title
                                  });
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '14px',
                                backgroundColor: 'white'
                              }}
                            >
                              <option value="">-- اختر تسجيل موجود --</option>
                              {sectionClips.map((clip) => {
                                const clipId = clip.listeningClipId || clip._id || clip.id;
                                return (
                                  <option key={clipId} value={clipId}>
                                    {clip.title || clip.audioUrl?.split('/').pop() || `Clip ${clipId?.slice(-6)}`}
                                    {clip.questionCount ? ` (${clip.questionCount} سؤال)` : ''}
                                  </option>
                                );
                              })}
                            </select>
                          ) : (
                            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0' }}>
                              لا توجد تسجيلات في هذا القسم بعد. ارفع تسجيلاً جديداً أدناه.
                            </p>
                          )}
                        </div>
                      )}

                      {/* ✅ اختيار من التسجيلات المتاحة (من GET /listeningclips) */}
                      {availableListeningClips.length > 0 && (
                        <div style={{
                          marginBottom: '12px',
                          padding: '12px',
                          backgroundColor: '#faf5ff',
                          border: '1px solid #d8b4fe',
                          borderRadius: '8px'
                        }}>
                          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#7c3aed' }}>
                            اختر تسجيل موجود ({formData.provider} - {formData.providerLevel} - Teil {formData.teilNumber}):
                          </label>
                          {loadingListeningClips ? (
                            <p style={{ fontSize: '12px', color: '#666' }}>جاري التحميل...</p>
                          ) : (
                            <select
                              onChange={(e) => {
                                const selectedClip = availableListeningClips.find(c => (c._id || c.id) === e.target.value);
                                if (selectedClip) {
                                  handleSelectListeningClip(selectedClip);
                                }
                              }}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid #d8b4fe',
                                fontSize: '14px',
                                backgroundColor: 'white'
                              }}
                            >
                              <option value="">-- اختر تسجيل موجود --</option>
                              {availableListeningClips.map((clip) => {
                                const clipId = clip._id || clip.id;
                                return (
                                  <option key={clipId} value={clipId}>
                                    {clip.title || clip.audioUrl?.split('/').pop() || `Teil ${clip.teil || ''} - ${clip.provider || ''} ${clip.level || ''}`}
                                    {clip.questionCount ? ` (${clip.questionCount} سؤال)` : ''}
                                  </option>
                                );
                              })}
                            </select>
                          )}
                        </div>
                      )}

                      {/* رفع ملف صوتي جديد */}
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#fff7ed',
                        border: '1px solid #fed7aa',
                        borderRadius: '8px'
                      }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#9a3412' }}>
                          {availableListeningClips.length > 0 || (formData.examId && sectionClips.length > 0) ? 'أو ارفع تسجيلاً جديداً:' : 'ارفع ملف استماع:'}
                        </label>

                        {!audioFile ? (
                          <div>
                            <input
                              type="file"
                              id="audioFileUpload"
                              accept="audio/*"
                              onChange={handleAudioFileChange}
                              style={{ display: 'none' }}
                            />
                            <label
                              htmlFor="audioFileUpload"
                              style={{
                                display: 'inline-block',
                                padding: '8px 16px',
                                backgroundColor: '#fb923c',
                                color: 'white',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '600'
                              }}
                            >
                              🎵 اختر ملف صوتي
                            </label>
                            <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#9a3412' }}>
                              MP3, WAV, OGG - الحد الأقصى 50MB
                            </p>
                          </div>
                        ) : (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <span style={{ fontSize: '13px', color: '#334155' }}>{audioFile.name}</span>
                              <button
                                type="button"
                                onClick={() => { setAudioFile(null); setAudioPreview(null); }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#dc2626',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                              >
                                ✕
                              </button>
                            </div>
                            {audioPreview && (
                              <audio controls preload="metadata" src={audioPreview} style={{ width: '100%', marginBottom: '8px' }}>
                                المتصفح لا يدعم تشغيل الملفات الصوتية
                              </audio>
                            )}
                            <button
                              type="button"
                              onClick={handleUploadAudio}
                              disabled={uploadingAudio}
                              style={{
                                padding: '8px 20px',
                                backgroundColor: uploadingAudio ? '#94a3b8' : '#22c55e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: uploadingAudio ? 'not-allowed' : 'pointer',
                                fontSize: '13px',
                                fontWeight: '600'
                              }}
                            >
                              {uploadingAudio ? 'جاري الرفع...' : '⬆️ رفع الملف'}
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {true && (
                <div className="form-group">
                  <label htmlFor="teilNumber">رقم Teil *</label>
                  <input
                    type="number"
                    id="teilNumber"
                    name="teilNumber"
                    value={formData.teilNumber}
                    onChange={handleInputChange}
                    min="1"
                    required
                    placeholder="1"
                  />
                </div>
              )}

              {true && (
                <div className="form-group">
                  <label htmlFor="sourceName">Source model (اختياري)</label>
                  <input
                    type="text"
                    id="sourceName"
                    name="sourceName"
                    value={formData.sourceName}
                    onChange={handleInputChange}
                    placeholder="مثال: Goethe B1 – Modelltest 1 – Lesen"
                  />
                </div>
              )}
            </div>
          )}

          {/* ✅ Exam Linking - Show prominently after Provider Metadata */}
          {formData.usageCategory === 'provider' && (
            <div className="form-group" style={{
              backgroundColor: '#f0f9ff',
              padding: '20px',
              borderRadius: '8px',
              border: '2px solid #0ea5e9',
              marginTop: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold', color: '#0369a1' }}>
                📝 ربط السؤال بامتحان
              </h3>
              <label htmlFor="examId" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#0c4a6e' }}>
                اختر الامتحان من MongoDB (اختياري) *
              </label>
              {loadingExams ? (
                <p style={{ color: '#0369a1' }}>جاري تحميل الامتحانات...</p>
              ) : (
                <>
                  <select
                    id="examId"
                    name="examId"
                    value={formData.examId}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '2px solid #0ea5e9',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      fontWeight: '500'
                    }}
                  >
                    <option value="">-- اختر الامتحان من القائمة --</option>
                    {exams.length === 0 ? (
                      <option value="" disabled>لا توجد امتحانات متاحة</option>
                    ) : (
                      exams.map((exam) => {
                        const examId = exam._id || exam.id || '';
                        return (
                          <option key={examId} value={examId}>
                            {exam.title} {exam.level ? `(${exam.level})` : ''} {exam.provider ? `- ${exam.provider}` : ''}
                          </option>
                        );
                      })
                    )}
                  </select>
                  {exams.length === 0 && (
                    <small style={{ color: '#dc2626', display: 'block', marginTop: '8px', fontWeight: '600' }}>
                      ⚠️ لا توجد امتحانات متاحة. يجب أن تنشئ امتحاناً أولاً من صفحة "إنشاء امتحان".
                    </small>
                  )}
                  {exams.length > 0 && !formData.examId && (
                    <small style={{ color: '#0369a1', display: 'block', marginTop: '8px' }}>
                      💡 اختر امتحاناً من القائمة أعلاه لربط السؤال به. الصوت المرفوع في الامتحان سيُستخدم تلقائياً.
                    </small>
                  )}
                  {formData.examId && (
                    <>
                      {/* ✅ قائمة أقسام الامتحان */}
                      <div style={{ marginTop: '12px' }}>
                        <label htmlFor="sectionKey-provider" style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#0c4a6e', fontSize: '14px' }}>
                          اختر القسم (Section) *
                        </label>
                        {loadingExamSections ? (
                          <p style={{ color: '#0369a1', fontSize: '13px' }}>جاري تحميل الأقسام...</p>
                        ) : examSections.length === 0 ? (
                          <p style={{ color: '#d97706', fontSize: '13px' }}>⚠️ لا توجد أقسام في هذا الامتحان. أنشئ أقساماً أولاً من صفحة إدارة الأقسام.</p>
                        ) : (
                          <select
                            id="sectionKey-provider"
                            name="sectionKey"
                            value={formData.sectionKey}
                            onChange={handleInputChange}
                            style={{
                              width: '100%',
                              padding: '10px',
                              borderRadius: '6px',
                              border: '2px solid #0ea5e9',
                              fontSize: '14px',
                              backgroundColor: 'white',
                              fontWeight: '500'
                            }}
                          >
                            <option value="">-- اختر القسم --</option>
                            {examSections.map((sec) => {
                              const key = sec.key || sec.sectionKey || '';
                              return (
                                <option key={key} value={key}>
                                  {sec.title || sec.name || key} {sec.skill ? `(${sec.skill})` : ''} {sec.teilNumber ? `Teil ${sec.teilNumber}` : ''}
                                </option>
                              );
                            })}
                          </select>
                        )}
                      </div>
                      <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: '#dbeafe',
                        border: '1px solid #93c5fd',
                        borderRadius: '6px'
                      }}>
                        <p style={{ margin: '0', color: '#1e40af', fontSize: '14px', fontWeight: '600' }}>
                          ✅ السؤال مربوط بامتحان. {formData.sectionKey ? `القسم: ${formData.sectionKey}` : 'اختر القسم أعلاه.'}
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Audio File Upload Section for Multiple Questions Mode - تم إزالته */}
          {false && questionMode === 'multiple' && formData.usageCategory === 'provider' && sharedFields.skill === 'hoeren' && (
            <div className="form-group" style={{
              backgroundColor: '#fff7ed',
              padding: '20px',
              borderRadius: '8px',
              border: '2px solid #fb923c',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold', color: '#c2410c' }}>
                🎵 ملف الاستماع المشترك (لجميع الأسئلة)
              </h3>

              {/* Audio Picker - اختيار من المقاطع المرفوعة سابقاً */}
              {availableListeningClips.length > 0 && !listeningClipId && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px'
                }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                    أو اختر من المقاطع المرفوعة سابقاً:
                  </label>
                  {loadingListeningClips ? (
                    <p style={{ fontSize: '12px', color: '#666' }}>جاري التحميل...</p>
                  ) : (
                    <select
                      onChange={(e) => {
                        const selectedClip = availableListeningClips.find(c => (c._id || c.id) === e.target.value);
                        if (selectedClip) {
                          handleSelectListeningClip(selectedClip);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid #bae6fd',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">-- اختر مقطع صوتي --</option>
                      {availableListeningClips.map((clip) => (
                        <option key={clip._id || clip.id} value={clip._id || clip.id}>
                          {clip.audioUrl?.split('/').pop() || `Teil ${clip.teil || ''} - ${clip.provider || ''} ${clip.level || ''}`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {!listeningClipId && !audioFile ? (
                <div className="file-upload-container">
                  <input
                    type="file"
                    id="audioFileMultiple"
                    accept="audio/*"
                    onChange={handleAudioFileChange}
                    className="file-input"
                  />
                  <label htmlFor="audioFileMultiple" className="file-upload-label">
                    <span className="file-upload-icon">🎵</span>
                    <span>اختر ملف صوتي</span>
                  </label>
                  <p className="file-upload-hint">
                    الحد الأقصى: 50MB | الأنواع المدعومة: MP3, WAV, OGG, etc.
                  </p>
                </div>
              ) : audioFile ? (
                <div className="audio-preview-container">
                  <div className="audio-preview-info">
                    <span className="audio-icon">🎵</span>
                    <div className="audio-info">
                      <p className="audio-name">{audioFile.name}</p>
                      <p className="audio-size">
                        {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveAudio}
                      className="remove-audio-btn"
                    >
                      ✕
                    </button>
                  </div>
                  {audioPreview && (
                    <audio controls className="audio-player">
                      <source src={audioPreview} type={audioFile.type} />
                      المتصفح لا يدعم تشغيل الملفات الصوتية
                    </audio>
                  )}
                  {!listeningClip && (
                    <button
                      type="button"
                      onClick={handleUploadAudio}
                      disabled={!audioFile || uploadingAudio}
                      style={{
                        marginTop: '12px',
                        padding: '8px 16px',
                        backgroundColor: uploadingAudio ? '#9ca3af' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: uploadingAudio ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      {uploadingAudio ? '⏳ جاري الرفع...' : '📤 رفع المقطع'}
                    </button>
                  )}
                </div>
              ) : null}

              {listeningClip && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '8px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <p style={{ margin: '0', color: '#166534', fontWeight: '600' }}>
                      تم اختيار ملف الاستماع ✅
                    </p>
                    <button
                      type="button"
                      onClick={handleRemoveAudio}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      تغيير الملف
                    </button>
                  </div>
                  <p style={{ margin: '0 0 8px 0', color: '#166534', fontSize: '12px' }}>
                    {listeningClip.audioUrl?.split('/').pop() || audioFile?.name || 'ملف صوتي'}
                  </p>
                  <audio
                    controls
                    src={audioUrl ? (audioUrl.startsWith('http') ? audioUrl : `${API_BASE_URL}${audioUrl}`) : (listeningClip?.audioUrl ? `${API_BASE_URL}${listeningClip.audioUrl}` : '')}
                    style={{ width: '100%', marginTop: '8px' }}
                  />
                </div>
              )}

              <small style={{ display: 'block', marginTop: '8px', color: '#c2410c', fontSize: '12px' }}>
                ⚠️ ملف صوتي مطلوب لأسئلة الاستماع (Hören). سيتم استخدام نفس الملف لجميع الأسئلة.
              </small>
            </div>
          )}

          {/* Exam Linking - Show always (not just when usageCategory is selected) */}
          <div className="form-group" style={{ borderTop: '2px solid #e5e7eb', paddingTop: '20px', marginTop: '20px' }}>
            <label htmlFor="examId">ربط السؤال بامتحان (اختياري)</label>
            {loadingExams ? (
              <p>جاري تحميل الامتحانات...</p>
            ) : (
              <>
                <select
                  id="examId"
                  name="examId"
                  value={formData.examId}
                  onChange={handleInputChange}
                >
                  <option value="">-- اختر الامتحان (اختياري) --</option>
                  {exams.length === 0 ? (
                    <option value="" disabled>لا توجد امتحانات متاحة</option>
                  ) : (
                    exams.map((exam) => {
                      const examId = exam._id || exam.id || '';
                      return (
                        <option key={examId} value={examId}>
                          {exam.title} {exam.level ? `(${exam.level})` : ''}
                        </option>
                      );
                    })
                  )}
                </select>
                {exams.length === 0 && (
                  <small style={{ color: '#dc2626', display: 'block', marginTop: '4px' }}>
                    ⚠️ لا توجد امتحانات متاحة. يجب أن تنشئ امتحاناً أولاً.
                  </small>
                )}
              </>
            )}
            <small style={{ display: 'block', marginTop: '4px', color: '#6b7280' }}>
              يمكنك ربط السؤال بامتحان معين عند الإنشاء. فقط الامتحانات التي تملكها ستظهر هنا.
            </small>
            {/* ✅ قائمة أقسام الامتحان */}
            {formData.examId && (
              <div style={{ marginTop: '12px' }}>
                <label htmlFor="sectionKey-general" style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>
                  اختر القسم (Section)
                </label>
                {loadingExamSections ? (
                  <p style={{ fontSize: '13px', color: '#666' }}>جاري تحميل الأقسام...</p>
                ) : examSections.length === 0 ? (
                  <p style={{ color: '#d97706', fontSize: '13px' }}>⚠️ لا توجد أقسام في هذا الامتحان.</p>
                ) : (
                  <select
                    id="sectionKey-general"
                    name="sectionKey"
                    value={formData.sectionKey}
                    onChange={handleInputChange}
                  >
                    <option value="">-- اختر القسم (اختياري) --</option>
                    {examSections.map((sec) => {
                      const key = sec.key || sec.sectionKey || '';
                      return (
                        <option key={key} value={key}>
                          {sec.title || sec.name || key} {sec.skill ? `(${sec.skill})` : ''} {sec.teilNumber ? `Teil ${sec.teilNumber}` : ''}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Legacy Section (for general and state questions) - only show if usageCategory is empty */}
          {!formData.usageCategory && (
            <>
              <div className="form-group">
                <label htmlFor="provider">المزود *</label>
                <select
                  id="provider"
                  name="provider"
                  value={formData.provider}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Deutschland-in-Leben">Deutschland-in-Leben</option>
                  <option value="telc">telc</option>
                  <option value="Goethe">Goethe</option>
                  <option value="ÖSD">ÖSD</option>
                  <option value="ECL">ECL</option>
                  <option value="DTB">DTB</option>
                  <option value="DTZ">DTZ</option>
                  <option value="Grammatik">Grammatik</option>
                  <option value="Wortschatz">Wortschatz</option>
                </select>
              </div>
            </>
          )}

          {/* Legacy Section - Hidden temporarily */}
          {false && (
            <>
              {/* Section */}
              <div className="form-group">
                <label htmlFor="section">القسم (اختياري)</label>
                <select
                  id="section"
                  name="section"
                  value={formData.section}
                  onChange={handleInputChange}
                >
                  <option value="">-- اختر القسم --</option>
                  <option value="Hören">Hören (الاستماع)</option>
                  <option value="Lesen">Lesen (القراءة)</option>
                  <option value="Schreiben">Schreiben (الكتابة)</option>
                  <option value="Sprechen">Sprechen (التحدث)</option>
                </select>
              </div>

              {/* Audio File Upload */}
              <div className="form-group">
                <label htmlFor="audioFile">ملف صوتي (اختياري)</label>
                {!audioFile ? (
                  <div className="file-upload-container">
                    <input
                      type="file"
                      id="audioFile"
                      accept="audio/*"
                      onChange={handleAudioFileChange}
                      className="file-input"
                    />
                    <label htmlFor="audioFile" className="file-upload-label">
                      <span className="file-upload-icon">🎵</span>
                      <span>اختر ملف صوتي</span>
                    </label>
                    <p className="file-upload-hint">
                      الحد الأقصى: 50MB | الأنواع المدعومة: MP3, WAV, OGG, etc.
                    </p>
                  </div>
                ) : (
                  <div className="audio-preview-container">
                    <div className="audio-preview-info">
                      <span className="audio-icon">🎵</span>
                      <div className="audio-info">
                        <p className="audio-name">{audioFile.name}</p>
                        <p className="audio-size">
                          {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveAudio}
                        className="remove-audio-btn"
                      >
                        ✕
                      </button>
                    </div>
                    {audioPreview && (
                      <audio controls className="audio-player">
                        <source src={audioPreview} type={audioFile.type} />
                        المتصفح لا يدعم تشغيل الملفات الصوتية
                      </audio>
                    )}
                  </div>
                )}
              </div>

              {/* Level */}
              <div className="form-group">
                <label htmlFor="level">المستوى *</label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  required
                >
                  <option value="A1">A1 - المبتدئ</option>
                  <option value="A2">A2 - المبتدئ المتقدم</option>
                  <option value="B1">B1 - المتوسط</option>
                  <option value="B2">B2 - المتوسط المتقدم</option>
                  <option value="C1">C1 - المتقدم</option>
                </select>
              </div>

              {/* Question Type (General or State-specific) */}
              <div className="form-group">
                <label>نوع السؤال *</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="questionType"
                      value="general"
                      checked={formData.questionType === 'general'}
                      onChange={handleInputChange}
                    />
                    <span>سؤال عام</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="questionType"
                      value="state"
                      checked={formData.questionType === 'state'}
                      onChange={handleInputChange}
                    />
                    <span>سؤال خاص بولاية معينة</span>
                  </label>
                </div>
              </div>

              {/* State Selection (only if state-specific) */}
              {formData.questionType === 'state' && (
                <div className="form-group">
                  <label htmlFor="selectedState">الولاية *</label>
                  <select
                    id="selectedState"
                    name="selectedState"
                    value={formData.selectedState}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- اختر الولاية --</option>
                    {germanStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tags */}
              <div className="form-group">
                <label>الوسوم</label>
                <div className="tags-container">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="tag-remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <div className="tag-input-container">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="أضف وسم..."
                      className="tag-input"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="add-tag-btn"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
              </div>

              {/* Exam Linking (Only for Legacy questions) */}
              <div className="form-group" style={{ borderTop: '2px solid #e5e7eb', paddingTop: '20px', marginTop: '20px' }}>
                <label htmlFor="examId">ربط السؤال بامتحان (اختياري)</label>
                {loadingExams ? (
                  <p>جاري تحميل الامتحانات...</p>
                ) : (
                  <select
                    id="examId"
                    name="examId"
                    value={formData.examId}
                    onChange={handleInputChange}
                  >
                    <option value="">-- اختر الامتحان (اختياري) --</option>
                    {exams.map((exam) => {
                      const examId = exam._id || exam.id || '';
                      return (
                        <option key={examId} value={examId}>
                          {exam.title} {exam.level ? `(${exam.level})` : ''}
                        </option>
                      );
                    })}
                  </select>
                )}
                <small>يمكنك ربط السؤال بامتحان معين عند الإنشاء</small>
                {/* ✅ قائمة أقسام الامتحان */}
                {formData.examId && (
                  <div style={{ marginTop: '12px' }}>
                    <label htmlFor="sectionKey-legacy" style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '14px' }}>
                      اختر القسم (Section)
                    </label>
                    {loadingExamSections ? (
                      <p style={{ fontSize: '13px', color: '#666' }}>جاري تحميل الأقسام...</p>
                    ) : examSections.length === 0 ? (
                      <p style={{ color: '#d97706', fontSize: '13px' }}>⚠️ لا توجد أقسام في هذا الامتحان.</p>
                    ) : (
                      <select
                        id="sectionKey-legacy"
                        name="sectionKey"
                        value={formData.sectionKey}
                        onChange={handleInputChange}
                      >
                        <option value="">-- اختر القسم (اختياري) --</option>
                        {examSections.map((sec) => {
                          const key = sec.key || sec.sectionKey || '';
                          return (
                            <option key={key} value={key}>
                              {sec.title || sec.name || key} {sec.skill ? `(${sec.skill})` : ''} {sec.teilNumber ? `Teil ${sec.teilNumber}` : ''}
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Status - Show only when usageCategory is selected */}
          {formData.usageCategory && (
            <div className="form-group" style={{ borderTop: '2px solid #e5e7eb', paddingTop: '20px', marginTop: '20px' }}>
              <label htmlFor="status">الحالة / Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                {globalEnums.statuses.length > 0 ? (
                  globalEnums.statuses.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="draft">مسودة (Draft)</option>
                    <option value="published">منشور (Published)</option>
                    <option value="archived">مؤرشف (Archived)</option>
                  </>
                )}
              </select>
              <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
                ⚠️ ملاحظة: فقط الأسئلة بحالة "منشور (Published)" ستظهر للطلاب.
                الأسئلة بحالة "مسودة (Draft)" لن تظهر في صفحة الطلاب.
              </small>
            </div>
          )}

          {/* Legacy Status - Hidden temporarily */}
          {false && (
            <div className="form-group">
              <label htmlFor="status">الحالة *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="draft">مسودة (Draft)</option>
                <option value="published">منشور (Published)</option>
                <option value="archived">مؤرشف (Archived)</option>
              </select>
              <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
                ⚠️ ملاحظة: فقط الأسئلة بحالة "منشور (Published)" ستظهر للطلاب.
                الأسئلة بحالة "مسودة (Draft)" لن تظهر في صفحة الطلاب.
              </small>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="cancel-btn"
            >
              إلغاء
            </button>
            <button type="submit" className="submit-btn" disabled={loading || uploadingAudio}>
              {uploadingAudio ? 'جاري رفع الملف...' : loading ? 'جاري الحفظ...' : 'حفظ السؤال'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateQuestion;

