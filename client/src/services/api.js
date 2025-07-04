// API service for backend communication
import axios from 'axios';

// API base configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add session ID for visitor tracking
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      config.headers['x-session-id'] = sessionId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  // Verify Firebase token with backend
  verifyToken: async (idToken) => {
    try {
      const response = await api.post('/auth/verify', { idToken });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete user account
  deleteAccount: async () => {
    try {
      const response = await api.delete('/auth/account');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get visitor session info
  getVisitorInfo: async () => {
    try {
      const response = await api.get('/auth/visitor');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// User API calls
export const userAPI = {
  // Get user dashboard data
  getDashboard: async () => {
    try {
      const response = await api.get('/users/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user files
  getFiles: async (params = {}) => {
    try {
      const response = await api.get('/users/files', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get usage statistics
  getUsageStats: async (period = 'month') => {
    try {
      const response = await api.get('/users/usage', { params: { period } });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// File API calls
export const fileAPI = {
  // Upload file
  uploadFile: async (formData, onProgress) => {
    try {
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get file details
  getFile: async (fileId) => {
    try {
      const response = await api.get(`/files/${fileId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete file
  deleteFile: async (fileId) => {
    try {
      const response = await api.delete(`/files/${fileId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create visualization
  createVisualization: async (fileId, visualizationData) => {
    try {
      const response = await api.post(`/files/${fileId}/visualize`, visualizationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// Test API calls (development only)
export const testAPI = {
  // Test Firebase configuration
  testFirebaseConfig: async () => {
    try {
      const response = await api.get('/test/firebase-config');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Test Firebase authentication
  testFirebaseAuth: async (idToken) => {
    try {
      const response = await api.post('/test/firebase-auth', { idToken });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Test visitor session
  testVisitorSession: async () => {
    try {
      const response = await api.get('/test/visitor-session');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// Utility functions
export const apiUtils = {
  // Set auth token
  setAuthToken: (token) => {
    if (token) {
      localStorage.setItem('authToken', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('authToken');
      delete api.defaults.headers.common['Authorization'];
    }
  },

  // Set session ID for visitor tracking
  setSessionId: (sessionId) => {
    if (sessionId) {
      localStorage.setItem('sessionId', sessionId);
    } else {
      localStorage.removeItem('sessionId');
    }
  },

  // Get session ID
  getSessionId: () => {
    return localStorage.getItem('sessionId');
  },

  // Generate session ID for visitors
  generateSessionId: () => {
    const sessionId = 'visitor_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    apiUtils.setSessionId(sessionId);
    return sessionId;
  },

  // Clear all stored data
  clearStorage: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('sessionId');
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;

