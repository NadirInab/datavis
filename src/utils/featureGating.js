// Feature definitions and access control
export const FEATURES = {
  // File Format Support
  CSV_UPLOAD: {
    id: 'csv_upload',
    name: 'CSV File Upload',
    description: 'Upload and process CSV files',
    category: 'File Formats',
    tier: 'free',
    enabled: true
  },
  TSV_UPLOAD: {
    id: 'tsv_upload',
    name: 'TSV File Upload',
    description: 'Upload and process Tab-Separated Values files',
    category: 'File Formats',
    tier: 'premium',
    enabled: true
  },
  EXCEL_UPLOAD: {
    id: 'excel_upload',
    name: 'Excel File Upload',
    description: 'Upload and process Excel (.xlsx/.xls) files',
    category: 'File Formats',
    tier: 'premium',
    enabled: true
  },
  JSON_UPLOAD: {
    id: 'json_upload',
    name: 'JSON File Upload',
    description: 'Upload and process JSON files',
    category: 'File Formats',
    tier: 'premium',
    enabled: true
  },
  XML_UPLOAD: {
    id: 'xml_upload',
    name: 'XML File Upload',
    description: 'Upload and process XML files',
    category: 'File Formats',
    tier: 'premium',
    enabled: true
  },
  TXT_UPLOAD: {
    id: 'txt_upload',
    name: 'Text File Upload',
    description: 'Upload and process text files with auto-delimiter detection',
    category: 'File Formats',
    tier: 'premium',
    enabled: true
  },
  GOOGLE_SHEETS: {
    id: 'google_sheets',
    name: 'Google Sheets Import',
    description: 'Import data directly from Google Sheets',
    category: 'File Formats',
    tier: 'premium',
    enabled: true
  },

  // Visualization Features
  BASIC_CHARTS: {
    id: 'basic_charts',
    name: 'Basic Charts',
    description: 'Bar, Line, and Pie charts',
    category: 'Visualizations',
    tier: 'free',
    enabled: true
  },
  ADVANCED_CHARTS: {
    id: 'advanced_charts',
    name: 'Advanced Charts',
    description: 'Area, Radar, Scatter, and Bubble charts',
    category: 'Visualizations',
    tier: 'premium',
    enabled: true
  },
  CUSTOM_STYLING: {
    id: 'custom_styling',
    name: 'Custom Chart Styling',
    description: 'Customize colors, fonts, and chart appearance',
    category: 'Visualizations',
    tier: 'premium',
    enabled: true
  },

  // Export Features
  CHART_EXPORT_PNG: {
    id: 'chart_export_png',
    name: 'Export Chart as PNG',
    description: 'Download charts as PNG images',
    category: 'Export',
    tier: 'free',
    enabled: true
  },
  CHART_EXPORT_JPG: {
    id: 'chart_export_jpg',
    name: 'Export Chart as JPG',
    description: 'Download charts as JPG images',
    category: 'Export',
    tier: 'premium',
    enabled: true
  },
  CHART_EXPORT_PDF: {
    id: 'chart_export_pdf',
    name: 'Export Chart as PDF',
    description: 'Download charts as PDF documents',
    category: 'Export',
    tier: 'premium',
    enabled: true
  },
  CHART_EXPORT_SVG: {
    id: 'chart_export_svg',
    name: 'Export Chart as SVG',
    description: 'Download charts as scalable vector graphics',
    category: 'Export',
    tier: 'premium',
    enabled: true
  },
  DATA_EXPORT_CSV: {
    id: 'data_export_csv',
    name: 'Export Data as CSV',
    description: 'Download processed data as CSV files',
    category: 'Export',
    tier: 'free',
    enabled: true
  },
  DATA_EXPORT_EXCEL: {
    id: 'data_export_excel',
    name: 'Export Data as Excel',
    description: 'Download processed data as Excel files',
    category: 'Export',
    tier: 'premium',
    enabled: true
  },
  DATA_EXPORT_JSON: {
    id: 'data_export_json',
    name: 'Export Data as JSON',
    description: 'Download processed data as JSON files',
    category: 'Export',
    tier: 'premium',
    enabled: true
  },
  BULK_EXPORT: {
    id: 'bulk_export',
    name: 'Bulk Export',
    description: 'Export multiple charts and data at once',
    category: 'Export',
    tier: 'premium',
    enabled: true
  },

  // Data Processing
  DATA_PREVIEW: {
    id: 'data_preview',
    name: 'Data Preview',
    description: 'Preview data before processing',
    category: 'Data Processing',
    tier: 'free',
    enabled: true
  },
  COLUMN_ANALYSIS: {
    id: 'column_analysis',
    name: 'Smart Column Analysis',
    description: 'AI-powered column type detection and suggestions',
    category: 'Data Processing',
    tier: 'premium',
    enabled: true
  },
  DATA_CLEANING: {
    id: 'data_cleaning',
    name: 'Data Cleaning',
    description: 'Automated data cleaning and validation',
    category: 'Data Processing',
    tier: 'premium',
    enabled: true
  },

  // Dashboard Features
  DASHBOARD_ACCESS: {
    id: 'dashboard_access',
    name: 'Dashboard Access',
    description: 'Access to main dashboard interface',
    category: 'Dashboard',
    tier: 'free',
    enabled: true
  },
  DASHBOARD_CUSTOMIZATION: {
    id: 'dashboard_customization',
    name: 'Dashboard Customization',
    description: 'Customize dashboard layout and widgets',
    category: 'Dashboard',
    tier: 'premium',
    enabled: true
  },
  REAL_TIME_UPDATES: {
    id: 'real_time_updates',
    name: 'Real-time Updates',
    description: 'Live data updates and notifications',
    category: 'Dashboard',
    tier: 'premium',
    enabled: true
  },

  // File Management
  FILE_UPLOAD: {
    id: 'file_upload',
    name: 'File Upload',
    description: 'Upload and manage data files',
    category: 'File Management',
    tier: 'free',
    enabled: true
  },
  FILE_SHARING: {
    id: 'file_sharing',
    name: 'File Sharing',
    description: 'Share files with other users',
    category: 'File Management',
    tier: 'premium',
    enabled: true
  },
  FILE_VERSIONING: {
    id: 'file_versioning',
    name: 'File Versioning',
    description: 'Keep track of file versions and changes',
    category: 'File Management',
    tier: 'premium',
    enabled: true
  },
  FILE_COLLABORATION: {
    id: 'file_collaboration',
    name: 'File Collaboration',
    description: 'Collaborate on files with team members',
    category: 'File Management',
    tier: 'premium',
    enabled: true
  },

  // Storage & Limits
  BASIC_STORAGE: {
    id: 'basic_storage',
    name: 'Basic Storage',
    description: '10MB storage limit',
    category: 'Storage',
    tier: 'free',
    enabled: true
  },
  EXTENDED_STORAGE: {
    id: 'extended_storage',
    name: 'Extended Storage',
    description: '100MB+ storage limit',
    category: 'Storage',
    tier: 'premium',
    enabled: true
  },
  UNLIMITED_FILES: {
    id: 'unlimited_files',
    name: 'Unlimited Files',
    description: 'No limit on number of files',
    category: 'Storage',
    tier: 'premium',
    enabled: true
  },

  // User Management
  USER_PROFILES: {
    id: 'user_profiles',
    name: 'User Profiles',
    description: 'Create and manage user profiles',
    category: 'User Management',
    tier: 'free',
    enabled: true
  },
  TEAM_MANAGEMENT: {
    id: 'team_management',
    name: 'Team Management',
    description: 'Manage team members and permissions',
    category: 'User Management',
    tier: 'premium',
    enabled: true
  },
  ROLE_BASED_ACCESS: {
    id: 'role_based_access',
    name: 'Role-based Access Control',
    description: 'Advanced user roles and permissions',
    category: 'User Management',
    tier: 'premium',
    enabled: true
  },

  // API & Integration
  API_ACCESS: {
    id: 'api_access',
    name: 'API Access',
    description: 'Access to REST API endpoints',
    category: 'API & Integration',
    tier: 'premium',
    enabled: true
  },
  WEBHOOK_SUPPORT: {
    id: 'webhook_support',
    name: 'Webhook Support',
    description: 'Receive real-time data via webhooks',
    category: 'API & Integration',
    tier: 'premium',
    enabled: true
  },
  THIRD_PARTY_INTEGRATIONS: {
    id: 'third_party_integrations',
    name: 'Third-party Integrations',
    description: 'Connect with external services and tools',
    category: 'API & Integration',
    tier: 'premium',
    enabled: true
  },

  // Support & Help
  BASIC_SUPPORT: {
    id: 'basic_support',
    name: 'Basic Support',
    description: 'Email support and documentation access',
    category: 'Support',
    tier: 'free',
    enabled: true
  },
  PRIORITY_SUPPORT: {
    id: 'priority_support',
    name: 'Priority Support',
    description: 'Priority email and chat support',
    category: 'Support',
    tier: 'premium',
    enabled: true
  },
  PHONE_SUPPORT: {
    id: 'phone_support',
    name: 'Phone Support',
    description: 'Direct phone support access',
    category: 'Support',
    tier: 'premium',
    enabled: true
  }
};

