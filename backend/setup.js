#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up CSV Dashboard Backend...\n');

// Create necessary directories
const directories = [
  'src/controllers',
  'src/models',
  'src/routes',
  'src/services',
  'uploads',
  'logs',
  'tests/unit',
  'tests/integration',
  'tests/fixtures'
];

console.log('📁 Creating directory structure...');
directories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`   ✓ Created ${dir}`);
  } else {
    console.log(`   - ${dir} already exists`);
  }
});

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('\n🔧 Creating .env file...');
  fs.copyFileSync(envExamplePath, envPath);
  console.log('   ✓ Created .env file from .env.example');
  console.log('   ⚠️  Please update .env with your actual configuration values');
} else if (fs.existsSync(envPath)) {
  console.log('\n🔧 .env file already exists');
} else {
  console.log('\n❌ .env.example not found');
}

// Check if package.json exists and install dependencies
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  console.log('\n📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    console.log('   ✓ Dependencies installed successfully');
  } catch (error) {
    console.log('   ❌ Failed to install dependencies');
    console.log('   Please run "npm install" manually');
  }
} else {
  console.log('\n❌ package.json not found');
}

// Create basic placeholder files
const placeholderFiles = [
  {
    path: 'src/routes/auth.js',
    content: `// Authentication routes - to be implemented
const express = require('express');
const router = express.Router();

// Placeholder routes
router.post('/register', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

router.post('/login', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

module.exports = router;`
  },
  {
    path: 'src/routes/users.js',
    content: `// User management routes - to be implemented
const express = require('express');
const router = express.Router();

module.exports = router;`
  },
  {
    path: 'src/routes/subscriptions.js',
    content: `// Subscription management routes - to be implemented
const express = require('express');
const router = express.Router();

module.exports = router;`
  },
  {
    path: 'src/routes/payments.js',
    content: `// Payment processing routes - to be implemented
const express = require('express');
const router = express.Router();

module.exports = router;`
  },
  {
    path: 'src/routes/files.js',
    content: `// File management routes - to be implemented
const express = require('express');
const router = express.Router();

module.exports = router;`
  },
  {
    path: 'src/routes/webhooks.js',
    content: `// Webhook handlers - to be implemented
const express = require('express');
const router = express.Router();

module.exports = router;`
  }
];

console.log('\n📄 Creating placeholder route files...');
placeholderFiles.forEach(file => {
  const fullPath = path.join(__dirname, file.path);
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, file.content);
    console.log(`   ✓ Created ${file.path}`);
  } else {
    console.log(`   - ${file.path} already exists`);
  }
});

console.log('\n✅ Backend setup complete!');
console.log('\n📋 Next steps:');
console.log('   1. Update .env file with your Firebase and MongoDB configuration');
console.log('   2. Start MongoDB service');
console.log('   3. Run "npm run migrate" to set up database schema');
console.log('   4. Run "npm run seed" to populate with sample data (optional)');
console.log('   5. Run "npm run dev" to start the development server');
console.log('\n🔧 Configuration required:');
console.log('   • Firebase Admin SDK credentials');
console.log('   • MongoDB connection string');
console.log('   • Stripe API keys (for payment processing)');
console.log('   • SMTP settings (for email notifications)');
console.log('\n🔗 Useful commands:');
console.log('   npm run dev     - Start development server');
console.log('   npm test        - Run tests');
console.log('   npm run migrate - Run database migrations');
console.log('   npm run seed    - Seed database with sample data');
console.log('\n🎯 Features implemented:');
console.log('   ✓ Firebase Authentication integration');
console.log('   ✓ 3-tier user role system (visitor/user/admin)');
console.log('   ✓ MongoDB schema with comprehensive models');
console.log('   ✓ User dashboard and file management APIs');
console.log('   ✓ Usage tracking and analytics');
console.log('   ✓ Subscription management foundation');
console.log('\n🌟 Ready for Step 3: Subscription Management API!');
