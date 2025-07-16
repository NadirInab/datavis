#!/usr/bin/env node

/**
 * Development Server Startup Script
 * Helps diagnose and start the backend server with proper error handling
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Check if port 5001 is available
const checkPort = (port) => {
  return new Promise((resolve) => {
    const server = http.createServer();
    
    server.listen(port, () => {
      server.close(() => {
        resolve(true); // Port is available
      });
    });
    
    server.on('error', () => {
      resolve(false); // Port is in use
    });
  });
};

// Check if server is responding
const checkServerHealth = async (port = 5001, maxAttempts = 10) => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`http://localhost:${port}/api/v1/health`);
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Server not ready yet, wait and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
};

// Main startup function
async function startServer() {
  log('cyan', '🚀 Starting CSV Dashboard Backend Server...\n');
  
  // Check if port is available
  log('blue', '📡 Checking port 5001 availability...');
  const portAvailable = await checkPort(5001);
  
  if (!portAvailable) {
    log('yellow', '⚠️  Port 5001 is already in use.');
    log('yellow', '   This might mean the server is already running.');
    log('blue', '🔍 Checking if server is responding...');
    
    const isHealthy = await checkServerHealth(5001, 3);
    if (isHealthy) {
      log('green', '✅ Backend server is already running and healthy!');
      log('green', '   Server URL: http://localhost:5001');
      log('green', '   Health check: http://localhost:5001/api/v1/health');
      return;
    } else {
      log('red', '❌ Port 5001 is occupied but server is not responding.');
      log('red', '   Please kill the process using port 5001 and try again.');
      process.exit(1);
    }
  }
  
  log('green', '✅ Port 5001 is available');
  
  // Check if we're in the backend directory
  const currentDir = process.cwd();
  const isBackendDir = currentDir.includes('backend') || 
                      require('fs').existsSync(path.join(currentDir, 'src', 'server.js'));
  
  if (!isBackendDir) {
    log('yellow', '⚠️  Not in backend directory. Attempting to change to backend folder...');
    try {
      process.chdir(path.join(__dirname));
      log('green', '✅ Changed to backend directory');
    } catch (error) {
      log('red', '❌ Could not find backend directory. Please run this from the backend folder.');
      process.exit(1);
    }
  }
  
  // Start the server
  log('blue', '🔄 Starting Node.js server...');
  
  const serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: '5001'
    }
  });
  
  // Handle server process events
  serverProcess.on('error', (error) => {
    log('red', `❌ Failed to start server: ${error.message}`);
    process.exit(1);
  });
  
  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      log('red', `❌ Server exited with code ${code}`);
    } else {
      log('yellow', '👋 Server stopped');
    }
  });
  
  // Wait a moment then check if server started successfully
  setTimeout(async () => {
    log('blue', '🔍 Verifying server startup...');
    const isHealthy = await checkServerHealth(5001, 5);
    
    if (isHealthy) {
      log('green', '\n🎉 Backend server started successfully!');
      log('green', '   Server URL: http://localhost:5001');
      log('green', '   Health check: http://localhost:5001/api/v1/health');
      log('green', '   Socket.IO: http://localhost:5001/socket.io/');
      log('cyan', '\n📱 You can now start the frontend with: npm run dev (in client folder)');
    } else {
      log('yellow', '⚠️  Server started but health check failed.');
      log('yellow', '   Check the server logs above for any errors.');
    }
  }, 3000);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('yellow', '\n👋 Shutting down server...');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('yellow', '\n👋 Shutting down server...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
}

// Run the startup script
if (require.main === module) {
  startServer().catch((error) => {
    log('red', `❌ Startup failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { startServer, checkPort, checkServerHealth };
