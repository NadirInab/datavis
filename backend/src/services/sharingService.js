const File = require('../models/File');
const User = require('../models/User');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * File Sharing Service
 * Handles file sharing, permissions, and access control
 */

class SharingService {
  /**
   * Create a shareable link for a file
   */
  async createShareLink(fileId, userId, options = {}) {
    try {
      const file = await File.findById(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      // Check if user is owner
      if (file.ownerUid !== userId) {
        throw new Error('Only file owner can create share links');
      }

      // Generate share token if not exists
      if (!file.sharing.shareToken) {
        file.generateShareToken();
      }

      // Update sharing settings
      file.sharing.permissions = {
        defaultAccess: options.defaultAccess || 'view',
        allowAnonymous: options.allowAnonymous !== false,
        requireAuth: options.requireAuth || false,
        expiresAt: options.expiresAt || null
      };
      
      file.sharing.sharedBy = userId;
      
      await file.save();

      logger.info('Share link created:', {
        fileId: file._id,
        shareToken: file.sharing.shareToken,
        sharedBy: userId
      });

      return {
        shareUrl: file.sharing.shareUrl,
        shareToken: file.sharing.shareToken,
        permissions: file.sharing.permissions
      };
    } catch (error) {
      logger.error('Create share link error:', error);
      throw error;
    }
  }

  /**
   * Validate share token and get file access
   */
  async validateShareAccess(fileId, shareToken, userId = null) {
    try {
      const file = await File.findById(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      // Check if file is shared
      if (!file.sharing.isShared || file.sharing.shareToken !== shareToken) {
        throw new Error('Invalid share link');
      }

      // Check if share has expired
      if (file.sharing.permissions.expiresAt && new Date() > file.sharing.permissions.expiresAt) {
        throw new Error('Share link has expired');
      }

      // Determine user permission
      let permission = 'none';
      
      if (userId) {
        permission = file.getUserPermission(userId, file.ownerUid === userId);
      } else if (file.sharing.permissions.allowAnonymous) {
        permission = file.sharing.permissions.defaultAccess;
      } else if (file.sharing.permissions.requireAuth) {
        throw new Error('Authentication required to access this file');
      }

      return {
        file,
        permission,
        isOwner: userId === file.ownerUid,
        canEdit: ['edit', 'admin'].includes(permission),
        canView: ['view', 'edit', 'admin'].includes(permission)
      };
    } catch (error) {
      logger.error('Validate share access error:', error);
      throw error;
    }
  }

  /**
   * Add user permission to a file
   */
  async addUserPermission(fileId, ownerId, targetEmail, permission) {
    try {
      const file = await File.findById(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      // Check if user is owner or admin
      const ownerPermission = file.getUserPermission(ownerId);
      if (!['admin'].includes(ownerPermission) && file.ownerUid !== ownerId) {
        throw new Error('Insufficient permissions to grant access');
      }

      // Find target user
      const targetUser = await User.findOne({ email: targetEmail });
      if (!targetUser) {
        throw new Error('User not found');
      }

      // Add permission
      file.addUserPermission(targetUser.firebaseUid, targetEmail, permission, ownerId);
      await file.save();

      logger.info('User permission added:', {
        fileId: file._id,
        targetUser: targetEmail,
        permission,
        grantedBy: ownerId
      });

      return {
        userId: targetUser.firebaseUid,
        email: targetEmail,
        permission
      };
    } catch (error) {
      logger.error('Add user permission error:', error);
      throw error;
    }
  }

  /**
   * Remove user permission from a file
   */
  async removeUserPermission(fileId, ownerId, targetUserId) {
    try {
      const file = await File.findById(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      // Check if user is owner or admin
      const ownerPermission = file.getUserPermission(ownerId);
      if (!['admin'].includes(ownerPermission) && file.ownerUid !== ownerId) {
        throw new Error('Insufficient permissions to revoke access');
      }

      // Remove permission
      file.userPermissions = file.userPermissions.filter(p => p.userId !== targetUserId);
      await file.save();

      logger.info('User permission removed:', {
        fileId: file._id,
        targetUserId,
        removedBy: ownerId
      });

      return true;
    } catch (error) {
      logger.error('Remove user permission error:', error);
      throw error;
    }
  }

  /**
   * Update sharing settings
   */
  async updateSharingSettings(fileId, userId, settings) {
    try {
      const file = await File.findById(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      // Check if user is owner
      if (file.ownerUid !== userId) {
        throw new Error('Only file owner can update sharing settings');
      }

      // Update settings
      if (settings.defaultAccess) {
        file.sharing.permissions.defaultAccess = settings.defaultAccess;
      }
      if (settings.allowAnonymous !== undefined) {
        file.sharing.permissions.allowAnonymous = settings.allowAnonymous;
      }
      if (settings.requireAuth !== undefined) {
        file.sharing.permissions.requireAuth = settings.requireAuth;
      }
      if (settings.expiresAt !== undefined) {
        file.sharing.permissions.expiresAt = settings.expiresAt;
      }
      if (settings.isShared !== undefined) {
        file.sharing.isShared = settings.isShared;
      }

      await file.save();

      logger.info('Sharing settings updated:', {
        fileId: file._id,
        settings,
        updatedBy: userId
      });

      return file.sharing;
    } catch (error) {
      logger.error('Update sharing settings error:', error);
      throw error;
    }
  }

  /**
   * Revoke share link
   */
  async revokeShareLink(fileId, userId) {
    try {
      const file = await File.findById(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      // Check if user is owner
      if (file.ownerUid !== userId) {
        throw new Error('Only file owner can revoke share links');
      }

      // Generate new token to invalidate old links
      file.generateShareToken();
      file.sharing.isShared = false;
      
      await file.save();

      logger.info('Share link revoked:', {
        fileId: file._id,
        revokedBy: userId
      });

      return true;
    } catch (error) {
      logger.error('Revoke share link error:', error);
      throw error;
    }
  }

  /**
   * Get file sharing info
   */
  async getSharingInfo(fileId, userId) {
    try {
      const file = await File.findById(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      const userPermission = file.getUserPermission(userId, file.ownerUid === userId);
      
      // Only owners and admins can see full sharing info
      if (!['admin'].includes(userPermission) && file.ownerUid !== userId) {
        throw new Error('Insufficient permissions to view sharing info');
      }

      return {
        isShared: file.sharing.isShared,
        shareUrl: file.sharing.shareUrl,
        permissions: file.sharing.permissions,
        userPermissions: file.userPermissions,
        sharedAt: file.sharing.sharedAt,
        sharedBy: file.sharing.sharedBy
      };
    } catch (error) {
      logger.error('Get sharing info error:', error);
      throw error;
    }
  }

  /**
   * Get files shared with a user
   */
  async getSharedFiles(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      
      const files = await File.find({
        $or: [
          { 'userPermissions.userId': userId },
          { 'sharing.isShared': true, 'sharing.permissions.allowAnonymous': true }
        ],
        status: { $ne: 'deleted' }
      })
      .select('-data -editHistory') // Exclude large fields
      .sort({ 'sharing.sharedAt': -1 })
      .skip(skip)
      .limit(limit)
      .lean();

      const total = await File.countDocuments({
        $or: [
          { 'userPermissions.userId': userId },
          { 'sharing.isShared': true, 'sharing.permissions.allowAnonymous': true }
        ],
        status: { $ne: 'deleted' }
      });

      return {
        files: files.map(file => ({
          ...file,
          userPermission: file.userPermissions?.find(p => p.userId === userId)?.permission || file.sharing?.permissions?.defaultAccess || 'none'
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalFiles: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Get shared files error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const sharingService = new SharingService();

module.exports = sharingService;