// Subscription tier definitions
export const SUBSCRIPTION_TIERS = {
  visitor: {
    name: 'Visitor',
    features: [
      'csv_upload', 'basic_charts', 'data_preview', 'dashboard_access',
      'file_upload', 'chart_export_png', 'data_export_csv', 'user_profiles', 'basic_support'
    ],
    limits: {
      files: 3,
      storage: 5 * 1024 * 1024, // 5MB
      exports: 5
    }
  },
  free: {
    name: 'Free',
    features: [
      'csv_upload', 'basic_charts', 'data_preview', 'dashboard_access',
      'file_upload', 'chart_export_png', 'data_export_csv', 'user_profiles',
      'basic_storage', 'basic_support'
    ],
    limits: {
      files: 5,
      storage: 10 * 1024 * 1024, // 10MB
      exports: 10
    }
  },
  pro: {
    name: 'Pro',
    features: [
      // File Formats
      'csv_upload', 'tsv_upload', 'excel_upload', 'json_upload', 'xml_upload', 'txt_upload',
      // Visualizations
      'basic_charts', 'advanced_charts', 'custom_styling',
      // Export
      'chart_export_png', 'chart_export_jpg', 'chart_export_pdf', 'data_export_csv', 'data_export_excel',
      // Data Processing
      'data_preview', 'column_analysis', 'data_cleaning',
      // Dashboard
      'dashboard_access', 'dashboard_customization',
      // File Management
      'file_upload', 'file_sharing', 'file_versioning',
      // Storage
      'extended_storage',
      // User Management
      'user_profiles', 'team_management',
      // Support
      'basic_support', 'priority_support'
    ],
    limits: {
      files: -1, // unlimited
      storage: 100 * 1024 * 1024, // 100MB
      exports: 100
    }
  },
  enterprise: {
    name: 'Enterprise',
    features: Object.keys(FEATURES),
    limits: {
      files: -1, // unlimited
      storage: 1024 * 1024 * 1024, // 1GB
      exports: -1 // unlimited
    }
  }
};

