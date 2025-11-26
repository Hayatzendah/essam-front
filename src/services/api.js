import axios from 'axios';

// استخدام الدومين الكامل مباشرة (بدون proxy)
// ⚠️ مهم جداً: تأكد من أن الدومين صحيح: .com وليس .co
// إذا كان لديك ملف .env، تأكد من: VITE_API_URL=https://api.deutsch-tests.com
// الـ Base URL الصحيح هو: https://api.deutsch-tests.com (مع .com)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.deutsch-tests.com';

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
export const getGrammarTopics = async (level) => {
  console.log('📚 Fetching grammar topics for level:', level);
  console.log('📚 Full URL will be:', `${API_BASE_URL}/grammar/topics?level=${level}`);

  const response = await api.get('/grammar/topics', {
    params: { level },
  });

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
export const getPublicExams = async ({ level, provider, page = 1, limit = 20 }) => {
  console.log('📝 Fetching public exams with params:', { level, provider, page, limit });
  const response = await api.get('/exams/public', {
    params: {
      level,
      provider,
      page,
      limit,
    },
  });
  console.log('📝 Public exams response:', response.data);
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

export default api;

