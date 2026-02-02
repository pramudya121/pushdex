import { useCallback, useMemo } from 'react';

// XSS Prevention - sanitize user inputs
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

// Validate Ethereum address
export const isValidEthAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Validate numeric input for amounts
export const isValidAmount = (amount: string): boolean => {
  if (!amount) return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num < Number.MAX_SAFE_INTEGER;
};

// Rate limiting hook
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const useRateLimit = ({ maxRequests = 10, windowMs = 60000 }: Partial<RateLimitConfig> = {}) => {
  const requests = useMemo(() => new Map<string, number[]>(), []);

  const isRateLimited = useCallback((key: string): boolean => {
    const now = Date.now();
    const timestamps = requests.get(key) || [];
    
    // Filter out old requests
    const validTimestamps = timestamps.filter(t => now - t < windowMs);
    
    if (validTimestamps.length >= maxRequests) {
      return true;
    }
    
    validTimestamps.push(now);
    requests.set(key, validTimestamps);
    return false;
  }, [requests, maxRequests, windowMs]);

  return { isRateLimited };
};

// CSRF token generation and validation
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Input validation hook
interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const useInputValidation = () => {
  const validateAddress = useCallback((address: string): ValidationResult => {
    if (!address) {
      return { isValid: false, error: 'Address is required' };
    }
    if (!isValidEthAddress(address)) {
      return { isValid: false, error: 'Invalid Ethereum address format' };
    }
    return { isValid: true };
  }, []);

  const validateAmount = useCallback((amount: string, balance?: string): ValidationResult => {
    if (!amount) {
      return { isValid: false, error: 'Amount is required' };
    }
    if (!isValidAmount(amount)) {
      return { isValid: false, error: 'Invalid amount' };
    }
    if (balance && parseFloat(amount) > parseFloat(balance)) {
      return { isValid: false, error: 'Insufficient balance' };
    }
    return { isValid: true };
  }, []);

  const validateSlippage = useCallback((slippage: string): ValidationResult => {
    const num = parseFloat(slippage);
    if (isNaN(num)) {
      return { isValid: false, error: 'Invalid slippage value' };
    }
    if (num < 0.01 || num > 50) {
      return { isValid: false, error: 'Slippage must be between 0.01% and 50%' };
    }
    return { isValid: true };
  }, []);

  return {
    validateAddress,
    validateAmount,
    validateSlippage,
    sanitizeInput,
  };
};

// Secure storage wrapper
export const secureStorage = {
  set: (key: string, value: string): void => {
    try {
      // Don't store sensitive data in localStorage
      const sanitized = sanitizeInput(value);
      localStorage.setItem(key, sanitized);
    } catch (e) {
      console.error('Storage error:', e);
    }
  },
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Storage error:', e);
      return null;
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Storage error:', e);
    }
  },
};
