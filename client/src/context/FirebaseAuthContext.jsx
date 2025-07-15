import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { auth, onAuthStateChanged, authHelpers, getFirebaseErrorMessage } from '../config/firebase';
import { authAPI, apiUtils } from '../services/api';
import { hasFeatureAccess, getUserLimits, trackFeatureUsage } from '../utils/featureGating';
import visitorTrackingService from '../services/visitorTrackingService';
import fingerprintService from '../services/fingerprintService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [visitorSession, setVisitorSession] = useState(null);
  const [visitorStats, setVisitorStats] = useState(null);
  const [fingerprintReady, setFingerprintReady] = useState(false);

  // Refs for optimization and caching
  const lastSyncRef = useRef(0);
  const syncInProgressRef = useRef(false);
  const lastSyncedUidRef = useRef(null);
  const lastSyncedTokenRef = useRef(null);
  const cooldownRef = useRef(0);
  const debounceTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const visitorSessionCacheRef = useRef(null);
  const visitorSessionTimestampRef = useRef(0);
  const authDataCacheRef = useRef(null);
  const authDataTimestampRef = useRef(0);

  // Subscription plan limits (preserved from original)
  const subscriptionLimits = {
    free: {
      filesLimit: 5, // 2 visitor + 3 authenticated
      storageLimit: 10 * 1024 * 1024, // 10MB
      features: ['Basic visualizations', '7-day data storage', 'Export as PNG']
    },
    pro: {
      filesLimit: -1, // unlimited
      storageLimit: 100 * 1024 * 1024, // 100MB
      features: ['Advanced visualizations', '30-day data storage', 'Export in multiple formats', 'Team sharing']
    },
    enterprise: {
      filesLimit: -1, // unlimited
      storageLimit: 1024 * 1024 * 1024, // 1GB
      features: ['All features', '365-day data storage', 'Priority support', 'Custom visualizations']
    }
  };

  // Initialize fingerprint and visitor tracking
  const initializeFingerprintTracking = async () => {
    try {
      // Initialize fingerprint tracking
      
      // Initialize fingerprint service
      await fingerprintService.initialize();
      setFingerprintReady(true);
      
      // Initialize visitor tracking
      await visitorTrackingService.initialize();
      
      // Get visitor stats
      const stats = await visitorTrackingService.getVisitorStats();
      setVisitorStats(stats);
      
      // Fingerprint tracking initialized successfully
      
      return stats;
    } catch (error) {
      // Log error in development only
      if (import.meta.env.DEV) {
        console.error('Failed to initialize fingerprint tracking:', error);
      }
      setFingerprintReady(false);
      
      // Fallback visitor stats
      const fallbackStats = {
        visitorId: 'fallback_' + Date.now(),
        totalUploads: 0,
        maxUploads: 2,
        remainingUploads: 2,
        uploads: [],
        firstVisit: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        canUpload: true,
        error: error.message
      };
      
      setVisitorStats(fallbackStats);
      return fallbackStats;
    }
  };

  // Initialize optimized visitor session for unauthenticated users with caching
  const initializeVisitorSession = async () => {
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

    // Check if we have cached data that's still valid
    if (visitorSessionCacheRef.current &&
        now - visitorSessionTimestampRef.current < CACHE_DURATION) {
      setVisitorSession(visitorSessionCacheRef.current);
      return;
    }

    try {
      // Initialize fingerprint tracking and get stats with timeout
      const stats = await Promise.race([
        initializeFingerprintTracking(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Fingerprint initialization timeout')), 5000)
        )
      ]);
      let sessionId = apiUtils.getSessionId() || apiUtils.generateSessionId();

      // Try to get visitor info from backend with timeout, fallback to stats
      let visitorData = {};
      try {
        const response = await Promise.race([
          authAPI.getVisitorInfo(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Visitor API timeout')), 3000)
          )
        ]);
        visitorData = response.data || {};
      } catch (err) {
        // Could not get visitor info from backend, using local tracking
        if (import.meta.env.DEV) {
          console.warn('Visitor API call failed or timed out:', err.message);
        }
      }

      // Merge logic: prefer backend, fallback to stats, always provide all fields
      const merged = {
        sessionId,
        visitorId: visitorData.visitorId || stats.visitorId || 'fallback_visitor',
        filesUploaded: typeof visitorData.filesUploaded === 'number' ? visitorData.filesUploaded : (typeof stats.totalUploads === 'number' ? stats.totalUploads : 0),
        fileLimit: typeof visitorData.fileLimit === 'number' ? visitorData.fileLimit : (typeof stats.maxUploads === 'number' ? stats.maxUploads : 3),
        remainingFiles: typeof visitorData.remainingFiles === 'number' ? visitorData.remainingFiles : (typeof stats.remainingUploads === 'number' ? stats.remainingUploads : 3),
        isLimitReached: typeof visitorData.isLimitReached === 'boolean' ? visitorData.isLimitReached : (typeof stats.canUpload === 'boolean' ? !stats.canUpload : false),
        canUpload: typeof visitorData.canUpload === 'boolean' ? visitorData.canUpload : (typeof stats.canUpload === 'boolean' ? stats.canUpload : true),
        lastActivity: visitorData.lastActivity || stats.lastActivity || new Date().toISOString(),
        fingerprintReady: typeof fingerprintReady === 'boolean' ? fingerprintReady : false,
        features: Array.isArray(visitorData.features) ? visitorData.features : ['csv_upload', 'google_sheets_import', 'basic_charts', 'chart_export_png'],
        upgradeMessage: typeof visitorData.upgradeMessage === 'string' ? visitorData.upgradeMessage : (stats.canUpload ? null : 'Upload limit reached. Sign up for more uploads!'),
        error: visitorData.error || undefined
      };

      // Cache the session data
      visitorSessionCacheRef.current = merged;
      visitorSessionTimestampRef.current = now;

      setVisitorSession(merged);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to initialize visitor session:', error);
      }

      const fallbackSession = {
        sessionId: apiUtils.getSessionId() || 'fallback_session',
        visitorId: 'fallback_visitor',
        filesUploaded: 0,
        fileLimit: 3,
        remainingFiles: 3,
        isLimitReached: false,
        canUpload: true,
        lastActivity: new Date().toISOString(),
        fingerprintReady: false,
        features: ['csv_upload'],
        upgradeMessage: null,
        error: error.message
      };

      // Cache the fallback session too
      visitorSessionCacheRef.current = fallbackSession;
      visitorSessionTimestampRef.current = now;

      setVisitorSession(fallbackSession);
    }
  };

  // Migrate visitor data to user account
  const migrateVisitorDataToUser = async (user) => {
    try {
      // Get visitor data before clearing
      const visitorData = localStorage.getItem('visitor_upload_data');
      const visitorId = await fingerprintService.getVisitorId();

      if (visitorData && visitorId) {
        const parsedData = JSON.parse(visitorData);

        // Send visitor data to backend for migration
        try {
          await authAPI.migrateVisitorData({
            visitorId,
            visitorData: parsedData,
            userId: user.id
          });

          // Visitor data migrated successfully
        } catch (error) {
          if (import.meta.env.DEV) {
            console.warn('Failed to migrate visitor data to backend:', error);
          }
        }

        // Clear visitor data from localStorage
        localStorage.removeItem('visitor_upload_data');
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error during visitor data migration:', error);
      }
    }
  };

  // Debounced sync function with request deduplication
  // Reduced debounce delay to 2000ms (2 seconds) for better user experience
  const debouncedVerifyAndSyncUser = useCallback((firebaseUser, attempt = 1) => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    // Additional check: don't debounce if we already have a valid user with same UID
    if (currentUser && firebaseUser && currentUser.id === firebaseUser.uid) {
      setLoading(false); // Ensure loading is false for existing users
      return;
    }

    debounceTimeoutRef.current = setTimeout(() => {
      verifyAndSyncUser(firebaseUser, attempt);
    }, 2000);
  }, [currentUser]);

  // Enhanced verifyAndSyncUser with all optimizations
  const verifyAndSyncUser = async (firebaseUser, attempt = 1) => {
    if (!firebaseUser) {
      setCurrentUser(null);
      apiUtils.clearStorage();
      lastSyncedUidRef.current = null;
      lastSyncedTokenRef.current = null;
      return null;
    }
    // Cooldown: prevent sync if recently rate-limited
    const now = Date.now();
    if (cooldownRef.current && now < cooldownRef.current) {
      setAuthError('Too many requests. Please wait and try again.');
      return;
    }
    // Prevent redundant syncs: skip if in progress or too soon
    // Increased minimum interval between syncs to 120000ms (2 minutes)
    if (syncInProgressRef.current || now - lastSyncRef.current < 120000) {
      if (import.meta.env.DEV) {
        console.log('Skipping sync - too soon or in progress');
      }
      return;
    }
    // Only sync if UID or token changed, or if we don't have a current user
    const idToken = await firebaseUser.getIdToken();
    if (
      currentUser &&
      lastSyncedUidRef.current === firebaseUser.uid &&
      lastSyncedTokenRef.current === idToken
    ) {
      if (import.meta.env.DEV) {
        console.log('Skipping sync - no changes detected');
      }
      return;
    }
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    syncInProgressRef.current = true;
    try {
      setLoading(true);
      setAuthError(null);
      apiUtils.setAuthToken(idToken);
      let visitorId = null;
      try { visitorId = await fingerprintService.getVisitorId(); } catch {}

      // Add abort signal to the request
      console.log('🔍 Starting user verification:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        attempt: attempt,
        apiUrl: import.meta.env.VITE_API_BASE_URL
      });

      console.log('🔑 Firebase token obtained, calling backend...');
      const response = await authAPI.verifyToken(idToken, { visitorId, signal: abortControllerRef.current.signal });
      if (response.success) {
        console.log('✅ Backend verification successful:', {
          isNewUser: response.data.isNewUser || false,
          userId: response.data.user.firebaseUid,
          email: response.data.user.email
        });
        const userData = response.data.user;
        // Load permanent upload counter from localStorage (temporary until backend is implemented)
        const storedFileUsage = localStorage.getItem('user_upload_data');
        const localFileUsage = storedFileUsage ? JSON.parse(storedFileUsage) : {};

        const transformedUser = {
          id: userData.firebaseUid,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          subscription: userData.subscription?.tier || 'free',
          filesCount: userData.fileUsage?.totalFiles ?? 0,
          filesLimit: userData.subscriptionLimits?.files ?? 0,
          storageUsed: userData.fileUsage?.storageUsed ?? 0,
          storageLimit: userData.subscriptionLimits?.storage ?? 0,
          company: userData.company?.name || '',
          lastLogin: userData.lastLoginAt,
          photoURL: userData.photoURL,
          isEmailVerified: userData.isEmailVerified,
          subscriptionLimits: userData.subscriptionLimits || {},
          preferences: userData.preferences || {},
          // Add permanent upload tracking (merge backend data with local data)
          fileUsage: {
            totalFiles: userData.fileUsage?.totalFiles ?? 0,
            storageUsed: userData.fileUsage?.storageUsed ?? 0,
            // Permanent upload counter (use local data until backend is implemented)
            totalUploadsCount: localFileUsage.totalUploadsCount ?? userData.fileUsage?.totalUploadsCount ?? 0,
            firstUploadDate: localFileUsage.firstUploadDate ?? userData.fileUsage?.firstUploadDate ?? null,
            lastUploadDate: localFileUsage.lastUploadDate ?? userData.fileUsage?.lastUploadDate ?? null
          },
          visitorId
        };
        setCurrentUser(transformedUser);
        localStorage.setItem('user', JSON.stringify(transformedUser));

        // Cache the auth data
        authDataCacheRef.current = transformedUser;
        authDataTimestampRef.current = Date.now();

        // Migrate visitor data to user account
        await migrateVisitorDataToUser(transformedUser);

        setVisitorSession(null);
        setVisitorStats(null);
        apiUtils.setSessionId(null);
        lastSyncRef.current = Date.now();
        lastSyncedUidRef.current = firebaseUser.uid;
        lastSyncedTokenRef.current = idToken;

        // Ensure loading is set to false after successful sync
        setLoading(false);
        return transformedUser;
      } else {
        console.error('❌ Backend verification failed:', response);
        throw new Error(`Backend verification failed: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      // Don't handle aborted requests
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        return;
      }

      if (error?.message?.includes('Too many requests')) {
        cooldownRef.current = Date.now() + 60000; // 60s cooldown for rate limits
        setAuthError('Too many requests. Please wait a moment and try again.');
        return;
      }

      console.error('🚨 Authentication sync failed:', {
        error: error.message,
        stack: error.stack,
        attempt: attempt,
        uid: firebaseUser?.uid,
        email: firebaseUser?.email,
        apiUrl: import.meta.env.VITE_API_BASE_URL,
        isDev: import.meta.env.DEV
      });

      setAuthError(error.message || 'Authentication verification failed');
      apiUtils.clearStorage();
      setCurrentUser(null);
      lastSyncedUidRef.current = null;
      lastSyncedTokenRef.current = null;
    } finally {
      syncInProgressRef.current = false;
      setLoading(false);
    }
  };

  // Listen for localStorage 'user' changes (multi-tab sync)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'user') {
        const storedUser = e.newValue ? JSON.parse(e.newValue) : null;
        if (storedUser && storedUser.id !== currentUser?.id) {
          setCurrentUser(storedUser);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [currentUser]);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      if (firebaseUser) {
        // Set loading to true immediately for authenticated users
        setLoading(true);
        debouncedVerifyAndSyncUser(firebaseUser);
      } else {
        // For visitors, initialize session and stop loading immediately
        setCurrentUser(null);
        apiUtils.clearStorage();
        lastSyncedUidRef.current = null;
        lastSyncedTokenRef.current = null;

        // Initialize visitor session asynchronously but don't wait for it
        initializeVisitorSession().catch(error => {
          if (import.meta.env.DEV) {
            console.error('Visitor session initialization failed:', error);
          }
        });

        // Stop loading immediately for visitors
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [debouncedVerifyAndSyncUser]);

  // Listen for upload counter updates
  useEffect(() => {
    const handleUploadCounterUpdate = (event) => {
      if (currentUser && event.detail?.fileUsage) {
        setCurrentUser(prev => ({
          ...prev,
          fileUsage: {
            ...prev.fileUsage,
            ...event.detail.fileUsage
          }
        }));
      }
    };

    window.addEventListener('user-upload-counter-updated', handleUploadCounterUpdate);

    return () => {
      window.removeEventListener('user-upload-counter-updated', handleUploadCounterUpdate);
    };
  }, [currentUser]);

  // Expose a manual retry function for UI
  const retryUserSync = () => {
    if (firebaseUser) debouncedVerifyAndSyncUser(firebaseUser, 1);
  };

  // Sign up with email and password
  const register = async (name, email, password) => {
    try {
      setLoading(true);
      setAuthError(null);

      // Create Firebase user
      const userCredential = await authHelpers.signUpWithEmail(email, password, name);
      
      // Firebase auth state change will trigger verifyAndSyncUser
      return userCredential.user;
    } catch (error) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      setAuthError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  // Sign in with email and password
  const login = async (email, password) => {
    try {
      setLoading(true);
      setAuthError(null);

      // Sign in with Firebase
      const userCredential = await authHelpers.signInWithEmail(email, password);
      
      // Firebase auth state change will trigger verifyAndSyncUser
      return userCredential.user;
    } catch (error) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      setAuthError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setAuthError(null);

      // Sign in with Google
      const userCredential = await authHelpers.signInWithGoogle();
      
      // Firebase auth state change will trigger verifyAndSyncUser
      return userCredential.user;
    } catch (error) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      setAuthError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  };

  // Sign out
  const logout = async () => {
    try {
      setLoading(true);
      setAuthError(null);

      // Call backend logout
      try {
        await authAPI.logout();
      } catch (error) {
        // Backend logout failed, continuing with local logout
      }

      // Sign out from Firebase
      await authHelpers.signOut();
      
      // Clear local data
      apiUtils.clearStorage();
      setCurrentUser(null);
      setFirebaseUser(null);
      
      // Initialize visitor session for unauthenticated browsing
      await initializeVisitorSession();
    } catch (error) {
      const errorMessage = getFirebaseErrorMessage(error.code);
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      if (!currentUser) throw new Error('No user logged in');
      
      // Update Firebase profile if needed
      if (profileData.name && firebaseUser) {
        await authHelpers.updateUserProfile({ displayName: profileData.name });
      }

      // Update backend profile
      const response = await authAPI.updateProfile(profileData);
      
      if (response.success) {
        const updatedUser = {
          ...currentUser,
          ...profileData,
          lastUpdated: new Date().toISOString()
        };
        
        setCurrentUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      }
    } catch (error) {
      setAuthError(error.message || 'Profile update failed');
      throw error;
    }
  };

  // Update subscription (preserved from original)
  const updateSubscription = (plan) => {
    if (!currentUser) throw new Error('No user logged in');
    if (!subscriptionLimits[plan]) throw new Error('Invalid subscription plan');
    
    const updatedUser = {
      ...currentUser,
      subscription: plan,
      filesLimit: subscriptionLimits[plan].filesLimit,
      storageLimit: subscriptionLimits[plan].storageLimit,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
    return updatedUser;
  };

  // Increment file count when user uploads a file
  const incrementFileCount = async () => {
    if (currentUser) {
      // For authenticated users
      const updatedUser = {
        ...currentUser,
        filesCount: (currentUser.filesCount || 0) + 1,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
    } else {
      // For visitors, update visitor stats
      try {
        const stats = await visitorTrackingService.getVisitorStats();
        setVisitorStats(stats);
        
        // Update visitor session
        if (visitorSession) {
          setVisitorSession({
            ...visitorSession,
            filesUploaded: stats.totalUploads,
            remainingFiles: stats.remainingUploads,
            isLimitReached: !stats.canUpload,
            canUpload: stats.canUpload,
            lastActivity: stats.lastActivity
          });
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to update visitor stats:', error);
        }
      }
    }
  };

  // Record file upload for visitors
  const recordVisitorUpload = async (fileInfo) => {
    try {
      if (!currentUser) {
        const result = await visitorTrackingService.recordUpload(fileInfo);
        if (result.success) {
          await incrementFileCount();
          return result;
        }
        throw new Error(result.error || 'Failed to record upload');
      }
      return { success: true, message: 'User upload, no visitor tracking needed' };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to record visitor upload:', error);
      }
      throw error;
    }
  };

  // Check if user/visitor can upload
  const canUpload = async (fileSize = 0) => {
    if (currentUser) {
      // First check permanent upload limit (applies to all authenticated users)
      const permanentLimit = 5;
      const totalUploadsCount = currentUser.fileUsage?.totalUploadsCount || 0;

      if (totalUploadsCount >= permanentLimit) {
        return {
          allowed: false,
          reason: 'Permanent upload limit reached. You have used all 5 lifetime uploads.',
          details: 'Deleting files does not restore upload capacity. This limit prevents abuse of the free service.',
          limitType: 'permanent',
          totalUploadsCount,
          permanentLimit,
          remainingUploads: 0,
          isPermanentLimit: true
        };
      }

      // Then check subscription-based current file limit
      if (currentUser.filesLimit === -1) {
        return {
          allowed: true,
          totalUploadsCount,
          permanentLimit,
          remainingUploads: permanentLimit - totalUploadsCount
        };
      }

      const remaining = currentUser.filesLimit - (currentUser.filesCount || 0);
      return {
        allowed: remaining > 0,
        reason: remaining <= 0 ? 'File limit reached for your subscription' : null,
        currentUploads: currentUser.filesCount || 0,
        maxUploads: currentUser.filesLimit,
        remainingUploads: remaining,
        totalUploadsCount,
        permanentLimit,
        remainingPermanentUploads: permanentLimit - totalUploadsCount
      };
    } else {
      // For visitors, use fingerprint-based tracking
      return await visitorTrackingService.canUpload(fileSize);
    }
  };

  // Check if user has reached their file limit
  const hasReachedFileLimit = () => {
    if (!currentUser) {
      // For visitors, check visitor session
      if (visitorSession) {
        return visitorSession.filesUploaded >= visitorSession.fileLimit;
      }
      if (visitorStats) {
        return !visitorStats.canUpload;
      }
      return true;
    }
    
    // For authenticated users, unlimited files for paid plans
    if (currentUser.filesLimit === -1) return false;
    
    return (currentUser.filesCount || 0) >= currentUser.filesLimit;
  };

  // Get features available for current subscription
  const getSubscriptionFeatures = () => {
    if (!currentUser) return [];
    return subscriptionLimits[currentUser.subscription]?.features || [];
  };

  // Check if the user is an admin
  const isAdmin = () => {
    return currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  };

  // Check if the user is a regular user (not admin or visitor)
  const isRegularUser = () => {
    return currentUser?.role === 'user';
  };

  // Check if the user is a visitor
  const isVisitor = () => {
    return currentUser?.role === 'visitor' || !currentUser;
  };

  // Get user type (visitor, user, admin)
  const getUserType = () => {
    if (!currentUser) return 'visitor';
    return currentUser.role;
  };

  // Get remaining file uploads
  const getRemainingFiles = () => {
    if (!currentUser) {
      if (visitorSession) return visitorSession.remainingFiles;
      if (visitorStats) return visitorStats.remainingUploads;
      return 3;
    }
    
    if (currentUser.filesLimit === -1) return 'unlimited';
    return Math.max(0, currentUser.filesLimit - (currentUser.filesCount || 0));
  };

  // Get visitor ID
  const getVisitorId = async () => {
    try {
      return await fingerprintService.getVisitorId();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to get visitor ID:', error);
      }
      return null;
    }
  };

  // Get current user ID token safely
  const getCurrentUserToken = async () => {
    try {
      if (firebaseUser) {
        return await firebaseUser.getIdToken();
      }
      return null;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to get user token:', error);
      }
      return null;
    }
  };

  // Initialize visitor tracking on mount
  useEffect(() => {
    if (!currentUser && !firebaseUser) {
      initializeVisitorSession();
    }
  }, []);

  // Fallback timeout to ensure loading never gets stuck
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        if (import.meta.env.DEV) {
          console.warn('Loading timeout reached, forcing loading to false');
        }
        setLoading(false);
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  // Check for existing user on mount (fallback)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && !currentUser && !firebaseUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to parse stored user:', error);
        }
        localStorage.removeItem('user');
      }
    }
  }, [currentUser, firebaseUser]);

  // Feature access methods
  const hasFeature = (featureId) => {
    return hasFeatureAccess(currentUser, featureId);
  };

  const trackFeature = (featureId) => {
    trackFeatureUsage(currentUser, featureId);
  };

  const getFeatureLimits = () => {
    return getUserLimits(currentUser);
  };

  const value = {
    currentUser,
    firebaseUser,
    visitorSession,
    visitorStats,
    fingerprintReady,
    loading,
    authError,
    login,
    register,
    signInWithGoogle,
    logout,
    updateProfile,
    updateSubscription,
    incrementFileCount,
    recordVisitorUpload,
    canUpload,
    hasReachedFileLimit,
    getSubscriptionFeatures,
    isAdmin,
    isRegularUser,
    isVisitor,
    getUserType,
    getRemainingFiles,
    getVisitorId,
    getCurrentUserToken,
    subscriptionLimits,
    setAuthError,
    // Feature access methods
    hasFeature,
    trackFeature,
    getFeatureLimits,
    retryUserSync
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};