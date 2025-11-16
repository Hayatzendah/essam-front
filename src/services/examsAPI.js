import api from './api';

export const examsAPI = {
  // للمعلمين: إنشاء Exam جديد
  create: async (examData) => {
    const response = await api.post('/exams', examData);
    return response.data;
  },

  // للمعلمين: الحصول على قائمة الامتحانات
  getAll: async (params = {}) => {
    const response = await api.get('/exams', { params });
    return response.data;
  },

  // للمعلمين: الحصول على تفاصيل Exam
  getById: async (id) => {
    const response = await api.get(`/exams/${id}`);
    return response.data;
  },

  // للمعلمين: تحديث Exam
  update: async (id, examData) => {
    const response = await api.patch(`/exams/${id}`, examData);
    return response.data;
  },

  // للمعلمين: حذف Exam
  delete: async (id) => {
    const response = await api.delete(`/exams/${id}`);
    return response.data;
  },

  // للطلاب: الحصول على الامتحانات المتاحة
  getAvailable: async (params = {}) => {
    // استخدام /exams/available للطلاب (إذا كان يدعم state)
    // أو استخدام /exams?status=published&state=... إذا كان /exams/available لا يدعم state
    const response = await api.get('/exams/available', { params });
    return response.data;
  },

  // للطلاب: الحصول على الامتحانات المتاحة باستخدام /exams مع filters
  getAvailableExams: async (params = {}) => {
    // استخدام /exams?status=published&state=... للطلاب
    const response = await api.get('/exams', { 
      params: {
        status: 'published',
        ...params
      }
    });
    return response.data;
  },

  // بدء محاولة امتحان جديدة
  startAttempt: async (examId) => {
    const response = await api.post('/attempts', { examId });
    return response.data;
  },

  // الحصول على تفاصيل محاولة
  getAttempt: async (attemptId) => {
    const response = await api.get(`/attempts/${attemptId}`);
    return response.data;
  },

  // حفظ إجابة
  saveAnswer: async (attemptId, answerData) => {
    const response = await api.patch(`/attempts/${attemptId}/answer`, answerData);
    return response.data;
  },

  // تسليم المحاولة
  submitAttempt: async (attemptId) => {
    const response = await api.post(`/attempts/${attemptId}/submit`, {});
    return response.data;
  },

  // الحصول على قائمة محاولات الطالب
  getMyAttempts: async (examId = null) => {
    const params = examId ? { examId } : {};
    const response = await api.get('/attempts', { params });
    return response.data;
  },
};
