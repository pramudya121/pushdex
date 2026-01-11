import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface PriceAlert {
  id: string;
  token0Symbol: string;
  token1Symbol: string;
  pairAddress: string;
  targetPrice: number;
  condition: 'above' | 'below';
  currentPrice: number;
  createdAt: number;
  triggered: boolean;
  notified: boolean;
}

const ALERTS_STORAGE_KEY = 'pushdex_price_alerts';

// Request notification permission
const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

// Show browser notification
const showBrowserNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/tokens/pc.png',
      badge: '/tokens/pc.png',
    });
  }
};

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasRequestedPermission = useRef(false);

  // Load alerts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAlerts(parsed.filter((a: PriceAlert) => !a.triggered));
      } catch (e) {
        console.error('Failed to parse price alerts:', e);
      }
    }
    
    // Request notification permission on first load
    if (!hasRequestedPermission.current) {
      hasRequestedPermission.current = true;
      requestNotificationPermission();
    }
  }, []);

  // Save alerts to localStorage
  const saveAlerts = useCallback((newAlerts: PriceAlert[]) => {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(newAlerts));
  }, []);

  const addAlert = useCallback((alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered' | 'notified'>) => {
    const newAlert: PriceAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      triggered: false,
      notified: false,
    };
    
    setAlerts(prev => {
      const updated = [...prev, newAlert];
      saveAlerts(updated);
      return updated;
    });

    toast.success("Price Alert Created", {
      description: `Alert set for ${alert.token0Symbol}/${alert.token1Symbol} when price goes ${alert.condition} ${alert.targetPrice.toFixed(6)}`,
    });

    return newAlert;
  }, [saveAlerts]);

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => {
      const updated = prev.filter(a => a.id !== id);
      saveAlerts(updated);
      return updated;
    });
    toast.info("Alert removed");
  }, [saveAlerts]);

  const checkAlerts = useCallback((pairAddress: string, currentPrice: number) => {
    setAlerts(prev => {
      let hasChanges = false;
      const updated = prev.map(alert => {
        if (alert.pairAddress.toLowerCase() !== pairAddress.toLowerCase() || alert.triggered) {
          return alert;
        }

        const shouldTrigger = 
          (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
          (alert.condition === 'below' && currentPrice <= alert.targetPrice);

        if (shouldTrigger && !alert.notified) {
          hasChanges = true;
          
          // Show toast notification
          toast.success("🔔 Price Alert Triggered!", {
            description: `${alert.token0Symbol}/${alert.token1Symbol} is now ${alert.condition} ${alert.targetPrice.toFixed(6)} (Current: ${currentPrice.toFixed(6)})`,
            duration: 10000,
          });
          
          // Show browser notification
          showBrowserNotification(
            "🔔 Price Alert Triggered!",
            `${alert.token0Symbol}/${alert.token1Symbol} is now ${alert.condition} ${alert.targetPrice.toFixed(6)}`
          );
          
          return { ...alert, triggered: true, notified: true, currentPrice };
        }

        return { ...alert, currentPrice };
      });

      if (hasChanges) {
        saveAlerts(updated.filter(a => !a.triggered));
      }

      return updated.filter(a => !a.triggered);
    });
  }, [saveAlerts]);

  const checkAllAlerts = useCallback((priceUpdates: Map<string, number>) => {
    priceUpdates.forEach((price, pairAddress) => {
      checkAlerts(pairAddress, price);
    });
  }, [checkAlerts]);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
    saveAlerts([]);
    toast.info("All Alerts Cleared", {
      description: "All price alerts have been removed.",
    });
  }, [saveAlerts]);

  const updateAlertPrice = useCallback((id: string, newPrice: number) => {
    setAlerts(prev => {
      const updated = prev.map(alert => 
        alert.id === id ? { ...alert, currentPrice: newPrice } : alert
      );
      saveAlerts(updated);
      return updated;
    });
  }, [saveAlerts]);

  // Get alerts count for a specific pair
  const getAlertsForPair = useCallback((pairAddress: string) => {
    return alerts.filter(a => a.pairAddress.toLowerCase() === pairAddress.toLowerCase());
  }, [alerts]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  return {
    alerts,
    addAlert,
    removeAlert,
    checkAlerts,
    checkAllAlerts,
    clearAllAlerts,
    updateAlertPrice,
    getAlertsForPair,
  };
}