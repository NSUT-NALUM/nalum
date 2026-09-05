const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          // Basic email validation
          if (!/^\S+@\S+\.\S+$/.test(v)) return false;

          // If role is student or faculty, email must end with @nsut.ac.in
          if ((this.role === "student" || this.role === "faculty") && !v.endsWith("@nsut.ac.in")) {
            return false;
          }

          return true;
        },
        message: function (props) {
          if (props.instance.role === "student" || props.instance.role === "faculty") {
            return "Students and Faculty must use an @nsut.ac.in email address";
          }
          return "Invalid email format";
        },
      },
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === 'local';
      },
      minlength: 8,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    email_verified: {
      type: Boolean,
      default: false,
    },
    email_verified_at: {
      type: Date,
      default: null,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["student", "alumni", "faculty", "admin"],
      required: true,
    },
    // Only applicable for alumni - students and admins don't have this field
    verified_alumni: {
      type: Boolean,
      default: function () {
        // Only alumni need this field
        return this.role === "alumni" ? false : true;
      },
    },
    banned: {
      type: Boolean,
      default: false,
    },
    ban_expires_at: {
      type: Date,
      default: null,
    },
    ban_reason: {
      type: String,
      default: null,
    },
    isDeactivated: {
      type: Boolean,
      default: false,
    },
    deactivatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Method to check if student email verification has expired (180 days)
userSchema.methods.isStudentVerificationExpired = function () {
  if (this.role !== "student") return false;
  if (!this.email_verified || !this.email_verified_at) return true;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 180);

  return this.email_verified_at < thirtyDaysAgo;
};

// Method to check if user needs alumni verification
userSchema.methods.needsAlumniVerification = function () {
  // Only alumni need verification
  if (this.role !== "alumni") return false;
  return !this.verified_alumni;
};

module.exports = mongoose.model("User", userSchema);
