// API service for backend communication
import axios from 'axios';

// API base configuration with fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://datavis-cc2x.onrender.com/api/v1';

console.log('🌐 API Base URL:', API_BASE_URL);

if (!API_BASE_URL) {
  throw new Error('API_BASE_URL could not be determined');
}

// Request throttling cache
const requestCache = new Map();
const REQUEST_CACHE_DURATION = 5000; // 5 seconds

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Enable if using cookies for auth
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      // Get Firebase auth token
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔑 Added Firebase token to request');
      } else {
        console.log('👤 No authenticated user for request');
      }
    } catch (authError) {
      console.warn('⚠️ Failed to get Firebase token:', authError.message);
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
  // Verify Firebase token with backend (with throttling)
  verifyToken: async (idToken, additionalData = {}) => {
    const cacheKey = `verify_token_${idToken.substring(0, 20)}`;
    const now = Date.now();

    // Check cache first (shorter cache for auth tokens)
    if (requestCache.has(cacheKey)) {
      const cached = requestCache.get(cacheKey);
      if (now - cached.timestamp < 30000) { // 30 second cache for auth
        return cached.data;
      }
    }

    try {
      const { signal, ...otherData } = additionalData;
      const config = signal ? { signal } : {};
      const response = await api.post('/auth/verify', { idToken, ...otherData }, config);

      // Cache successful responses only
      if (response.data.success) {
        requestCache.set(cacheKey, {
          data: response.data,
          timestamp: now
        });
      }

      return response.data;
    } catch (error) {
      // Don't log errors for aborted requests
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        throw error;
      }

      if (import.meta.env.DEV) {
        console.error('Token verification error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          isNetworkError: error.code === 'ERR_NETWORK'
        });
      }
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
    const cacheKey = 'visitor_info';
    const now = Date.now();

    // Check cache first
    if (requestCache.has(cacheKey)) {
      const cached = requestCache.get(cacheKey);
      if (now - cached.timestamp < REQUEST_CACHE_DURATION) {
        return cached.data;
      }
    }

    try {
      const response = await api.get('/auth/visitor');

      // Cache the response
      requestCache.set(cacheKey, {
        data: response.data,
        timestamp: now
      });

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Migrate visitor data to user account
  migrateVisitorData: async (migrationData) => {
    try {
      const response = await api.post('/auth/migrate-visitor', migrationData);
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
      console.log('📤 Starting file upload API call...');
      console.log('🌐 Upload URL:', `${API_BASE_URL}/files/upload`);

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

      console.log('✅ Upload API response:', {
        status: response.status,
        success: response.data?.success,
        fileId: response.data?.file?.id || response.data?.file?._id,
        hasFile: !!response.data?.file
      });

      return response.data;
    } catch (error) {
      console.error('🚨 Upload API error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message || error.message,
        url: error.config?.url,
        hasAuth: !!error.config?.headers?.Authorization
      });
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
  },

  // Convert file to different formats
  convertFile: async (fileId, targetFormat, options = {}) => {
    try {
      console.log(`🔄 Converting file ${fileId} to ${targetFormat}...`);
      const response = await api.post(`/files/${fileId}/convert`, {
        targetFormat,
        options
      });
      return response.data;
    } catch (error) {
      console.error('🚨 File conversion error:', error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  // Get available conversion formats for a file
  getConversionFormats: async (fileId) => {
    try {
      const response = await api.get(`/files/${fileId}/conversion-formats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Download converted file
  downloadConvertedFile: async (fileId, format) => {
    try {
      const response = await api.get(`/files/${fileId}/download/${format}`, {
        responseType: 'blob'
      });
      return response;
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

