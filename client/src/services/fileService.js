import { fileAPI } from './api';
import storageManager from '../utils/storageManager';

/**
 * Unified File Service
 * Handles seamless file operations for both visitors (localStorage) and authenticated users (MongoDB)
 * Provides smart fallback mechanisms and maintains backward compatibility
 */

class FileService {
  constructor() {
    this.cache = new Map();
    this.syncQueue = [];
    this.isOnline = navigator.onLine;
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Get user identifier for localStorage
   */
  getUserId(currentUser, isVisitor) {
    if (currentUser && !isVisitor()) {
      return currentUser.id || currentUser.uid;
    }
    return localStorage.getItem('sessionId') || 'visitor-session';
  }

  /**
   * Get files for a user with smart fallback
   */
  async getFiles(currentUser, isVisitor) {
    const userId = this.getUserId(currentUser, isVisitor);
    
    try {
      // For authenticated users, try API first
      if (currentUser && !isVisitor() && this.isOnline) {
        console.log('🔄 Fetching files from API...');
        const response = await fileAPI.getFiles();
        
        if (response.success) {
          console.log('✅ Files fetched from API successfully');
          
          // Transform and cache the data
          const transformedFiles = response.files.map(this.transformApiFileToLocal);
          this.cacheFiles(userId, transformedFiles);
          
          return {
            files: transformedFiles,
            source: 'api',
            pagination: response.pagination,
            storageStats: response.storageStats
          };
        }
      }
    } catch (apiError) {
      console.warn('⚠️ API fetch failed, falling back to localStorage:', apiError);
    }

    // Fallback to localStorage
    console.log('💾 Fetching files from localStorage...');
    const localFiles = this.getLocalFiles(userId);
    
    return {
      files: localFiles,
      source: 'localStorage',
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalFiles: localFiles.length,
        hasNextPage: false,
        hasPrevPage: false,
        limit: localFiles.length
      }
    };
  }

  /**
   * Get a specific file by ID with smart fallback
   */
  async getFile(fileId, currentUser, isVisitor) {
    const userId = this.getUserId(currentUser, isVisitor);
    
    try {
      // For authenticated users, try API first
      if (currentUser && !isVisitor() && this.isOnline) {
        console.log(`🔄 Fetching file ${fileId} from API...`);
        const response = await fileAPI.getFile(fileId);
        
        if (response.success && response.file) {
          console.log('✅ File fetched from API successfully');
          const transformedFile = this.transformApiFileToLocal(response.file);
          return { file: transformedFile, source: 'api' };
        }
      }
    } catch (apiError) {
      console.warn('⚠️ API fetch failed, falling back to localStorage:', apiError);
    }

    // Fallback to localStorage
    console.log(`💾 Fetching file ${fileId} from localStorage...`);
    const localFiles = this.getLocalFiles(userId);
    const file = localFiles.find(f => f.id === fileId || f._id === fileId);
    
    return { file, source: 'localStorage' };
  }

  /**
   * Save a file with smart persistence
   */
  async saveFile(fileData, currentUser, isVisitor) {
    const userId = this.getUserId(currentUser, isVisitor);
    
    // Always save to localStorage first for immediate availability
    this.saveToLocalStorage(userId, fileData);
    
    // For authenticated users, try to sync to database
    if (currentUser && !isVisitor()) {
      if (this.isOnline) {
        try {
          console.log('🔄 Syncing file to database...');
          // Note: This would require a separate API endpoint for file metadata sync
          // For now, files are uploaded directly via the upload endpoint
          console.log('✅ File available locally, database sync handled by upload process');
        } catch (syncError) {
          console.warn('⚠️ Database sync failed, queuing for later:', syncError);
          this.queueForSync(fileData, 'save');
        }
      } else {
        console.log('📴 Offline - queuing file for sync when online');
        this.queueForSync(fileData, 'save');
      }
    }

    return { success: true, source: 'localStorage' };
  }

  /**
   * Update a file with smart persistence
   */
  async updateFile(fileId, updates, currentUser, isVisitor) {
    const userId = this.getUserId(currentUser, isVisitor);
    
    // Update localStorage first
    const localFiles = this.getLocalFiles(userId);
    const fileIndex = localFiles.findIndex(f => f.id === fileId || f._id === fileId);
    
    if (fileIndex === -1) {
      throw new Error('File not found');
    }

    localFiles[fileIndex] = { ...localFiles[fileIndex], ...updates };
    localStorage.setItem(`files_${userId}`, JSON.stringify(localFiles));

    // For authenticated users, try to sync to database
    if (currentUser && !isVisitor()) {
      if (this.isOnline) {
        try {
          console.log(`🔄 Syncing file ${fileId} updates to database...`);
          // This would require API endpoints for file updates
          console.log('✅ File updated locally, database sync would happen here');
        } catch (syncError) {
          console.warn('⚠️ Database sync failed, queuing for later:', syncError);
          this.queueForSync({ fileId, updates }, 'update');
        }
      } else {
        this.queueForSync({ fileId, updates }, 'update');
      }
    }

    return { success: true, file: localFiles[fileIndex] };
  }

