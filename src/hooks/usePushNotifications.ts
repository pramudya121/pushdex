import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  priceAlerts: boolean;
  tradeExecuted: boolean;
  lpRewards: boolean;
  whaleAlerts: boolean;
  farmingRewards: boolean;
  stakingRewards: boolean;
  newPools: boolean;
  governanceVotes: boolean;
}

interface PushNotification {
  id: string;
  title: string;
  body: string;
  type: 'price' | 'trade' | 'reward' | 'whale' | 'info';
  timestamp: Date;
  read: boolean;
  data?: Record<string, any>;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  priceAlerts: true,
  tradeExecuted: true,
  lpRewards: true,
  whaleAlerts: true,
  farmingRewards: true,
  stakingRewards: true,
  newPools: false,
  governanceVotes: false,
};

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  // Check support and load preferences on mount
  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
    
    // Load preferences from localStorage
    const savedPrefs = localStorage.getItem('pushdex_notification_prefs');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }
    
    // Load notifications from localStorage
    const savedNotifs = localStorage.getItem('pushdex_notifications');
    if (savedNotifs) {
      const parsed = JSON.parse(savedNotifs).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp),
      }));
      setNotifications(parsed);
      setUnreadCount(parsed.filter((n: PushNotification) => !n.read).length);
    }
  }, []);

  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem('pushdex_notification_prefs', JSON.stringify(preferences));
  }, [preferences]);

  // Save notifications when they change
  useEffect(() => {
    localStorage.setItem('pushdex_notifications', JSON.stringify(notifications));
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive push notifications",
        });
        
        // Register service worker for push notifications
        if ('serviceWorker' in navigator) {
          try {
            await navigator.serviceWorker.register('/sw.js');
          } catch (err) {
            console.log('Service worker registration optional:', err);
          }
        }
        
        return true;
      } else {
        toast({
          title: "Permission Denied",
          description: "Enable notifications in browser settings to receive alerts",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported, toast]);

  // Send a notification
  const sendNotification = useCallback(async (
    title: string,
    body: string,
    type: PushNotification['type'],
    data?: Record<string, any>
  ) => {
    const notification: PushNotification = {
      id: Date.now().toString(),
      title,
      body,
      type,
      timestamp: new Date(),
      read: false,
      data,
    };
    
    // Add to local notifications
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
    
    // Show browser notification if permitted
    if (permission === 'granted') {
      try {
        const icon = type === 'price' ? '📊' : type === 'trade' ? '✅' : type === 'reward' ? '🎁' : type === 'whale' ? '🐋' : 'ℹ️';
        
        new Notification(title, {
          body,
          icon: '/tokens/psdx.png',
          badge: '/tokens/psdx.png',
          tag: type,
          requireInteraction: type === 'trade' || type === 'whale',
        });
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
    
    // Also show in-app toast
    toast({
      title,
      description: body,
    });
    
    return notification;
  }, [permission, toast]);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Update preferences
  const updatePreferences = useCallback((key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);

  // Simulate notifications for demo
  const simulateNotification = useCallback((type: PushNotification['type']) => {
    const notifications: Record<PushNotification['type'], { title: string; body: string }> = {
      price: { 
        title: '📊 Price Alert', 
        body: 'ETH reached your target price of $2,500!' 
      },
      trade: { 
        title: '✅ Trade Executed', 
        body: 'Successfully swapped 1 ETH for 2,450 USDC' 
      },
      reward: { 
        title: '🎁 Rewards Ready', 
        body: 'You have 125 PSDX rewards to claim!' 
      },
      whale: { 
        title: '🐋 Whale Alert', 
        body: 'Large buy detected: 500 ETH ($1.25M)' 
      },
      info: { 
        title: 'ℹ️ Update', 
        body: 'New liquidity pool added: ETH/PSDX' 
      },
    };
    
    const { title, body } = notifications[type];
    sendNotification(title, body, type);
  }, [sendNotification]);

  return {
    isSupported,
    permission,
    preferences,
    notifications,
    unreadCount,
    requestPermission,
    sendNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    updatePreferences,
    simulateNotification,
  };
};
