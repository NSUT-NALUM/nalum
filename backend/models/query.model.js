const mongoose = require('mongoose');

const querySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    content: {
      type: String,
      required: true,
      maxlength: 500,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 2;
        },
        message: 'You can upload a maximum of 2 images.',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'viewed', 'responded'],
      default: 'pending',
    },
    answer: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
querySchema.index({ status: 1 });
querySchema.index({ userId: 1 });
querySchema.index({ status: 1, createdAt: -1 });
querySchema.index({ createdAt: -1 });
querySchema.index({ userId: 1, isDeleted: 1 }); // for user's own queries excluding deleted

module.exports = mongoose.model('Query', querySchema);
