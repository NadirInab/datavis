import fingerprintService from './fingerprintService';

class VisitorTrackingService {
  constructor() {
    this.storageKey = 'visitor_upload_data';
    this.maxUploadsPerVisitor = 2; // Free tier limit
    this.maxFileSizeBytes = 2 * 1024 * 1024; // 2MB limit for guests
  }

  // Initialize the service and get visitor ID
  async initialize() {
    try {
      const visitorId = await fingerprintService.getVisitorId();
      console.log('Visitor tracking initialized for ID:', visitorId);
      return visitorId;
    } catch (error) {
      console.error('Failed to initialize visitor tracking:', error);
      throw error;
    }
  }

  // Get visitor data from localStorage
  getVisitorData(visitorId) {
    try {
      const allData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      return allData[visitorId] || {
        uploads: [],
        totalUploads: 0,
        firstVisit: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error reading visitor data:', error);
      return {
        uploads: [],
        totalUploads: 0,
        firstVisit: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
    }
  }

  // Save visitor data to localStorage
  saveVisitorData(visitorId, data) {
    try {
      const allData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      allData[visitorId] = {
        ...data,
        lastActivity: new Date().toISOString()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(allData));
    } catch (error) {
      console.error('Error saving visitor data:', error);
    }
  }

  // Check if visitor can upload a file
  async canUpload(fileSize = 0) {
    try {
      const visitorId = await fingerprintService.getVisitorId();
      const visitorData = this.getVisitorData(visitorId);

      // Check upload count limit
      if (visitorData.totalUploads >= this.maxUploadsPerVisitor) {
        return {
          allowed: false,
          reason: `Upload limit reached. Guests can upload up to ${this.maxUploadsPerVisitor} files.`,
          upgradeRequired: 'signup',
          currentUploads: visitorData.totalUploads,
          maxUploads: this.maxUploadsPerVisitor
        };
      }

      // Check file size limit
      if (fileSize > this.maxFileSizeBytes) {
        return {
          allowed: false,
          reason: `File too large. Maximum size for guests is ${this.maxFileSizeBytes / (1024 * 1024)}MB.`,
          upgradeRequired: 'signup',
          currentSize: fileSize,
          maxSize: this.maxFileSizeBytes
        };
      }

      return {
        allowed: true,
        currentUploads: visitorData.totalUploads,
        maxUploads: this.maxUploadsPerVisitor,
        remainingUploads: this.maxUploadsPerVisitor - visitorData.totalUploads
      };
    } catch (error) {
      console.error('Error checking upload permission:', error);
      return {
        allowed: false,
        reason: 'Unable to verify upload permissions. Please try again.',
        error: error.message
      };
    }
  }

  // Record a file upload
  async recordUpload(fileInfo) {
    try {
      const visitorId = await fingerprintService.getVisitorId();
      const visitorData = this.getVisitorData(visitorId);

      const uploadRecord = {
        id: Date.now().toString(),
        fileName: fileInfo.name,
        fileSize: fileInfo.size,
        fileType: fileInfo.type,
        uploadTime: new Date().toISOString(),
        visitorId: visitorId
      };

      visitorData.uploads.push(uploadRecord);
      visitorData.totalUploads = visitorData.uploads.length;

      this.saveVisitorData(visitorId, visitorData);

      console.log('Upload recorded for visitor:', visitorId, uploadRecord);

      return {
        success: true,
        uploadRecord,
        totalUploads: visitorData.totalUploads,
        remainingUploads: this.maxUploadsPerVisitor - visitorData.totalUploads
      };
    } catch (error) {
      console.error('Error recording upload:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get visitor statistics
  async getVisitorStats() {
    try {
      const visitorId = await fingerprintService.getVisitorId();
      const visitorData = this.getVisitorData(visitorId);

      return {
        visitorId,
        totalUploads: visitorData.totalUploads,
        maxUploads: this.maxUploadsPerVisitor,
        remainingUploads: Math.max(0, this.maxUploadsPerVisitor - visitorData.totalUploads),
        uploads: visitorData.uploads,
        firstVisit: visitorData.firstVisit,
        lastActivity: visitorData.lastActivity,
        canUpload: visitorData.totalUploads < this.maxUploadsPerVisitor
      };
    } catch (error) {
      console.error('Error getting visitor stats:', error);
      return {
        visitorId: 'unknown',
        totalUploads: 0,
        maxUploads: this.maxUploadsPerVisitor,
        remainingUploads: this.maxUploadsPerVisitor,
        uploads: [],
        firstVisit: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        canUpload: true,
        error: error.message
      };
    }
  }

  // Clean up old visitor data (optional, for privacy)
  cleanupOldData(daysToKeep = 30) {
    try {
      const allData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      let cleaned = 0;
      Object.keys(allData).forEach(visitorId => {
        const visitorData = allData[visitorId];
        const lastActivity = new Date(visitorData.lastActivity);
        
        if (lastActivity < cutoffDate) {
          delete allData[visitorId];
          cleaned++;
        }
      });

      localStorage.setItem(this.storageKey, JSON.stringify(allData));
      console.log(`Cleaned up ${cleaned} old visitor records`);
      
      return cleaned;
    } catch (error) {
      console.error('Error cleaning up visitor data:', error);
      return 0;
    }
  }

  // Send visitor data to backend (for server-side tracking)
  async syncWithBackend(endpoint = '/api/visitor/sync') {
    try {
      const visitorId = await fingerprintService.getVisitorId();
      const visitorInfo = await fingerprintService.getVisitorInfo();
      const stats = await this.getVisitorStats();

      const payload = {
        visitorId,
        visitorInfo,
        stats,
        timestamp: new Date().toISOString()
      };

      // This would be sent to your backend
      console.log('Would sync to backend:', payload);
      
      // Uncomment when backend is ready:
      // const response = await fetch(endpoint, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(payload)
      // });
      // 
      // if (!response.ok) {
      //   throw new Error(`Backend sync failed: ${response.statusText}`);
      // }
      // 
      // return await response.json();

      return { success: true, synced: true };
    } catch (error) {
      console.error('Error syncing with backend:', error);
      return { success: false, error: error.message };
    }
  }

  // Reset visitor data (for testing)
  async resetVisitorData() {
    try {
      const visitorId = await fingerprintService.getVisitorId();
      const allData = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      delete allData[visitorId];
      localStorage.setItem(this.storageKey, JSON.stringify(allData));
      console.log('Reset data for visitor:', visitorId);
    } catch (error) {
      console.error('Error resetting visitor data:', error);
    }
  }
}

// Create a singleton instance
const visitorTrackingService = new VisitorTrackingService();

export default visitorTrackingService;