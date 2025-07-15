const path = require('path');
const File = require('../models/File');
const User = require('../models/User');
const fileStorageService = require('../services/fileStorageService');
const dataProcessingService = require('../services/dataProcessingService');
const logger = require('../utils/logger');
const { FILE_STATUS, FILE_CONSTRAINTS, HTTP_STATUS } = require('../utils/constants');

/**
 * Upload and process CSV file
 * @route POST /api/v1/files/upload
 * @access Public (with optional auth)
 */
const uploadFile = async (req, res) => {
  try {
    console.log('📁 File upload request received:', {
      hasFile: !!req.file,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      hasUser: !!req.user,
      hasVisitor: !!req.visitor,
      sessionId: req.sessionId
    });

    // Check if file was uploaded
    if (!req.file) {
      console.error('❌ No file in upload request');
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { file } = req;
    const user = req.user;
    const visitor = req.visitor;
    const sessionId = req.sessionId;

    // Parse metadata if provided
    let clientMetadata = {};
    if (req.body.metadata) {
      try {
        clientMetadata = JSON.parse(req.body.metadata);
      } catch (error) {
        logger.warn('Failed to parse client metadata:', error);
      }
    }

    // Determine owner information
    const ownerType = user ? 'user' : 'visitor';
    const ownerUid = user ? user.firebaseUid : sessionId;
    const visitorSessionId = ownerType === 'visitor' ? sessionId : null;

    if (!ownerUid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Unable to identify file owner'
      });
    }

    // Get file constraints based on user type
    const constraints = getFileConstraints(user);

    // Validate file
    const validation = await dataProcessingService.validateFile(file.path, constraints);
    if (!validation.valid) {
      // Clean up uploaded file
      await fileStorageService.deleteFile(file.path);
      
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'File validation failed',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    // Store file in organized structure
    const fileBuffer = await fileStorageService.getFile(file.path);
    const storageResult = await fileStorageService.storeFile(
      fileBuffer,
      {
        originalname: file.originalname,
        mimetype: file.mimetype,
        encoding: file.encoding
      },
      ownerType,
      ownerUid
    );

    // Create file record in database
    const fileRecord = new File({
      filename: storageResult.fileName,
      originalName: file.originalname,
      ownerUid,
      ownerType,
      visitorSessionId,
      size: storageResult.size,
      mimetype: storageResult.mimetype,
      encoding: storageResult.encoding,
      path: storageResult.relativePath,
      status: FILE_STATUS.PROCESSING,
      processingProgress: 0,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Process the CSV data
    try {
      const parseResult = validation.parseResult;
      
      // Update file record with processed data
      fileRecord.dataInfo = {
        rows: parseResult.totalRows,
        columns: parseResult.totalColumns,
        headers: parseResult.metadata.headers,
        sampleData: parseResult.metadata.sampleData,
        statistics: parseResult.metadata.statistics
      };
      
      // Store processed data (limit size for database storage)
      const maxDataRows = user?.subscription?.tier === 'enterprise' ? 10000 : 1000;
      fileRecord.data = parseResult.data.slice(0, maxDataRows);

      // Add visualizations from client metadata if provided
      if (clientMetadata.visualizations && Array.isArray(clientMetadata.visualizations)) {
        fileRecord.visualizations = clientMetadata.visualizations;
      }
      
      fileRecord.status = FILE_STATUS.READY;
      fileRecord.processingProgress = 100;
      fileRecord.processedAt = new Date();

    } catch (processingError) {
      logger.error('File processing error:', processingError);
      fileRecord.status = FILE_STATUS.ERROR;
      fileRecord.errorMessage = processingError.message;
    }

    // Save file record
    console.log('💾 Saving file record to MongoDB:', {
      filename: fileRecord.filename,
      ownerUid: fileRecord.ownerUid,
      status: fileRecord.status
    });

    await fileRecord.save();

    console.log('✅ File record saved to MongoDB:', {
      fileId: fileRecord._id,
      filename: fileRecord.filename,
      status: fileRecord.status
    });

    // Update user/visitor file usage
    if (user) {
      await updateUserFileUsage(user, fileRecord);
    } else if (visitor) {
      await updateVisitorFileUsage(visitor, fileRecord);
    }

    // Clean up temporary file
    await fileStorageService.deleteFile(file.path);

    // Generate response
    const response = {
      success: true,
      message: 'File uploaded and processed successfully',
      file: {
        id: fileRecord._id,
        filename: fileRecord.filename,
        originalName: fileRecord.originalName,
        size: fileRecord.size,
        status: fileRecord.status,
        processingProgress: fileRecord.processingProgress,
        dataInfo: fileRecord.dataInfo,
        uploadedAt: fileRecord.uploadedAt,
        processedAt: fileRecord.processedAt
      }
    };

    // Include upload limit info
    if (req.uploadLimitInfo) {
      response.uploadLimits = req.uploadLimitInfo;
    }

    // Include visitor limits
    if (req.visitorLimits) {
      response.visitorLimits = req.visitorLimits;
    }

    console.log('✅ Sending file upload response:', {
      fileId: response.file.id,
      filename: response.file.filename,
      status: response.file.status
    });

    res.status(HTTP_STATUS.CREATED).json(response);

  } catch (error) {
    logger.error('File upload error:', error);
    
    // Clean up on error
    if (req.file?.path) {
      try {
        await fileStorageService.deleteFile(req.file.path);
      } catch (cleanupError) {
        logger.error('Cleanup error:', cleanupError);
      }
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'File upload failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get user files list
 * @route GET /api/v1/files
 * @access Private
 */
const getFiles = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sortBy = 'uploadedAt', sortOrder = 'desc' } = req.query;
    const user = req.user;

    // Build query
    const query = { ownerUid: user.firebaseUid };
    if (status) {
      query.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const files = await File.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-data') // Exclude large data field from list
      .lean();

    // Get total count
    const total = await File.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      files,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalFiles: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Get files error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to retrieve files',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get file details
 * @route GET /api/v1/files/:id
 * @access Private
 */
const getFileDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    console.log('📁 File details request:', {
      fileId: id,
      userId: user?._id,
      firebaseUid: user?.firebaseUid,
      isValidObjectId: require('mongoose').Types.ObjectId.isValid(id)
    });

    // Check if the ID is a valid MongoDB ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('❌ Invalid file ID format:', id);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `File not found (ID: ${id}). Please upload a file first or check the file ID.`
      });
    }

    const file = await File.findOne({
      _id: id,
      ownerUid: user.firebaseUid
    });

    console.log('🔍 File query result:', {
      fileFound: !!file,
      fileName: file?.filename
    });

    if (!file) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'File not found'
      });
    }

    // Increment view count
    file.incrementViewCount();
    await file.save();

    res.json({
      success: true,
      file
    });

  } catch (error) {
    console.error('🚨 File details error:', {
      error: error.message,
      stack: error.stack,
      fileId: req.params.id,
      userId: req.user?._id
    });

    logger.error('Get file details error:', error);

    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `File not found (ID: ${req.params.id}). Please upload a file first or check the file ID.`
      });
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to retrieve file details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Delete file
 * @route DELETE /api/v1/files/:id
 * @access Private
 */
