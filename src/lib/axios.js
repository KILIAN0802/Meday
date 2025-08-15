

import axios from 'axios';

import { CONFIG } from 'src/global-config';

import { JWT_STORAGE_KEY } from '../auth/context/jwt/constant';
// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: CONFIG.apiUrl });

axiosInstance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(JWT_STORAGE_KEY); // <— dùng sessionStorage
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


// ----------------------------------------------------------------------

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];
    const res = await axiosInstance.get(url, { ...config });

    // ✅ CHANGED: fetcher không nên trả về accessToken cứng
    // Trả lại payload để caller tự xử lý
    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
};
// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: {
    me: '/api/v1/admins/owner/me',
    signIn: '/api/v1/auth/admin/login',
    signUp: '/api/auth/sign-up',
  },

  staff: {
    me: '/api/v1/staffs/owner/me',
    signIn: '/api/v1/auth/staff/login',
    create: '/api/v1/admin/staffs',
    fillter: '/api/v1/admin/staffs',
    getID: '/api/v1/admin/staffs/{id}',
    updateID: '/api/v1/admin/staffs/{id}',
    deleteID: '/api/v1/admin/staffs/{id}',
  },
  mail: {
    list: '/api/mail/list',
    details: '/api/mail/details',
    labels: '/api/mail/labels',
  },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
};
