// Rate limiting and security utilities for file uploads

// File size limits by user type (in bytes)
export const FILE_SIZE_LIMITS = {
  visitor: 2 * 1024 * 1024, // 2MB for guests
  free: 5 * 1024 * 1024, // 5MB for free users
  pro: 25 * 1024 * 1024, // 25MB for pro users
  enterprise: 100 * 1024 * 1024 // 100MB for enterprise users
};

// Upload limits by user type
export const UPLOAD_LIMITS = {
  visitor: {
    maxFiles: 2,
    maxStorageTotal: 5 * 1024 * 1024, // 5MB total
    allowedFormats: ['CSV'], // Only CSV for guests
    rateLimitWindow: 60 * 60 * 1000, // 1 hour
    maxUploadsPerWindow: 2
  },
  free: {
    maxFiles: 5,
    maxStorageTotal: 10 * 1024 * 1024, // 10MB total
    allowedFormats: ['CSV', 'TSV', 'JSON'],
    rateLimitWindow: 60 * 60 * 1000, // 1 hour
    maxUploadsPerWindow: 5
  },
  pro: {
    maxFiles: -1, // unlimited
    maxStorageTotal: 100 * 1024 * 1024, // 100MB total
    allowedFormats: ['CSV', 'TSV', 'JSON', 'EXCEL', 'XML'],
    rateLimitWindow: 60 * 60 * 1000, // 1 hour
    maxUploadsPerWindow: 50
  },
  enterprise: {
    maxFiles: -1, // unlimited
    maxStorageTotal: 1024 * 1024 * 1024, // 1GB total
    allowedFormats: ['CSV', 'TSV', 'JSON', 'EXCEL', 'XML', 'TXT'],
    rateLimitWindow: 60 * 60 * 1000, // 1 hour
    maxUploadsPerWindow: 100
  }
};

// Get user type for rate limiting
export const getUserType = (user) => {
  if (!user) return 'visitor';
  return user.subscription || user.role || 'free';
};

// Get file size limit for user
export const getFileSizeLimit = (user) => {
  const userType = getUserType(user);
  return FILE_SIZE_LIMITS[userType] || FILE_SIZE_LIMITS.visitor;
};

// Get upload limits for user
export const getUploadLimits = (user) => {
  const userType = getUserType(user);
  return UPLOAD_LIMITS[userType] || UPLOAD_LIMITS.visitor;
};

