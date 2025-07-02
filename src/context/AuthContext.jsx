import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Subscription plan limits
  const subscriptionLimits = {
    free: {
      filesLimit: 3,
      storageLimit: 5 * 1024 * 1024, // 5MB
      features: ['Basic visualizations', '7-day data storage', 'Export as PNG']
    },
    pro: {
      filesLimit: 50,
      storageLimit: 100 * 1024 * 1024, // 100MB
      features: ['Advanced visualizations', '30-day data storage', 'Export in multiple formats', 'Team sharing']
    },
    enterprise: {
      filesLimit: 1000,
      storageLimit: 1024 * 1024 * 1024, // 1GB
      features: ['All features', '365-day data storage', 'Priority support', 'Custom visualizations']
    }
  };

  // Mock login function
  const login = async (email, password) => {
    // In a real app, this would validate against a backend
    if (email === 'admin@example.com' && password === 'password') {
      const user = {
        id: 'admin-user-id',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        subscription: 'enterprise',
        filesCount: 0,
        filesLimit: subscriptionLimits.enterprise.filesLimit,
        storageUsed: 0,
        storageLimit: subscriptionLimits.enterprise.storageLimit,
        company: 'DataViz Inc.',
        lastLogin: new Date().toISOString()
      };
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
      return user;
    } else if (email === 'user@example.com' && password === 'password') {
      const user = {
        id: 'regular-user-id',
        name: 'Regular User',
        email: 'user@example.com',
        role: 'user',
        subscription: 'free',
        filesCount: 0,
        filesLimit: subscriptionLimits.free.filesLimit,
        storageUsed: 0,
        storageLimit: subscriptionLimits.free.storageLimit,
        company: '',
        lastLogin: new Date().toISOString()
      };
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
      return user;
    }
    throw new Error('Invalid email or password');
  };

  // Mock register function
  const register = async (name, email, password) => {
    // In a real app, this would create a new user in the backend
    const user = {
      id: `user-${Date.now()}`,
      name,
      email,
      role: 'user',
      subscription: 'free',
      filesCount: 0,
      filesLimit: subscriptionLimits.free.filesLimit,
      storageUsed: 0,
      storageLimit: subscriptionLimits.free.storageLimit,
      company: '',
      lastLogin: new Date().toISOString()
    };
    localStorage.setItem('user', JSON.stringify(user));
    setCurrentUser(user);
    return user;
  };

  // Mock logout function
  const logout = async () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    if (!currentUser) throw new Error('No user logged in');
    
    const updatedUser = {
      ...currentUser,
      ...profileData,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
    return updatedUser;
  };

  // Update subscription
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
    if (!currentUser) return true;
    return (currentUser.filesCount || 0) >= currentUser.filesLimit;
  };

  // Get features available for current subscription
  const getSubscriptionFeatures = () => {
    if (!currentUser) return [];
    return subscriptionLimits[currentUser.subscription]?.features || [];
  };

  // Check if user is logged in on page load
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    setLoading(false);
  }, []);

  // Check if the user is an admin
  const isAdmin = () => {
    return currentUser?.role === 'admin';
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    updateProfile,
    updateSubscription,
    incrementFileCount,
    hasReachedFileLimit,
    getSubscriptionFeatures,
    isAdmin,
    subscriptionLimits
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};