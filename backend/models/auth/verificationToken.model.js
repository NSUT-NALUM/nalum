const mongoose = require("mongoose");

const verificationTokenSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => /^\S+@\S+\.\S+$/.test(v),
        message: "Invalid email format",
      },
    },
    token: {
      type: String,
      required: true,
    },
    expires_at: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 1000 * 60 * 60 * 1), // 1 hour
      expires: 0, // auto-delete when expired (TTL index)
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VerificationToken", verificationTokenSchema);
