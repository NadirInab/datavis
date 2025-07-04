const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../utils/logger');

// Payment model for tracking transactions
const Payment = require('../models/Payment');

// @route   POST /api/v1/payments/mock-payment
// @desc    Create mock payment for subscription (simplified)
// @access  Private
router.post('/mock-payment', protect, async (req, res) => {
  try {
    const { planType, billingCycle = 'monthly', amount } = req.body;

    if (!planType || !['pro', 'enterprise'].includes(planType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan type'
      });
    }

    // Create mock payment record
    const payment = new Payment({
      userId: req.user._id,
      paymentId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount || (planType === 'pro' ? 9.99 : 29.99),
      currency: 'usd',
      status: 'completed',
      planType,
      billingCycle,
      paymentMethod: 'mock'
    });

    await payment.save();

    // Update user subscription
    await User.findByIdAndUpdate(req.user._id, {
      subscription: planType,
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
    });

    logger.info(`Mock payment created for user ${req.user._id}`, {
      paymentId: payment.paymentId,
      planType,
      amount: payment.amount
    });

    res.status(201).json({
      success: true,
      message: 'Mock payment processed successfully',
      data: {
        paymentId: payment.paymentId,
        planType,
        amount: payment.amount,
        status: 'completed'
      }
    });

  } catch (error) {
    logger.error('Mock payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: error.message
    });
  }
});

// @route   GET /api/v1/payments/history
// @desc    Get user payment history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments({ userId: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment history',
      error: error.message
    });
  }
});

// @route   GET /api/v1/payments/admin/history
// @desc    Get all payments (admin only)
// @access  Private/Admin
router.get('/admin/history', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (userId) {
      query.userId = userId;
    }

    const payments = await Payment.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get admin payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment history',
      error: error.message
    });
  }
});

// @route   POST /api/v1/payments/admin/manual
// @desc    Create manual payment (admin only)
// @access  Private/Admin
router.post('/admin/manual', protect, authorize('admin'), async (req, res) => {
  try {
    const { userId, planType, billingCycle = 'monthly', amount, notes } = req.body;

    if (!userId || !planType || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create manual payment record
    const payment = new Payment({
      userId,
      paymentId: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      currency: 'usd',
      status: 'completed',
      planType,
      billingCycle,
      paymentMethod: 'manual',
      notes
    });

    await payment.save();

    // Update user subscription
    await User.findByIdAndUpdate(userId, {
      subscription: planType,
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
    });

    logger.info(`Manual payment created by admin ${req.user._id} for user ${userId}`, {
      paymentId: payment.paymentId,
      planType,
      amount
    });

    res.status(201).json({
      success: true,
      message: 'Manual payment created successfully',
      data: payment
    });

  } catch (error) {
    logger.error('Create manual payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create manual payment',
      error: error.message
    });
  }
});

// @route   POST /api/v1/payments/cancel-subscription
// @desc    Cancel user subscription
// @access  Private
router.post('/cancel-subscription', protect, async (req, res) => {
  try {
    const { reason } = req.body;

    // Update user subscription status
    await User.findByIdAndUpdate(req.user._id, {
      subscriptionStatus: 'cancelled',
      subscriptionCancelledAt: new Date(),
      subscriptionCancelReason: reason || 'User requested cancellation'
    });

    logger.info(`Subscription cancelled for user ${req.user._id}`, { reason });

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully'
    });

  } catch (error) {
    logger.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message
    });
  }
});

module.exports = router;
