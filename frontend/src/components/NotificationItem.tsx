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
    metadata?: Record<string, any>;
  };
  onClose: () => void;
  variant?: "dark" | "light";
}

export const NotificationItem = ({ notification, onClose, variant = "dark" }: NotificationItemProps) => {
  const navigate = useNavigate();
  const { markAsRead, deleteNotification } = useNotifications();
  const light = variant === "light";

  const handleClick = async () => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    const conversationId = notification.metadata?.conversationId;
    const messageId = notification.metadata?.messageId;
    const isChatNotification = ['new_message', 'connection_request', 'connection_accepted'].includes(notification.type);
    const destination = isChatNotification && conversationId
      ? `/dashboard/chat/${conversationId}${messageId ? `?messageId=${messageId}` : ''}`
      : notification.actionUrl;

    if (destination) {
      navigate(destination);
      onClose();
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // For message notifications, delete all from the same sender
    const deleteAllFromSender = notification.type === 'new_message';
    await deleteNotification(notification.id, deleteAllFromSender);
  };

  return (
    <div
      className={cn(
        "p-4 transition-colors cursor-pointer relative group",
        light ? "hover:bg-muted" : "hover:bg-white/5",
        !notification.read && (light ? "bg-primary-subtle/60" : "bg-blue-500/10")
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        {notification.sender && (
          <UserAvatar
            name={notification.sender.name}
            src={notification.sender.profilePicture}
            size="sm"
          />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn("font-medium text-sm line-clamp-1", light ? "text-foreground" : "text-white")}>
            {notification.title}
          </p>
          <p className={cn("text-sm line-clamp-2", light ? "text-muted-foreground" : "text-gray-400")}>
            {notification.message}
          </p>
          <p className={cn("text-xs mt-1", light ? "text-muted-foreground" : "text-gray-500")}>
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>

        {/* Unread indicator & Delete */}
        <div className="flex flex-col items-end gap-2">
          {!notification.read && (
            <div className={cn("h-2 w-2 rounded-full", light ? "bg-primary" : "bg-blue-500")} />
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity", light ? "hover:bg-muted" : "hover:bg-white/10")}
            onClick={handleDelete}
          >
            <X className={cn("h-4 w-4", light ? "text-muted-foreground" : "text-gray-400")} />
          </Button>
        </div>
      </div>
    </div>
  );
};
