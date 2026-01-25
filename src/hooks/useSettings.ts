import { useState, useEffect, useCallback } from 'react';

export interface UserSettings {
  // Network Settings
  customRpcUrl: string;
  useCustomRpc: boolean;
  
  // Trading Defaults
  defaultSlippage: number;
  defaultDeadline: number;
  expertMode: boolean;
  
  // Display Preferences
  theme: 'dark' | 'light' | 'system';
  language: 'en' | 'id';
  showTestnetWarning: boolean;
  compactMode: boolean;
  
  // Notifications
  enableSoundEffects: boolean;
  enablePriceAlerts: boolean;
  
  // Privacy
  hideBalances: boolean;
  disableAnalytics: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  customRpcUrl: '',
  useCustomRpc: false,
  defaultSlippage: 0.5,
  defaultDeadline: 20,
  expertMode: false,
  theme: 'dark',
  language: 'en',
  showTestnetWarning: true,
  compactMode: false,
  enableSoundEffects: true,
  enablePriceAlerts: true,
  hideBalances: false,
  disableAnalytics: false,
};

const STORAGE_KEY = 'pushdex_settings';

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return DEFAULT_SETTINGS;
  });

  const [isDirty, setIsDirty] = useState(false);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: UserSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      setIsDirty(false);
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }, []);

  // Update a single setting
  const updateSetting = useCallback(<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      setIsDirty(true);
      return newSettings;
    });
  }, []);

  // Reset to defaults
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
    setIsDirty(false);
  }, []);

  // Auto-save when settings change (debounced)
  useEffect(() => {
    if (isDirty) {
      const timer = setTimeout(() => {
        saveSettings(settings);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [settings, isDirty, saveSettings]);

  // Validate RPC URL
  const validateRpcUrl = useCallback(async (url: string): Promise<boolean> => {
    if (!url) return false;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1,
        }),
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      return !!data.result;
    } catch {
      return false;
    }
  }, []);

  // Get effective RPC URL
  const getEffectiveRpcUrl = useCallback(() => {
    if (settings.useCustomRpc && settings.customRpcUrl) {
      return settings.customRpcUrl;
    }
    return 'https://evm.donut.rpc.push.org';
  }, [settings.useCustomRpc, settings.customRpcUrl]);

  return {
    settings,
    updateSetting,
    saveSettings,
    resetSettings,
    validateRpcUrl,
    getEffectiveRpcUrl,
    isDirty,
    DEFAULT_SETTINGS,
  };
};

// Export for use in other components
export const getStoredSettings = (): UserSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
};
