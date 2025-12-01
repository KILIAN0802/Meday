import axios from 'axios';

import { CONFIG } from 'src/global-config';

import { JWT_STORAGE_KEY } from '../auth/context/jwt/constant';
// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: CONFIG.apiUrl });

axiosInstance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(JWT_STORAGE_KEY);
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
    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
};
// ----------------------------------------------------------------------

export const endpoints = {
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

  auth0: {
    admin: '/api/v1/auth/admin/login',
    staff: '/api/v1/auth/staff/login',
  },

  owner:{
    admin: '/api/v1/admins/owner/me',
    staff: '/api/v1/staffs/owner/me',
  },

  admin_manage_staff:{
    create: '/api/v1/admin/staffs',
    get: '/api/v1/admin/staffs',
    getID: (id) => `/api/v1/admin/staffs/${id}`,
    updateID: (id) => `/api/v1/admin/staffs/${id}`,
    deleteID: (id) => `/api/v1/admin/staffs/${id}`,
  },

  admin_vital_groups:{
    create: '/api/v1/admin/vital-groups',
    get: '/api/v1/admin/vital-groups',
    getID: (id) => `/api/v1/admin/vital-groups/${id}`,
    updateID: (id) => `/api/v1/admin/vital-groups/${id}`,
    deleteID: (id) => `/api/v1/admin/vital-groups/${id}`,
  },

  admin_vital_indicators:{
    create: '/api/v1/admin/vital-indicators',
    get: '/api/v1/admin/vital-indicators',
    getID: (id) => `/api/v1/admin/vital-indicators/${id}`,
    updateID: (id) => `/api/v1/admin/vital-indicators/${id}`,
    deleteID: (id) => `/api/v1/admin/vital-indicators/${id}`,

  },

  staff_patientManagerment:{
    getPatient:'/api/v1/staff/patients',
  },

  vitals:{
    getAllGroup: '/api/v1/vitals/groups',
    getIDGroup: (id) => `/api/v1/vitals/groups/${id}`,
    getAllIndicator: '/api/v1/vitals/indicator',
    getIDIndicator: (id) => `/api/v1/vitals/indicators/${id}`,
  },

  vital_groups: {
    create: '/api/v1/admin/vital-groups' ,
    get: '/api/v1/admin/vital-groups',
    getID: '/api/v1/admin/vital-groups/{id}',
    updateID: '/api/v1/admin/vital-groups/{id}',
    deleteID: '/api/v1/admin/vital-groups/{id}',
  },

  medical_record_staff:{
    create:'/api/staff/medical-records',
    get:'/api/staff/medical-records',
    getCurrent:'/api/staff/medical-records/my-records',
    getID:(id) => `/api/staff/medical-records/${id}`,
    UpdateID:(id) => `/api/staff/medical-records/${id}`,
    DeleteID:(id) => `/api/staff/medical-records/${id}`,
    getVitalId:(id) => `/api/staff/medical-records/${id}/vital-values`,
    UpdateVitalId:(id) => `/api/staff/medical-records/${id}/vital-values`,
    UpdateGroupID: (id) => `/api/staff/medical-records/vital-group/${id}`,
  },

  medical_record_templates_staff:{
    get:'/api/staff/medical-record-templates',
    getID:(id) => `/api/staff/medical-record-templates/${id}`,
  },
  
  appointments_staff:{
    create:'/api/v1/staff/appointments',
    getAll:'/api/v1/staff/appointments',
    getCurrent:'/api/v1/staff/appointments/my-appointments',
    checkAvailability:'/api/v1/staff/appointments/check-availability',
    getID:(id) => `/api/v1/staff/appointments/${id}`,
    UpdateID:(id) => `/api/staff/medical-records/${id}`,
    DeleteID:(id) => `/api/staff/medical-records/${id}`,
    updateStatus:(id) => `/api/v1/staff/appointments/${id}/status`,
    getVitalId:(id) => `/api/staff/medical-records/${id}/vital-values`,
    UpdateVitalId:(id) => `/api/staff/medical-records/vital-group/${id}`
  },

  vital_indicators: {
    create: '/api/v1/admin/vital-indicators' ,
    get: '/api/v1/admin/vital-indicators',
    getID: (id) => `/api/v1/admin/vital-indicators/${id}`,
    updateID: (id) => `/api/v1/admin/vital-indicators/${id}`,
    deleteID: (id) => `/api/v1/admin/vital-indicators/${id}`, 
  },
};