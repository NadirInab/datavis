import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/FirebaseAuthContext';
import { getServerUrl, isCollaborationEnabled, isDevelopment } from '../utils/environment';
import { autoRunDiagnostics } from '../utils/serverStatus';

/**
 * Real-time Collaboration Hook
 * Manages WebSocket connection and collaboration state
 */
export const useCollaboration = (fileId) => {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [voiceComments, setVoiceComments] = useState([]);
  const [cursors, setCursors] = useState(new Map());
  const [followMode, setFollowMode] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!fileId || !currentUser) return;

    // Check if collaboration is enabled
    if (!isCollaborationEnabled()) {
      console.log('🔒 Collaboration features disabled via environment variable');
      return;
    }

    // Get server URL from environment utilities
    const serverUrl = getServerUrl();

    if (isDevelopment()) {
      console.log('🔗 Connecting to collaboration server:', serverUrl);
    }

    let newSocket;

    // Initialize socket with authentication
    const initializeSocketWithAuth = async () => {
      try {
        let authToken = null;

        // Try to get Firebase ID token for authentication
        if (currentUser) {
          try {
            // Get token from Firebase auth directly
            const { getAuth } = await import('firebase/auth');
            const auth = getAuth();
            const firebaseUser = auth.currentUser;

            if (firebaseUser) {
              authToken = await firebaseUser.getIdToken();
              console.log('🔑 Got Firebase token for Socket.IO connection');
            } else {
              console.warn('⚠️ No Firebase user found for Socket.IO authentication');
            }
          } catch (tokenError) {
            console.warn('⚠️ Failed to get Firebase token:', tokenError.message);
          }
        }

        // Enhanced Socket.IO configuration with authentication
        newSocket = io(serverUrl, {
          transports: ['polling', 'websocket'], // Start with polling for better compatibility
          timeout: 10000, // Reduced timeout for faster failure detection
          forceNew: true,
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 3, // Reduced attempts to fail faster
          reconnectionDelay: 2000,
          reconnectionDelayMax: 5000,
          maxReconnectionAttempts: 3,
          upgrade: true,
          rememberUpgrade: false,
          // Additional options for better reliability
          withCredentials: true,
          auth: {
            token: authToken,
            userId: currentUser?.uid || currentUser?.id,
            userEmail: currentUser?.email
          },
          extraHeaders: {
            'Access-Control-Allow-Origin': '*',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
          }
        });

        return newSocket;
      } catch (error) {
        console.error('❌ Failed to initialize Socket.IO:', error);
        if (isDevelopment()) {
          console.warn('💡 Make sure the backend server is running on port 5001');
          autoRunDiagnostics();
        }
        return null;
      }
    };

    // Initialize socket with authentication
    initializeSocketWithAuth().then((socket) => {
      if (!socket) return;
      newSocket = socket;

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('🔗 Connected to collaboration server');
        setIsConnected(true);

        // Join the file collaboration session
        newSocket.emit('join-file-session', {
          fileId,
          user: {
            id: currentUser.uid || currentUser.id,
            name: currentUser.displayName || currentUser.name || currentUser.email,
            email: currentUser.email,
            avatar: currentUser.photoURL || currentUser.avatar
          }
        });
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from collaboration server:', reason);
        setIsConnected(false);

        // Handle different disconnect reasons
        if (reason === 'io server disconnect') {
          console.warn('💡 Server disconnected the client. Attempting to reconnect...');
        } else if (reason === 'transport close') {
          console.warn('💡 Transport connection closed. Will attempt to reconnect.');
        }

        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (socketRef.current) {
            socketRef.current.connect();
          }
        }, 3000);
      });

      // Add reconnection handlers
      newSocket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
      });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Reconnection attempt ${attemptNumber}`);
      });

      newSocket.on('reconnect_failed', () => {
        console.error('❌ Failed to reconnect to collaboration server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('🚨 Socket.IO Connection error:', error);
        setIsConnected(false);

        // Enhanced error handling with specific error types
        if (error.message?.includes('ECONNREFUSED') || error.type === 'TransportError') {
          console.warn('💡 Backend server connection failed. Possible causes:');
          console.warn('   - Backend server not running on port 5001');
          console.warn('   - Network connectivity issues');
          console.warn('   - Firewall blocking the connection');

          // Auto-run diagnostics in development
          if (isDevelopment()) {
            console.warn('🔍 Running automatic diagnostics...');
            autoRunDiagnostics();
          }
        } else if (error.message?.includes('CORS')) {
          console.warn('💡 CORS error detected. Check server CORS configuration.');
        } else if (error.type === 'TransportError') {
          if (error.description?.includes('xhr poll error')) {
            console.warn('💡 XHR polling failed. This usually means the backend server is not accessible.');
            console.warn('   - Check if backend server is running: npm run dev (in backend folder)');
            console.warn('   - Verify server is listening on port 5001');
          } else if (error.description?.includes('websocket')) {
            console.warn('💡 WebSocket connection failed, will try polling transport.');
          }
        } else {
          console.warn('💡 Unknown connection error:', error.type, error.description);
        }
      });

      // Collaboration event handlers
      newSocket.on('session-state', (state) => {
        console.log('📊 Received session state:', state);
        setCollaborators(state.users || []);
        setAnnotations(state.annotations || []);
        setVoiceComments(state.voiceComments || []);
        setFollowMode(state.followMode);
      });

      newSocket.on('user-joined', (user) => {
        console.log('👋 User joined:', user.name);
        setCollaborators(prev => [...prev, user]);
      });

      newSocket.on('user-left', ({ userId }) => {
        console.log('👋 User left:', userId);
        setCollaborators(prev => prev.filter(u => u.id !== userId));
        setCursors(prev => {
          const newCursors = new Map(prev);
          newCursors.delete(userId);
          return newCursors;
        });
      });

      newSocket.on('cursor-update', ({ userId, cursor, chartId, userColor }) => {
        setCursors(prev => {
          const newCursors = new Map(prev);
          newCursors.set(userId, { cursor, chartId, userColor });
          return newCursors;
        });
      });

      newSocket.on('chart-interaction', (interaction) => {
        // Handle chart interactions from other users
        console.log('📊 Chart interaction:', interaction);
      });

      newSocket.on('annotation-added', (annotation) => {
        setAnnotations(prev => [...prev, annotation]);
      });

      newSocket.on('annotation-removed', ({ annotationId }) => {
        setAnnotations(prev => prev.filter(a => a.id !== annotationId));
      });

      newSocket.on('voice-comment-added', (voiceComment) => {
        setVoiceComments(prev => [...prev, voiceComment]);
      });

      newSocket.on('follower-joined', ({ followerId, followerName }) => {
        console.log(`👥 ${followerName} is now following you`);
      });

      newSocket.on('follower-left', ({ followerId }) => {
        console.log('👥 Follower stopped following');
      });

      newSocket.on('follow-mode-started', ({ leaderId }) => {
        setIsFollowing(true);
        setFollowMode(leaderId);
      });

      newSocket.on('follow-mode-stopped', () => {
        setIsFollowing(false);
        setFollowMode(null);
      });

      newSocket.on('error', (error) => {
        console.error('🚨 Collaboration error:', error);
        // Check for authentication errors
        if (error.message?.includes('Authentication') || error.message?.includes('Unauthorized')) {
          console.error('🔐 Authentication failed for collaboration. Please sign in again.');
        }
      });
    }).catch((error) => {
      console.error('❌ Failed to initialize collaboration:', error);
    });

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [fileId, currentUser]);

  // Collaboration actions
  const sendCursorMove = useCallback((x, y, chartId) => {
    if (socket && isConnected) {
      socket.emit('cursor-move', { x, y, chartId });
    }
  }, [socket, isConnected]);

  const sendChartInteraction = useCallback((type, chartId, dataPoint, position) => {
    if (socket && isConnected) {
      socket.emit('chart-interaction', { type, chartId, dataPoint, position });
    }
  }, [socket, isConnected]);

  const addAnnotation = useCallback((chartId, position, text, type = 'note') => {
    if (socket && isConnected) {
      socket.emit('add-annotation', { chartId, position, text, type });
    }
  }, [socket, isConnected]);

  const removeAnnotation = useCallback((annotationId) => {
    if (socket && isConnected) {
      socket.emit('remove-annotation', { annotationId });
    }
  }, [socket, isConnected]);

  const addVoiceComment = useCallback((chartId, position, audioBlob, duration) => {
    if (socket && isConnected) {
      socket.emit('add-voice-comment', { chartId, position, audioBlob, duration });
    }
  }, [socket, isConnected]);

  const startFollowMode = useCallback((leaderId) => {
    if (socket && isConnected) {
      socket.emit('start-follow-mode', { leaderId });
    }
  }, [socket, isConnected]);

  const stopFollowMode = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('stop-follow-mode');
    }
  }, [socket, isConnected]);

  return {
    // Connection state
    isConnected,
    socket,
    
    // Collaboration data
    collaborators,
    annotations,
    voiceComments,
    cursors,
    followMode,
    isFollowing,
    
    // Actions
    sendCursorMove,
    sendChartInteraction,
    addAnnotation,
    removeAnnotation,
    addVoiceComment,
    startFollowMode,
    stopFollowMode
  };
};
