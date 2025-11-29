import api from './api';

export const usersAPI = {
  // الحصول على معلومات المستخدم الحالي
  getMe: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  // تحديث ولاية المستخدم
  updateState: async (state) => {
    const response = await api.patch('/users/me/state', { state });
    return response.data;
  },
};


















