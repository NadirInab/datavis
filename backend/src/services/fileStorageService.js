const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');

class FileStorageService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.tempDir = path.join(__dirname, '../../temp');
    this.ensureDirectories();
  }

  async ensureDirectories() {
    try {
      await fs.ensureDir(this.uploadDir);
      await fs.ensureDir(this.tempDir);
      
      // Create subdirectories for organization
      await fs.ensureDir(path.join(this.uploadDir, 'users'));
      await fs.ensureDir(path.join(this.uploadDir, 'visitors'));
      await fs.ensureDir(path.join(this.uploadDir, 'processed'));
    } catch (error) {
      console.error('Error creating directories:', error);
      throw error;
    }
  }

  /**
   * Store uploaded file
   * @param {Buffer} fileBuffer - File buffer
   * @param {Object} fileInfo - File information
   * @param {string} ownerType - 'user' or 'visitor'
   * @param {string} ownerId - User ID or visitor session ID
   * @returns {Object} Storage result with file path and metadata
   */
  async storeFile(fileBuffer, fileInfo, ownerType, ownerId) {
    try {
      const fileId = uuidv4();
      const fileExtension = path.extname(fileInfo.originalname);
      const fileName = `${fileId}${fileExtension}`;
      
      // Determine storage path based on owner type
      const ownerDir = ownerType === 'user' ? 'users' : 'visitors';
      const userDir = path.join(this.uploadDir, ownerDir, ownerId);
      await fs.ensureDir(userDir);
      
      const filePath = path.join(userDir, fileName);
      
      // Write file to disk
      await fs.writeFile(filePath, fileBuffer);
      
      // Get file stats
      const stats = await fs.stat(filePath);
      
      return {
        fileId,
        fileName,
        filePath,
        relativePath: path.relative(this.uploadDir, filePath),
        size: stats.size,
        mimetype: fileInfo.mimetype || mime.lookup(fileExtension) || 'application/octet-stream',
        encoding: fileInfo.encoding || 'binary',
        storedAt: new Date()
      };
    } catch (error) {
      console.error('Error storing file:', error);
      throw new Error(`Failed to store file: ${error.message}`);
    }
  }

  /**
   * Get file buffer
   * @param {string} filePath - File path
   * @returns {Buffer} File buffer
   */
  async getFile(filePath) {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.uploadDir, filePath);
      
      if (!await fs.pathExists(fullPath)) {
        throw new Error('File not found');
      }
      
      return await fs.readFile(fullPath);
    } catch (error) {
      console.error('Error reading file:', error);
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  /**
   * Delete file
   * @param {string} filePath - File path
   * @returns {boolean} Success status
   */
  async deleteFile(filePath) {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.uploadDir, filePath);
      
      if (await fs.pathExists(fullPath)) {
        await fs.remove(fullPath);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get file info
   * @param {string} filePath - File path
   * @returns {Object} File information
   */
  async getFileInfo(filePath) {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.uploadDir, filePath);
      
      if (!await fs.pathExists(fullPath)) {
        throw new Error('File not found');
      }
      
      const stats = await fs.stat(fullPath);
      
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  /**
   * Generate secure file URL
   * @param {string} filePath - File path
   * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns {string} Secure file URL
   */
  generateSecureUrl(filePath, expiresIn = 3600) {
    // For local storage, we'll use a simple token-based approach
    // In production, you might want to use signed URLs or JWT tokens
    const token = Buffer.from(JSON.stringify({
      path: filePath,
      expires: Date.now() + (expiresIn * 1000)
    })).toString('base64');
    
    return `/api/v1/files/download/${token}`;
  }

  /**
   * Validate secure URL token
   * @param {string} token - URL token
   * @returns {Object} Decoded token data
   */
  validateSecureUrl(token) {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      
      if (Date.now() > decoded.expires) {
        throw new Error('URL has expired');
      }
      
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired URL');
    }
  }

  /**
   * Clean up expired files
   * @param {number} maxAge - Maximum age in milliseconds
   * @returns {number} Number of files cleaned up
   */
  async cleanupExpiredFiles(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    try {
      let cleanedCount = 0;
      const now = Date.now();
      
      const processDirectory = async (dirPath) => {
        if (!await fs.pathExists(dirPath)) return;
        
        const items = await fs.readdir(dirPath);
        
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stats = await fs.stat(itemPath);
          
          if (stats.isDirectory()) {
            await processDirectory(itemPath);
          } else if (stats.isFile()) {
            const age = now - stats.mtime.getTime();
            if (age > maxAge) {
              await fs.remove(itemPath);
              cleanedCount++;
            }
          }
        }
      };
      
      await processDirectory(path.join(this.uploadDir, 'visitors'));
      
      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up files:', error);
      throw new Error(`Failed to cleanup files: ${error.message}`);
    }
  }

  /**
   * Get storage statistics
   * @returns {Object} Storage statistics
   */
  async getStorageStats() {
    try {
      const stats = {
        totalFiles: 0,
        totalSize: 0,
        userFiles: 0,
        visitorFiles: 0,
        userSize: 0,
        visitorSize: 0
      };

      const calculateDirStats = async (dirPath, type) => {
        if (!await fs.pathExists(dirPath)) return { files: 0, size: 0 };
        
        let files = 0;
        let size = 0;
        
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const item of items) {
          if (item.isDirectory()) {
            const subStats = await calculateDirStats(path.join(dirPath, item.name), type);
            files += subStats.files;
            size += subStats.size;
          } else if (item.isFile()) {
            const fileStat = await fs.stat(path.join(dirPath, item.name));
            files++;
            size += fileStat.size;
          }
        }
        
        return { files, size };
      };

      const userStats = await calculateDirStats(path.join(this.uploadDir, 'users'), 'user');
      const visitorStats = await calculateDirStats(path.join(this.uploadDir, 'visitors'), 'visitor');

      stats.userFiles = userStats.files;
      stats.userSize = userStats.size;
      stats.visitorFiles = visitorStats.files;
      stats.visitorSize = visitorStats.size;
      stats.totalFiles = userStats.files + visitorStats.files;
      stats.totalSize = userStats.size + visitorStats.size;

      return stats;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw new Error(`Failed to get storage stats: ${error.message}`);
    }
  }
}

module.exports = new FileStorageService();
