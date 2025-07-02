const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const { SubscriptionPlan } = require('../models/Subscription');
const logger = require('../utils/logger');

// Payment model for tracking transactions
const Payment = require('../models/Payment');

// @route   POST /api/v1/payments/create-intent
// @desc    Create payment intent for subscription
// @access  Private
router.post('/create-intent', protect, async (req, res) => {
  try {
    const { planId, billingCycle = 'monthly' } = req.body;

    // Get subscription plan
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Calculate amount based on billing cycle
    const amount = billingCycle === 'yearly'
      ? plan.pricing.yearly.amount
      : plan.pricing.monthly.amount;

    if (amount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create payment intent for free plan'
      });
    }

    // Create Stripe customer if doesn't exist
    let customer;
    if (req.user.stripeCustomerId) {
      customer = await stripe.customers.retrieve(req.user.stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        metadata: {
          userId: req.user._id.toString()
        }
      });

      // Save customer ID to user
      req.user.stripeCustomerId = customer.id;
      await req.user.save();
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customer.id,
      metadata: {
        userId: req.user._id.toString(),
        planId: planId,
        billingCycle: billingCycle
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        currency: 'usd',
        plan: {
          name: plan.name,
          tier: plan.tier,
          billingCycle
        }
      }
    });
  } catch (error) {
    logger.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
});

// @route   POST /api/v1/payments/confirm
// @desc    Confirm payment and update subscription
// @access  Private
router.post('/confirm', protect, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    const { planId, billingCycle } = paymentIntent.metadata;

    // Get subscription plan
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Update user subscription
    req.user.subscription = {
      tier: plan.tier,
      status: 'active',
      planId: plan._id,
      billingCycle,
      startDate: new Date(),
      endDate: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
      stripeSubscriptionId: paymentIntent.id
    };

    await req.user.save();

    // Create payment record
    const payment = new Payment({
      userId: req.user._id,
      stripePaymentIntentId: paymentIntentId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'completed',
      planId: plan._id,
      billingCycle,
      metadata: paymentIntent.metadata
    });

    await payment.save();

    logger.info(`Payment confirmed for user ${req.user.email}, plan: ${plan.name}`);

    res.status(200).json({
      success: true,
      message: 'Payment confirmed and subscription updated',
      data: {
        subscription: req.user.subscription,
        payment: payment
      }
    });
  } catch (error) {
    logger.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
});

// @route   GET /api/v1/payments/history
// @desc    Get payment history for user
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const payments = await Payment.find({ userId: req.user._id })
      .populate('planId', 'name tier')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments({ userId: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: payments.length,
          totalPayments: total
        }
      }
    });
  } catch (error) {
    logger.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history',
      error: error.message
    });
  }
});

// @route   GET /api/v1/payments/admin/history
// @desc    Get all payment history (admin only)
// @access  Admin
router.get('/admin/history', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const payments = await Payment.find(filter)
      .populate('userId', 'name email')
      .populate('planId', 'name tier')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: payments.length,
          totalPayments: total
        }
      }
    });
  } catch (error) {
    logger.error('Get admin payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history',
      error: error.message
    });
  }
});

// @route   POST /api/v1/payments/admin/refund
// @desc    Process refund (admin only)
// @access  Admin
router.post('/admin/refund', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { paymentId, reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: 'Payment already refunded'
      });
    }

    // Process refund with Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      reason: reason || 'requested_by_customer'
    });

    // Update payment status
    payment.status = 'refunded';
    payment.refundId = refund.id;
    payment.refundedAt = new Date();
    payment.refundReason = reason;
    await payment.save();

    // Update user subscription if needed
    const user = await User.findById(payment.userId);
    if (user && user.subscription.stripeSubscriptionId === payment.stripePaymentIntentId) {
      user.subscription.status = 'cancelled';
      await user.save();
    }

    logger.info(`Refund processed for payment ${paymentId} by admin ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        payment,
        refund
      }
    });
  } catch (error) {
    logger.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message
    });
  }
});

module.exports = router;
