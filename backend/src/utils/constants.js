// Application constants

// User roles
const USER_ROLES = {
  VISITOR: 'visitor',
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

// Subscription tiers
const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
};

// Subscription statuses
const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  CANCELLED: 'cancelled',
  PAST_DUE: 'past_due',
  UNPAID: 'unpaid',
  TRIALING: 'trialing'
};

// Payment statuses
const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// File statuses
const FILE_STATUS = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  READY: 'ready',
  ERROR: 'error',
  DELETED: 'deleted'
};

// Visualization types
const VISUALIZATION_TYPES = {
  BAR: 'bar',
  LINE: 'line',
  PIE: 'pie',
  AREA: 'area',
  RADAR: 'radar',
  SCATTER: 'scatter',
  HISTOGRAM: 'histogram',
  HEATMAP: 'heatmap'
};

// Export formats
const EXPORT_FORMATS = {
  PNG: 'png',
  PDF: 'pdf',
  CSV: 'csv',
  JSON: 'json',
  EXCEL: 'excel'
};

// Email templates
const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  SUBSCRIPTION_CONFIRMATION: 'subscription-confirmation',
  PAYMENT_FAILED: 'payment-failed',
  SUBSCRIPTION_CANCELLED: 'subscription-cancelled',
  PASSWORD_RESET: 'password-reset',
  ACCOUNT_VERIFICATION: 'account-verification'
};

// Error codes
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  SUBSCRIPTION_LIMIT_EXCEEDED: 'SUBSCRIPTION_LIMIT_EXCEEDED',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR'
};

// HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Rate limiting
const RATE_LIMITS = {
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // 5 attempts per window
  },
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requests per window
  },
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10 // 10 uploads per hour for free tier
  }
};

// File constraints
const FILE_CONSTRAINTS = {
  MAX_SIZE: {
    FREE: 5 * 1024 * 1024, // 5MB
    PRO: 50 * 1024 * 1024, // 50MB
    ENTERPRISE: 100 * 1024 * 1024 // 100MB
  },
  ALLOWED_TYPES: [
    'text/csv',
    'application/vnd.ms-excel',
    'text/plain'
  ],
  MAX_ROWS: {
    FREE: 1000,
    PRO: 50000,
    ENTERPRISE: 1000000
  }
};

// Subscription limits
const SUBSCRIPTION_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE]: {
    files: 3,
    storage: 5 * 1024 * 1024, // 5MB
    exports: 10,
    visualizations: ['bar', 'line', 'pie'],
    dataRetention: 7, // days
    apiCalls: 100
  },
  [SUBSCRIPTION_TIERS.PRO]: {
    files: 50,
    storage: 100 * 1024 * 1024, // 100MB
    exports: 100,
    visualizations: ['bar', 'line', 'pie', 'area', 'radar', 'scatter'],
    dataRetention: 30, // days
    apiCalls: 1000,
    pdfExports: true,
    teamSharing: true
  },
  [SUBSCRIPTION_TIERS.ENTERPRISE]: {
    files: 1000,
    storage: 1024 * 1024 * 1024, // 1GB
    exports: -1, // unlimited
    visualizations: 'all',
    dataRetention: 365, // days
    apiCalls: -1, // unlimited
    pdfExports: true,
    teamSharing: true,
    customVisualizations: true,
    apiAccess: true,
    whiteLabel: true,
    prioritySupport: true
  }
};

// Webhook events
const WEBHOOK_EVENTS = {
  STRIPE: {
    PAYMENT_SUCCEEDED: 'payment_intent.succeeded',
    PAYMENT_FAILED: 'payment_intent.payment_failed',
    SUBSCRIPTION_CREATED: 'customer.subscription.created',
    SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
    SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
    INVOICE_PAID: 'invoice.payment_succeeded',
    INVOICE_FAILED: 'invoice.payment_failed'
  }
};

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  USER_PROFILE: 300, // 5 minutes
  SUBSCRIPTION_PLANS: 3600, // 1 hour
  FILE_METADATA: 600, // 10 minutes
  USAGE_STATS: 300 // 5 minutes
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

module.exports = {
  USER_ROLES,
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_STATUS,
  PAYMENT_STATUS,
  FILE_STATUS,
  VISUALIZATION_TYPES,
  EXPORT_FORMATS,
  EMAIL_TEMPLATES,
  ERROR_CODES,
  HTTP_STATUS,
  RATE_LIMITS,
  FILE_CONSTRAINTS,
  SUBSCRIPTION_LIMITS,
  WEBHOOK_EVENTS,
  CACHE_TTL,
  PAGINATION
};
