import { getServerUrl } from './environment';

/**
 * Server Status Checker
 * Helps diagnose backend connectivity issues
 */

/**
 * Check if backend server is running
 */
export const checkServerStatus = async () => {
  const serverUrl = getServerUrl();
  
  try {
    const response = await fetch(`${serverUrl}/api/v1/health`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        isRunning: true,
        status: 'healthy',
        data,
        url: serverUrl
      };
    } else {
      return {
        isRunning: false,
        status: 'unhealthy',
        error: `Server responded with status ${response.status}`,
        url: serverUrl
      };
    }
  } catch (error) {
    return {
      isRunning: false,
      status: 'unreachable',
      error: error.message,
      url: serverUrl
    };
  }
};

/**
 * Check Socket.IO endpoint specifically
 */
export const checkSocketIOStatus = async () => {
  const serverUrl = getServerUrl();
  
  try {
    // Try to access the Socket.IO endpoint info
    const response = await fetch(`${serverUrl}/socket.io/`, {
      method: 'GET',
      timeout: 5000
    });
    
    return {
      isAvailable: response.status !== 404,
      status: response.status,
      url: `${serverUrl}/socket.io/`
    };
  } catch (error) {
    return {
      isAvailable: false,
      error: error.message,
      url: `${serverUrl}/socket.io/`
    };
  }
};

/**
 * Comprehensive server diagnostics
 */
export const runServerDiagnostics = async () => {
  console.log('🔍 Running server diagnostics...');
  
  const serverStatus = await checkServerStatus();
  const socketStatus = await checkSocketIOStatus();
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    server: serverStatus,
    socketIO: socketStatus,
    recommendations: []
  };
  
  // Generate recommendations
  if (!serverStatus.isRunning) {
    diagnostics.recommendations.push({
      type: 'error',
      message: 'Backend server is not running',
      action: 'Start the backend server with: cd backend && npm run dev'
    });
  }
  
  if (!socketStatus.isAvailable) {
    diagnostics.recommendations.push({
      type: 'warning',
      message: 'Socket.IO endpoint not available',
      action: 'Ensure collaboration service is initialized in the backend'
    });
  }
  
  if (serverStatus.isRunning && socketStatus.isAvailable) {
    diagnostics.recommendations.push({
      type: 'success',
      message: 'All services are running correctly',
      action: 'Collaboration features should work normally'
    });
  }
  
  // Log diagnostics
  console.group('🔍 Server Diagnostics Results');
  console.log('Server Status:', serverStatus);
  console.log('Socket.IO Status:', socketStatus);
  console.log('Recommendations:', diagnostics.recommendations);
  console.groupEnd();
  
  return diagnostics;
};

/**
 * Auto-run diagnostics when collaboration fails
 */
export const autoRunDiagnostics = () => {
  if (import.meta.env.DEV) {
    setTimeout(() => {
      runServerDiagnostics();
    }, 2000);
  }
};

export default {
  checkServerStatus,
  checkSocketIOStatus,
  runServerDiagnostics,
  autoRunDiagnostics
};
