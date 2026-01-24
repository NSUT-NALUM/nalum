import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from '../hooks/useSocket';
import api from '../lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  sender?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string, deleteAllFromSameSender?: boolean) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { accessToken } = useAuth();
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const response = await api.get('/notifications', {
        params: { page: 1, limit: 20 },
      });

      // Transform _id to id for consistency with socket notifications
      const transformedNotifications = response.data.data.notifications.map((n: any) => ({
        ...n,
        id: n._id || n.id,
      }));

      setNotifications(transformedNotifications);
      
      // Also fetch unread count
      const countResponse = await api.get('/notifications/unread-count');
      setUnreadCount(countResponse.data.count);

    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark as read
  const markAsRead = async (notificationId: string) => {
    if (!accessToken) return;

    try {
      await api.patch(
        `/notifications/${notificationId}/read`
      );

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!accessToken) return;

    try {
      await api.patch(
        '/notifications/mark-all-read'
      );

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);

    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification (with support for bulk deletion of message notifications)
  const deleteNotification = async (notificationId: string, deleteAllFromSameSender = false) => {
    if (!accessToken) return;

    try {
      // Find the notification being deleted
      const notification = notifications.find(n => n.id === notificationId);
      
      // If it's a message notification and we want to delete all from same sender
      if (deleteAllFromSameSender && notification?.type === 'new_message' && notification.sender?._id) {
        const senderId = notification.sender._id;
        
        // Get all message notification IDs from this sender
        const notificationIdsToDelete = notifications
          .filter(n => n.type === 'new_message' && n.sender?._id === senderId)
          .map(n => n.id);

        // Delete all of them from backend
        await Promise.all(
          notificationIdsToDelete.map(id => api.delete(`/notifications/${id}`))
        );

        // Update local state - remove all message notifications from this sender
        setNotifications(prev => prev.filter(n => 
          !(n.type === 'new_message' && n.sender?._id === senderId)
        ));
      } else {
        // Single notification deletion
        await api.delete(`/notifications/${notificationId}`);

        // Update local state
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }

    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Listen for real-time notifications via Socket.io
  useEffect(() => {
    if (!socket || !isConnected) return;

    // New notification received
    socket.on('notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    // Badge count update
    socket.on('notification:badge', ({ count }: { count: number }) => {
      setUnreadCount(count);
    });

    // Notification removed (e.g., when message is unsent)
    socket.on('notification:removed', ({ notificationId }: { notificationId: string }) => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    });

    return () => {
      socket.off('notification');
      socket.off('notification:badge');
      socket.off('notification:removed');
    };
  }, [socket, isConnected]);

  // Initial fetch
  useEffect(() => {
    if (accessToken) {
      fetchNotifications();
    }
  }, [accessToken]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
