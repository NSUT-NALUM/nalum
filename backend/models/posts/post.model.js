const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 2;
        },
        message: "You can upload a maximum of 2 images.",
      },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewed_by: {
      type: String,
      default: null,
    },
    reviewed_at: {
      type: Date,
      default: null,
    },
    rejection_reason: {
      type: String,
      default: null,
    },
    report_count: {
      type: Number,
      default: 0,
    },
    view_count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
postSchema.index({ status: 1 });
postSchema.index({ userId: 1 });
postSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
