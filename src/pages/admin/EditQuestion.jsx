import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { questionsAPI } from '../../services/questionsAPI';
import axios from 'axios';
import './CreateQuestion.css';

// API Base URL
const API_BASE_URL = 'https://api.deutsch-tests.com';

// ✅ دالة لبناء URL من key مع encoding صحيح
const buildImageUrlFromKey = (key) => {
  if (!key) {
    console.warn('⚠️ buildImageUrlFromKey: key is empty');
    return '';
  }
  
  try {
    // إذا كان key يبدأ بـ http، نعيده كما هو
    if (key.startsWith('http://') || key.startsWith('https://')) {
      console.log('✅ Key is already a full URL:', key);
      return key;
    }
    
    // إذا كان key يبدأ بـ /uploads/ أو /images/، نضيف base URL فقط
    if (key.startsWith('/uploads/') || key.startsWith('/images/')) {
      const fullUrl = `${API_BASE_URL}${key}`;
      console.log('✅ Building URL from absolute path:', { key, fullUrl });
      return fullUrl;
    }
    
    // إذا كان key يبدأ بـ uploads/ أو images/ بدون /، نضيف / و base URL
    if (key.startsWith('uploads/') || key.startsWith('images/')) {
      const fullUrl = `${API_BASE_URL}/${key}`;
      console.log('✅ Building URL from relative path:', { key, fullUrl });
      return fullUrl;
    }
    
    // غير ذلك، نقسم key على / ونعمل encoding على كل جزء
    const segments = key.split('/');
    const encodedSegments = segments.map(segment => {
      return encodeURIComponent(segment);
    });
    const encodedPath = encodedSegments.join('/');
    const fullUrl = `${API_BASE_URL}/uploads/${encodedPath}`;
    console.log('✅ Building URL from key with encoding:', { key, encodedPath, fullUrl });
    return fullUrl;
  } catch (error) {
    console.error('❌ Error building URL from key:', key, error);
    return `${API_BASE_URL}/uploads/${key}`;
  }
};

// ✅ دالة لبناء URL الصورة بشكل صحيح مع encoding للأحرف الخاصة
const getImageUrl = (image) => {
  if (!image) {
    console.warn('⚠️ getImageUrl: image is null or undefined');
    return null;
  }
  
  // إذا كان URL كامل موجود ويبدأ بـ http، نستخدمه لكن نصلح encoding
  if (image.url && (image.url.startsWith('http://') || image.url.startsWith('https://'))) {
    try {
      const urlObj = new URL(image.url);
      // إذا كان pathname يحتوي على أحرف غير encoded (مثل العربية أو الألمانية)
      // نحتاج لإعادة بناء المسار مع encoding صحيح
      const pathSegments = urlObj.pathname.split('/').filter(s => s);
      const encodedSegments = pathSegments.map(segment => {
        // إذا كان Segment يحتوي على أحرف غير ASCII، نعمل encoding
        try {
          // نحاول decode أولاً لنرى إذا كان encoded بالفعل
          const decoded = decodeURIComponent(segment);
          // إذا كان decode نجح ونتيجته مختلفة، يعني كان encoded
          // لكن قد يحتاج re-encoding بشكل صحيح
          return encodeURIComponent(decoded);
        } catch (e) {
          // إذا decode فشل، يعني Segment غير encoded، نعمل encoding
          return encodeURIComponent(segment);
        }
      });
      
      const encodedPath = '/' + encodedSegments.join('/');
      const newUrl = `${urlObj.origin}${encodedPath}${urlObj.search}${urlObj.hash}`;
      
      console.log('✅ Fixed URL encoding:', {
        original: image.url,
        fixed: newUrl,
        pathname: urlObj.pathname,
        encodedPath: encodedPath
      });
      
      return newUrl;
    } catch (e) {
      // إذا فشل parsing، نستخدم URL كما هو
      console.log('⚠️ URL parsing failed, using as-is:', image.url);
      return image.url;
    }
  }
  
  // إذا كان key موجود، نبني URL منه
  if (image.key) {
    const builtUrl = buildImageUrlFromKey(image.key);
    console.log('✅ Built URL from key:', builtUrl);
    return builtUrl;
  }
  
  // إذا كان url موجود لكن غير كامل
  if (image.url) {
    // إذا كان يبدأ بـ /uploads/ أو images/
    if (image.url.startsWith('/uploads/') || image.url.startsWith('/images/')) {
      // نعمل encoding على المسار
      const pathSegments = image.url.split('/').filter(s => s);
      const encodedSegments = pathSegments.map(segment => encodeURIComponent(segment));
      const encodedPath = '/' + encodedSegments.join('/');
      const fullUrl = `${API_BASE_URL}${encodedPath}`;
      console.log('✅ Built URL from absolute path:', fullUrl);
      return fullUrl;
    }
    // إذا كان يبدأ بـ uploads/ أو images/ بدون /
    if (image.url.startsWith('uploads/') || image.url.startsWith('images/')) {
      const pathSegments = image.url.split('/');
      const encodedSegments = pathSegments.map(segment => encodeURIComponent(segment));
      const encodedPath = encodedSegments.join('/');
      const fullUrl = `${API_BASE_URL}/${encodedPath}`;
      console.log('✅ Built URL from relative path:', fullUrl);
      return fullUrl;
    }
    // غير ذلك، نضيف /uploads/
    const encodedUrl = encodeURIComponent(image.url);
    const fullUrl = `${API_BASE_URL}/uploads/${encodedUrl}`;
    console.log('✅ Built URL with /uploads/ prefix:', fullUrl);
    return fullUrl;
  }
  
  console.warn('⚠️ No URL or key found for image:', image);
  return null;
};

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

