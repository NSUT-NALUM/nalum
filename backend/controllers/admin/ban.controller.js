const User = require("../../models/user/user.model");
const Ban = require("../../models/admin/ban.model");
const { logAdminActivity } = require("../../middleware/adminAuth");
const { invalidateAlumniMapCache } = require("../../config/cacheKeys");

// Calculate ban expiry date
const calculateBanExpiry = (duration) => {
  const now = new Date();
  switch (duration) {
    case "24h":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case "365d":
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    case "permanent":
      return null;
    default:
      throw new Error("Invalid ban duration");
  }
};

// Ban a user
exports.banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { duration, reason } = req.body;

    // Validation
    if (!duration || !reason) {
      return res.status(400).json({
        success: false,
        message: "Duration and reason are required",
      });
    }

    if (!["24h", "7d", "30d", "365d", "permanent"].includes(duration)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ban duration",
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is already banned
    if (user.banned) {
      return res.status(400).json({
        success: false,
        message: "User is already banned",
      });
    }

    // Calculate ban expiry
    const banExpiresAt = calculateBanExpiry(duration);

    // Update user
    user.banned = true;
    user.ban_expires_at = banExpiresAt;
    user.ban_reason = reason;
    await user.save();

    // Banned users must disappear from the public map immediately, not after
    // the 1h cache TTL.
    await invalidateAlumniMapCache();

    // Create ban record
    await Ban.create({
      user: userId,
      banned_by: req.admin.email,
      reason,
      duration,
      ban_expires_at: banExpiresAt,
      is_active: true,
    });

    // Log activity
    await logAdminActivity(
      req.admin.email,
      "ban_user",
      "user",
      userId,
      {
        user_name: user.name,
        user_email: user.email,
        duration,
        reason,
        ban_expires_at: banExpiresAt,
      },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: "User banned successfully",
      ban: {
        duration,
        expires_at: banExpiresAt,
        reason,
      },
    });
  } catch (error) {
    console.error("Error banning user:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while banning user",
    });
  }
};

// Unban a user
exports.unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { notes } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is banned
    if (!user.banned) {
      return res.status(400).json({
        success: false,
        message: "User is not banned",
      });
    }

    // Update user
    user.banned = false;
    user.ban_expires_at = null;
    user.ban_reason = null;
    await user.save();

    // Unbanned users may now be eligible for the map again
    await invalidateAlumniMapCache();

    // Update ban record
    await Ban.updateMany(
      { user: userId, is_active: true },
      {
        is_active: false,
        unbanned_at: new Date(),
        unbanned_by: req.admin.email,
      }
    );

    // Log activity
    await logAdminActivity(
      req.admin.email,
      "unban_user",
      "user",
      userId,
      {
        user_name: user.name,
        user_email: user.email,
        notes: notes || "",
      },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: "User unbanned successfully",
    });
  } catch (error) {
    console.error("Error unbanning user:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while unbanning user",
    });
  }
};

// Get all banned users
exports.getBannedUsers = async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;

    // Find active bans with user data
    const bans = await Ban.find({ is_active: true })
      .populate({
        path: "user",
        select: "name email role createdAt",
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Format the response to match frontend expectations
    const bannedUsers = bans
      .filter(ban => ban.user) // Filter out bans where user might be deleted
      .map(ban => ({
        _id: ban._id,
        user_id: ban.user._id,
        user_name: ban.user.name,
        user_email: ban.user.email,
        banned_by: ban.banned_by,
        banned_by_name: ban.banned_by, // Using email as name for now
        reason: ban.reason,
        duration: ban.duration,
        ban_expires_at: ban.ban_expires_at,
        is_active: ban.is_active,
        created_at: ban.createdAt,
      }));

    const total = await Ban.countDocuments({ is_active: true });

    res.status(200).json({
      success: true,
      data: bannedUsers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching banned users:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching banned users",
    });
  }
};

// Get ban history for a user
exports.getUserBanHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const banHistory = await Ban.find({ user: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: banHistory,
    });
  } catch (error) {
    console.error("Error fetching ban history:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching ban history",
    });
  }
};

// Deactivate / Delete user account by Admin (Task 3.6)
exports.deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isDeactivated) {
      return res.status(400).json({
        success: false,
        message: "User is already deactivated",
      });
    }

    // 1. Run cascade delete to clean up user posts, comments, events, givings, queries
    const { cascadeDeleteUser } = require("../../utils/cascadeDelete");
    await cascadeDeleteUser(userId);

    // 2. Mark user deactivated
    user.isDeactivated = true;
    user.deactivatedAt = new Date();
    user.verified_alumni = false;
    await user.save();

    // 3. Delete user sessions
    const Session = require("../../models/auth/session.model");
    await Session.deleteMany({ user_id: userId });

    // 4. Log admin activity
    await logAdminActivity(
      req.admin.email,
      "deactivate_user",
      "user",
      userId,
      { user_name: user.name, user_email: user.email },
      req.ip
    );

    res.status(200).json({
      success: true,
      message: "User account has been deactivated successfully",
    });
  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while deactivating user account",
    });
  }
};

