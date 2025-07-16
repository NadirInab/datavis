// File Conversion Limits Utility
import { useAuth } from '../context/FirebaseAuthContext';

// Configuration
export const CONVERSION_LIMITS = {
  VISITOR_DAILY_LIMIT: 5,
  AUTHENTICATED_LIMIT: null, // Unlimited
  STORAGE_KEY: 'csv_conversion_tracking',
  RESET_HOUR: 0 // Reset at midnight
};

// Get current date string for tracking
const getCurrentDateKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Get conversion tracking data from localStorage
export const getConversionData = () => {
  try {
    const stored = localStorage.getItem(CONVERSION_LIMITS.STORAGE_KEY);
    if (!stored) {
      return { date: getCurrentDateKey(), count: 0 };
    }
    
    const data = JSON.parse(stored);
    const currentDate = getCurrentDateKey();
    
    // Reset if it's a new day
    if (data.date !== currentDate) {
      return { date: currentDate, count: 0 };
    }
    
    return data;
  } catch (error) {
    console.error('Error reading conversion data:', error);
    return { date: getCurrentDateKey(), count: 0 };
  }
};

// Save conversion tracking data to localStorage
export const saveConversionData = (data) => {
  try {
    localStorage.setItem(CONVERSION_LIMITS.STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving conversion data:', error);
  }
};

// Check if user can perform conversion
export const canPerformConversion = (isAuthenticated) => {
  if (isAuthenticated) {
    return { allowed: true, remaining: null };
  }
  
  const data = getConversionData();
  const remaining = CONVERSION_LIMITS.VISITOR_DAILY_LIMIT - data.count;
  
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    used: data.count,
    limit: CONVERSION_LIMITS.VISITOR_DAILY_LIMIT
  };
};

// Increment conversion count for visitors
export const incrementConversionCount = (isAuthenticated) => {
  if (isAuthenticated) {
    return; // No tracking needed for authenticated users
  }
  
  const data = getConversionData();
  data.count += 1;
  saveConversionData(data);
};

// Get conversion status message
export const getConversionStatusMessage = (isAuthenticated) => {
  if (isAuthenticated) {
    return {
      type: 'unlimited',
      message: 'Unlimited conversions with your free account',
      remaining: null
    };
  }
  
  const status = canPerformConversion(false);
  
  if (status.remaining === 0) {
    return {
      type: 'limit_reached',
      message: 'Free daily limit reached - sign up for unlimited',
      remaining: 0,
      used: status.used,
      limit: status.limit
    };
  }
  
  if (status.remaining <= 2) {
    return {
      type: 'warning',
      message: `${status.remaining} conversion${status.remaining === 1 ? '' : 's'} remaining today`,
      remaining: status.remaining,
      used: status.used,
      limit: status.limit
    };
  }
  
  return {
    type: 'normal',
    message: `${status.remaining} conversions remaining today`,
    remaining: status.remaining,
    used: status.used,
    limit: status.limit
  };
};

// Reset conversion count (for testing purposes)
export const resetConversionCount = () => {
  try {
    localStorage.removeItem(CONVERSION_LIMITS.STORAGE_KEY);
  } catch (error) {
    console.error('Error resetting conversion data:', error);
  }
};

// Hook for conversion limits
export const useConversionLimits = () => {
  const { currentUser } = useAuth();
  const isAuthenticated = !!currentUser;
  
  const checkLimit = () => canPerformConversion(isAuthenticated);
  
  const incrementCount = () => incrementConversionCount(isAuthenticated);
  
  const getStatus = () => getConversionStatusMessage(isAuthenticated);
  
  const getRemainingTime = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilReset = tomorrow.getTime() - now.getTime();
    const hoursUntilReset = Math.ceil(msUntilReset / (1000 * 60 * 60));
    
    return {
      hours: hoursUntilReset,
      resetTime: tomorrow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };
  
  return {
    isAuthenticated,
    checkLimit,
    incrementCount,
    getStatus,
    getRemainingTime,
    resetCount: resetConversionCount
  };
};

// Analytics tracking for conversion limits
export const trackConversionLimitEvent = (eventType, data = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion_limit', {
      event_category: 'File Conversion',
      event_label: eventType,
      custom_parameter_1: data.remaining || 0,
      custom_parameter_2: data.isAuthenticated ? 'authenticated' : 'visitor'
    });
  }
};

export default {
  CONVERSION_LIMITS,
  getConversionData,
  saveConversionData,
  canPerformConversion,
  incrementConversionCount,
  getConversionStatusMessage,
  resetConversionCount,
  useConversionLimits,
  trackConversionLimitEvent
};
