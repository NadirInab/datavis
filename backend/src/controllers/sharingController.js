const sharingService = require('../services/sharingService');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Create share link for a file
 */
const createShareLink = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { defaultAccess, allowAnonymous, requireAuth, expiresAt } = req.body;
    const user = req.user;

    const shareInfo = await sharingService.createShareLink(fileId, user.firebaseUid, {
      defaultAccess,
      allowAnonymous,
      requireAuth,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Share link created successfully',
      shareInfo
    });
  } catch (error) {
    logger.error('Create share link error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to create share link'
    });
  }
};

/**
 * Get shared file by token (public endpoint)
 */
const getSharedFile = async (req, res) => {
  try {
    const { fileId, shareToken } = req.params;
    const user = req.user; // May be null for anonymous access

    const accessInfo = await sharingService.validateShareAccess(
      fileId, 
      shareToken, 
      user?.firebaseUid
    );

    // Return file data based on permission level
    const responseData = {
      success: true,
      file: {
        _id: accessInfo.file._id,
        filename: accessInfo.file.filename,
        originalName: accessInfo.file.originalName,
        size: accessInfo.file.size,
        uploadedAt: accessInfo.file.uploadedAt,
        dataInfo: accessInfo.file.dataInfo,
        visualizations: accessInfo.file.visualizations,
        cellComments: accessInfo.file.cellComments
      },
      permission: accessInfo.permission,
      canEdit: accessInfo.canEdit,
      canView: accessInfo.canView,
      isOwner: accessInfo.isOwner
    };

    // Include data only if user has view permission
    if (accessInfo.canView) {
      responseData.file.data = accessInfo.file.data;
    }

    res.json(responseData);
  } catch (error) {
    logger.error('Get shared file error:', error);
    res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: error.message || 'Access denied'
    });
  }
};

/**
 * Add user permission to file
 */
const addUserPermission = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { email, permission } = req.body;
    const user = req.user;

    if (!email || !permission) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email and permission are required'
      });
    }

    const userPermission = await sharingService.addUserPermission(
      fileId,
      user.firebaseUid,
      email,
      permission
    );

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'User permission added successfully',
      userPermission
    });
  } catch (error) {
    logger.error('Add user permission error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to add user permission'
    });
  }
};

/**
 * Remove user permission from file
 */
const removeUserPermission = async (req, res) => {
  try {
    const { fileId, userId } = req.params;
    const user = req.user;

    await sharingService.removeUserPermission(fileId, user.firebaseUid, userId);

    res.json({
      success: true,
      message: 'User permission removed successfully'
    });
  } catch (error) {
    logger.error('Remove user permission error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to remove user permission'
    });
  }
};

/**
 * Update sharing settings
 */
const updateSharingSettings = async (req, res) => {
  try {
    const { fileId } = req.params;
    const settings = req.body;
    const user = req.user;

    const updatedSettings = await sharingService.updateSharingSettings(
      fileId,
      user.firebaseUid,
      settings
    );

    res.json({
      success: true,
      message: 'Sharing settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    logger.error('Update sharing settings error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to update sharing settings'
    });
  }
};

/**
 * Revoke share link
 */
const revokeShareLink = async (req, res) => {
  try {
    const { fileId } = req.params;
    const user = req.user;

    await sharingService.revokeShareLink(fileId, user.firebaseUid);

    res.json({
      success: true,
      message: 'Share link revoked successfully'
    });
  } catch (error) {
    logger.error('Revoke share link error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to revoke share link'
    });
  }
};

/**
 * Get sharing info for a file
 */
const getSharingInfo = async (req, res) => {
  try {
    const { fileId } = req.params;
    const user = req.user;

    const sharingInfo = await sharingService.getSharingInfo(fileId, user.firebaseUid);

    res.json({
      success: true,
      sharingInfo
    });
  } catch (error) {
    logger.error('Get sharing info error:', error);
    res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: error.message || 'Access denied'
    });
  }
};

/**
 * Get files shared with user
 */
const getSharedFiles = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = req.user;

    const result = await sharingService.getSharedFiles(
      user.firebaseUid,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Get shared files error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to get shared files'
    });
  }
};

module.exports = {
  createShareLink,
  getSharedFile,
  addUserPermission,
  removeUserPermission,
  updateSharingSettings,
  revokeShareLink,
  getSharingInfo,
  getSharedFiles
};
