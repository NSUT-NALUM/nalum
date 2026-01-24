import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { NotificationList } from './NotificationList';
import { useNotifications } from '../context/NotificationContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { toast } from 'sonner';

export const NotificationBell = () => {
  const { unreadCount } = useNotifications();
  const { isSupported, permission, subscribe } = usePushNotifications();
  const [open, setOpen] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);

  useEffect(() => {
    // Show push notification prompt if supported but not enabled
    if (isSupported() && permission === 'default') {
      setShowPushPrompt(true);
    } else {
      setShowPushPrompt(false);
    }
  }, [permission, isSupported]);

  const handleEnablePush = async () => {
    const success = await subscribe();
    if (success) {
      toast.success('Push notifications enabled!');
      setShowPushPrompt(false);
    } else {
      toast.error('Failed to enable push notifications');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        {showPushPrompt && (
          <div className="p-3 bg-blue-50 border-b border-blue-100">
            <p className="text-sm text-blue-900 mb-2">
              Enable push notifications to stay updated even when the app is closed
            </p>
            <Button 
              size="sm" 
              className="w-full"
              onClick={handleEnablePush}
            >
              Enable Push Notifications
            </Button>
          </div>
        )}
        <NotificationList onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};
