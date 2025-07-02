const express = require('express');
const router = express.Router();

const {
  verifyToken,
  getMe,
  updateUserRole,
  getVisitorInfo,
  logout,
  deleteAccount
} = require('../controllers/authController');

const { protect, authorize, trackVisitor } = require('../middleware/auth');
const { validate, userValidation } = require('../utils/validation');

// @route   POST /api/v1/auth/verify
// @desc    Verify Firebase token and get/create user
// @access  Public
router.post('/verify', verifyToken);

// @route   GET /api/v1/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, getMe);

// @route   GET /api/v1/auth/visitor
// @desc    Get visitor session info
// @access  Public
router.get('/visitor', trackVisitor, getVisitorInfo);

// @route   POST /api/v1/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, logout);

// @route   DELETE /api/v1/auth/account
// @desc    Delete user account
// @access  Private
router.delete('/account', protect, deleteAccount);

// Admin routes
// @route   PUT /api/v1/auth/users/:uid/role
// @desc    Update user role (Admin only)
// @access  Private (Admin)
router.put('/users/:uid/role', protect, authorize('admin', 'super_admin'), updateUserRole);

module.exports = router;
