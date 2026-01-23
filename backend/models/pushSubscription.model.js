const mongoose = require('mongoose');
const { Schema } = mongoose;

const pushSubscriptionSchema = new Schema({
  user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Push subscription data from browser
  endpoint: {
    type: String,
    required: true,
    unique: true,
  },

  keys: {
    p256dh: {
      type: String,
      required: true,
    },
    auth: {
      type: String,
      required: true,
    },
  },

  // Device info (for management)
  deviceInfo: {
    userAgent: String,
    browser: String,
    os: String,
  },

  // Status
  active: {
    type: Boolean,
    default: true,
  },

  lastUsed: {
    type: Date,
    default: Date.now,
  },

}, {
  timestamps: true,
});

// Index for cleanup
pushSubscriptionSchema.index({ active: 1, lastUsed: 1 });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
