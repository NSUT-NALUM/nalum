import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import UserAvatar from './UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: {
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
  };
  onClose: () => void;
}

export const NotificationItem = ({ notification, onClose }: NotificationItemProps) => {
  const navigate = useNavigate();
  const { markAsRead, deleteNotification } = useNotifications();

  const handleClick = async () => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onClose();
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notification.id);
  };

  return (
    <div
      className={cn(
        "p-4 hover:bg-accent transition-colors cursor-pointer relative group",
        !notification.read && "bg-blue-50/50 dark:bg-blue-950/20"
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        {notification.sender && (
          <UserAvatar 
            user={notification.sender} 
            size="sm"
          />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm line-clamp-1">
            {notification.title}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>

        {/* Unread indicator & Delete */}
        <div className="flex flex-col items-end gap-2">
          {!notification.read && (
            <div className="h-2 w-2 rounded-full bg-blue-600" />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDelete}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
