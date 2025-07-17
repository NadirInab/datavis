const { Server } = require('socket.io');
const logger = require('../utils/logger');
const { verifyIdToken } = require('../config/firebase');

/**
 * Real-time Collaboration Service
 * Handles multi-user data exploration sessions
 */

class CollaborationService {
  constructor() {
    this.io = null;
    this.activeSessions = new Map(); // fileId -> session data
    this.userSessions = new Map(); // userId -> session info
  }

  /**
   * Initialize Socket.IO server
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Add authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        const userId = socket.handshake.auth?.userId;
        const userEmail = socket.handshake.auth?.userEmail;

        if (!token) {
          // Allow connection without authentication for now, but log it
          logger.warn('Socket connection without authentication token');
          socket.isAuthenticated = false;
          socket.userId = userId || 'anonymous';
          socket.userEmail = userEmail || 'anonymous@temp.local';
          return next();
        }

        try {
          // Verify Firebase token
          const decodedToken = await verifyIdToken(token);
          socket.isAuthenticated = true;
          socket.userId = decodedToken.uid;
          socket.userEmail = decodedToken.email;
          socket.firebaseUser = decodedToken;

          logger.info(`Authenticated socket connection: ${decodedToken.email}`);
          next();
        } catch (authError) {
          logger.error('Socket authentication failed:', authError.message);
          socket.isAuthenticated = false;
          socket.userId = userId || 'anonymous';
          socket.userEmail = userEmail || 'anonymous@temp.local';
          // Allow connection but mark as unauthenticated
          next();
        }
      } catch (error) {
        logger.error('Socket authentication middleware error:', error);
        // Allow connection but mark as unauthenticated
        socket.isAuthenticated = false;
        socket.userId = 'anonymous';
        socket.userEmail = 'anonymous@temp.local';
        next();
      }
    });

    this.setupEventHandlers();
    logger.info('Collaboration service initialized');
  }

  /**
   * Setup Socket.IO event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`User connected: ${socket.id}`);

      // Join file collaboration session
      socket.on('join-file-session', (data) => {
        this.handleJoinSession(socket, data);
      });

      // Handle cursor movements
      socket.on('cursor-move', (data) => {
        this.handleCursorMove(socket, data);
      });

      // Handle chart interactions
      socket.on('chart-interaction', (data) => {
        this.handleChartInteraction(socket, data);
      });

      // Handle annotations
      socket.on('add-annotation', (data) => {
        this.handleAddAnnotation(socket, data);
      });

      socket.on('remove-annotation', (data) => {
        this.handleRemoveAnnotation(socket, data);
      });

      // Handle voice comments
      socket.on('add-voice-comment', (data) => {
        this.handleAddVoiceComment(socket, data);
      });

      // Cell editing
      socket.on('cell-edit-start', (data) => {
        this.handleCellEditStart(socket, data);
      });

      socket.on('cell-edit-update', (data) => {
        this.handleCellEditUpdate(socket, data);
      });

      socket.on('cell-edit-commit', (data) => {
        this.handleCellEditCommit(socket, data);
      });

      socket.on('cell-edit-cancel', (data) => {
        this.handleCellEditCancel(socket, data);
      });

      // Cell comments
      socket.on('add-cell-comment', (data) => {
        this.handleAddCellComment(socket, data);
      });

      socket.on('reply-cell-comment', (data) => {
        this.handleReplyCellComment(socket, data);
      });

      socket.on('resolve-cell-comment', (data) => {
        this.handleResolveCellComment(socket, data);
      });

      // Chat messages
      socket.on('send-chat-message', (data) => {
        this.handleSendChatMessage(socket, data);
      });

      // Follow mode
      socket.on('start-follow-mode', (data) => {
        this.handleStartFollowMode(socket, data);
      });

      socket.on('stop-follow-mode', (data) => {
        this.handleStopFollowMode(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  /**
   * Handle user joining a file collaboration session
   */
  handleJoinSession(socket, { fileId, user }) {
    try {
      // Check authentication status
      if (!socket.isAuthenticated) {
        logger.warn(`Unauthenticated user attempting to join collaboration: ${socket.userId}`);
        socket.emit('error', {
          message: 'Authentication failed. Please sign in again.',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      // Leave any existing sessions
      this.leaveAllSessions(socket);

      // Join the file room
      socket.join(`file-${fileId}`);

      // Initialize session if it doesn't exist
      if (!this.activeSessions.has(fileId)) {
        this.activeSessions.set(fileId, {
          fileId,
          users: new Map(),
          annotations: [],
          voiceComments: [],
          cellEdits: new Map(), // cellId -> edit info
          cellComments: [],
          chatMessages: [],
          followMode: null
        });
      }

      const session = this.activeSessions.get(fileId);

      // Use authenticated user data
      const userData = {
        id: socket.userId,
        name: user.name || socket.userEmail?.split('@')[0] || 'Anonymous',
        email: socket.userEmail,
        avatar: user.avatar,
        color: this.generateUserColor(socket.userId),
        cursor: { x: 0, y: 0 },
        activeChart: null,
        isFollowing: false,
        socketId: socket.id,
        isAuthenticated: socket.isAuthenticated
      };

      session.users.set(socket.userId, userData);
      this.userSessions.set(socket.id, { fileId, userId: socket.userId });

      // Notify other users
      socket.to(`file-${fileId}`).emit('user-joined', userData);

      // Send current session state to new user
      socket.emit('session-state', {
        users: Array.from(session.users.values()).filter(u => u.id !== socket.userId),
        annotations: session.annotations,
        voiceComments: session.voiceComments,
        followMode: session.followMode
      });

      logger.info(`User ${socket.userId} (${socket.userEmail}) joined file session ${fileId}`);
    } catch (error) {
      logger.error('Error joining session:', error);
      socket.emit('error', { message: 'Failed to join collaboration session' });
    }
  }

  /**
   * Handle cursor movement
   */
  handleCursorMove(socket, { x, y, chartId }) {
    const sessionInfo = this.userSessions.get(socket.id);
    if (!sessionInfo) return;

    const session = this.activeSessions.get(sessionInfo.fileId);
    if (!session) return;

    const user = session.users.get(sessionInfo.userId);
    if (!user) return;

    // Update user cursor position
    user.cursor = { x, y };
    user.activeChart = chartId;

    // Broadcast to other users in the session
    socket.to(`file-${sessionInfo.fileId}`).emit('cursor-update', {
      userId: user.id,
      cursor: { x, y },
      chartId,
      userColor: user.color
    });
  }

  /**
   * Handle chart interactions (hover, click, etc.)
   */
  handleChartInteraction(socket, { type, chartId, dataPoint, position }) {
    const sessionInfo = this.userSessions.get(socket.id);
    if (!sessionInfo) return;

    const session = this.activeSessions.get(sessionInfo.fileId);
    if (!session) return;

    const user = session.users.get(sessionInfo.userId);
    if (!user) return;

    // Broadcast interaction to other users
    socket.to(`file-${sessionInfo.fileId}`).emit('chart-interaction', {
      userId: user.id,
      userName: user.name,
      userColor: user.color,
      type,
      chartId,
      dataPoint,
      position
    });
  }

  /**
   * Handle adding annotations
   */
  handleAddAnnotation(socket, { chartId, position, text, type = 'note' }) {
    const sessionInfo = this.userSessions.get(socket.id);
    if (!sessionInfo) return;

    const session = this.activeSessions.get(sessionInfo.fileId);
    if (!session) return;

    const user = session.users.get(sessionInfo.userId);
    if (!user) return;

    const annotation = {
      id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chartId,
      position,
      text,
      type,
      author: {
        id: user.id,
        name: user.name,
        color: user.color
      },
      createdAt: new Date().toISOString()
    };

    session.annotations.push(annotation);

    // Broadcast to all users in session
    this.io.to(`file-${sessionInfo.fileId}`).emit('annotation-added', annotation);
  }

  /**
   * Handle removing annotations
   */
  handleRemoveAnnotation(socket, { annotationId }) {
    const sessionInfo = this.userSessions.get(socket.id);
    if (!sessionInfo) return;

    const session = this.activeSessions.get(sessionInfo.fileId);
    if (!session) return;

    const user = session.users.get(sessionInfo.userId);
    if (!user) return;

    // Find and remove annotation (only author can remove)
    const annotationIndex = session.annotations.findIndex(
      a => a.id === annotationId && a.author.id === user.id
    );

    if (annotationIndex !== -1) {
      session.annotations.splice(annotationIndex, 1);
      this.io.to(`file-${sessionInfo.fileId}`).emit('annotation-removed', { annotationId });
    }
  }

  /**
   * Handle adding voice comments
   */
  handleAddVoiceComment(socket, { chartId, position, audioBlob, duration }) {
    const sessionInfo = this.userSessions.get(socket.id);
    if (!sessionInfo) return;

    const session = this.activeSessions.get(sessionInfo.fileId);
    if (!session) return;

    const user = session.users.get(sessionInfo.userId);
    if (!user) return;

    const voiceComment = {
      id: `voice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chartId,
      position,
      audioBlob,
      duration,
      author: {
        id: user.id,
        name: user.name,
        color: user.color
      },
      createdAt: new Date().toISOString()
    };

    session.voiceComments.push(voiceComment);

    // Broadcast to all users in session
    this.io.to(`file-${sessionInfo.fileId}`).emit('voice-comment-added', voiceComment);
  }

  /**
   * Handle follow mode
   */
  handleStartFollowMode(socket, { leaderId }) {
    const sessionInfo = this.userSessions.get(socket.id);
    if (!sessionInfo) return;

    const session = this.activeSessions.get(sessionInfo.fileId);
    if (!session) return;

    const user = session.users.get(sessionInfo.userId);
    if (!user) return;

    user.isFollowing = leaderId;

    // Notify the leader
    const leaderUser = Array.from(session.users.values()).find(u => u.id === leaderId);
    if (leaderUser) {
      this.io.to(leaderUser.socketId).emit('follower-joined', {
        followerId: user.id,
        followerName: user.name
      });
    }

    socket.emit('follow-mode-started', { leaderId });
  }

  handleStopFollowMode(socket) {
    const sessionInfo = this.userSessions.get(socket.id);
    if (!sessionInfo) return;

    const session = this.activeSessions.get(sessionInfo.fileId);
    if (!session) return;

    const user = session.users.get(sessionInfo.userId);
    if (!user) return;

    const leaderId = user.isFollowing;
    user.isFollowing = false;

    // Notify the leader
    if (leaderId) {
      const leaderUser = Array.from(session.users.values()).find(u => u.id === leaderId);
      if (leaderUser) {
        this.io.to(leaderUser.socketId).emit('follower-left', {
          followerId: user.id
        });
      }
    }

    socket.emit('follow-mode-stopped');
  }

  /**
   * Handle user disconnect
   */
  handleDisconnect(socket) {
    const sessionInfo = this.userSessions.get(socket.id);
    if (!sessionInfo) return;

    const session = this.activeSessions.get(sessionInfo.fileId);
    if (session) {
      const user = session.users.get(sessionInfo.userId);
      if (user) {
        // Notify other users
        socket.to(`file-${sessionInfo.fileId}`).emit('user-left', {
          userId: user.id
        });

        // Remove user from session
        session.users.delete(sessionInfo.userId);

        // Clean up empty sessions
        if (session.users.size === 0) {
          this.activeSessions.delete(sessionInfo.fileId);
        }
      }
    }

    this.userSessions.delete(socket.id);
    logger.info(`User disconnected: ${socket.id}`);
  }

  /**
   * Utility methods
   */
  leaveAllSessions(socket) {
    const sessionInfo = this.userSessions.get(socket.id);
    if (sessionInfo) {
      socket.leave(`file-${sessionInfo.fileId}`);
      this.handleDisconnect(socket);
    }
  }

  generateUserColor(userId) {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Handle cell edit start
   */
  handleCellEditStart(socket, { cellId, row, column }) {
    const sessionInfo = this.userSessions.get(socket.id);
    if (!sessionInfo) return;

    const session = this.activeSessions.get(sessionInfo.fileId);
    if (!session) return;

    const user = session.users.get(sessionInfo.userId);
    if (!user) return;

    // Check if cell is already being edited
    if (session.cellEdits.has(cellId)) {
      const existingEdit = session.cellEdits.get(cellId);
      socket.emit('cell-edit-conflict', {
        cellId,
        editedBy: existingEdit.user
      });
      return;
    }

    // Lock cell for editing
    session.cellEdits.set(cellId, {
      user: {
        id: user.id,
        name: user.name,
        color: user.color
      },
      startTime: new Date(),
      row,
      column
    });

    // Broadcast to other users
    socket.to(`file-${sessionInfo.fileId}`).emit('cell-edit-started', {
      cellId,
      row,
      column,
      user: {
        id: user.id,
        name: user.name,
        color: user.color
      }
    });
  }

  /**
   * Handle cell edit update (live typing)
   */
  handleCellEditUpdate(socket, { cellId, value, row, column }) {
    const sessionInfo = this.userSessions.get(socket.id);
    if (!sessionInfo) return;

    const session = this.activeSessions.get(sessionInfo.fileId);
    if (!session) return;

    const user = session.users.get(sessionInfo.userId);
    if (!user) return;

    // Verify user owns this edit
    const cellEdit = session.cellEdits.get(cellId);
    if (!cellEdit || cellEdit.user.id !== user.id) return;

    // Broadcast live update to other users
    socket.to(`file-${sessionInfo.fileId}`).emit('cell-edit-updated', {
      cellId,
      value,
      row,
      column,
      user: {
        id: user.id,
        name: user.name,
        color: user.color
      }
    });
  }

  /**
   * Handle cell edit commit
   */
  async handleCellEditCommit(socket, { cellId, value, oldValue, row, column }) {
    const sessionInfo = this.userSessions.get(socket.id);
    if (!sessionInfo) return;

    const session = this.activeSessions.get(sessionInfo.fileId);
    if (!session) return;

    const user = session.users.get(sessionInfo.userId);
    if (!user) return;

    // Verify user owns this edit
    const cellEdit = session.cellEdits.get(cellId);
    if (!cellEdit || cellEdit.user.id !== user.id) return;

    try {
      // Update database
      const File = require('../models/File');
      const file = await File.findById(sessionInfo.fileId);
      if (file) {
        file.updateCellValue(row, column, oldValue, value, {
          id: user.id,
          name: user.name,
          sessionId: socket.id
        });
        await file.save();
      }

      // Release cell lock
      session.cellEdits.delete(cellId);

      // Broadcast commit to all users
      this.io.to(`file-${sessionInfo.fileId}`).emit('cell-edit-committed', {
        cellId,
        value,
        row,
        column,
        user: {
          id: user.id,
          name: user.name,
          color: user.color
        }
      });

    } catch (error) {
      logger.error('Cell edit commit error:', error);
      socket.emit('cell-edit-error', {
        cellId,
        error: 'Failed to save changes'
      });
    }
  }

  /**
   * Handle cell edit cancel
   */
  handleCellEditCancel(socket, { cellId }) {
    const sessionInfo = this.userSessions.get(socket.id);
    if (!sessionInfo) return;

    const session = this.activeSessions.get(sessionInfo.fileId);
    if (!session) return;

    const user = session.users.get(sessionInfo.userId);
    if (!user) return;

    // Verify user owns this edit
    const cellEdit = session.cellEdits.get(cellId);
    if (!cellEdit || cellEdit.user.id !== user.id) return;

    // Release cell lock
    session.cellEdits.delete(cellId);

    // Broadcast cancel to other users
    socket.to(`file-${sessionInfo.fileId}`).emit('cell-edit-cancelled', {
      cellId,
      user: {
        id: user.id,
        name: user.name
      }
    });
  }

  /**
   * Handle add cell comment
   */
  async handleAddCellComment(socket, { row, column, text }) {
    const sessionInfo = this.userSessions.get(socket.id);
    if (!sessionInfo) return;

    const session = this.activeSessions.get(sessionInfo.fileId);
    if (!session) return;

    const user = session.users.get(sessionInfo.userId);
    if (!user) return;

    try {
      // Add to database
      const File = require('../models/File');
      const file = await File.findById(sessionInfo.fileId);
      if (file) {
        const comment = file.addCellComment(row, column, text, {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        });
        await file.save();

        // Broadcast to all users
        this.io.to(`file-${sessionInfo.fileId}`).emit('cell-comment-added', comment);
      }
    } catch (error) {
      logger.error('Add cell comment error:', error);
      socket.emit('error', { message: 'Failed to add comment' });
    }
  }

  /**
   * Handle reply to cell comment
   */
  async handleReplyCellComment(socket, { commentId, text }) {
    const sessionInfo = this.userSessions.get(socket.id);
    if (!sessionInfo) return;

    const session = this.activeSessions.get(sessionInfo.fileId);
    if (!session) return;

    const user = session.users.get(sessionInfo.userId);
    if (!user) return;

    try {
      // Add to database
      const File = require('../models/File');
      const file = await File.findById(sessionInfo.fileId);
      if (file) {
        const reply = file.addCommentReply(commentId, text, {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        });
        await file.save();

        if (reply) {
          // Broadcast to all users
          this.io.to(`file-${sessionInfo.fileId}`).emit('cell-comment-reply-added', {
            commentId,
            reply
          });
        }
      }
    } catch (error) {
      logger.error('Reply cell comment error:', error);
      socket.emit('error', { message: 'Failed to add reply' });
    }
  }

  /**
   * Handle resolve cell comment
   */
  async handleResolveCellComment(socket, { commentId, resolved }) {
    const sessionInfo = this.userSessions.get(socket.id);
    if (!sessionInfo) return;

    try {
      // Update database
      const File = require('../models/File');
      const file = await File.findById(sessionInfo.fileId);
      if (file) {
        const comment = file.cellComments.id(commentId);
        if (comment) {
          comment.resolved = resolved;
          comment.updatedAt = new Date();
          await file.save();

          // Broadcast to all users
          this.io.to(`file-${sessionInfo.fileId}`).emit('cell-comment-resolved', {
            commentId,
            resolved
          });
        }
      }
    } catch (error) {
      logger.error('Resolve cell comment error:', error);
      socket.emit('error', { message: 'Failed to resolve comment' });
    }
  }

  /**
   * Handle send chat message
   */
  handleSendChatMessage(socket, { message }) {
    const sessionInfo = this.userSessions.get(socket.id);
    if (!sessionInfo) return;

    const session = this.activeSessions.get(sessionInfo.fileId);
    if (!session) return;

    const user = session.users.get(sessionInfo.userId);
    if (!user) return;

    const chatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      user: {
        id: user.id,
        name: user.name,
        color: user.color,
        avatar: user.avatar
      },
      timestamp: new Date().toISOString()
    };

    // Add to session
    session.chatMessages.push(chatMessage);

    // Keep only last 100 messages
    if (session.chatMessages.length > 100) {
      session.chatMessages = session.chatMessages.slice(-100);
    }

    // Broadcast to all users
    this.io.to(`file-${sessionInfo.fileId}`).emit('chat-message-received', chatMessage);
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    return {
      activeSessions: this.activeSessions.size,
      totalUsers: this.userSessions.size,
      sessions: Array.from(this.activeSessions.entries()).map(([fileId, session]) => ({
        fileId,
        userCount: session.users.size,
        annotationCount: session.annotations.length,
        voiceCommentCount: session.voiceComments.length,
        cellCommentsCount: session.cellComments.length,
        activeCellEdits: session.cellEdits.size,
        chatMessagesCount: session.chatMessages.length
      }))
    };
  }
}

// Create singleton instance
const collaborationService = new CollaborationService();

module.exports = collaborationService;
