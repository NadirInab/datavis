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
  }
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

module.exports = mongoose.model('File', fileSchema);
