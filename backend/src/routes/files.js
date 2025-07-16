const express = require('express');
const router = express.Router();

const { protect, optionalAuth, checkSubscriptionLimits, checkPermanentUploadLimit, checkVisitorLimits, trackVisitor } = require('../middleware/auth');
const { uploadMiddleware, cleanupMiddleware } = require('../middleware/upload');
const {
  uploadFile,
  getFiles,
  getFileDetails,
  deleteFile,
  downloadFile,
  createVisualization
} = require('../controllers/fileController');

// @route   POST /api/v1/files/upload
// @desc    Upload CSV file
// @access  Public (with optional auth)
router.post('/upload',
  optionalAuth,
  trackVisitor,
  checkVisitorLimits,
  checkPermanentUploadLimit,
  checkSubscriptionLimits('files'),
  uploadMiddleware,
  uploadFile,
  cleanupMiddleware
);

// @route   GET /api/v1/files
// @desc    List user files
// @access  Private
router.get('/', protect, getFiles);

// @route   GET /api/v1/files/:id
// @desc    Get file details
// @access  Private
router.get('/:id', protect, getFileDetails);

// @route   DELETE /api/v1/files/:id
// @desc    Delete file
// @access  Private
router.delete('/:id', protect, deleteFile);

// @route   GET /api/v1/files/download/:token
// @desc    Download file with secure token
// @access  Public (with valid token)
router.get('/download/:token', downloadFile);

// @route   POST /api/v1/files/:id/visualize
// @desc    Create visualization
// @access  Private
router.post('/:id/visualize', protect, createVisualization);

module.exports = router;
