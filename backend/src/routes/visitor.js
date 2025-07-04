const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const visitorSessionService = require('../services/visitorSessionService');
const logger = require('../utils/logger');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/visitor');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const sessionId = req.headers['x-session-id'];
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `visitor_${sessionId}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for visitors
  },
  fileFilter: (req, file, cb) => {
    // Allow CSV and Google Sheets for visitors
    const allowedTypes = ['.csv', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext) || file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed for visitors. Create a free account for more formats!'));
    }
  }
});

// @route   POST /api/v1/visitor/upload
// @desc    Upload file for visitor
// @access  Public
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Check if visitor can upload more files
    if (!visitorSessionService.canUpload(sessionId)) {
      // Clean up uploaded file
      await fs.unlink(req.file.path).catch(() => {});
      
      return res.status(403).json({
        success: false,
        message: 'Upload limit reached',
        upgradeMessage: 'Create a free account to get 5 more uploads at no cost!',
        upgradeRequired: true
      });
    }

    // Record the upload
    const sessionData = visitorSessionService.recordFileUpload(sessionId, {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: path.extname(req.file.originalname),
      filePath: req.file.path
    });

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileId: req.file.filename,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        uploadedAt: new Date(),
        session: {
          filesUploaded: sessionData.filesUploaded,
          remainingFiles: sessionData.remainingFiles,
          isLimitReached: sessionData.isLimitReached
        }
      }
    });

  } catch (error) {
    logger.error('Visitor file upload failed:', error);
    
    // Clean up file if upload failed
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Upload failed'
    });
  }
});

// @route   GET /api/v1/visitor/session
// @desc    Get visitor session info
// @access  Public
router.get('/session', (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID required'
      });
    }

    const sessionData = visitorSessionService.getSession(sessionId);
    
    res.status(200).json({
      success: true,
      data: sessionData
    });

  } catch (error) {
    logger.error('Get visitor session failed:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/v1/visitor/stats
// @desc    Get visitor upload statistics
// @access  Public
router.get('/stats', (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID required'
      });
    }

    const stats = visitorSessionService.getUploadStats(sessionId);
    
    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Get visitor stats failed:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/v1/visitor/google-sheets
// @desc    Import Google Sheets for visitor
// @access  Public
router.post('/google-sheets', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    const { sheetUrl, sheetName } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID required'
      });
    }

    if (!sheetUrl) {
      return res.status(400).json({
        success: false,
        message: 'Google Sheets URL required'
      });
    }

    // Check if visitor can upload more files
    if (!visitorSessionService.canUpload(sessionId)) {
      return res.status(403).json({
        success: false,
        message: 'Upload limit reached',
        upgradeMessage: 'Create a free account to get 5 more uploads at no cost!',
        upgradeRequired: true
      });
    }

    // Process Google Sheets import (simplified for demo)
    // In production, implement actual Google Sheets API integration
    const sessionData = visitorSessionService.recordFileUpload(sessionId, {
      fileName: sheetName || 'Google Sheet',
      fileSize: 0, // Unknown for Google Sheets
      fileType: 'google_sheets',
      sheetUrl
    });

    res.status(200).json({
      success: true,
      message: 'Google Sheets imported successfully',
      data: {
        sheetUrl,
        sheetName: sheetName || 'Google Sheet',
        importedAt: new Date(),
        session: {
          filesUploaded: sessionData.filesUploaded,
          remainingFiles: sessionData.remainingFiles,
          isLimitReached: sessionData.isLimitReached
        }
      }
    });

  } catch (error) {
    logger.error('Visitor Google Sheets import failed:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Import failed'
    });
  }
});

module.exports = router;