// Validate file size
export const validateFileSize = (file, user) => {
  const maxSize = getFileSizeLimit(user);
  
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    const userType = getUserType(user);
    
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the ${maxSizeMB}MB limit for ${userType} users.`,
      upgrade: userType === 'visitor' ? 'signup' : userType === 'free' ? 'pro' : null
    };
  }
  
  return { valid: true };
};

// Validate file format
export const validateFileFormat = (file, user) => {
  const limits = getUploadLimits(user);
  const fileExtension = file.name.split('.').pop().toUpperCase();
  
  // Map file extensions to format names
  const formatMap = {
    'CSV': 'CSV',
    'TSV': 'TSV',
    'TXT': 'TXT',
    'JSON': 'JSON',
    'XLS': 'EXCEL',
    'XLSX': 'EXCEL',
    'XML': 'XML'
  };
  
  const format = formatMap[fileExtension];
  
  if (!format || !limits.allowedFormats.includes(format)) {
    const userType = getUserType(user);
    return {
      valid: false,
      error: `${format || fileExtension} files are not supported for ${userType} users. Supported formats: ${limits.allowedFormats.join(', ')}`,
      upgrade: userType === 'visitor' ? 'signup' : userType === 'free' ? 'pro' : null
    };
  }
  
  return { valid: true };
};

// Get guest session data
export const getGuestSession = () => {
  const sessionId = localStorage.getItem('sessionId') || generateSessionId();
  const sessionData = JSON.parse(localStorage.getItem(`guest_session_${sessionId}`) || '{}');
  
  return {
    sessionId,
    filesUploaded: sessionData.filesUploaded || 0,
    totalStorage: sessionData.totalStorage || 0,
    uploadHistory: sessionData.uploadHistory || [],
    firstUpload: sessionData.firstUpload || null,
    lastUpload: sessionData.lastUpload || null
  };
};

// Update guest session data
export const updateGuestSession = (sessionId, data) => {
  const currentData = JSON.parse(localStorage.getItem(`guest_session_${sessionId}`) || '{}');
  const updatedData = { ...currentData, ...data };
  localStorage.setItem(`guest_session_${sessionId}`, JSON.stringify(updatedData));
  return updatedData;
};

// Generate session ID for guests
export const generateSessionId = () => {
  const sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('sessionId', sessionId);
  return sessionId;
};

// Check if guest has reached upload limit
export const checkGuestUploadLimit = () => {
  const session = getGuestSession();
  const limits = UPLOAD_LIMITS.visitor;
  
  // Check file count limit
  if (session.filesUploaded >= limits.maxFiles) {
    return {
      allowed: false,
      reason: `Guest users can only upload ${limits.maxFiles} files. Please sign up for more uploads.`,
      upgrade: 'signup',
      remainingFiles: 0
    };
  }
  
  // Check rate limiting (uploads per hour)
  const now = Date.now();
  const windowStart = now - limits.rateLimitWindow;
  const recentUploads = session.uploadHistory.filter(upload => upload.timestamp > windowStart);
  
  if (recentUploads.length >= limits.maxUploadsPerWindow) {
    return {
      allowed: false,
      reason: `Rate limit exceeded. Guest users can upload ${limits.maxUploadsPerWindow} files per hour.`,
      upgrade: 'signup',
      remainingFiles: limits.maxFiles - session.filesUploaded
    };
  }
  
  return {
    allowed: true,
    remainingFiles: limits.maxFiles - session.filesUploaded,
    remainingInWindow: limits.maxUploadsPerWindow - recentUploads.length
  };
};

// Check if authenticated user has reached upload limit
export const checkUserUploadLimit = (user) => {
  const userType = getUserType(user);
  const limits = getUploadLimits(user);
  
  // Get user's file count from localStorage or user object
  const userId = user.id || user.uid;
  const userFiles = JSON.parse(localStorage.getItem(`files_${userId}`) || '[]');
  const filesCount = userFiles.length;
  
  // Check file count limit (unlimited for pro/enterprise)
  if (limits.maxFiles !== -1 && filesCount >= limits.maxFiles) {
    return {
      allowed: false,
      reason: `You have reached your upload limit of ${limits.maxFiles} files.`,
      upgrade: userType === 'free' ? 'pro' : null,
      remainingFiles: 0
    };
  }
  
  // Check storage limit
  const totalStorage = userFiles.reduce((total, file) => total + (file.size || 0), 0);
  if (totalStorage >= limits.maxStorageTotal) {
    const maxStorageMB = (limits.maxStorageTotal / (1024 * 1024)).toFixed(1);
    return {
      allowed: false,
      reason: `You have reached your storage limit of ${maxStorageMB}MB.`,
      upgrade: userType === 'free' ? 'pro' : null,
      remainingFiles: limits.maxFiles === -1 ? 'unlimited' : limits.maxFiles - filesCount
    };
  }
  
  return {
    allowed: true,
    remainingFiles: limits.maxFiles === -1 ? 'unlimited' : limits.maxFiles - filesCount,
    remainingStorage: limits.maxStorageTotal - totalStorage
  };
};

// Record file upload for guest
export const recordGuestUpload = (file) => {
  const session = getGuestSession();
  const now = Date.now();
  
  const uploadRecord = {
    timestamp: now,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  };
  
  const updatedSession = updateGuestSession(session.sessionId, {
    filesUploaded: session.filesUploaded + 1,
    totalStorage: session.totalStorage + file.size,
    uploadHistory: [...session.uploadHistory, uploadRecord],
    firstUpload: session.firstUpload || now,
    lastUpload: now
  });
  
  return updatedSession;
};

// Get upload metrics for guest
export const getGuestMetrics = () => {
  const session = getGuestSession();
  const limits = UPLOAD_LIMITS.visitor;
  
  return {
    filesUploaded: session.filesUploaded,
    maxFiles: limits.maxFiles,
    remainingFiles: Math.max(0, limits.maxFiles - session.filesUploaded),
    totalStorage: session.totalStorage,
    maxStorage: limits.maxStorageTotal,
    remainingStorage: Math.max(0, limits.maxStorageTotal - session.totalStorage),
    uploadHistory: session.uploadHistory,
    firstUpload: session.firstUpload,
    lastUpload: session.lastUpload,
    sessionId: session.sessionId
  };
};

// Get upload metrics for authenticated user
export const getUserMetrics = (user) => {
  const userId = user.id || user.uid;
  const userFiles = JSON.parse(localStorage.getItem(`files_${userId}`) || '[]');
  const limits = getUploadLimits(user);
  
  const totalStorage = userFiles.reduce((total, file) => total + (file.size || 0), 0);
  
  return {
    filesUploaded: userFiles.length,
    maxFiles: limits.maxFiles,
    remainingFiles: limits.maxFiles === -1 ? 'unlimited' : Math.max(0, limits.maxFiles - userFiles.length),
    totalStorage,
    maxStorage: limits.maxStorageTotal,
    remainingStorage: Math.max(0, limits.maxStorageTotal - totalStorage),
    uploadHistory: userFiles.map(file => ({
      timestamp: new Date(file.uploadedAt).getTime(),
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })),
    firstUpload: userFiles.length > 0 ? Math.min(...userFiles.map(f => new Date(f.uploadedAt).getTime())) : null,
    lastUpload: userFiles.length > 0 ? Math.max(...userFiles.map(f => new Date(f.uploadedAt).getTime())) : null
  };
};

// Comprehensive file validation
export const validateFileUpload = (file, user) => {
  // Check file size
  const sizeValidation = validateFileSize(file, user);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }
  
  // Check file format
  const formatValidation = validateFileFormat(file, user);
  if (!formatValidation.valid) {
    return formatValidation;
  }
  
  // Check upload limits
  const limitCheck = user ? checkUserUploadLimit(user) : checkGuestUploadLimit();
  if (!limitCheck.allowed) {
    return {
      valid: false,
      error: limitCheck.reason,
      upgrade: limitCheck.upgrade
    };
  }
  
  return { valid: true };
};

// Security: Validate file content (basic checks)
export const validateFileContent = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target.result;
      
      // Check for suspicious content
      const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i
      ];
      
      const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(content));
      
      if (hasSuspiciousContent) {
        resolve({
          valid: false,
          error: 'File contains potentially malicious content and cannot be uploaded.'
        });
        return;
      }
      
      // Check file size vs content size (detect compression bombs)
      if (content.length > file.size * 100) {
        resolve({
          valid: false,
          error: 'File appears to be a compression bomb and cannot be uploaded.'
        });
        return;
      }
      
      resolve({ valid: true });
    };
    
    reader.onerror = () => {
      resolve({
        valid: false,
        error: 'Unable to read file content for security validation.'
      });
    };
    
    // Read only first 10KB for security check
    const blob = file.slice(0, 10240);
    reader.readAsText(blob);
  });
};