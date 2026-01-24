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
  deleteNotification: (notificationId: string) => Promise<void>;
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

      setNotifications(response.data.data.notifications);
      
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

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    if (!accessToken) return;

    try {
      await api.delete(`/notifications/${notificationId}`);

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

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

    return () => {
      socket.off('notification');
      socket.off('notification:badge');
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
