const Notification = require('../models/notification.model');
const NotificationPreferences = require('../models/notificationPreferences.model');
const PushSubscription = require('../models/pushSubscription.model');
const webPush = require('web-push');
const { sendEmail } = require('../mail/notificationMailer');

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    `mailto:${process.env.MAIL_FROM_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

class NotificationService {
  
  /**
   * Create and send a notification
   */
  async createNotification({
    recipientId,
    senderId = null,
    type,
    title,
    message,
    actionUrl = null,
    relatedEntity = null,
    priority = 'medium',
    metadata = {},
  }) {
    try {
      // Check user preferences
      const preferences = await this.getUserPreferences(recipientId);
      
      // Check if type is muted
      if (preferences.inApp.mutedTypes.includes(type)) {
        console.log(`Notification type ${type} is muted for user ${recipientId}`);
        return null;
      }

      // Check Do Not Disturb
      if (this.isDoNotDisturbActive(preferences)) {
        console.log(`DND active for user ${recipientId}, notification will be queued`);
      }

      // Create notification document
      const notification = await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type,
        title,
        message,
        actionUrl,
        relatedEntity,
        priority,
        metadata,
        expiresAt: this.getExpiryDate(type),
      });

      // Send via different channels
      const deliveryStatus = {};

      // 1. In-app (always send if not muted)
      deliveryStatus.inApp = await this.sendInApp(notification);

      // 2. Push notification (if user has it enabled)
      if (preferences.push[type] !== false) {
        deliveryStatus.push = await this.sendPushNotification(notification);
      }

      // 3. Email notification (if user has it enabled)
      if (preferences.email[type] === true) {
        deliveryStatus.email = await this.sendEmailNotification(notification);
      }

      // Update delivery status
      await Notification.findByIdAndUpdate(notification._id, {
        deliveryStatus,
      });

      return notification;

    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send in-app notification via Socket.io
   */
  async sendInApp(notification) {
    try {
      const io = global.io;
      
      if (!io) {
        console.warn('Socket.io not available');
        return false;
      }

      // Populate sender details for display
      await notification.populate('sender', 'name profilePicture');

      // Emit to user's room
      io.to(`user:${notification.recipient}`).emit('notification', {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        sender: notification.sender,
        actionUrl: notification.actionUrl,
        priority: notification.priority,
        createdAt: notification.createdAt,
      });

      // Also update badge count
      const unreadCount = await this.getUnreadCount(notification.recipient);
      io.to(`user:${notification.recipient}`).emit('notification:badge', {
        count: unreadCount,
      });

      return true;
    } catch (error) {
      console.error('Error sending in-app notification:', error);
      return false;
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(notification) {
    try {
      const subscriptions = await PushSubscription.find({
        user: notification.recipient,
        active: true,
      });

      if (subscriptions.length === 0) {
        return false;
      }

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: {
          url: notification.actionUrl || '/',
          notificationId: notification._id,
        },
      });

      const pushPromises = subscriptions.map(async (subscription) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
              },
            },
            payload
          );

          // Update last used
          subscription.lastUsed = new Date();
          await subscription.save();

          return true;
        } catch (error) {
          // If subscription is expired/invalid, deactivate it
          if (error.statusCode === 410 || error.statusCode === 404) {
            subscription.active = false;
            await subscription.save();
          }
          console.error('Push notification failed:', error);
          return false;
        }
      });

      const results = await Promise.allSettled(pushPromises);
      return results.some(r => r.status === 'fulfilled' && r.value === true);

    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(notification) {
    try {
      const User = require('./user/user.model');
      const user = await User.findById(notification.recipient, 'email name');

      if (!user || !user.email) {
        return false;
      }

      await sendEmail({
        to: user.email,
        subject: notification.title,
        template: 'notification',
        data: {
          name: user.name,
          title: notification.title,
          message: notification.message,
          actionUrl: notification.actionUrl
            ? `${process.env.FRONTEND_URL}${notification.actionUrl}`
            : process.env.FRONTEND_URL,
        },
      });

      return true;
    } catch (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
  }

  /**
   * Get user's notification preferences
   */
  async getUserPreferences(userId) {
    let preferences = await NotificationPreferences.findOne({ user: userId });

    // Create default preferences if not exists
    if (!preferences) {
      preferences = await NotificationPreferences.create({ user: userId });
    }

    return preferences;
  }

  /**
   * Check if Do Not Disturb is active
   */
  isDoNotDisturbActive(preferences) {
    if (!preferences.doNotDisturb.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = preferences.doNotDisturb.start;
    const end = preferences.doNotDisturb.end;

    // Handle overnight DND (e.g., 22:00 to 08:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    }

    return currentTime >= start && currentTime <= end;
  }

  /**
   * Get expiry date based on notification type
   */
  getExpiryDate(type) {
    const expiryDays = {
      connection_request: 30,
      connection_accepted: 7,
      post_like: 7,
      post_comment: 14,
      new_message: 30,
      event_reminder: 1,
      system_announcement: 90,
    };

    const days = expiryDays[type] || 30;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    return expiry;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    return await Notification.countDocuments({
      recipient: userId,
      read: false,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true, readAt: new Date() },
      { new: true }
    );

    // Update badge count
    if (notification) {
      const unreadCount = await this.getUnreadCount(userId);
      const io = global.io;
      if (io) {
        io.to(`user:${userId}`).emit('notification:badge', {
          count: unreadCount,
        });
      }
    }

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true, readAt: new Date() }
    );

    // Update badge count
    const io = global.io;
    if (io) {
      io.to(`user:${userId}`).emit('notification:badge', { count: 0 });
    }

    return true;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    return await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false }) {
    const query = { recipient: userId };
    
    if (unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name profilePicture')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }
}

module.exports = new NotificationService();
