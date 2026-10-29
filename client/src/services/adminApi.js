// client/src/services/adminApi.js
// Dedicated Admin API Service wrapping all /api/admin/* and moderation endpoints.
// Utilizes the central Axios instance from api.js.

import axios from 'axios';

// Central instance configured in api.js
const envUrl = import.meta.env.VITE_API_URL;
const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '')
    ? envUrl.trim().replace(/\/+$/, '')
    : 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

client.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('homerent_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch {
      // Ignore
    }
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const msg = error.response?.data?.message || error.message || 'Unknown error';
    console.error(`[Admin API Error ${status}]: ${msg}`);

    if (status === 403 && error.response?.data?.isSuspended) {
      localStorage.removeItem('homerent_user');
      localStorage.removeItem('homerent_saved_properties');
      const reason = encodeURIComponent(error.response?.data?.message || 'Your account has been suspended.');
      window.location.href = `/login?suspended=true&reason=${reason}`;
      return Promise.reject(error);
    }

    if (status === 401 || (status === 403 && error.config?.url?.includes('/admin'))) {
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }

    return Promise.reject(error);
  }
);

export const AdminApi = {
  // 1. Dashboard
  getDashboard: async () => {
    const res = await client.get('/admin/dashboard');
    return res.data;
  },

  // 2. Users
  getUsers: async (params = {}) => {
    const res = await client.get('/admin/users', { params });
    return res.data;
  },
  getUserById: async (id) => {
    const res = await client.get(`/admin/users/${id}`);
    return res.data;
  },
  setUserSuspension: async (id, { suspend, reason = '' }) => {
    const res = await client.put(`/admin/users/${id}/suspend`, { suspend, reason });
    return res.data;
  },

  // 3. Properties
  getProperties: async (params = {}) => {
    const res = await client.get('/admin/properties', { params });
    return res.data;
  },
  getPropertyById: async (id) => {
    const res = await client.get(`/admin/properties/${id}`);
    return res.data;
  },
  updatePropertyApproval: async (id, { status, reason = '', adminNote }) => {
    const res = await client.put(`/admin/properties/${id}/approval`, { status, reason, adminNote });
    return res.data;
  },
  setPropertyAdminNote: async (id, note) => {
    const res = await client.put(`/admin/properties/${id}/note`, { note });
    return res.data;
  },
  removeProperty: async (id, reason) => {
    const res = await client.put(`/admin/properties/${id}/remove`, { reason });
    return res.data;
  },

  // 4. Reports & Safety
  getReports: async (params = {}) => {
    const res = await client.get('/admin/reports', { params });
    return res.data;
  },
  getReportById: async (id) => {
    const res = await client.get(`/admin/reports/${id}`);
    return res.data;
  },
  updateReportStatus: async (id, { status, adminNotes = '', resolution = '' }) => {
    const res = await client.put(`/admin/reports/${id}`, { status, adminNotes, resolution });
    return res.data;
  },

  // 5. Verifications
  getVerifications: async (params = {}) => {
    const res = await client.get('/admin/verifications', { params });
    return res.data;
  },
  getVerificationById: async (id) => {
    const res = await client.get(`/admin/verifications/${id}`);
    return res.data;
  },
  reviewVerification: async (id, { status, rejectionReason = '' }) => {
    const res = await client.put(`/admin/verifications/${id}`, { status, rejectionReason });
    return res.data;
  },
  fetchDocumentBlob: async (filename) => {
    const res = await client.get(`/verifications/documents/${filename}`, {
      responseType: 'blob',
    });
    return res.data;
  },

  // 6. Visit Requests
  getVisitRequests: async (params = {}) => {
    const res = await client.get('/admin/visits', { params });
    return res.data;
  },

  // 7. Reviews
  getReviews: async (params = {}) => {
    const res = await client.get('/admin/reviews', { params });
    return res.data;
  },
  moderateReview: async (id, data) => {
    const res = await client.put(`/admin/reviews/${id}/moderate`, data);
    return res.data;
  },

  // 8. Audit Logs
  getAuditLogs: async (params = {}) => {
    const res = await client.get('/admin/audit-logs', { params });
    return res.data;
  },

  // ── Supporting Endpoints for Public & Landlord Pages ──────────────────────
  // Visit Requests
  submitVisitRequest: async (data) => {
    const res = await client.post('/visits', data);
    return res.data;
  },
  getMyVisits: async () => {
    const res = await client.get('/visits/my-visits');
    return res.data;
  },
  getOwnerVisits: async () => {
    const res = await client.get('/visits/owner');
    return res.data;
  },
  updateVisitStatus: async (id, status) => {
    const res = await client.put(`/visits/${id}/status`, { status });
    return res.data;
  },

  // Reviews
  getPropertyReviews: async (propertyId) => {
    const res = await client.get(`/reviews/property/${propertyId}`);
    return res.data;
  },
  submitReview: async (data) => {
    const res = await client.post('/reviews', data);
    return res.data;
  },

  // Safety Reports
  submitReport: async (data) => {
    const res = await client.post('/reports', data);
    return res.data;
  },

  // Landlord Verification
  getPropertyVerification: async (propertyId) => {
    const res = await client.get(`/verifications/property/${propertyId}`);
    return res.data;
  },
  submitPropertyVerification: async (formData) => {
    const res = await client.post('/verifications/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};

export default AdminApi;
