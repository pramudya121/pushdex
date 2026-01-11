import { useState, useCallback, useRef, useEffect } from 'react';
import { ethers } from 'ethers';
import { RPC_URL } from '@/config/contracts';

// Cache for contract data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 30000; // 30 seconds

// Global cache
const globalCache = new Map<string, CacheEntry<any>>();

export function useContractCache<T>(key: string) {
  const get = useCallback((): T | null => {
    const entry = globalCache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
      return entry.data;
    }
    return null;
  }, [key]);

  const set = useCallback((data: T) => {
    globalCache.set(key, { data, timestamp: Date.now() });
  }, [key]);

  const invalidate = useCallback(() => {
    globalCache.delete(key);
  }, [key]);

  return { get, set, invalidate };
}

// Debounced async function hook
export function useDebouncedCallback<T extends (...args: any[]) => Promise<any>>(
  callback: T,
  delay: number = 300
) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>): Promise<ReturnType<T>> => {
      return new Promise((resolve, reject) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(async () => {
          try {
            const result = await callbackRef.current(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    },
    [delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// Optimized provider with connection pooling
let providerInstance: ethers.JsonRpcProvider | null = null;

export function getOptimizedProvider(): ethers.JsonRpcProvider {
  if (!providerInstance) {
    providerInstance = new ethers.JsonRpcProvider(RPC_URL, undefined, {
      staticNetwork: true,
      batchMaxCount: 10,
    });
  }
  return providerInstance;
}

// Batch contract calls
export async function batchContractCalls<T>(
  calls: Array<() => Promise<T>>
): Promise<T[]> {
  return Promise.all(calls.map(call => 
    call().catch(error => {
      console.warn('Batch call failed:', error);
      return null as T;
    })
  ));
}

// Retry mechanism for contract calls
export async function retryContractCall<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError!;
}

// Loading state with minimum duration to prevent flickering
export function useMinLoadingDuration(isLoading: boolean, minDuration: number = 300) {
  const [showLoading, setShowLoading] = useState(isLoading);
  const loadingStartRef = useRef<number>(0);

  useEffect(() => {
    if (isLoading) {
      loadingStartRef.current = Date.now();
      setShowLoading(true);
    } else {
      const elapsed = Date.now() - loadingStartRef.current;
      const remaining = Math.max(0, minDuration - elapsed);
      
      if (remaining > 0) {
        const timeout = setTimeout(() => setShowLoading(false), remaining);
        return () => clearTimeout(timeout);
      } else {
        setShowLoading(false);
      }
    }
  }, [isLoading, minDuration]);

  return showLoading;
}

// Transaction state management
export interface TransactionState {
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  hash: string | null;
}

export function useTransactionState() {
  const [state, setState] = useState<TransactionState>({
    isPending: false,
    isConfirming: false,
    isSuccess: false,
    isError: false,
    error: null,
    hash: null,
  });

  const reset = useCallback(() => {
    setState({
      isPending: false,
      isConfirming: false,
      isSuccess: false,
      isError: false,
      error: null,
      hash: null,
    });
  }, []);

  const setPending = useCallback(() => {
    setState(prev => ({ ...prev, isPending: true, isError: false, error: null }));
  }, []);

  const setConfirming = useCallback((hash: string) => {
    setState(prev => ({ ...prev, isPending: false, isConfirming: true, hash }));
  }, []);

  const setSuccess = useCallback(() => {
    setState(prev => ({ ...prev, isConfirming: false, isSuccess: true }));
  }, []);

  const setError = useCallback((error: Error) => {
    setState(prev => ({ 
      ...prev, 
      isPending: false, 
      isConfirming: false, 
      isError: true, 
      error 
    }));
  }, []);

  return { state, reset, setPending, setConfirming, setSuccess, setError };
}
