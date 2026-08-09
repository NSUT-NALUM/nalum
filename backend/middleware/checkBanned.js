const User = require("../models/user/user.model");
const { invalidateAlumniMapCache } = require("../config/cacheKeys");

// Middleware to check if a user is banned
exports.checkBanned = async (req, res, next) => {
  try {
    // Skip check if no user is authenticated
    if (!req.user || !req.user.user_id) {
      return next();
    }

    // Find the user
    const user = await User.findById(req.user.user_id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is banned
    if (user.banned) {
      // Check if ban has expired
      if (user.ban_expires_at && new Date() > user.ban_expires_at) {
        // Ban has expired, unban the user
        user.banned = false;
        user.ban_expires_at = null;
        user.ban_reason = null;
        await user.save();

        // The user may be eligible for the public map again — drop the cached
        // response so their pin reappears without waiting for the 1h TTL.
        await invalidateAlumniMapCache();

        // Continue with the request
        return next();
      }

      // User is still banned
      const banMessage =
        user.ban_expires_at && user.ban_expires_at !== null
          ? `Your account has been banned until ${user.ban_expires_at.toLocaleString()}.`
          : "Your account has been permanently banned.";

      return res.status(403).json({
        success: false,
        message: `${banMessage} Reason: ${user.ban_reason || "Not specified"}`,
        banned: true,
        ban_expires_at: user.ban_expires_at,
        ban_reason: user.ban_reason,
      });
    }

    // User is not banned, continue
    next();
  } catch (error) {
    console.error("Error checking ban status:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking account status",
    });
  }
};
