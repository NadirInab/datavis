/**
 * Environment Utilities
 * Safe access to Vite environment variables with fallbacks and validation
 */

/**
 * Get environment variable with fallback and validation
 */
export const getEnvVar = (key, fallback = '', required = false) => {
  const value = import.meta.env[key] || fallback;
  
  if (required && !value) {
    console.error(`❌ Required environment variable ${key} is not set`);
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value;
};

/**
 * Get server URL for API and Socket.IO connections
 */
export const getServerUrl = () => {
  const serverUrl = getEnvVar('VITE_SERVER_URL', 'http://localhost:5001');
  
  // Validate URL format
  try {
    new URL(serverUrl);
    return serverUrl;
  } catch (error) {
    console.warn(`⚠️ Invalid server URL: ${serverUrl}, using fallback`);
    return 'http://localhost:5001';
  }
};

/**
 * Get API base URL
 */
export const getApiBaseUrl = () => {
  return getEnvVar('VITE_API_BASE_URL', `${getServerUrl()}/api/v1`);
};

/**
 * Check if collaboration features are enabled
 */
export const isCollaborationEnabled = () => {
  return getEnvVar('VITE_ENABLE_COLLABORATION', 'true') !== 'false';
};

/**
 * Check if debug mode is enabled
 */
export const isDebugMode = () => {
  return getEnvVar('VITE_DEBUG', 'false') === 'true';
};

/**
 * Get current environment
 */
export const getEnvironment = () => {
  return getEnvVar('VITE_NODE_ENV', import.meta.env.MODE || 'development');
};

/**
 * Check if running in development mode
 */
export const isDevelopment = () => {
  return getEnvironment() === 'development' || import.meta.env.DEV;
};

/**
 * Check if running in production mode
 */
export const isProduction = () => {
  return getEnvironment() === 'production' || import.meta.env.PROD;
};

/**
 * Log environment configuration (for debugging)
 */
export const logEnvironmentConfig = () => {
  if (isDevelopment() || isDebugMode()) {
    console.group('🔧 Environment Configuration');
    console.log('Environment:', getEnvironment());
    console.log('Server URL:', getServerUrl());
    console.log('API Base URL:', getApiBaseUrl());
    console.log('Collaboration Enabled:', isCollaborationEnabled());
    console.log('Debug Mode:', isDebugMode());
    console.log('Available Env Vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
    console.groupEnd();
  }
};

/**
 * Environment configuration object
 */
export const env = {
  serverUrl: getServerUrl(),
  apiBaseUrl: getApiBaseUrl(),
  collaborationEnabled: isCollaborationEnabled(),
  debugMode: isDebugMode(),
  environment: getEnvironment(),
  isDevelopment: isDevelopment(),
  isProduction: isProduction()
};

// Log configuration on import in development
if (isDevelopment()) {
  logEnvironmentConfig();
}

export default env;
