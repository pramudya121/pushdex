import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

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
}

const ALERTS_STORAGE_KEY = 'pushdex_price_alerts';

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);

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
  }, []);

  // Save alerts to localStorage
  const saveAlerts = useCallback((newAlerts: PriceAlert[]) => {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(newAlerts));
  }, []);

  const addAlert = useCallback((alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => {
    const newAlert: PriceAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      triggered: false,
    };
    
    setAlerts(prev => {
      const updated = [...prev, newAlert];
      saveAlerts(updated);
      return updated;
    });

    toast({
      title: "Price Alert Created",
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

        if (shouldTrigger) {
          hasChanges = true;
          toast({
            title: "🔔 Price Alert Triggered!",
            description: `${alert.token0Symbol}/${alert.token1Symbol} is now ${alert.condition} ${alert.targetPrice.toFixed(6)} (Current: ${currentPrice.toFixed(6)})`,
            variant: "default",
          });
          return { ...alert, triggered: true, currentPrice };
        }

        return { ...alert, currentPrice };
      });

      if (hasChanges) {
        saveAlerts(updated.filter(a => !a.triggered));
      }

      return updated.filter(a => !a.triggered);
    });
  }, [saveAlerts]);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
    saveAlerts([]);
    toast({
      title: "All Alerts Cleared",
      description: "All price alerts have been removed.",
    });
  }, [saveAlerts]);

  return {
    alerts,
    addAlert,
    removeAlert,
    checkAlerts,
    clearAllAlerts,
  };
}
