const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const {
  createShareLink,
  getSharedFile,
  addUserPermission,
  removeUserPermission,
  updateSharingSettings,
  revokeShareLink,
  getSharingInfo,
  getSharedFiles
} = require('../controllers/sharingController');

// @route   POST /api/v1/sharing/:fileId/create
// @desc    Create share link for a file
// @access  Private (owner only)
router.post('/:fileId/create', protect, createShareLink);

// @route   GET /api/v1/sharing/:fileId/:shareToken
// @desc    Get shared file by token (public access)
// @access  Public (with optional auth)
router.get('/:fileId/:shareToken', optionalAuth, getSharedFile);

// @route   POST /api/v1/sharing/:fileId/users
// @desc    Add user permission to file
// @access  Private (owner/admin only)
router.post('/:fileId/users', protect, addUserPermission);

// @route   DELETE /api/v1/sharing/:fileId/users/:userId
// @desc    Remove user permission from file
// @access  Private (owner/admin only)
router.delete('/:fileId/users/:userId', protect, removeUserPermission);

// @route   PUT /api/v1/sharing/:fileId/settings
// @desc    Update sharing settings
// @access  Private (owner only)
router.put('/:fileId/settings', protect, updateSharingSettings);

// @route   DELETE /api/v1/sharing/:fileId/revoke
// @desc    Revoke share link
// @access  Private (owner only)
router.delete('/:fileId/revoke', protect, revokeShareLink);

// @route   GET /api/v1/sharing/:fileId/info
// @desc    Get sharing info for a file
// @access  Private (owner/admin only)
router.get('/:fileId/info', protect, getSharingInfo);

// @route   GET /api/v1/sharing/shared-with-me
// @desc    Get files shared with user
// @access  Private
router.get('/shared-with-me', protect, getSharedFiles);

module.exports = router;
