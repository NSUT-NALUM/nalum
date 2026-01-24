import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export const usePushNotifications = () => {
  const { accessToken } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  // Check if push notifications are supported
  const isSupported = () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  };

  // Request notification permission
  const requestPermission = async () => {
    if (!isSupported()) {
      console.warn('Push notifications not supported');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  };

  // Subscribe to push notifications
  const subscribe = async () => {
    if (!accessToken) {
      console.warn('No access token available');
      return false;
    }

    try {
      // First request permission
      const permissionGranted = await requestPermission();
      if (!permissionGranted) {
        console.warn('Notification permission not granted');
        return false;
      }

      // Unregister any existing service workers first (clean slate)
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of existingRegistrations) {
        await registration.unregister();
      }

      // Register service worker with explicit scope
      console.log('Registering service worker...');
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service worker registered, waiting for ready state...');
      await navigator.serviceWorker.ready;
      console.log('Service worker ready');

      // Get VAPID public key from server
      console.log('Fetching VAPID public key...');
      const { data } = await api.get('/notifications/push/vapid-public-key');
      const publicKey = data.publicKey;

      if (!publicKey) {
        throw new Error('VAPID public key not available from server');
      }

      console.log('Subscribing to push manager...');
      // Subscribe to push
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      console.log('Push subscription successful, sending to server...');
      // Send subscription to server
      await api.post(
        '/notifications/push/subscribe',
        {
          endpoint: pushSubscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
            auth: arrayBufferToBase64(pushSubscription.getKey('auth')!),
          },
          deviceInfo: {
            userAgent: navigator.userAgent,
            browser: getBrowserName(),
            os: getOSName(),
          },
        }
      );

      console.log('Subscription saved to server');
      setSubscription(pushSubscription);
      return true;

    } catch (error) {
      console.error('Error subscribing to push:', error);
      return false;
    }
  };

  // Unsubscribe
  const unsubscribe = async () => {
    if (!subscription) return;

    try {
      await api.post(
        '/notifications/push/unsubscribe',
        { endpoint: subscription.endpoint }
      );

      await subscription.unsubscribe();
      setSubscription(null);

    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  };

  // Check current subscription
  useEffect(() => {
    if (!isSupported()) return;

    navigator.serviceWorker.ready.then(async (registration) => {
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    });

    setPermission(Notification.permission);
  }, []);

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
  };
};

// Helper functions
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function getBrowserName() {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getOSName() {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Win')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
}
