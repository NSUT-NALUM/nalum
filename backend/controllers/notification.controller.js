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
 * Verify if notification entity still exists before navigation
 */
exports.verifyNotificationEntity = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { notificationId } = req.params;

    const Notification = require('../models/notification.model');
    const notification = await Notification.findOne({ _id: notificationId, recipient: userId });

    if (!notification) {
      // If notification is gone, technically it's invalid to navigate
      return res.status(200).json({ success: true, data: { valid: false } });
    }

    let isValid = true;

    // Based on notification type, verify the entity exists
    if (notification.type === 'new_message') {
      const Conversation = require('../models/chat/conversations.model');
      const convId = notification.metadata?.conversationId;
      if (convId) {
        const conv = await Conversation.findById(convId);
        if (!conv) isValid = false;
      }
    } else if (['post_like', 'post_comment', 'comment_reply', 'comment_mention', 'post_mention'].includes(notification.type)) {
      if (notification.actionUrl) {
        const match = notification.actionUrl.match(/\/posts\/([a-fA-F0-9]{24})/);
        if (match) {
          const Post = require('../models/post.model');
          const post = await Post.findById(match[1]);
          if (!post) isValid = false;
        }
      }
    } else if (['connection_request', 'connection_accepted'].includes(notification.type)) {
      const connId = notification.metadata?.connectionId;
      if (connId) {
        const Connection = require('../models/chat/connections.model');
        const conn = await Connection.findById(connId);
        if (!conn) isValid = false;
      }
    } else if (['event_invitation', 'event_reminder', 'event_update'].includes(notification.type)) {
      if (notification.actionUrl) {
        const match = notification.actionUrl.match(/\/events\/([a-fA-F0-9]{24})/);
        if (match) {
          const Event = require('../models/admin/event.model');
          const event = await Event.findById(match[1]);
          if (!event) isValid = false;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: { valid: isValid }
    });
  } catch (error) {
    console.error('Error verifying notification entity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify notification'
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

    // Use findOneAndUpdate with upsert to avoid race conditions
    const subscription = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        user: userId,
        endpoint,
        keys,
        deviceInfo,
        active: true,
        lastUsed: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

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
  const publicKey = process.env.VAPID_PUBLIC_KEY || null;
  
  console.log('\n🔑 VAPID PUBLIC KEY REQUEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Key exists:', !!publicKey);
  if (publicKey) {
    console.log('Key length:', publicKey.length);
    console.log('Key (first 50):', publicKey.substring(0, 50) + '...');
    console.log('Key (last 50):', '...' + publicKey.substring(publicKey.length - 50));
  } else {
    console.log('⚠️ WARNING: VAPID_PUBLIC_KEY not set in environment!');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  res.status(200).json({
    success: true,
    publicKey: publicKey,
  });
};
