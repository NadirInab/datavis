const mongoose = require('mongoose');

const migrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  version: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'rolled_back'],
    default: 'pending'
  },
  executedAt: {
    type: Date
  },
  rolledBackAt: {
    type: Date
  },
  executionTime: {
    type: Number // in milliseconds
  },
  error: {
    type: String
  },
  checksum: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
migrationSchema.index({ version: 1 });
migrationSchema.index({ status: 1 });
migrationSchema.index({ executedAt: -1 });

// Static method to get current database version
migrationSchema.statics.getCurrentVersion = async function() {
  const lastMigration = await this.findOne({ 
    status: 'completed' 
  }).sort({ version: -1 });
  
  return lastMigration ? lastMigration.version : '0.0.0';
};

// Static method to get pending migrations
migrationSchema.statics.getPendingMigrations = async function() {
  return this.find({ 
    status: { $in: ['pending', 'failed'] } 
  }).sort({ version: 1 });
};

// Static method to get migration history
migrationSchema.statics.getHistory = async function(limit = 50) {
  return this.find({})
    .sort({ executedAt: -1 })
    .limit(limit);
};

// Instance method to mark as completed
migrationSchema.methods.markCompleted = function(executionTime) {
  this.status = 'completed';
  this.executedAt = new Date();
  this.executionTime = executionTime;
  this.error = undefined;
  return this.save();
};

// Instance method to mark as failed
migrationSchema.methods.markFailed = function(error) {
  this.status = 'failed';
  this.error = error;
  return this.save();
};

// Instance method to mark as rolled back
migrationSchema.methods.markRolledBack = function() {
  this.status = 'rolled_back';
  this.rolledBackAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Migration', migrationSchema);
