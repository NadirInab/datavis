const express = require('express');
const router = express.Router();

const {
  getDatabaseStatus,
  getCollectionStats,
  runSeeder,
  clearCollection,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  getSystemStatus,
  getUsageAnalytics
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/auth');

// Enable authentication middleware for production
router.use(protect);
router.use(authorize('admin', 'super_admin'));

// Database management routes
router.get('/db/status', getDatabaseStatus);
router.get('/db/stats', getCollectionStats);
router.post('/db/seed', runSeeder);
router.delete('/db/clear', clearCollection);

// User management routes
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);

// System monitoring routes
router.get('/system/status', getSystemStatus);
router.get('/analytics', getUsageAnalytics);

// System health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin API is healthy',
    timestamp: new Date().toISOString(),
    user: req.user ? {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    } : null
  });
});

module.exports = router;


