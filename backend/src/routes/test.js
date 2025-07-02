const express = require('express');
const router = express.Router();

const {
  testFirebaseAuth,
  testVisitorSession,
  getFirebaseConfig
} = require('../controllers/testController');

const { trackVisitor } = require('../middleware/auth');

// Only enable test routes in development
if (process.env.NODE_ENV !== 'production') {
  
  // @route   POST /api/v1/test/firebase-auth
  // @desc    Test Firebase token verification
  // @access  Public
  router.post('/firebase-auth', testFirebaseAuth);

  // @route   GET /api/v1/test/visitor-session
  // @desc    Test visitor session tracking
  // @access  Public
  router.get('/visitor-session', trackVisitor, testVisitorSession);

  // @route   GET /api/v1/test/firebase-config
  // @desc    Get Firebase configuration status
  // @access  Public
  router.get('/firebase-config', getFirebaseConfig);

} else {
  // In production, return 404 for all test routes
  router.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Test endpoints are not available in production'
    });
  });
}

module.exports = router;