// Check if user has access to a feature
export const hasFeatureAccess = (user, featureId) => {
  if (!user) {
    // Visitor access
    return SUBSCRIPTION_TIERS.visitor.features.includes(featureId);
  }

  const userTier = user.subscription?.tier || 'free';
  const tierConfig = SUBSCRIPTION_TIERS[userTier];
  
  if (!tierConfig) {
    return false;
  }

  return tierConfig.features.includes(featureId);
};

// Get user's subscription tier
export const getUserTier = (user) => {
  if (!user) return 'visitor';
  return user.subscription?.tier || 'free';
};

// Get features available to user
export const getUserFeatures = (user) => {
  const tier = getUserTier(user);
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  
  return tierConfig ? tierConfig.features : [];
};

// Get user's limits
export const getUserLimits = (user) => {
  const tier = getUserTier(user);
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  
  return tierConfig ? tierConfig.limits : SUBSCRIPTION_TIERS.visitor.limits;
};

// Check if feature requires upgrade
export const requiresUpgrade = (user, featureId) => {
  return !hasFeatureAccess(user, featureId);
};

// Get upgrade suggestions for a feature
export const getUpgradeSuggestion = (user, featureId) => {
  const currentTier = getUserTier(user);
  const feature = FEATURES[featureId];
  
  if (!feature) {
    return null;
  }

  // Find the minimum tier that includes this feature
  const requiredTier = Object.entries(SUBSCRIPTION_TIERS).find(([tier, config]) => 
    config.features.includes(featureId)
  );

  if (!requiredTier) {
    return null;
  }

  const [tierName, tierConfig] = requiredTier;

  return {
    feature: feature.name,
    currentTier: SUBSCRIPTION_TIERS[currentTier]?.name || 'Visitor',
    requiredTier: tierConfig.name,
    tierKey: tierName,
    description: feature.description
  };
};

