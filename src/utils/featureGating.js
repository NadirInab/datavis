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
  BASIC_EXPORT: {
    id: 'basic_export',
    name: 'Basic Export',
    description: 'Export charts as PNG images',
    category: 'Export',
    tier: 'free',
    enabled: true
  },
  ADVANCED_EXPORT: {
    id: 'advanced_export',
    name: 'Advanced Export',
    description: 'Export as PDF, SVG, and high-resolution formats',
    category: 'Export',
    tier: 'premium',
    enabled: true
  },
  BULK_EXPORT: {
    id: 'bulk_export',
    name: 'Bulk Export',
    description: 'Export multiple charts at once',
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
  }
};

// Subscription tier definitions
export const SUBSCRIPTION_TIERS = {
  visitor: {
    name: 'Visitor',
    features: ['csv_upload', 'basic_charts', 'data_preview'],
    limits: {
      files: 3,
      storage: 5 * 1024 * 1024, // 5MB
      exports: 5
    }
  },
  free: {
    name: 'Free',
    features: ['csv_upload', 'basic_charts', 'basic_export', 'data_preview', 'basic_storage'],
    limits: {
      files: 5,
      storage: 10 * 1024 * 1024, // 10MB
      exports: 10
    }
  },
  pro: {
    name: 'Pro',
    features: [
      'csv_upload', 'tsv_upload', 'excel_upload', 'json_upload',
      'basic_charts', 'advanced_charts', 'custom_styling',
      'basic_export', 'advanced_export',
      'data_preview', 'column_analysis',
      'extended_storage'
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

export const getFeatureFlag = (featureId) => {
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
