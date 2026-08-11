const express = require('express');
const router = express.Router();
const User = require('../../models/user/user.model');
const Session = require('../../models/auth/session.model');
const { protect } = require('../../middleware/auth');
const { cascadeDeleteUser } = require('../../utils/cascadeDelete');

// @route   DELETE /api/auth/account
// @desc    Self-deactivate user account and cascade delete all content
// @access  Private (User self)
router.delete('/', protect, async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Find the user to make sure they exist and get their email
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // 1. Run cascade delete to remove/soft-delete all their created content and profile picture
    await cascadeDeleteUser(userId);

    // 2. Set isDeactivated = true and deactivate timestamp on User document
    user.isDeactivated = true;
    user.deactivatedAt = new Date();
    // Also mark banned/verified as false to hide them from lists/queries
    user.verified_alumni = false; 
    await user.save();

    // 3. Clear all active sessions/refresh tokens for this user in DB
    try {
      await Session.deleteMany({ $or: [{ user_id: userId }, { user_id: userId.toString() }] });
    } catch (sessionErr) {
      console.warn("Error clearing user sessions during deactivation:", sessionErr.message);
    }

    // 4. Clear client-side authentication cookies
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return res.status(200).json({
      success: true,
      message: 'Your account has been deactivated successfully.',
    });
  } catch (error) {
    console.error('Account deactivation error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while deactivating your account',
    });
  }
});

module.exports = router;
