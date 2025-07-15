const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { FILE_CONSTRAINTS } = require('../utils/constants');

// Ensure temp directory exists
const tempDir = path.join(__dirname, '../../temp');
fs.ensureDirSync(tempDir);

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `upload-${uniqueSuffix}${extension}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/json'
  ];

  const allowedExtensions = ['.csv', '.txt', '.xls', '.xlsx', '.json'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`), false);
  }
};

// Get file size limit based on user
const getFileSizeLimit = (req) => {
  const user = req.user;
  
  if (!user) {
    return FILE_CONSTRAINTS.MAX_SIZE.FREE;
  }

  const tier = user.subscription?.tier || 'free';
  return FILE_CONSTRAINTS.MAX_SIZE[tier.toUpperCase()] || FILE_CONSTRAINTS.MAX_SIZE.FREE;
};

// Create multer upload middleware
const createUploadMiddleware = () => {
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: FILE_CONSTRAINTS.MAX_SIZE.ENTERPRISE, // Use max size, we'll check user-specific limits later
      files: 1 // Only allow single file upload
    }
  });
};

// Upload middleware with dynamic size checking
const uploadMiddleware = (req, res, next) => {
  const upload = createUploadMiddleware();
  
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Handle multer-specific errors
      let message = 'File upload error';
      
      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          message = 'File too large. Maximum size allowed is based on your subscription tier.';
          break;
        case 'LIMIT_FILE_COUNT':
          message = 'Too many files. Only one file allowed per upload.';
          break;
        case 'LIMIT_UNEXPECTED_FILE':
          message = 'Unexpected file field. Use "file" as the field name.';
          break;
        default:
          message = err.message;
      }
      
      return res.status(400).json({
        success: false,
        message,
        error: err.code
      });
    } else if (err) {
      // Handle other errors (like file filter errors)
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    // Check user-specific file size limit
    if (req.file) {
      const userSizeLimit = getFileSizeLimit(req);
      
      if (req.file.size > userSizeLimit) {
        // Delete the uploaded file
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting oversized file:', unlinkErr);
        });
        
        const sizeMB = (userSizeLimit / (1024 * 1024)).toFixed(1);
        return res.status(400).json({
          success: false,
          message: `File size exceeds your plan limit of ${sizeMB}MB. Please upgrade your subscription for larger file uploads.`,
          error: 'FILE_SIZE_LIMIT_EXCEEDED',
          limit: userSizeLimit,
          actualSize: req.file.size
        });
      }
    }

    next();
  });
};

// Cleanup middleware to remove temp files on error
const cleanupMiddleware = (err, req, res, next) => {
  if (req.file && req.file.path) {
    fs.unlink(req.file.path, (unlinkErr) => {
      if (unlinkErr) console.error('Error cleaning up temp file:', unlinkErr);
    });
  }
  next(err);
};

module.exports = {
  uploadMiddleware,
  cleanupMiddleware,
  getFileSizeLimit
};
