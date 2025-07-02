const express = require('express');
const router = express.Router();

const {
  updateProfile,
  getDashboard,
  getUserFiles,
  getUsageStats,
  getAllUsers,
  getUserById
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/auth');
const { validate, userValidation } = require('../utils/validation');

// User profile routes
// @route   PUT /api/v1/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, validate(userValidation.updateProfile), updateProfile);

// @route   GET /api/v1/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', protect, getDashboard);

// @route   GET /api/v1/users/files
// @desc    Get user files
// @access  Private
router.get('/files', protect, getUserFiles);

// @route   GET /api/v1/users/usage
// @desc    Get usage statistics
// @access  Private
router.get('/usage', protect, getUsageStats);

// Admin routes
// @route   GET /api/v1/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', protect, authorize('admin', 'super_admin'), getAllUsers);

// @route   GET /api/v1/users/:uid
// @desc    Get user by ID (Admin only)
// @access  Private (Admin)
router.get('/:uid', protect, authorize('admin', 'super_admin'), getUserById);

module.exports = router;
