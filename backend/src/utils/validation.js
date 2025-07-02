const Joi = require('joi');

// User validation schemas
const userValidation = {
  verifyToken: Joi.object({
    idToken: Joi.string()
      .required()
      .messages({
        'any.required': 'Firebase ID token is required'
      })
  }),

  login: Joi.object({
    idToken: Joi.string()
      .required()
      .messages({
        'any.required': 'Firebase ID token is required'
      })
  }),

  updateProfile: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 50 characters'
      }),

    company: Joi.object({
      name: Joi.string().max(100).optional(),
      size: Joi.string().valid('1-10', '11-50', '51-200', '201-1000', '1000+').optional(),
      industry: Joi.string().max(100).optional()
    }).optional(),

    preferences: Joi.object({
      theme: Joi.string().valid('light', 'dark', 'auto').optional(),
      defaultVisualization: Joi.string().valid('bar', 'line', 'pie', 'area', 'radar', 'scatter').optional(),
      emailNotifications: Joi.boolean().optional(),
      marketingEmails: Joi.boolean().optional(),
      language: Joi.string().optional(),
      timezone: Joi.string().optional()
    }).optional()
  }),

  updateRole: Joi.object({
    role: Joi.string()
      .valid('user', 'admin', 'super_admin')
      .required()
      .messages({
        'any.only': 'Role must be one of: user, admin, super_admin',
        'any.required': 'Role is required'
      })
  })
};

// Subscription validation schemas
const subscriptionValidation = {
  createSubscription: Joi.object({
    tier: Joi.string()
      .valid('free', 'pro', 'enterprise')
      .required()
      .messages({
        'any.only': 'Subscription tier must be one of: free, pro, enterprise',
        'any.required': 'Subscription tier is required'
      }),
    
    interval: Joi.string()
      .valid('month', 'year')
      .default('month')
      .messages({
        'any.only': 'Billing interval must be either month or year'
      }),
    
    paymentMethodId: Joi.string()
      .when('tier', {
        is: Joi.valid('pro', 'enterprise'),
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .messages({
        'any.required': 'Payment method is required for paid subscriptions'
      })
  }),

  updateSubscription: Joi.object({
    tier: Joi.string()
      .valid('free', 'pro', 'enterprise')
      .optional(),
    
    interval: Joi.string()
      .valid('month', 'year')
      .optional()
  })
};

// File validation schemas
const fileValidation = {
  upload: Joi.object({
    filename: Joi.string()
      .max(255)
      .required()
      .messages({
        'string.max': 'Filename cannot exceed 255 characters',
        'any.required': 'Filename is required'
      }),
    
    size: Joi.number()
      .positive()
      .max(parseInt(process.env.MAX_FILE_SIZE) || 10485760) // 10MB default
      .required()
      .messages({
        'number.positive': 'File size must be positive',
        'number.max': 'File size exceeds maximum allowed limit',
        'any.required': 'File size is required'
      }),
    
    mimetype: Joi.string()
      .valid('text/csv', 'application/vnd.ms-excel', 'text/plain')
      .required()
      .messages({
        'any.only': 'Only CSV files are allowed',
        'any.required': 'File type is required'
      })
  })
};

// Payment validation schemas
const paymentValidation = {
  createPaymentIntent: Joi.object({
    amount: Joi.number()
      .positive()
      .required()
      .messages({
        'number.positive': 'Amount must be positive',
        'any.required': 'Amount is required'
      }),
    
    currency: Joi.string()
      .valid('usd', 'eur', 'gbp')
      .default('usd')
      .messages({
        'any.only': 'Currency must be one of: usd, eur, gbp'
      }),
    
    subscriptionTier: Joi.string()
      .valid('pro', 'enterprise')
      .required()
      .messages({
        'any.only': 'Subscription tier must be pro or enterprise',
        'any.required': 'Subscription tier is required'
      })
  })
};

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    req.validatedData = value;
    next();
  };
};

module.exports = {
  userValidation,
  subscriptionValidation,
  fileValidation,
  paymentValidation,
  validate
};
