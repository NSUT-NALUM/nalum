const mongoose = require("mongoose");
const { Schema } = mongoose;

const AdminActivitySchema = new Schema(
  {
    admin_username: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "login",
        "logout",
        "ban_user",
        "unban_user",
        "deactivate_user",
        "approve_verification",
        "reject_verification",
        "create_event",
        "update_event",
        "approve_event",
        "reject_event",
        "delete_event",
        "approve_post",
        "reject_post",
        "delete_post",
        "delete_giving",
        "delete_query",
        "upload_newsletter",
        "delete_newsletter",
        "generate_codes",
        "delete_expired_codes",
      ],
    },
    target_type: {
      type: String,
      enum: ["user", "event", "post", "giving", "query", "newsletter", "verification", "code", "system"],
      default: "system",
    },
    target_id: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    details: {
      type: Schema.Types.Mixed, // flexible object for storing action-specific data
      default: {},
    },
    ip_address: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
AdminActivitySchema.index({ admin_username: 1, createdAt: -1 });
AdminActivitySchema.index({ action: 1, createdAt: -1 });
AdminActivitySchema.index({ target_type: 1, target_id: 1 });

const AdminActivity = mongoose.model("AdminActivity", AdminActivitySchema);

module.exports = AdminActivity;
