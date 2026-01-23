const notificationService = require('../services/notificationService');
const PushSubscription = require('../models/pushSubscription.model');
const NotificationPreferences = require('../models/notificationPreferences.model');

/**
 * Get user notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
    });
  }
};

/**
 * Get unread count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const count = await notificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
    });
  }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { notificationId } = req.params;

    const notification = await notificationService.markAsRead(notificationId, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
    });
  }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.user_id;
    await notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read',
    });
  }
};

/**
 * Delete notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { notificationId } = req.params;

    const notification = await notificationService.deleteNotification(notificationId, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
    });
  }
};

/**
 * Subscribe to push notifications
 */
exports.subscribePush = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { endpoint, keys, deviceInfo } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription data',
      });
    }

    // Check if subscription already exists
    let subscription = await PushSubscription.findOne({ endpoint });

    if (subscription) {
      // Update existing subscription
      subscription.user = userId;
      subscription.keys = keys;
      subscription.deviceInfo = deviceInfo;
      subscription.active = true;
      subscription.lastUsed = new Date();
      await subscription.save();
    } else {
      // Create new subscription
      subscription = await PushSubscription.create({
        user: userId,
        endpoint,
        keys,
        deviceInfo,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Push subscription saved',
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save push subscription',
    });
  }
};

/**
 * Unsubscribe from push notifications
 */
exports.unsubscribePush = async (req, res) => {
  try {
    const { endpoint } = req.body;

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { active: false }
    );

    res.status(200).json({
      success: true,
      message: 'Push subscription removed',
    });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove push subscription',
    });
  }
};

/**
 * Get notification preferences
 */
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const preferences = await notificationService.getUserPreferences(userId);

    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch preferences',
    });
  }
};

/**
 * Update notification preferences
 */
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const updates = req.body;

    const preferences = await NotificationPreferences.findOneAndUpdate(
      { user: userId },
      updates,
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
    });
  }
};

/**
 * Get VAPID public key (for frontend)
 */
exports.getVapidPublicKey = async (req, res) => {
  res.status(200).json({
    success: true,
    publicKey: process.env.VAPID_PUBLIC_KEY || null,
  });
};