  /**
   * Delete a file with smart persistence
   */
  async deleteFile(fileId, currentUser, isVisitor) {
    const userId = this.getUserId(currentUser, isVisitor);
    
    // Remove from localStorage
    const localFiles = this.getLocalFiles(userId);
    const filteredFiles = localFiles.filter(f => f.id !== fileId && f._id !== fileId);
    localStorage.setItem(`files_${userId}`, JSON.stringify(filteredFiles));

    // For authenticated users, try to delete from database
    if (currentUser && !isVisitor()) {
      if (this.isOnline) {
        try {
          console.log(`🔄 Deleting file ${fileId} from database...`);
          await fileAPI.deleteFile(fileId);
          console.log('✅ File deleted from database successfully');
        } catch (deleteError) {
          console.warn('⚠️ Database delete failed:', deleteError);
          // Don't queue deletes for retry - local deletion is sufficient
        }
      }
    }

    return { success: true };
  }

  /**
   * Get files from localStorage
   */
  getLocalFiles(userId) {
    try {
      const filesData = localStorage.getItem(`files_${userId}`);
      return filesData ? JSON.parse(filesData) : [];
    } catch (error) {
      console.error('Failed to parse local files:', error);
      return [];
    }
  }

  /**
   * Save file to localStorage with smart storage management
   */
  saveToLocalStorage(userId, fileData) {
    try {
      const existingFiles = this.getLocalFiles(userId);
      const fileIndex = existingFiles.findIndex(f =>
        f.id === fileData.id || f._id === fileData._id
      );

      let updatedFiles;
      if (fileIndex >= 0) {
        updatedFiles = [...existingFiles];
        updatedFiles[fileIndex] = fileData;
      } else {
        updatedFiles = [...existingFiles, fileData];
      }

      // Use smart save with automatic cleanup
      const saveResult = storageManager.smartSave(`files_${userId}`, updatedFiles, userId);

      if (saveResult.success) {
        console.log(`💾 File saved to localStorage using ${saveResult.method} method`);
        if (saveResult.warning) {
          console.warn(`⚠️ ${saveResult.warning}`);
        }
        if (saveResult.cleanupResult?.cleaned > 0) {
          console.log(`🧹 Cleaned up ${saveResult.cleanupResult.cleaned} old files to make space`);
        }
      } else {
        throw new Error(saveResult.error || 'Failed to save file');
      }
    } catch (error) {
      console.error('Failed to save file to localStorage:', error);
      throw error;
    }
  }

  /**
   * Transform API file format to local format
   */
  transformApiFileToLocal(apiFile) {
    return {
      id: apiFile._id,
      _id: apiFile._id,
      name: apiFile.filename,
      originalName: apiFile.originalName,
      size: apiFile.size,
      type: apiFile.mimetype,
      format: apiFile.dataInfo?.headers ? 'csv' : 'unknown',
      uploadedAt: apiFile.uploadedAt,
      rows: apiFile.dataInfo?.rows || 0,
      columns: apiFile.dataInfo?.headers || [],
      columnCount: apiFile.dataInfo?.columns || 0,
      columnTypes: apiFile.dataInfo?.statistics || {},
      visualizations: apiFile.visualizations || [],
      data: apiFile.data || [],
      status: apiFile.status,
      samplingInfo: apiFile.dataInfo?.samplingInfo
    };
  }

  /**
   * Cache files in memory
   */
  cacheFiles(userId, files) {
    this.cache.set(`files_${userId}`, {
      files,
      timestamp: Date.now()
    });
  }

  /**
   * Queue operations for sync when online
   */
  queueForSync(data, operation) {
    this.syncQueue.push({
      data,
      operation,
      timestamp: Date.now()
    });
  }

  /**
   * Process sync queue when coming back online
   */
  async processSyncQueue() {
    if (this.syncQueue.length === 0) return;

    console.log(`🔄 Processing ${this.syncQueue.length} queued sync operations...`);
    
    const queue = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of queue) {
      try {
        // Process queued operations
        console.log(`Processing ${item.operation} operation...`);
        // Implementation would depend on available API endpoints
      } catch (error) {
        console.warn('Failed to process sync item:', error);
        // Re-queue failed items
        this.syncQueue.push(item);
      }
    }
  }

  /**
   * Clear cache and localStorage for a user
   */
  clearUserData(userId) {
    localStorage.removeItem(`files_${userId}`);
    this.cache.delete(`files_${userId}`);
    console.log(`🧹 Cleared data for user: ${userId}`);
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(userId) {
    const files = this.getLocalFiles(userId);
    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
    const totalFiles = files.length;
    
    return {
      totalFiles,
      totalSize,
      formattedSize: this.formatFileSize(totalSize),
      files: files.map(f => ({
        id: f.id || f._id,
        name: f.name || f.originalName,
        size: f.size,
        formattedSize: this.formatFileSize(f.size)
      }))
    };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Create singleton instance
const fileService = new FileService();

export default fileService;