// Feature usage tracking
export const trackFeatureUsage = (user, featureId) => {
  // In a real app, this would send analytics to backend
  console.log('Feature used:', {
    userId: user?.id || 'visitor',
    featureId,
    tier: getUserTier(user),
    timestamp: new Date().toISOString()
  });
  
  // Store in localStorage for demo
  const usage = JSON.parse(localStorage.getItem('featureUsage') || '{}');
  const key = `${user?.id || 'visitor'}_${featureId}`;
  usage[key] = (usage[key] || 0) + 1;
  localStorage.setItem('featureUsage', JSON.stringify(usage));
};

// Get feature usage statistics
export const getFeatureUsageStats = () => {
  const usage = JSON.parse(localStorage.getItem('featureUsage') || '{}');
  const stats = {};
  
  Object.entries(usage).forEach(([key, count]) => {
    const [userId, featureId] = key.split('_');
    if (!stats[featureId]) {
      stats[featureId] = {
        totalUsage: 0,
        uniqueUsers: new Set(),
        feature: FEATURES[featureId]
      };
    }
    stats[featureId].totalUsage += count;
    stats[featureId].uniqueUsers.add(userId);
  });
  
  // Convert Sets to counts
  Object.values(stats).forEach(stat => {
    stat.uniqueUsers = stat.uniqueUsers.size;
  });
  
  return stats;
};

// Feature flags (for admin control)
let featureFlags = JSON.parse(localStorage.getItem('featureFlags') || '{}');

export const setFeatureFlag = (featureId, enabled) => {
  featureFlags[featureId] = enabled;
  localStorage.setItem('featureFlags', JSON.stringify(featureFlags));
};

export const resetFeatureFlags = () => {
  featureFlags = {};
  localStorage.removeItem('featureFlags');
};

export const resetToDefaults = () => {
  resetFeatureFlags();
  // Ensure critical features are enabled
  const criticalFeatures = ['csv_upload', 'basic_charts', 'data_preview', 'dashboard_access'];
  criticalFeatures.forEach(featureId => {
    setFeatureFlag(featureId, true);
  });
};

export const getFeatureFlag = (featureId) => {
  // Ensure critical features are always enabled
  const criticalFeatures = ['csv_upload', 'basic_charts', 'data_preview', 'dashboard_access'];
  if (criticalFeatures.includes(featureId)) {
    return true;
  }

  return featureFlags[featureId] !== undefined ? featureFlags[featureId] : FEATURES[featureId]?.enabled;
};

export const isFeatureEnabled = (featureId) => {
  return getFeatureFlag(featureId) === true;
};

// Get all features with their current status
export const getAllFeatures = () => {
  return Object.entries(FEATURES).map(([id, feature]) => ({
    ...feature,
    id,
    enabled: isFeatureEnabled(id),
    usage: getFeatureUsageStats()[id] || { totalUsage: 0, uniqueUsers: 0 }
  }));
};

// Validate file format access
export const validateFileFormatAccess = (user, format) => {
  const formatFeatureMap = {
    CSV: 'csv_upload',
    TSV: 'tsv_upload',
    EXCEL: 'excel_upload',
    JSON: 'json_upload',
    XML: 'xml_upload',
    TXT: 'txt_upload',
    GOOGLE_SHEETS: 'google_sheets'
  };
  
  const featureId = formatFeatureMap[format];
  if (!featureId) {
    return { allowed: false, reason: 'Unsupported format' };
  }
  
  if (!isFeatureEnabled(featureId)) {
    return { allowed: false, reason: 'Feature is currently disabled' };
  }
  
  if (!hasFeatureAccess(user, featureId)) {
    const suggestion = getUpgradeSuggestion(user, featureId);
    return { 
      allowed: false, 
      reason: 'Premium feature', 
      upgrade: suggestion 
    };
  }
  
  return { allowed: true };
};

// Debug helpers (available in browser console)
if (typeof window !== 'undefined') {
  window.debugFeatures = {
    resetFeatureFlags,
    resetToDefaults,
    setFeatureFlag,
    getFeatureFlag,
    getAllFeatures,
    currentFlags: () => featureFlags
  };
}
