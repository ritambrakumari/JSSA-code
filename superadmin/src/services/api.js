import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sa_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sa_token');
      const publicPaths = ['/login', '/admin-portal-login'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export const authService = {
  login: (credentials) => api.post('/auth/login', { ...credentials, role: 'superadmin' }),
  requestOTP: (phone) => api.post('/auth/nimbus-login-request', { phone, role: 'superadmin' }),
  verifyOTP: (phone, otp) => api.post('/auth/nimbus-login-verify', { phone, otp, role: 'superadmin' }),
  getMe: () => api.get('/auth/me'),
};

export const adminService = {
  getAdmins: () => api.get('/auth/superadmin/admins'),
  createAdmin: (data) => api.post('/auth/superadmin/admins', data),
  updateAdmin: (id, data) => api.put(`/auth/superadmin/admins/${id}`, data),
  deleteAdmin: (id) => api.delete(`/auth/superadmin/admins/${id}`),
};

export const sessionService = {
  getSessions: () => api.get('/auth/superadmin/sessions'),
  terminateSession: (id) => api.delete(`/auth/superadmin/sessions/${id}`),
  logoutAdmin: (adminId) => api.delete(`/auth/superadmin/logout-all/${adminId}`),
};

export const goalConfigService = {
  getConfig: (role) => api.get(`/goal-config`), // Actually the backend /api/goal-config returns all configs
  updateConfig: (role, data) => api.put(`/goal-config/${role}`, data),
};

export const landingConfigService = {
  getConfig: () => api.get('/landing-config'),
  updateConfig: (data) => api.put('/landing-config', data),
};

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

// Reuses the existing public/admin content APIs; backend already authorizes superadmin.
export const contentService = {
  getJobs: () => api.get('/job-postings', { params: { status: 'all', limit: 100 } }),
  createJob: (data) => api.post('/job-postings', data),
  updateJob: (id, data) => api.put(`/job-postings/${id}`, data),
  deleteJob: (id) => api.delete(`/job-postings/${id}`),
  uploadPdf: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/upload/advertisement', fd, multipart);
  },
  getNotifications: () => api.get('/notifications'),
  createNotification: (data) => api.post('/notifications', data),
  updateNotification: (id, data) => api.put(`/notifications/${id}`, data),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  // kind: 'gallery' | 'scroller'
  getImages: (kind) => api.get(`/${kind}`),
  createImage: (kind, fd) => api.post(`/${kind}`, fd, multipart),
  updateImage: (kind, id, data) => api.put(`/${kind}/${id}`, data),
  deleteImage: (kind, id) => api.delete(`/${kind}/${id}`),
};

export default api;
