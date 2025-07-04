import React, { createContext, useContext, useState, useEffect } from 'react';
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
      console.log('Initializing fingerprint tracking...');
      
      // Initialize fingerprint service
      await fingerprintService.initialize();
      setFingerprintReady(true);
      
      // Initialize visitor tracking
      await visitorTrackingService.initialize();
      
      // Get visitor stats
      const stats = await visitorTrackingService.getVisitorStats();
      setVisitorStats(stats);
      
      console.log('Fingerprint tracking initialized:', stats);
      
      return stats;
    } catch (error) {
      console.error('Failed to initialize fingerprint tracking:', error);
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

  // Initialize optimized visitor session for unauthenticated users
  const initializeVisitorSession = async () => {
    try {
      // Initialize fingerprint tracking first
      const stats = await initializeFingerprintTracking();
      
      let sessionId = apiUtils.getSessionId();
      if (!sessionId) {
        sessionId = apiUtils.generateSessionId();
      }

      // Try to get visitor info from backend
      try {
        const response = await authAPI.getVisitorInfo();
        setVisitorSession({
          ...response.data,
          visitorId: stats.visitorId,
          fingerprintReady,
          features: response.data.features || ['csv_upload', 'google_sheets_import', 'basic_charts', 'chart_export_png']
        });
      } catch (error) {
        console.warn('Could not get visitor info from backend, using local tracking:', error);
        
        // Create enhanced local visitor session as fallback
        setVisitorSession({
          sessionId,
          visitorId: stats.visitorId,
          filesUploaded: stats.totalUploads,
          fileLimit: stats.maxUploads,
          remainingFiles: stats.remainingUploads,
          isLimitReached: !stats.canUpload,
          canUpload: stats.canUpload,
          lastActivity: stats.lastActivity,
          fingerprintReady,
          features: ['csv_upload', 'google_sheets_import', 'basic_charts', 'chart_export_png'],
          upgradeMessage: stats.canUpload ? null : 'Upload limit reached. Sign up for more uploads!'
        });
      }
    } catch (error) {
      console.error('Failed to initialize visitor session:', error);
      
      // Ultimate fallback
      setVisitorSession({
        sessionId: apiUtils.getSessionId() || 'fallback_session',
        visitorId: 'fallback_visitor',
        filesUploaded: 0,
        fileLimit: 2,
        remainingFiles: 2,
        isLimitReached: false,
        canUpload: true,
        lastActivity: new Date().toISOString(),
        fingerprintReady: false,
        features: ['csv_upload'],
        upgradeMessage: null,
        error: error.message
      });
    }
  };

  // Verify Firebase token with backend and sync user data
  const verifyAndSyncUser = async (firebaseUser) => {
    try {
      setLoading(true);
      setAuthError(null);

      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();
      
      // Store token for API requests
      apiUtils.setAuthToken(idToken);

      // Get visitor ID for backend sync
      let visitorId = null;
      try {
        visitorId = await fingerprintService.getVisitorId();
      } catch (error) {
        console.warn('Could not get visitor ID for user sync:', error);
      }

      // Verify token with backend and get/create user
      const response = await authAPI.verifyToken(idToken, { visitorId });
      
      if (response.success) {
        const userData = response.data.user;
        
        // Transform backend user data to match frontend expectations
        const transformedUser = {
          id: userData.firebaseUid,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          subscription: userData.subscription.tier,
          filesCount: userData.fileUsage.totalFiles,
          filesLimit: userData.subscriptionLimits.files,
          storageUsed: userData.fileUsage.storageUsed,
          storageLimit: userData.subscriptionLimits.storage,
          company: userData.company?.name || '',
          lastLogin: userData.lastLoginAt,
          photoURL: userData.photoURL,
          isEmailVerified: userData.isEmailVerified,
          subscriptionLimits: userData.subscriptionLimits,
          preferences: userData.preferences,
          visitorId // Include visitor ID for tracking
        };

        setCurrentUser(transformedUser);
        localStorage.setItem('user', JSON.stringify(transformedUser));
        
        // Clear visitor session since user is now authenticated
        setVisitorSession(null);
        setVisitorStats(null);
        apiUtils.setSessionId(null);
        
        return transformedUser;
      } else {
        throw new Error('Backend verification failed');
      }
    } catch (error) {
      console.error('User verification failed:', error);
      setAuthError(error.message || 'Authentication verification failed');
      
      // Clear auth data on verification failure
      apiUtils.clearStorage();
      setCurrentUser(null);
      
      throw error;
    } finally {
      setLoading(false);
    }
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
        console.warn('Backend logout failed:', error);
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
        console.error('Failed to update visitor stats:', error);
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
      console.error('Failed to record visitor upload:', error);
      throw error;
    }
  };

  // Check if user/visitor can upload
  const canUpload = async (fileSize = 0) => {
    if (currentUser) {
      // For authenticated users, use existing logic
      if (currentUser.filesLimit === -1) return { allowed: true };
      
      const remaining = currentUser.filesLimit - (currentUser.filesCount || 0);
      return {
        allowed: remaining > 0,
        reason: remaining <= 0 ? 'File limit reached for your subscription' : null,
        currentUploads: currentUser.filesCount || 0,
        maxUploads: currentUser.filesLimit,
        remainingUploads: remaining
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
      return 2;
    }
    
    if (currentUser.filesLimit === -1) return 'unlimited';
    return Math.max(0, currentUser.filesLimit - (currentUser.filesCount || 0));
  };

  // Get visitor ID
  const getVisitorId = async () => {
    try {
      return await fingerprintService.getVisitorId();
    } catch (error) {
      console.error('Failed to get visitor ID:', error);
      return null;
    }
  };

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // User is signed in, verify with backend
        try {
          await verifyAndSyncUser(firebaseUser);
        } catch (error) {
          console.error('Failed to sync user with backend:', error);
          setLoading(false);
        }
      } else {
        // User is signed out
        setCurrentUser(null);
        apiUtils.clearStorage();
        
        // Initialize visitor session
        await initializeVisitorSession();
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Initialize visitor tracking on mount
  useEffect(() => {
    if (!currentUser && !firebaseUser) {
      initializeVisitorSession();
    }
  }, []);

  // Check for existing user on mount (fallback)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && !currentUser && !firebaseUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
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
    subscriptionLimits,
    setAuthError,
    // Feature access methods
    hasFeature,
    trackFeature,
    getFeatureLimits
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};