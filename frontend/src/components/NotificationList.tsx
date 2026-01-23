import { useNotifications } from '../context/NotificationContext';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { NotificationItem } from './NotificationItem';
import { Loader2, CheckCheck, Inbox } from 'lucide-react';

interface NotificationListProps {
  onClose: () => void;
}

export const NotificationList = ({ onClose }: NotificationListProps) => {
  const { 
    notifications, 
    loading, 
    unreadCount, 
    markAllAsRead 
  } = useNotifications();

  return (
    <div className="flex flex-col h-[500px]">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-lg">Notifications</h3>
        {unreadCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={markAllAsRead}
            className="text-xs"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Inbox className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map(notification => (
              <NotificationItem 
                key={notification.id} 
                notification={notification}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
