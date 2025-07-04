const logger = require('../utils/logger');

// In-memory visitor session storage (in production, use Redis)
const visitorSessions = new Map();

// Session cleanup interval (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

class VisitorSessionService {
  constructor() {
    // Start cleanup interval
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, CLEANUP_INTERVAL);
  }

  /**
   * Get or create visitor session
   * @param {string} sessionId - Unique session identifier
   * @returns {Object} Session data
   */
  getSession(sessionId) {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    let session = visitorSessions.get(sessionId);
    
    if (!session) {
      // Create new session
      session = {
        sessionId,
        filesUploaded: 0,
        fileLimit: 3, // Visitor limit
        createdAt: new Date(),
        lastActivity: new Date(),
        features: [
          'csv_upload',
          'google_sheets_import', 
          'basic_charts',
          'chart_export_png',
          'data_preview'
        ],
        uploadHistory: []
      };
      
      visitorSessions.set(sessionId, session);
      logger.info(`Created new visitor session: ${sessionId}`);
    } else {
      // Update last activity
      session.lastActivity = new Date();
      visitorSessions.set(sessionId, session);
    }

    return {
      ...session,
      remainingFiles: Math.max(0, session.fileLimit - session.filesUploaded),
      isLimitReached: session.filesUploaded >= session.fileLimit
    };
  }

  /**
   * Update session data
   * @param {string} sessionId - Session identifier
   * @param {Object} updates - Data to update
   * @returns {Object} Updated session data
   */
  updateSession(sessionId, updates) {
    const session = this.getSession(sessionId);
    
    Object.assign(session, updates, {
      lastActivity: new Date()
    });
    
    visitorSessions.set(sessionId, session);
    
    return {
      ...session,
      remainingFiles: Math.max(0, session.fileLimit - session.filesUploaded),
      isLimitReached: session.filesUploaded >= session.fileLimit
    };
  }

  /**
   * Record file upload for visitor
   * @param {string} sessionId - Session identifier
   * @param {Object} fileInfo - File information
   * @returns {Object} Updated session data
   */
  recordFileUpload(sessionId, fileInfo) {
    const session = this.getSession(sessionId);
    
    if (session.filesUploaded >= session.fileLimit) {
      throw new Error('Upload limit reached. Please create a free account to continue.');
    }

    session.filesUploaded += 1;
    session.uploadHistory.push({
      fileName: fileInfo.fileName,
      fileSize: fileInfo.fileSize,
      uploadedAt: new Date(),
      fileType: fileInfo.fileType
    });
    
    return this.updateSession(sessionId, session);
  }

  /**
   * Check if visitor can upload more files
   * @param {string} sessionId - Session identifier
   * @returns {boolean} Can upload
   */
  canUpload(sessionId) {
    const session = this.getSession(sessionId);
    return session.filesUploaded < session.fileLimit;
  }

  /**
   * Get upload statistics for visitor
   * @param {string} sessionId - Session identifier
   * @returns {Object} Upload stats
   */
  getUploadStats(sessionId) {
    const session = this.getSession(sessionId);
    
    return {
      filesUploaded: session.filesUploaded,
      fileLimit: session.fileLimit,
      remainingFiles: Math.max(0, session.fileLimit - session.filesUploaded),
      isLimitReached: session.filesUploaded >= session.fileLimit,
      uploadHistory: session.uploadHistory
    };
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, session] of visitorSessions.entries()) {
      const timeSinceLastActivity = now - new Date(session.lastActivity);
      
      if (timeSinceLastActivity > SESSION_TIMEOUT) {
        visitorSessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired visitor sessions`);
    }
  }

  /**
   * Get session count for monitoring
   * @returns {number} Active session count
   */
  getActiveSessionCount() {
    return visitorSessions.size;
  }

  /**
   * Transfer visitor data to user account
   * @param {string} sessionId - Visitor session ID
   * @param {string} userId - New user ID
   * @returns {Object} Transferred data
   */
  transferToUserAccount(sessionId, userId) {
    const session = this.getSession(sessionId);
    
    const transferData = {
      uploadHistory: session.uploadHistory,
      filesUploaded: session.filesUploaded,
      sessionDuration: new Date() - new Date(session.createdAt),
      transferredAt: new Date()
    };

    // Remove visitor session after transfer
    visitorSessions.delete(sessionId);
    
    logger.info(`Transferred visitor session ${sessionId} to user ${userId}`);
    
    return transferData;
  }

  /**
   * Get all sessions (for admin monitoring)
   * @returns {Array} All active sessions
   */
  getAllSessions() {
    return Array.from(visitorSessions.entries()).map(([sessionId, session]) => ({
      sessionId,
      ...session,
      remainingFiles: Math.max(0, session.fileLimit - session.filesUploaded),
      isLimitReached: session.filesUploaded >= session.fileLimit
    }));
  }

  /**
   * Delete specific session
   * @param {string} sessionId - Session to delete
   */
  deleteSession(sessionId) {
    const deleted = visitorSessions.delete(sessionId);
    if (deleted) {
      logger.info(`Deleted visitor session: ${sessionId}`);
    }
    return deleted;
  }
}

// Export singleton instance
module.exports = new VisitorSessionService();
