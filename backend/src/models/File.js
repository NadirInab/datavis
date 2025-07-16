const mongoose = require('mongoose');
const { FILE_STATUS, VISUALIZATION_TYPES } = require('../utils/constants');

const visualizationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: Object.values(VISUALIZATION_TYPES),
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  columns: {
    x: {
      type: String,
      required: true
    },
    y: {
      type: [String],
      required: true
    },
    groupBy: {
      type: String,
      default: null
    }
  },
  config: {
    colors: [String],
    showLegend: {
      type: Boolean,
      default: true
    },
    showGrid: {
      type: Boolean,
      default: true
    },
    showTooltip: {
      type: Boolean,
      default: true
    },
    animation: {
      type: Boolean,
      default: true
    },
    customOptions: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const fileSchema = new mongoose.Schema({
  // File identification
  filename: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Owner information
  ownerUid: {
    type: String,
    required: true
  },

  ownerType: {
    type: String,
    enum: ['user', 'visitor'],
    default: 'user'
  },

  // For visitor tracking
  visitorSessionId: {
    type: String,
    default: null
  },
  
  // File metadata
  size: {
    type: Number,
    required: true,
    min: 0
  },
  
  mimetype: {
    type: String,
    required: true
  },
  
  encoding: {
    type: String,
    default: 'utf8'
  },
  
  // File storage information
  path: {
    type: String,
    required: true
  },
  
  url: {
    type: String,
    default: null
  },
  
  // Processing status
  status: {
    type: String,
    enum: Object.values(FILE_STATUS),
    default: FILE_STATUS.UPLOADING
  },
  
  processingProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  errorMessage: {
    type: String,
    default: null
  },
  
  // CSV data information
  dataInfo: {
    rows: {
      type: Number,
      default: 0,
      min: 0
    },
    columns: {
      type: Number,
      default: 0,
      min: 0
    },
    headers: [{
      name: String,
      type: {
        type: String,
        enum: ['string', 'number', 'date', 'boolean'],
        default: 'string'
      },
      nullable: {
        type: Boolean,
        default: false
      },
      unique: {
        type: Boolean,
        default: false
      }
    }],
    sampleData: {
      type: mongoose.Schema.Types.Mixed,
      default: []
    },
    statistics: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  
  // Processed data (stored as JSON for quick access)
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  
  // Visualizations
  visualizations: [visualizationSchema],
  
  // File settings
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowDownload: {
      type: Boolean,
      default: true
    },
    retentionDays: {
      type: Number,
      default: 30
    },
    tags: [String],
    description: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  
  // Access tracking
  accessLog: {
    viewCount: {
      type: Number,
      default: 0
    },
    lastViewed: {
      type: Date,
      default: null
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    lastDownloaded: {
      type: Date,
      default: null
    },
    exportCount: {
      type: Number,
      default: 0
    },
    lastExported: {
      type: Date,
      default: null
    }
  },
  
  // Expiration for visitor files
  expiresAt: {
    type: Date,
    default: function() {
      // Visitor files expire after 24 hours, user files based on subscription
      if (this.ownerType === 'visitor') {
        return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      }
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days for users
    }
  },
  
  // Metadata
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  
  processedAt: {
    type: Date,
    default: null
  },
  
  ipAddress: {
    type: String,
    default: null
  },
  
  userAgent: {
    type: String,
    default: null
  },

  // Optimization tracking
  lastOptimized: {
    type: Date,
    default: null
  },

  deletedAt: {
    type: Date,
    default: null
  },

  // Sharing and collaboration settings
  sharing: {
    isShared: {
      type: Boolean,
      default: false
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true
    },
    shareUrl: {
      type: String,
      default: null
    },
    permissions: {
      defaultAccess: {
        type: String,
        enum: ['view', 'edit', 'none'],
        default: 'view'
      },
      allowAnonymous: {
        type: Boolean,
        default: true
      },
      requireAuth: {
        type: Boolean,
        default: false
      },
      expiresAt: {
        type: Date,
        default: null
      }
    },
    sharedAt: {
      type: Date,
      default: null
    },
    sharedBy: {
      type: String,
      default: null
    }
  },

  // User permissions for specific users
  userPermissions: [{
    userId: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    permission: {
      type: String,
      enum: ['view', 'edit', 'admin'],
      required: true
    },
    grantedBy: {
      type: String,
      required: true
    },
    grantedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Cell-level comments and edits
  cellComments: [{
    id: {
      type: String,
      required: true
    },
    row: {
      type: Number,
      required: true
    },
    column: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    author: {
      id: String,
      name: String,
      email: String,
      avatar: String
    },
    replies: [{
      id: String,
      text: String,
      author: {
        id: String,
        name: String,
        email: String,
        avatar: String
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    resolved: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Edit history for conflict resolution
  editHistory: [{
    cellId: String, // row_column format
    oldValue: String,
    newValue: String,
    author: {
      id: String,
      name: String,
      sessionId: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    version: Number
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
fileSchema.index({ ownerUid: 1, uploadedAt: -1 });
fileSchema.index({ ownerType: 1 });
fileSchema.index({ visitorSessionId: 1 });
fileSchema.index({ status: 1 });
fileSchema.index({ uploadedAt: -1 });
fileSchema.index({ expiresAt: 1 });
fileSchema.index({ 'settings.isPublic': 1 });

// Virtual for file age
fileSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const uploaded = this.uploadedAt;
  const diffTime = Math.abs(now - uploaded);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for processing time
fileSchema.virtual('processingTime').get(function() {
  if (!this.processedAt) return null;
  const diffTime = this.processedAt - this.uploadedAt;
  return Math.round(diffTime / 1000); // in seconds
});

// Virtual for file size in human readable format
fileSchema.virtual('sizeFormatted').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Method to add visualization
fileSchema.methods.addVisualization = function(visualizationData) {
  const visualization = {
    id: new mongoose.Types.ObjectId().toString(),
    ...visualizationData,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  this.visualizations.push(visualization);
  return visualization;
};

// Method to generate share token and URL
fileSchema.methods.generateShareToken = function() {
  const crypto = require('crypto');
  const shareToken = crypto.randomBytes(32).toString('hex');

  this.sharing.shareToken = shareToken;
  this.sharing.shareUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/shared/${this._id}/${shareToken}`;
  this.sharing.isShared = true;
  this.sharing.sharedAt = new Date();

  return shareToken;
};

// Method to check user permissions
fileSchema.methods.getUserPermission = function(userId, isOwner = false) {
  // Owner has full admin access
  if (isOwner || this.ownerUid === userId) {
    return 'admin';
  }

  // Check specific user permissions
  const userPerm = this.userPermissions.find(p => p.userId === userId);
  if (userPerm) {
    return userPerm.permission;
  }

  // Check if file is shared and return default access
  if (this.sharing.isShared) {
    // Check if share has expired
    if (this.sharing.permissions.expiresAt && new Date() > this.sharing.permissions.expiresAt) {
      return 'none';
    }
    return this.sharing.permissions.defaultAccess;
  }

  return 'none';
};

// Method to add user permission
fileSchema.methods.addUserPermission = function(userId, email, permission, grantedBy) {
  // Remove existing permission if any
  this.userPermissions = this.userPermissions.filter(p => p.userId !== userId);

  // Add new permission
  this.userPermissions.push({
    userId,
    email,
    permission,
    grantedBy,
    grantedAt: new Date()
  });
};

// Method to add cell comment
fileSchema.methods.addCellComment = function(row, column, text, author) {
  const comment = {
    id: new mongoose.Types.ObjectId().toString(),
    row,
    column,
    text,
    author,
    replies: [],
    resolved: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  this.cellComments.push(comment);
  return comment;
};

// Method to add comment reply
fileSchema.methods.addCommentReply = function(commentId, text, author) {
  const comment = this.cellComments.id(commentId);
  if (!comment) return null;

  const reply = {
    id: new mongoose.Types.ObjectId().toString(),
    text,
    author,
    createdAt: new Date()
  };

  comment.replies.push(reply);
  comment.updatedAt = new Date();
  return reply;
};

// Method to update cell value with history
fileSchema.methods.updateCellValue = function(row, column, oldValue, newValue, author) {
  const cellId = `${row}_${column}`;

  // Add to edit history
  this.editHistory.push({
    cellId,
    oldValue,
    newValue,
    author,
    timestamp: new Date(),
    version: this.editHistory.filter(h => h.cellId === cellId).length + 1
  });

  // Update the actual data
  if (this.data && this.data[row] && this.data[row][column] !== undefined) {
    this.data[row][column] = newValue;
  }

  return true;
};

// Method to update visualization
fileSchema.methods.updateVisualization = function(visualizationId, updateData) {
  const visualization = this.visualizations.id(visualizationId);
  if (!visualization) {
    throw new Error('Visualization not found');
  }
  
  Object.assign(visualization, updateData);
  visualization.updatedAt = new Date();
  return visualization;
};

// Method to remove visualization
fileSchema.methods.removeVisualization = function(visualizationId) {
  const visualization = this.visualizations.id(visualizationId);
  if (!visualization) {
    throw new Error('Visualization not found');
  }
  
  visualization.remove();
  return true;
};

// Method to increment view count
fileSchema.methods.incrementViewCount = function() {
  this.accessLog.viewCount += 1;
  this.accessLog.lastViewed = new Date();
};

// Method to increment download count
fileSchema.methods.incrementDownloadCount = function() {
  this.accessLog.downloadCount += 1;
  this.accessLog.lastDownloaded = new Date();
};

// Method to increment export count
fileSchema.methods.incrementExportCount = function() {
  this.accessLog.exportCount += 1;
  this.accessLog.lastExported = new Date();
};

// Pre-save middleware
fileSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === FILE_STATUS.READY && !this.processedAt) {
    this.processedAt = new Date();
  }
  next();
});

// Indexes for performance optimization
fileSchema.index({ ownerUid: 1, status: 1 }); // Primary query pattern
fileSchema.index({ ownerType: 1, status: 1 }); // For visitor/user filtering
fileSchema.index({ uploadedAt: -1 }); // For date-based queries and cleanup
fileSchema.index({ status: 1, uploadedAt: 1 }); // For cleanup and processing queries
fileSchema.index({ 'visitorSessionId': 1 }, { sparse: true }); // For visitor session lookup
fileSchema.index({ filename: 'text', originalName: 'text' }); // For text search
fileSchema.index({ size: 1 }); // For size-based queries
fileSchema.index({ 'dataInfo.rows': 1 }); // For data size optimization
fileSchema.index({ lastOptimized: 1 }, { sparse: true }); // For storage optimization
fileSchema.index({ processedAt: -1 }, { sparse: true }); // For recent files

// Compound indexes for common query patterns
fileSchema.index({ ownerUid: 1, uploadedAt: -1 }); // User's files by date
fileSchema.index({ status: 1, processingProgress: 1 }); // Processing status
fileSchema.index({ ownerType: 1, uploadedAt: -1 }); // Files by owner type and date

module.exports = mongoose.model('File', fileSchema);