function EditQuestion() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    prompt: '',
    qType: 'mcq',
    options: [{ text: '', isCorrect: false }],
    fillExact: '',
    regexList: [],
    answerKeyBoolean: true,
    answerKeyMatch: [{ left: '', right: '' }],
    answerKeyReorder: [],
    provider: 'deutschland-in-leben',
    section: '',
    level: 'B1',
    tags: [],
    status: 'draft',
    questionType: 'general',
    selectedState: '',
    // Leben in Deutschland fields
    usageCategory: '',
    mainSkill: '',
    images: [],
    // Interactive Text fields
    interactiveTextType: 'fill_blanks',
    text: '',
    interactiveBlanks: [],
    interactiveReorder: { parts: [] },
    // Free Text fields
    sampleAnswer: '',
    minWords: '',
    maxWords: '',
    // Speaking fields
    modelAnswerText: '',
    minSeconds: '',
    maxSeconds: '',
  });

  const [newTag, setNewTag] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

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

  // تحميل بيانات السؤال
  useEffect(() => {
    if (id) {
      loadQuestion();
    }
  }, [id]);

  const loadQuestion = async () => {
    try {
      setLoadingQuestion(true);
      setError('');
      console.log('🔄 Loading question with ID:', id);
      const question = await questionsAPI.getById(id);
      console.log('✅ Question loaded successfully:', question);
      
      // استخراج usageCategory و state من السؤال
      let usageCategory = '';
      let selectedState = '';
      let mainSkill = '';

      const providerLower = (question.provider || '').toLowerCase();

      // تحديد usageCategory من provider و tags
      if (providerLower === 'leben_in_deutschland' || providerLower === 'deutschland-in-leben' || providerLower === 'lid') {
        if (question.usageCategory === 'common' || question.tags?.includes('300-Fragen')) {
          usageCategory = 'common';
        } else if (question.usageCategory === 'state_specific' || question.state) {
          usageCategory = 'state_specific';
          selectedState = question.state || question.tags?.find(tag => germanStates.includes(tag)) || '';
        }
        mainSkill = question.mainSkill || 'leben_test';
      } else if (providerLower === 'grammatik' || providerLower === 'wortschatz') {
        usageCategory = 'grammar';
      } else if (['goethe', 'telc', 'osd', 'ecl', 'dtb', 'dtz'].includes(providerLower)) {
        usageCategory = 'provider';
      }

      // إذا كان usageCategory محفوظ في السؤال نفسه، نستخدمه
      if (question.usageCategory && !usageCategory) {
        usageCategory = question.usageCategory;
      }

      // تحويل البيانات من API format إلى form format
      // معالجة options - قد تكون array من objects أو strings
      let options = [];
      if (question.options && Array.isArray(question.options)) {
        if (question.options.length > 0 && typeof question.options[0] === 'string') {
          // إذا كانت strings، نحولها إلى objects
          options = question.options.map((opt, idx) => ({
            text: opt,
            isCorrect: question.correctAnswerIndex === idx || 
                      (Array.isArray(question.correctAnswerIndex) && question.correctAnswerIndex.includes(idx)) ||
                      false,
          }));
        } else {
          // إذا كانت objects بالفعل
          options = question.options.map(opt => ({
            text: opt.text || opt,
            isCorrect: opt.isCorrect !== undefined ? opt.isCorrect : false,
          }));
        }
      } else {
        options = [{ text: '', isCorrect: false }];
      }

      // معالجة answerKeyMatch - قد تكون array من objects أو array من arrays
      let answerKeyMatch = [];
      if (question.answerKeyMatch && Array.isArray(question.answerKeyMatch)) {
        if (question.answerKeyMatch.length > 0 && Array.isArray(question.answerKeyMatch[0])) {
          // إذا كانت array of arrays: [[left, right], ...]
          answerKeyMatch = question.answerKeyMatch.map(pair => ({
            left: pair[0] || '',
            right: pair[1] || '',
          }));
        } else {
          // إذا كانت array of objects: [{left, right}, ...]
          answerKeyMatch = question.answerKeyMatch.map(pair => ({
            left: pair.left || pair[0] || '',
            right: pair.right || pair[1] || '',
          }));
        }
      } else {
        answerKeyMatch = [{ left: '', right: '' }];
      }

      // Normalize provider to lowercase for backend compatibility
      const normalizeProvider = (provider) => {
        if (!provider) return 'deutschland-in-leben';
        const providerLower = provider.toLowerCase();
        // Map old values to new lowercase values
        const providerMap = {
          'goethe': 'goethe',
          'telc': 'telc',
          'télc': 'telc',
          'ösd': 'osd',
          'osd': 'osd',
          'ecl': 'ecl',
          'dtb': 'dtb',
          'dtz': 'dtz',
          'deutschland-in-leben': 'deutschland-in-leben',
          'leben in deutschland': 'deutschland-in-leben',
          'lid': 'deutschland-in-leben',
          'grammatik': 'grammatik',
          'wortschatz': 'wortschatz',
        };
        return providerMap[providerLower] || providerLower;
      };

      const normalizedProvider = normalizeProvider(question.provider);

      // 🔥 معالجة الصور بشكل صحيح
      let images = [];
      console.log('🖼️ Raw question data:', {
        hasImages: !!question.images,
        imagesLength: question.images?.length,
        images: question.images,
        hasMedia: !!question.media,
        media: question.media
      });

      if (Array.isArray(question.images) && question.images.length > 0) {
        // إذا كان هناك images array
        images = question.images.map((img, idx) => {
          const imageUrl = getImageUrl(img);
          console.log(`🖼️ Processing image ${idx + 1}:`, {
            original: img,
            key: img.key,
            url: img.url,
            builtUrl: imageUrl,
            description: img.description
          });
          
          return {
            type: img.type || 'image',
            key: img.key || '',
            url: imageUrl || '',
            mime: img.mime || 'image/jpeg',
            provider: img.provider || 's3',
            description: img.description || ''
          };
        });
      } else if (question.media && question.media.type === 'image') {
        // إذا كان هناك media واحد من نوع image
        const imageUrl = getImageUrl(question.media);
        console.log('🖼️ Processing media image:', {
          original: question.media,
          key: question.media.key,
          url: question.media.url,
          builtUrl: imageUrl,
          description: question.media.description
        });
        
        images = [{
          type: question.media.type || 'image',
          key: question.media.key || '',
          url: imageUrl || '',
          mime: question.media.mime || 'image/jpeg',
          provider: question.media.provider || 's3',
          description: question.media.description || ''
        }];
      }

      console.log('🖼️ Final processed images:', images);

      // معالجة بيانات Interactive Text
      let interactiveBlanks = [];
      if (Array.isArray(question.interactiveBlanks) && question.interactiveBlanks.length > 0) {
        interactiveBlanks = question.interactiveBlanks.map(blank => ({
          id: blank.id || '',
          type: blank.type || 'textInput',
          correctAnswers: Array.isArray(blank.correctAnswers) ? blank.correctAnswers : [],
          choices: Array.isArray(blank.choices) ? blank.choices : [],
          hint: blank.hint || '',
        }));
      }

      let interactiveReorder = { parts: [] };
      if (question.interactiveReorder && Array.isArray(question.interactiveReorder.parts)) {
        interactiveReorder = {
          parts: question.interactiveReorder.parts.map(part => ({
            id: part.id || '',
            text: part.text || '',
            order: part.order || 0,
          })),
        };
      }

      // تحديد نوع Interactive Text
      let interactiveTextType = 'fill_blanks';
      if (interactiveBlanks.length > 0) {
        interactiveTextType = 'fill_blanks';
      } else if (interactiveReorder.parts.length > 0) {
        interactiveTextType = 'reorder';
      }

      setFormData({
        prompt: question.prompt || '',
        qType: question.qType || 'mcq',
        options: options.length > 0 ? options : [{ text: '', isCorrect: false }],
        fillExact: question.fillExact || '',
        regexList: Array.isArray(question.regexList) ? question.regexList : [],
        answerKeyBoolean: question.answerKeyBoolean !== undefined ? question.answerKeyBoolean : true,
        answerKeyMatch: answerKeyMatch,
        answerKeyReorder: Array.isArray(question.answerKeyReorder) ? question.answerKeyReorder : [],
        provider: normalizedProvider,
        section: question.section || '',
        level: question.level || 'B1',
        tags: Array.isArray(question.tags) ? question.tags : [],
        status: question.status || 'draft',
        questionType: selectedState ? 'state' : 'general',
        selectedState: selectedState,
        usageCategory: usageCategory,
        mainSkill: mainSkill,
        images: images,
        // Interactive Text fields
        interactiveTextType: interactiveTextType,
        text: question.interactiveText || question.text || '',
        interactiveBlanks: interactiveBlanks,
        interactiveReorder: interactiveReorder,
        // Free Text fields
        sampleAnswer: question.sampleAnswer || '',
        minWords: question.minWords || '',
        maxWords: question.maxWords || '',
        // Speaking fields
        modelAnswerText: question.modelAnswerText || '',
        minSeconds: question.minSeconds || '',
        maxSeconds: question.maxSeconds || '',
      });

      // إذا كان هناك media (صوت)
      if (question.media && question.media.type === 'audio') {
        setAudioPreview(question.media.url || question.mediaUrl);
      }
    } catch (err) {
      console.error('❌ Error loading question:', err);
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        questionId: id,
      });
      
      let errorMessage = 'حدث خطأ أثناء تحميل السؤال';
      
      if (err.response?.status === 404) {
        errorMessage = 'السؤال غير موجود. قد يكون تم حذفه أو الـ ID غير صحيح.';
      } else if (err.response?.status === 403) {
        errorMessage = 'ليس لديك صلاحية لعرض هذا السؤال.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = typeof err.response.data.error === 'string' 
          ? err.response.data.error 
          : JSON.stringify(err.response.data.error);
      }
      
      setError(errorMessage);
      
      // إذا كان السؤال غير موجود (404)، عرض رسالة واضحة
      if (err.response?.status === 404) {
        setTimeout(() => {
          if (window.confirm('السؤال غير موجود. هل تريد العودة إلى قائمة الأسئلة؟')) {
            navigate('/admin/questions');
          }
        }, 2000);
      }
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
      
      // إذا تغير نوع السؤال (qType)، نعيد تعيين الحقول
      if (name === 'qType') {
        if (value === 'mcq') {
          updated.options = prev.options?.length > 0 ? prev.options : [{ text: '', isCorrect: false }];
        } else if (value === 'true_false') {
          updated.answerKeyBoolean = prev.answerKeyBoolean !== undefined ? prev.answerKeyBoolean : true;
        } else if (value === 'fill') {
          updated.fillExact = prev.fillExact || '';
          updated.regexList = prev.regexList?.length > 0 ? prev.regexList : [];
        } else if (value === 'match') {
          updated.answerKeyMatch = prev.answerKeyMatch?.length > 0 ? prev.answerKeyMatch : [{ left: '', right: '' }];
        } else if (value === 'reorder') {
          updated.answerKeyReorder = prev.answerKeyReorder?.length > 0 ? prev.answerKeyReorder : [];
        } else if (value === 'interactive_text') {
          updated.interactiveTextType = prev.interactiveTextType || 'fill_blanks';
          updated.text = prev.text || '';
          updated.interactiveBlanks = prev.interactiveBlanks?.length > 0 ? prev.interactiveBlanks : [];
          updated.interactiveReorder = prev.interactiveReorder?.parts?.length > 0 ? prev.interactiveReorder : { parts: [] };
        } else if (value === 'free_text') {
          updated.sampleAnswer = prev.sampleAnswer || '';
        } else if (value === 'speaking') {
          updated.modelAnswerText = prev.modelAnswerText || '';
        }
      }
      
      return updated;
    });
  };

  const handleOptionChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((option, i) =>
        i === index ? { ...option, [field]: value } : option
      ),
    }));
  };

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, { text: '', isCorrect: false }],
    }));
  };

  const removeOption = (index) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
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

  // Handlers for fill type (regex)
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
    const nextId = String.fromCharCode(97 + formData.interactiveBlanks.length);
    if (formData.interactiveBlanks.length >= 10) {
      setError('الحد الأقصى للفراغات هو 10');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      interactiveBlanks: [
        ...prev.interactiveBlanks,
        { id: nextId, type: 'textInput', correctAnswers: [], choices: [], hint: '' },
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
      const updated = { ...prev, interactiveBlanks: [...prev.interactiveBlanks] };
      updated.interactiveBlanks[blankIndex] = {
        ...updated.interactiveBlanks[blankIndex],
        correctAnswers: [...(updated.interactiveBlanks[blankIndex].correctAnswers || []), ''],
      };
      return updated;
    });
  };

  const handleUpdateCorrectAnswer = (blankIndex, answerIndex, value) => {
    setFormData((prev) => {
      const updated = { ...prev, interactiveBlanks: [...prev.interactiveBlanks] };
      const newAnswers = [...updated.interactiveBlanks[blankIndex].correctAnswers];
      newAnswers[answerIndex] = value;
      updated.interactiveBlanks[blankIndex] = {
        ...updated.interactiveBlanks[blankIndex],
        correctAnswers: newAnswers,
      };
      return updated;
    });
  };

  const handleRemoveCorrectAnswer = (blankIndex, answerIndex) => {
    setFormData((prev) => {
      const updated = { ...prev, interactiveBlanks: [...prev.interactiveBlanks] };
      updated.interactiveBlanks[blankIndex] = {
        ...updated.interactiveBlanks[blankIndex],
        correctAnswers: updated.interactiveBlanks[blankIndex].correctAnswers.filter((_, i) => i !== answerIndex),
      };
      return updated;
    });
  };

  const handleAddChoice = (blankIndex) => {
    setFormData((prev) => {
      const updated = { ...prev, interactiveBlanks: [...prev.interactiveBlanks] };
      updated.interactiveBlanks[blankIndex] = {
        ...updated.interactiveBlanks[blankIndex],
        choices: [...(updated.interactiveBlanks[blankIndex].choices || []), ''],
      };
      return updated;
    });
  };

  const handleUpdateChoice = (blankIndex, choiceIndex, value) => {
    setFormData((prev) => {
      const updated = { ...prev, interactiveBlanks: [...prev.interactiveBlanks] };
      const newChoices = [...updated.interactiveBlanks[blankIndex].choices];
      newChoices[choiceIndex] = value;
      updated.interactiveBlanks[blankIndex] = {
        ...updated.interactiveBlanks[blankIndex],
        choices: newChoices,
      };
      return updated;
    });
  };

  const handleRemoveChoice = (blankIndex, choiceIndex) => {
    setFormData((prev) => {
      const updated = { ...prev, interactiveBlanks: [...prev.interactiveBlanks] };
      updated.interactiveBlanks[blankIndex] = {
        ...updated.interactiveBlanks[blankIndex],
        choices: updated.interactiveBlanks[blankIndex].choices.filter((_, i) => i !== choiceIndex),
      };
      return updated;
    });
  };

  // Handlers for Interactive Text - Reorder
  const handleAddReorderPart = () => {
    setFormData((prev) => ({
      ...prev,
      interactiveReorder: {
        ...prev.interactiveReorder,
        parts: [
          ...prev.interactiveReorder.parts,
          { id: `part_${prev.interactiveReorder.parts.length + 1}`, text: '', order: prev.interactiveReorder.parts.length + 1 },
        ],
      },
    }));
  };

  const handleUpdateReorderPart = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      interactiveReorder: {
        ...prev.interactiveReorder,
        parts: prev.interactiveReorder.parts.map((part, i) =>
          i === index ? { ...part, [field]: value } : part
        ),
      },
    }));
  };

  const handleRemoveReorderPart = (index) => {
    setFormData((prev) => ({
      ...prev,
      interactiveReorder: {
        ...prev.interactiveReorder,
        parts: prev.interactiveReorder.parts.filter((_, i) => i !== index),
      },
    }));
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError('الملف يجب أن يكون ملف صوتي');
      return;
    }

    setUploadingAudio(true);
    setError('');

    try {
      const response = await questionsAPI.uploadMedia(file);
      setAudioFile(response.key);
      setAudioPreview(response.url);
      setSuccess('تم رفع الملف الصوتي بنجاح');
    } catch (err) {
      console.error('Error uploading audio:', err);
      setError('حدث خطأ أثناء رفع الملف الصوتي');
    } finally {
      setUploadingAudio(false);
    }
  };

  // رفع الصور لأسئلة Leben in Deutschland
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
        console.log('📤 Upload response (FULL):', JSON.stringify(response, null, 2));
        console.log('📤 response.url:', response.url);
        console.log('📤 response.key:', response.key);
        console.log('📤 response.location:', response.location);
        console.log('📤 response.fileUrl:', response.fileUrl);

        // استخدام URL من الـ response مباشرة إذا كان موجوداً
        let imageUrl = '';

        // جرب كل الحقول الممكنة للـ URL
        const possibleUrlFields = [response.url, response.location, response.fileUrl, response.imageUrl, response.path];
        const foundUrl = possibleUrlFields.find(u => u && typeof u === 'string');

        if (foundUrl) {
          if (foundUrl.startsWith('http://') || foundUrl.startsWith('https://')) {
            imageUrl = foundUrl;
          } else if (foundUrl.startsWith('/')) {
            imageUrl = `${API_BASE_URL}${foundUrl}`;
          } else {
            imageUrl = `${API_BASE_URL}/${foundUrl}`;
          }
        } else if (response.key) {
          // بناء URL من key - جرب مسارات مختلفة
          // أولاً جرب /media/ بدلاً من /uploads/
          imageUrl = `${API_BASE_URL}/media/${response.key}`;
        }

        console.log('🖼️ Built image URL:', imageUrl);

        // تجربة تحميل الصورة للتأكد من صحة الـ URL
        console.log('🔍 Testing image URL accessibility...');

        // بناء كائن الصورة حسب بنية API
        const imageObject = {
          type: 'image',
          key: response.key,
          mime: response.mime || file.type,
          provider: 's3',
          url: imageUrl,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setSuccess('');

    // Validation
    if (!formData.prompt.trim()) {
      setError('نص السؤال مطلوب');
      return;
    }

    if (formData.qType === 'mcq' && formData.options.length < 2) {
      setError('يجب إضافة خيارين على الأقل');
      return;
    }

    if (formData.qType === 'mcq' && !formData.options.some((opt) => opt.isCorrect)) {
      setError('يجب تحديد إجابة صحيحة واحدة على الأقل');
      return;
    }

    setLoading(true);

    try {
      // ✅ ALLOWED_QTYPES - القيم المسموحة
      const ALLOWED_QTYPES = new Set([
        'mcq',
        'fill',
        'true_false',
        'match',
        'reorder',
        'listen',
        'free_text',
        'speaking',
        'interactive_text',
      ]);

      // ✅ Normalize qType - يجب أن يكون lowercase وواحد من القيم المسموحة
      const normalizeQType = (qType) => {
        if (!qType) return 'mcq';
        const normalized = String(qType).trim().toLowerCase();
        if (ALLOWED_QTYPES.has(normalized)) {
          return normalized;
        }
        // إذا لم يكن من القيم المسموحة، نعيد mcq كقيمة افتراضية
        console.warn(`Invalid qType: "${qType}", using "mcq" as default`);
        return 'mcq';
      };

      // Normalize provider to lowercase before sending to backend
      const normalizeProvider = (provider) => {
        if (!provider) return 'deutschland-in-leben';
        const providerLower = provider.toLowerCase();
        const providerMap = {
          'goethe': 'goethe',
          'telc': 'telc',
          'télc': 'telc',
          'ösd': 'osd',
          'osd': 'osd',
          'ecl': 'ecl',
          'dtb': 'dtb',
          'dtz': 'dtz',
          'deutschland-in-leben': 'deutschland-in-leben',
          'leben in deutschland': 'deutschland-in-leben',
          'lid': 'deutschland-in-leben',
          'grammatik': 'grammatik',
          'wortschatz': 'wortschatz',
        };
        return providerMap[providerLower] || providerLower;
      };

      const questionData = {
        prompt: formData.prompt.trim(),
        qType: normalizeQType(formData.qType), // ✅ Normalize qType
        provider: normalizeProvider(formData.provider),
        level: formData.level,
        tags: formData.tags,
        status: formData.status,
      };

      if (formData.section) {
        questionData.section = formData.section;
      }

      // ✅ استخدام qType بعد normalize
      const normalizedQType = normalizeQType(formData.qType);
      
      // حسب نوع السؤال
      if (normalizedQType === 'mcq') {
        questionData.options = formData.options.map((opt) => ({
          text: opt.text.trim(),
          isCorrect: opt.isCorrect,
        }));
      } else if (normalizedQType === 'fill') {
        if (formData.fillExact) {
          questionData.fillExact = formData.fillExact;
        }
        if (formData.regexList.length > 0) {
          questionData.regexList = formData.regexList;
        }
      } else if (normalizedQType === 'true_false') {
        questionData.answerKeyBoolean = formData.answerKeyBoolean;
      } else if (normalizedQType === 'match') {
        questionData.answerKeyMatch = formData.answerKeyMatch;
      } else if (normalizedQType === 'reorder') {
        questionData.answerKeyReorder = formData.answerKeyReorder;
      } else if (normalizedQType === 'interactive_text') {
        // Interactive Text
        const interactiveTextValue = formData.text?.trim();
        if (interactiveTextValue) {
          questionData.interactiveText = interactiveTextValue;
        }
        if (formData.interactiveTextType === 'fill_blanks' && formData.interactiveBlanks.length > 0) {
          questionData.interactiveBlanks = formData.interactiveBlanks.map((blank) => ({
            id: blank.id,
            type: blank.type,
            correctAnswers: blank.correctAnswers.filter(a => a.trim() !== ''),
            ...(blank.type === 'dropdown' && blank.choices ? { choices: blank.choices.filter(c => c.trim() !== '') } : {}),
            ...(blank.hint ? { hint: blank.hint } : {}),
          }));
        } else if (formData.interactiveTextType === 'reorder' && formData.interactiveReorder.parts.length > 0) {
          questionData.interactiveReorder = {
            parts: formData.interactiveReorder.parts.map(part => ({
              id: part.id,
              text: part.text,
              order: part.order,
            })),
          };
        }
      } else if (normalizedQType === 'free_text') {
        if (formData.sampleAnswer) questionData.sampleAnswer = formData.sampleAnswer;
        if (formData.minWords) questionData.minWords = parseInt(formData.minWords) || undefined;
        if (formData.maxWords) questionData.maxWords = parseInt(formData.maxWords) || undefined;
      } else if (normalizedQType === 'speaking') {
        if (formData.modelAnswerText) questionData.modelAnswerText = formData.modelAnswerText;
        if (formData.minSeconds) questionData.minSeconds = parseInt(formData.minSeconds) || undefined;
        if (formData.maxSeconds) questionData.maxSeconds = parseInt(formData.maxSeconds) || undefined;
      }

      // إضافة media إذا كان موجود (صوت)
      if (audioFile) {
        questionData.media = {
          type: 'audio',
          key: audioFile,
          mime: 'audio/mpeg',
        };
      }

      // إضافة بيانات Leben in Deutschland
      if (formData.usageCategory === 'common' || formData.usageCategory === 'state_specific') {
        questionData.provider = 'leben_in_deutschland';
        questionData.mainSkill = 'leben_test';
        questionData.usageCategory = formData.usageCategory;
        questionData.level = formData.level || 'A1';
        
        if (formData.usageCategory === 'common') {
          questionData.tags = ['300-Fragen'];
        } else if (formData.usageCategory === 'state_specific') {
          questionData.state = formData.selectedState;
          questionData.tags = [formData.selectedState];
        }
        
        // إضافة الصور إذا كانت موجودة
        if (formData.images && formData.images.length > 0) {
          questionData.images = formData.images;
          // إذا كانت هناك صورة واحدة، نضيفها كـ media أيضاً
          if (formData.images.length === 1) {
            questionData.media = formData.images[0];
          }
        }
      }

      console.log('Updating question data:', JSON.stringify(questionData, null, 2));

      const updatedQuestion = await questionsAPI.update(id, questionData);
      console.log('✅ Question updated successfully:', updatedQuestion);
      setSuccess('تم تحديث السؤال بنجاح!');
      
      // Reload the question to get the latest data from the backend
      // This ensures the form shows the updated data
      try {
        await loadQuestion();
        console.log('✅ Question reloaded after update');
      } catch (reloadError) {
        console.error('❌ Error reloading question after update:', reloadError);
        // Don't show error to user if update was successful
        // Just log it for debugging
      }
      
      // Don't navigate away automatically - let user decide when to go back
      // This prevents issues where the question might not appear in the filtered list
    } catch (err) {
      console.error('Update question error:', err);
      
      let errorMessage = 'حدث خطأ أثناء تحديث السؤال';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' 
            ? errorData.error 
            : JSON.stringify(errorData.error);
        } else if (errorData.errors) {
          if (Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.map(e => 
              typeof e === 'string' ? e : JSON.stringify(e)
            ).join(', ');
          } else {
            errorMessage = Object.entries(errorData.errors)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join(' | ');
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else {
          errorMessage = JSON.stringify(errorData, null, 2);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingQuestion) {
    return (
      <div className="create-question-page">
        <div className="page-header">
          <button onClick={() => navigate('/admin/questions')} className="back-btn">
            ← العودة
          </button>
          <h1>تعديل السؤال</h1>
        </div>
        <div className="create-question-container">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
            <p>جاري تحميل بيانات السؤال...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-question-page">
      <div className="page-header">
        <button onClick={() => navigate('/admin/questions')} className="back-btn">
          ← العودة
        </button>
        <h1>تعديل السؤال</h1>
      </div>

      <div className="create-question-container">
        <form onSubmit={handleSubmit} className="question-form">
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
              placeholder="أدخل نص السؤال هنا..."
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
              <option value="reorder">ترتيب (Reorder)</option>
              <option value="interactive_text">نص تفاعلي (Interactive Text)</option>
              <option value="free_text">نص حر (Free Text)</option>
              <option value="speaking">تحدث (Speaking)</option>
            </select>
          </div>

          {/* MCQ Options */}
          {formData.qType === 'mcq' && (
            <div className="form-group">
              <label>الخيارات *</label>
              {formData.options.map((option, index) => (
                <div key={index} className="option-item">
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                    placeholder={`خيار ${index + 1}`}
                    required
                  />
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={option.isCorrect}
                      onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                    />
                    <span>صحيح</span>
                  </label>
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="remove-btn"
                    >
                      حذف
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addOption} className="add-btn">
                + إضافة خيار
              </button>
            </div>
          )}

          {/* True/False */}
          {formData.qType === 'true_false' && (
            <div className="form-group">
              <label>الإجابة الصحيحة *</label>
              <label className="checkbox-label">
                <input
                  type="radio"
                  name="answerKeyBoolean"
                  checked={formData.answerKeyBoolean === true}
                  onChange={() => setFormData((prev) => ({ ...prev, answerKeyBoolean: true }))}
                />
                <span>صحيح</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="radio"
                  name="answerKeyBoolean"
                  checked={formData.answerKeyBoolean === false}
                  onChange={() => setFormData((prev) => ({ ...prev, answerKeyBoolean: false }))}
                />
                <span>خطأ</span>
              </label>
            </div>
          )}

          {/* Fill */}
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
                required
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
                  className="add-btn"
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
                  />
                  <span style={{ margin: '0 8px' }}>↔</span>
                  <input
                    type="text"
                    value={pair.right}
                    onChange={(e) => handleUpdateMatchPair(index, 'right', e.target.value)}
                    placeholder={`اليمين ${index + 1}`}
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
                className="add-btn"
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
                className="add-btn"
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
                    style={{ marginBottom: '16px', width: '100%' }}
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
                          className="add-btn"
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
                          {(blank.choices || []).map((choice, choiceIndex) => (
                            <div key={choiceIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                              <input
                                type="text"
                                value={choice}
                                onChange={(e) => handleUpdateChoice(blankIndex, choiceIndex, e.target.value)}
                                placeholder="خيار"
                                style={{ flex: 1 }}
                              />
                              {(blank.choices || []).length > 2 && (
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
                            className="add-btn"
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
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddInteractiveBlank}
                    className="add-btn"
                    disabled={formData.interactiveBlanks.length >= 10}
                  >
                    + إضافة فراغ ({formData.interactiveBlanks.length}/10)
                  </button>
                </div>
              )}

              {/* Interactive Reorder */}
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>جزء {index + 1}</span>
                        <button type="button" onClick={() => handleRemoveReorderPart(index)} className="remove-btn">حذف</button>
                      </div>
                      <input
                        type="text"
                        value={part.text}
                        onChange={(e) => handleUpdateReorderPart(index, 'text', e.target.value)}
                        placeholder="نص الجزء"
                        style={{ width: '100%', marginBottom: '8px' }}
                      />
                      <input
                        type="number"
                        value={part.order}
                        onChange={(e) => handleUpdateReorderPart(index, 'order', parseInt(e.target.value) || 0)}
                        placeholder="الترتيب"
                        style={{ width: '80px' }}
                      />
                    </div>
                  ))}
                  <button type="button" onClick={handleAddReorderPart} className="add-btn">
                    + إضافة جزء
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Free Text */}
          {formData.qType === 'free_text' && (
            <div className="form-group">
              <label htmlFor="sampleAnswer">نموذج الإجابة (Sample Answer)</label>
              <textarea
                id="sampleAnswer"
                name="sampleAnswer"
                value={formData.sampleAnswer}
                onChange={handleInputChange}
                placeholder="أدخل نموذج الإجابة هنا..."
                rows={4}
              />
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="minWords">الحد الأدنى للكلمات</label>
                  <input
                    type="number"
                    id="minWords"
                    name="minWords"
                    value={formData.minWords}
                    onChange={handleInputChange}
                    placeholder="مثال: 50"
                    min="0"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="maxWords">الحد الأقصى للكلمات</label>
                  <input
                    type="number"
                    id="maxWords"
                    name="maxWords"
                    value={formData.maxWords}
                    onChange={handleInputChange}
                    placeholder="مثال: 200"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Speaking */}
          {formData.qType === 'speaking' && (
            <div className="form-group">
              <label htmlFor="modelAnswerText">نموذج الإجابة (Model Answer Text)</label>
              <textarea
                id="modelAnswerText"
                name="modelAnswerText"
                value={formData.modelAnswerText}
                onChange={handleInputChange}
                placeholder="أدخل نموذج الإجابة هنا..."
                rows={4}
              />
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="minSeconds">الحد الأدنى بالثواني</label>
                  <input
                    type="number"
                    id="minSeconds"
                    name="minSeconds"
                    value={formData.minSeconds}
                    onChange={handleInputChange}
                    placeholder="مثال: 30"
                    min="0"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="maxSeconds">الحد الأقصى بالثواني</label>
                  <input
                    type="number"
                    id="maxSeconds"
                    name="maxSeconds"
                    value={formData.maxSeconds}
                    onChange={handleInputChange}
                    placeholder="مثال: 120"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Usage Category */}
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

          {/* Grammar Metadata */}
          {formData.usageCategory === 'grammar' && (
            <div className="form-group" style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold' }}>
                إعدادات سؤال القواعد
              </h3>
              
              <div className="form-group">
                <label htmlFor="level">المستوى / Level *</label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
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

          {/* Provider Metadata */}
          {formData.usageCategory === 'provider' && (
            <div className="form-group" style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold' }}>
                🔹 Provider metadata
              </h3>
              
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
                <label htmlFor="level">المستوى / Level *</label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  required
                >
                  {getLevelsForProvider(formData.provider).map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="section">القسم / Section</label>
                <select
                  id="section"
                  name="section"
                  value={formData.section}
                  onChange={handleInputChange}
                >
                  <option value="">-- اختر القسم --</option>
                  <option value="Hören">Hören</option>
                  <option value="Lesen">Lesen</option>
                  <option value="Schreiben">Schreiben</option>
                  <option value="Sprechen">Sprechen</option>
                </select>
              </div>
            </div>
          )}

          {/* Leben Metadata */}
          {(formData.usageCategory === 'common' || formData.usageCategory === 'state_specific') && (
            <div className="form-group" style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '8px', border: '2px solid #fbbf24' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 'bold', color: '#92400e' }}>
                إعدادات سؤال Leben in Deutschland
              </h3>
              
              <div className="form-group">
                <label htmlFor="level">المستوى / Level *</label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
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
                            {(() => {
                              const imageUrl = getImageUrl(img);
                              console.log(`🖼️ Rendering image ${idx + 1}:`, {
                                image: img,
                                imageUrl: imageUrl,
                                hasUrl: !!imageUrl,
                                hasKey: !!img.key,
                                hasOriginalUrl: !!img.url
                              });
                              
                              if (!imageUrl) {
                                console.warn(`⚠️ No URL for image ${idx + 1}:`, img);
                                return (
                                  <div style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    backgroundColor: '#f3f4f6'
                                  }}>
                                    <span style={{ fontSize: '24px' }}>⚠️</span>
                                    <span style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', padding: '0 8px' }}>
                                      لا يوجد URL للصورة
                                    </span>
                                    <span style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center', padding: '0 8px' }}>
                                      Key: {img.key || 'N/A'}, URL: {img.url || 'N/A'}
                                    </span>
                                  </div>
                                );
                              }
                              
                              return (
                                <img
                                  key={`img-${idx}-${imageUrl}`}
                                  src={imageUrl}
                                  alt={`صورة ${idx + 1}`}
                                  style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover',
                                    display: 'block'
                                  }}
                                  onError={(e) => {
                                    console.error('❌ Image failed to load:', {
                                      image: img,
                                      imageUrl: imageUrl,
                                      key: img.key,
                                      originalUrl: img.url,
                                      error: e,
                                      targetSrc: e.target.src
                                    });
                                    e.target.style.display = 'none';
                                    const errorDiv = e.target.nextElementSibling;
                                    if (errorDiv) errorDiv.style.display = 'flex';
                                  }}
                                  onLoad={() => {
                                    console.log('✅ Image loaded successfully:', {
                                      image: img,
                                      imageUrl: imageUrl
                                    });
                                  }}
                                />
                              );
                            })()}
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
            </div>
          )}

          {/* Tags - حسب نوع الاستخدام */}
          {formData.usageCategory === 'grammar' && (
            <div className="form-group">
              <label>Tags</label>
              <div className="tags-input">
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
                  placeholder="أدخل tag واضغط Enter"
                />
                <button type="button" onClick={handleAddTag} className="add-btn">
                  إضافة
                </button>
              </div>
              <div className="tags-list">
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
              </div>
            </div>
          )}

          {formData.usageCategory === 'provider' && (
            <div className="form-group">
              <label>Tags</label>
              <div className="tags-input">
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
                  placeholder="أدخل tag واضغط Enter"
                />
                <button type="button" onClick={handleAddTag} className="add-btn">
                  إضافة
                </button>
              </div>
              <div className="tags-list">
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
              </div>
            </div>
          )}

          {/* Tags Display فقط لأسئلة Leben in Deutschland (للعرض فقط) */}
          {(formData.usageCategory === 'common' || formData.usageCategory === 'state_specific') && (
            <div className="form-group" style={{ backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '6px', border: '1px solid #bae6fd' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#0369a1' }}>
                📋 Tags (يتم تحديدها تلقائياً)
              </label>
              <div className="tags-list">
                {formData.tags.length > 0 ? (
                  formData.tags.map((tag, index) => (
                    <span key={index} className="tag" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>
                      {tag}
                    </span>
                  ))
                ) : (
                  <span style={{ color: '#64748b', fontSize: '13px' }}>
                    {formData.usageCategory === 'common' ? '300-Fragen' : formData.selectedState || 'سيتم إضافة tag تلقائياً عند الحفظ'}
                  </span>
                )}
              </div>
              <small style={{ display: 'block', marginTop: '8px', color: '#64748b', fontSize: '12px' }}>
                💡 Tags يتم تحديدها تلقائياً: {formData.usageCategory === 'common' ? '["300-Fragen"]' : `["${formData.selectedState || 'اسم الولاية'}"]`}
              </small>
            </div>
          )}

          {/* Audio Upload - فقط لأسئلة Provider */}
          {formData.usageCategory === 'provider' && (
            <div className="form-group">
              <label>ملف صوتي (اختياري)</label>
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                disabled={uploadingAudio}
              />
              {audioPreview && (
                <div className="audio-preview">
                  <audio controls src={audioPreview} />
                  <button
                    type="button"
                    onClick={() => {
                      setAudioFile(null);
                      setAudioPreview(null);
                    }}
                    className="remove-btn"
                  >
                    إزالة الملف
                  </button>
                </div>
              )}
              {uploadingAudio && <p>جاري رفع الملف...</p>}
            </div>
          )}

          {/* Status */}
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

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/admin/questions')}
              className="cancel-btn"
            >
              إلغاء
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditQuestion;

