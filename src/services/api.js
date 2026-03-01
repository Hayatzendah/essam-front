import axios from 'axios';

// استخدام الدومين الكامل مباشرة (بدون proxy)
// ⚠️ مهم جداً: تأكد من أن الدومين صحيح: .com وليس .co
// إذا كان لديك ملف .env، تأكد من: VITE_API_URL=https://api.deutsch-tests.com
// الـ Base URL الصحيح هو: https://api.deutsch-tests.com (مع .com)

// الحصول على القيمة من الـ env مع تصحيح أي خطأ في الدومين
let envApiUrl = import.meta.env.VITE_API_URL || '';
// تصحيح أي استخدام خاطئ لـ .co بدلاً من .com
if (envApiUrl && envApiUrl.includes('.co') && !envApiUrl.includes('.com')) {
  console.warn('⚠️ تم اكتشاف استخدام خاطئ لـ .co في VITE_API_URL، سيتم تصحيحه تلقائياً');
  envApiUrl = envApiUrl.replace(/\.co([^m]|$)/g, '.com');
}

// استخدام القيمة المصححة أو القيمة الافتراضية
// ⚠️ مهم: القيمة الصحيحة هي https://api.deutsch-tests.com (مع .com)
let API_BASE_URL = envApiUrl || 'https://api.deutsch-tests.com';

// فرض استخدام القيمة الصحيحة - تصحيح أي استخدام خاطئ لـ .co
if (API_BASE_URL.includes('deutsch-tests.co') && !API_BASE_URL.includes('deutsch-tests.com')) {
  console.error('❌ تم اكتشاف استخدام خاطئ لـ .co - سيتم تصحيحه تلقائياً');
  API_BASE_URL = API_BASE_URL.replace(/deutsch-tests\.co([^m]|$)/g, 'deutsch-tests.com');
}

// التأكد النهائي من القيمة الصحيحة
if (!API_BASE_URL.includes('deutsch-tests.com')) {
  console.warn('⚠️ القيمة غير صحيحة، سيتم استخدام القيمة الافتراضية');
  API_BASE_URL = 'https://api.deutsch-tests.com';
}