const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const file = await File.findOne({
      _id: id,
      ownerUid: user.firebaseUid
    });

    if (!file) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete physical file
    try {
      await fileStorageService.deleteFile(file.path);
    } catch (storageError) {
      logger.warn('Failed to delete physical file:', storageError);
      // Continue with database deletion even if physical file deletion fails
    }

    // Update file status instead of hard delete (for audit trail)
    file.status = FILE_STATUS.DELETED;
    await file.save();

    // Note: We don't decrement the permanent upload count as per requirements
    // The permanent upload limit is deletion-proof

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    logger.error('Delete file error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete file',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Download file
 * @route GET /api/v1/files/download/:token
 * @access Public (with valid token)
 */
const downloadFile = async (req, res) => {
  try {
    const { token } = req.params;

    // Validate token
    const tokenData = fileStorageService.validateSecureUrl(token);
    
    // Get file info
    const fileInfo = await fileStorageService.getFileInfo(tokenData.path);
    const fileBuffer = await fileStorageService.getFile(tokenData.path);

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(tokenData.path)}"`);
    res.setHeader('Content-Length', fileBuffer.length);

    res.send(fileBuffer);

  } catch (error) {
    logger.error('Download file error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Invalid download link'
    });
  }
};

/**
 * Helper function to get file constraints based on user type
 */
function getFileConstraints(user) {
  if (!user) {
    return {
      maxSize: FILE_CONSTRAINTS.MAX_SIZE.FREE,
      maxRows: FILE_CONSTRAINTS.MAX_ROWS.FREE
    };
  }

  const tier = user.subscription?.tier || 'free';
  return {
    maxSize: FILE_CONSTRAINTS.MAX_SIZE[tier.toUpperCase()] || FILE_CONSTRAINTS.MAX_SIZE.FREE,
    maxRows: FILE_CONSTRAINTS.MAX_ROWS[tier.toUpperCase()] || FILE_CONSTRAINTS.MAX_ROWS.FREE
  };
}

/**
 * Helper function to update user file usage
 */
async function updateUserFileUsage(user, fileRecord) {
  try {
    // Initialize fileUsage if it doesn't exist
    if (!user.fileUsage) {
      user.fileUsage = {
        totalFiles: 0,
        totalSize: 0,
        totalUploadsCount: 0
      };
    }

    // Update usage counters
    user.fileUsage.totalFiles += 1;
    user.fileUsage.totalSize += fileRecord.size;
    user.fileUsage.totalUploadsCount += 1; // Permanent counter that never decreases

    // Update last activity
    user.lastActivityAt = new Date();

    await user.save();
  } catch (error) {
    logger.error('Error updating user file usage:', error);
    // Don't throw error as file upload was successful
  }
}

/**
 * Helper function to update visitor file usage
 */
async function updateVisitorFileUsage(visitor, fileRecord) {
  try {
    // Initialize visitorSession if it doesn't exist
    if (!visitor.visitorSession) {
      visitor.visitorSession = {
        sessionId: visitor.firebaseUid.replace('visitor_', ''),
        filesUploaded: 0,
        lastActivity: new Date()
      };
    }

    // Update visitor usage counters
    visitor.visitorSession.filesUploaded += 1;
    visitor.visitorSession.lastActivity = new Date();

    await visitor.save();
  } catch (error) {
    logger.error('Error updating visitor file usage:', error);
    // Don't throw error as file upload was successful
  }
}

module.exports = {
  uploadFile,
  getFiles,
  getFileDetails,
  deleteFile,
  downloadFile
};
