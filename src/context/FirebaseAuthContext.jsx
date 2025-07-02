import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged, authHelpers, getFirebaseErrorMessage } from '../config/firebase';
import { authAPI, apiUtils } from '../services/api';
import { hasFeatureAccess, getUserLimits, trackFeatureUsage } from '../utils/featureGating';

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

  // Initialize visitor session for unauthenticated users
  const initializeVisitorSession = async () => {
    try {
      let sessionId = apiUtils.getSessionId();
      if (!sessionId) {
        sessionId = apiUtils.generateSessionId();
      }
      
      // Get visitor info from backend
      const response = await authAPI.getVisitorInfo();
      setVisitorSession(response.data);
    } catch (error) {
      console.warn('Could not initialize visitor session:', error);
      // Create local visitor session as fallback
      setVisitorSession({
        sessionId: apiUtils.getSessionId(),
        filesUploaded: 0,
        fileLimit: 2,
        remainingFiles: 2,
        lastActivity: new Date().toISOString()
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

      // Verify token with backend and get/create user
      const response = await authAPI.verifyToken(idToken);
      
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
          preferences: userData.preferences
        };

        setCurrentUser(transformedUser);
        localStorage.setItem('user', JSON.stringify(transformedUser));
        
        // Clear visitor session since user is now authenticated
        setVisitorSession(null);
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
  const incrementFileCount = () => {
    if (!currentUser) return;
    
    const updatedUser = {
      ...currentUser,
      filesCount: (currentUser.filesCount || 0) + 1,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  // Check if user has reached their file limit
  const hasReachedFileLimit = () => {
    if (!currentUser) {
      // For visitors, check visitor session
      if (visitorSession) {
        return visitorSession.filesUploaded >= visitorSession.fileLimit;
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
      return visitorSession ? visitorSession.remainingFiles : 2;
    }
    
    if (currentUser.filesLimit === -1) return 'unlimited';
    return Math.max(0, currentUser.filesLimit - (currentUser.filesCount || 0));
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
    loading,
    authError,
    login,
    register,
    signInWithGoogle,
    logout,
    updateProfile,
    updateSubscription,
    incrementFileCount,
    hasReachedFileLimit,
    getSubscriptionFeatures,
    isAdmin,
    isRegularUser,
    isVisitor,
    getUserType,
    getRemainingFiles,
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