// طباعة الـ API URL للتأكد من القيمة الصحيحة
console.log('🌐 API Base URL:', API_BASE_URL);
if (API_BASE_URL.includes('.co') && !API_BASE_URL.includes('.com')) {
  console.error('❌ خطأ في الـ API URL! يجب أن يكون .com وليس .co');
  console.error('   القيمة الحالية:', API_BASE_URL);
  console.error('   القيمة الصحيحة: https://api.deutsch-tests.com');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// إضافة token تلقائياً للطلبات
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    console.log('🔧 Interceptor running for:', config.url);
    console.log('🔑 Token from localStorage:', token ? token.substring(0, 20) + '...' : 'null');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Authorization header added');
    } else {
      console.log('❌ No token found in localStorage');
    }
    console.log('📤 Final headers:', config.headers);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// معالجة الأخطاء من الـ API
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // الـ API ردّ بخطأ
      console.error('❌ API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
      
      // معالجة خاصة لخطأ 401 (Unauthorized) - Token منتهي أو غير صالح
      if (error.response.status === 401) {
        console.error('🔒 401 Unauthorized - Token منتهي أو غير صالح');
        // حذف tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // إعادة توجيه للـ login (فقط إذا لم نكن في صفحة login)
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      // 403 Forbidden = ما عندك صلاحية (مش مشكلة token)
      if (error.response.status === 403) {
        console.error('🚫 403 Forbidden - ليس لديك صلاحية لهذا الإجراء');
        // لا تحذف الـ tokens! المستخدم مسجل دخول لكن ما عنده صلاحية
      }
      
      // معالجة خاصة لخطأ 502
      if (error.response.status === 502) {
        console.error('🔴 Backend Server غير متاح!');
        console.error('💡 تأكد من:');
        console.error('   1. الـ Backend يعمل على http://localhost:4000');
        console.error('   2. أو غيّر VITE_API_URL في .env');
        console.error('   3. أو غيّر target في vite.config.js');
      }
    } else if (error.request) {
      // الطلب أُرسل لكن لم يكن هناك رد
      console.error('❌ No response received:', error.request);
      console.error('💡 الـ Backend لا يرد. تأكد من أنه يعمل.');
    } else {
      // خطأ في إعداد الطلب
      console.error('❌ Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (email, password, role = 'student') => {
    const data = {
      email: email.trim().toLowerCase(),
      password,
      role: role || 'student',
    };
    
    console.log('Registering with data:', { ...data, password: '***' });
    console.log('API URL:', API_BASE_URL);
    console.log('Full URL:', `${API_BASE_URL}/auth/register`);
    
    try {
      const response = await api.post('/auth/register', data);
      return response.data;
    } catch (error) {
      console.error('=== Register API Call Failed ===');
      console.error('URL:', `${API_BASE_URL}/auth/register`);
      console.error('Request data:', { ...data, password: '***' });
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Error message:', error.message);
      console.error('================================');
      throw error;
    }
  },

  login: async (email, password) => {
    const data = {
      email: email.trim().toLowerCase(),
      password,
    };
    console.log('Logging in with data:', { ...data, password: '***' });
    console.log('API URL:', API_BASE_URL);
    console.log('Full URL:', `${API_BASE_URL}/auth/login`);

    try {
      const response = await api.post('/auth/login', data);
      console.log('✅ Login response received:', {
        hasAccessToken: !!response.data.accessToken,
        hasRefreshToken: !!response.data.refreshToken,
        hasUser: !!response.data.user,
        tokenPreview: response.data.accessToken ? response.data.accessToken.substring(0, 20) + '...' : 'null'
      });

      // حفظ tokens في localStorage
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        console.log('✅ Tokens saved to localStorage');
        console.log('📦 Verification - accessToken in localStorage:', localStorage.getItem('accessToken') ? 'موجود ✅' : 'غير موجود ❌');
      } else {
        console.error('❌ No accessToken in login response!');
      }
      return response.data;
    } catch (error) {
      console.error('Login API call failed:', {
        url: `${API_BASE_URL}/auth/login`,
        data: { ...data, password: '***' },
        error: error.response?.data || error.message,
      });
      throw error;
    }
  },

  checkEmail: async (email) => {
    try {
      const response = await api.get(`/auth/check/${encodeURIComponent(email.trim().toLowerCase())}`);
      return response.data;
    } catch (error) {
      console.error('Check email error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },
};

// 1. جلب قائمة مواضيع القواعد
export const getGrammarTopics = async (level = null) => {
  console.log('📚 Fetching grammar topics', level ? `for level: ${level}` : '(all topics)');

  const params = level ? { level } : {};
  const response = await api.get('/grammar/topics', { params });

  console.log('📚 Response:', response.data);
  return response.data;
};

// 2. جلب موضوع قواعد محدد
export const getGrammarTopic = async (slug, level) => {
  const response = await api.get(`/grammar/topics/${slug}`, {
    params: { level },
  });
  return response.data;
};

// 3. إنشاء موضوع قواعد جديد
export const createGrammarTopic = async (topicData) => {
  const response = await api.post('/grammar/topics', topicData);
  return response.data;
};

// 4. تحديث موضوع قواعد محدد
export const updateGrammarTopic = async (topicId, topicData) => {
  const response = await api.patch(`/grammar/topics/${topicId}`, topicData);
  return response.data;
};

// 5. جلب موضوع قواعد بالـ ID (للاستخدام في admin)
// Note: API might use slug, but we'll try ID first, fallback to slug if needed
export const getGrammarTopicById = async (topicId) => {
  try {
    // Try with ID first
    const response = await api.get(`/grammar/topics/${topicId}`);
    return response.data;
  } catch (err) {
    // If ID doesn't work, might need to use slug - but for now we'll use the topic's slug
    throw err;
  }
};

// 6. إعادة ترتيب مواضيع القواعد (Admin فقط)
export const reorderGrammarTopics = async (topicIds) => {
  console.log('🔄 Reordering grammar topics:', topicIds);
  const response = await api.patch('/grammar/topics/reorder', { topicIds });
  console.log('✅ Reorder response:', response.data);
  return response.data;
};

// ========== Vocabulary Topics API ==========
// 1. جلب قائمة مواضيع المفردات
export const getVocabularyTopics = async (level = null) => {
  console.log('📚 Fetching vocabulary topics', level ? `for level: ${level}` : '(all topics)');
  const params = level ? { level } : {};
  const response = await api.get('/vocabulary-topics', { params });
  console.log('📚 Response:', response.data);
  return response.data;
};

// 2. جلب موضوع مفردات محدد
export const getVocabularyTopic = async (topicId) => {
  const response = await api.get(`/vocabulary-topics/${topicId}`);
  return response.data;
};

// 3. إنشاء موضوع مفردات جديد
export const createVocabularyTopic = async (topicData) => {
  const response = await api.post('/vocabulary-topics', topicData);
  return response.data;
};

// 4. تحديث موضوع مفردات محدد
export const updateVocabularyTopic = async (topicId, topicData) => {
  const response = await api.patch(`/vocabulary-topics/${topicId}`, topicData);
  return response.data;
};

// 5. حذف موضوع مفردات
export const deleteVocabularyTopic = async (topicId) => {
  const response = await api.delete(`/vocabulary-topics/${topicId}`);
  return response.data;
};

// 6. إعادة ترتيب مواضيع المفردات
export const reorderVocabularyTopics = async (topicIds) => {
  const response = await api.patch('/vocabulary-topics/reorder', { topicIds });
  return response.data;
};

// ========== Vocabulary Words API ==========
// 1. جلب كلمات موضوع محدد
export const getVocabularyWords = async (topicId) => {
  const response = await api.get('/vocabulary-words', { params: { topicId } });
  return response.data;
};

// 2. إضافة كلمة جديدة
export const createVocabularyWord = async (topicId, wordData) => {
  const response = await api.post('/vocabulary-words', { ...wordData, topicId });
  return response.data;
};

// 3. إضافة عدة كلمات مرة واحدة
export const createVocabularyWordsBulk = async (topicId, wordsArray) => {
  // الصيغة: { topicId, words: [{ word, meaning, exampleSentence }] }
  const response = await api.post('/vocabulary-words/bulk', { 
    topicId,
    words: wordsArray 
  });
  return response.data;
};

// 4. تحديث كلمة
export const updateVocabularyWord = async (topicId, wordId, wordData) => {
  const response = await api.patch(`/vocabulary-words/${wordId}`, { ...wordData, topicId });
  return response.data;
};

// 5. حذف كلمة
export const deleteVocabularyWord = async (topicId, wordId) => {
  const response = await api.delete(`/vocabulary-words/${wordId}`, { params: { topicId } });
  return response.data;
};

// 6. إعادة ترتيب الكلمات
export const reorderVocabularyWords = async (wordIds) => {
  const response = await api.patch('/vocabulary-words/reorder', { topicIds: wordIds });
  return response.data;
};

// 3. جلب أسئلة القواعد المتعلقة بالموضوع
export const getGrammarQuestions = async ({ level, tags, page = '1', limit = '20' }) => {
  const response = await api.get('/questions/grammar', {
    params: {
      level,
      tags,
      page,
      limit,
    },
  });
  return response.data;
};

// 4. جلب قائمة الامتحانات المنشورة (Public)
// جلب قائمة مزودي الامتحانات (Prüfungen Providers)
export const getProviders = async () => {
  console.log('📋 Fetching exam providers');
  const response = await api.get('/exams/providers');
  console.log('📋 Providers response:', response.data);
  return response.data;
};

// جلب الامتحانات حسب فلاتر (provider, level, skill, category)
export const getExams = async ({ examCategory, provider, level, mainSkill, page = 1, limit = 20 }) => {
  console.log('📝 Fetching exams with params:', { examCategory, provider, level, mainSkill, page, limit });
  const params = {};
  if (examCategory) params.examCategory = examCategory;
  if (provider) params.provider = provider;
  if (level) params.level = level;
  if (mainSkill) params.mainSkill = mainSkill;
  if (page) params.page = page;
  if (limit) params.limit = limit;

  const response = await api.get('/exams', { params });
  console.log('📝 Exams response:', response.data);
  return response.data;
};

// Legacy function - keep for backward compatibility
export const getPublicExams = async ({ level, provider, mainSkill, page = 1, limit = 20 }) => {
  const params = { level, provider, page, limit };
  if (mainSkill) params.mainSkill = mainSkill;
  console.log('📝 Fetching public exams with params:', params);
  const response = await api.get('/exams/public', { params });
  console.log('📝 Public exams response:', response.data);
  return response.data;
};

// جلب المهارات المتاحة لمزود ومستوى معين
export const getProviderSkills = async (provider, level) => {
  console.log('📝 Fetching provider skills:', { provider, level });
  const response = await api.get('/exams/provider-skills', { params: { provider, level } });
  console.log('📝 Provider skills response:', response.data);
  return response.data;
};

// 5. جلب تفاصيل امتحان معين (Public)
export const getExamDetails = async (examId) => {
  console.log('📝 Fetching exam details for:', examId);
  const response = await api.get(`/exams/${examId}/public`);
  console.log('📝 Exam details response:', response.data);
  return response.data;
};

// 6. إنشاء محاولة امتحان جديدة
export const createAttempt = async (examId, mode = 'exam') => {
  console.log('🎯 Creating attempt for exam:', examId, 'mode:', mode);
  const response = await api.post('/attempts', {
    examId,
    mode,
  });
  console.log('🎯 Attempt created:', response.data);
  return response.data;
};

// 7. جلب محاولة امتحان معينة
export const getAttempt = async (attemptId) => {
  console.log('🎯 Fetching attempt:', attemptId);
  const response = await api.get(`/attempts/${attemptId}`);
  console.log('🎯 Attempt response:', response.data);
  return response.data;
};

// 8. إرسال إجابات المحاولة
export const submitAttempt = async (attemptId, answers) => {
  console.log('🎯 Submitting attempt:', attemptId, 'answers:', answers);
  const response = await api.post(`/attempts/${attemptId}/submit`, { answers });
  console.log('🎯 Submit response:', response.data);
  return response.data;
};

// 9. إصلاح أقسام الامتحان الفارغة (admin only)
export const fixExamSections = async (examId) => {
  console.log('🔧 Fixing empty sections for exam:', examId);
  const response = await api.post(`/exams/${examId}/fix-sections`);
  console.log('✅ Sections fixed:', response.data);
  return response.data;
};

// 10. جلب الـ Enums (Skills, Status, etc.)
export const getEnums = async () => {
  console.log('📋 Fetching global enums...');
  const response = await api.get('/enums');
  console.log('📋 Enums response:', response.data);
  return response.data;
};

// ========== Schreiben (Writing Tasks) API ==========

// 1. جلب جميع مهام الكتابة
export const getSchreibenTasks = async ({ level, provider, status } = {}) => {
  console.log('✍️ Fetching Schreiben tasks:', { level, provider, status });
  const params = {};
  if (level) params.level = level;
  if (provider) params.provider = provider;
  if (status) params.status = status;
  const response = await api.get('/schreiben/tasks', { params });
  console.log('✍️ Schreiben tasks response:', response.data);
  return response.data;
};

// 2. جلب مهمة كتابة واحدة
export const getSchreibenTask = async (taskId) => {
  console.log('✍️ Fetching Schreiben task:', taskId);
  const response = await api.get(`/schreiben/tasks/${taskId}`);
  console.log('✍️ Schreiben task response:', response.data);
  return response.data;
};

// 3. إنشاء مهمة كتابة جديدة (Admin/Teacher)
export const createSchreibenTask = async (taskData) => {
  console.log('✍️ Creating Schreiben task:', taskData);
  const response = await api.post('/schreiben/tasks', taskData);
  console.log('✍️ Created Schreiben task:', response.data);
  return response.data;
};

// 4. تحديث مهمة كتابة (Admin/Teacher)
export const updateSchreibenTask = async (taskId, taskData) => {
  console.log('✍️ Updating Schreiben task:', taskId, taskData);
  const response = await api.patch(`/schreiben/tasks/${taskId}`, taskData);
  console.log('✍️ Updated Schreiben task:', response.data);
  return response.data;
};

// 5. حذف مهمة كتابة (Admin/Teacher)
export const deleteSchreibenTask = async (taskId) => {
  console.log('✍️ Deleting Schreiben task:', taskId);
  const response = await api.delete(`/schreiben/tasks/${taskId}`);
  console.log('✍️ Deleted Schreiben task:', response.data);
  return response.data;
};

// 6. إعادة ترتيب مهام الكتابة (Admin/Teacher)
export const reorderSchreibenTasks = async (taskIds) => {
  console.log('✍️ Reordering Schreiben tasks:', taskIds);
  const response = await api.patch('/schreiben/tasks/reorder', { taskIds });
  console.log('✍️ Reorder Schreiben response:', response.data);
  return response.data;
};

// 7. تحديث محتوى المهمة (Content Blocks)
export const updateSchreibenContentBlocks = async (taskId, contentBlocks) => {
  console.log('✍️ Updating Schreiben content blocks:', taskId, contentBlocks);
  const response = await api.patch(`/schreiben/tasks/${taskId}/content-blocks`, { contentBlocks });
  console.log('✍️ Updated content blocks:', response.data);
  return response.data;
};

// 8. ربط مهمة كتابة بامتحان
export const linkSchreibenExam = async (taskId, examId) => {
  console.log('✍️ Linking Schreiben task to exam:', taskId, examId);
  const response = await api.patch(`/schreiben/tasks/${taskId}/link-exam`, { examId });
  console.log('✍️ Link exam response:', response.data);
  return response.data;
};

// 9. إلغاء ربط المهمة بالامتحان
export const unlinkSchreibenExam = async (taskId) => {
  console.log('✍️ Unlinking Schreiben task from exam:', taskId);
  const response = await api.delete(`/schreiben/tasks/${taskId}/link-exam`);
  console.log('✍️ Unlink exam response:', response.data);
  return response.data;
};

// 10. تسليم إجابات نموذج الكتابة وتصحيحها تلقائياً
export const submitSchreibenForm = async (attemptId, formAnswers) => {
  console.log('✍️ Submitting Schreiben form:', attemptId, formAnswers);
  const response = await api.post(`/attempts/${attemptId}/submit-schreiben`, { formAnswers });
  console.log('✍️ Schreiben form submit response:', response.data);
  return response.data;
};

// 11. فحص حقل واحد من نموذج الكتابة بدون تسليم
export const checkSchreibenField = async (taskId, fieldId, answer) => {
  console.log('✍️ Checking Schreiben field:', taskId, fieldId);
  const response = await api.post(`/schreiben/tasks/${taskId}/check-field`, { fieldId, answer });
  console.log('✍️ Schreiben field check response:', response.data);
  return response.data;
};

// 12. تحديث الإجابة الصحيحة لحقل معين في مهمة الكتابة
export const updateFieldCorrectAnswer = async (taskId, fieldId, body) => {
  console.log('✍️ Updating field correct answer:', taskId, fieldId, body);
  const response = await api.patch(`/schreiben/tasks/${taskId}/fields/${fieldId}/correct-answer`, body);
  console.log('✍️ Update field correct answer response:', response.data);
  return response.data;
};

// 13. رفع صورة
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/uploads/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export default api;

