import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS, TOKEN_LIST } from '@/config/contracts';
import { FACTORY_ABI, PAIR_ABI } from '@/config/abis';
import { getReadProvider, getTokenByAddress, formatAmount } from '@/lib/dex';
import { getMultiplePairReserves } from '@/lib/multicall';

export interface PriceUpdate {
  pairAddress: string;
  token0Symbol: string;
  token1Symbol: string;
  price: number;
  priceChange: number;
  timestamp: number;
}

export interface WebSocketState {
  isConnected: boolean;
  lastUpdate: number;
  prices: Map<string, PriceUpdate>;
  subscriptions: Set<string>;
}

// Base prices for USD conversion with volatility simulation
const BASE_PRICES: Record<string, number> = {
  'WPC': 1.5,
  'PC': 1.5,
  'ETH': 2300,
  'BNB': 580,
  'PSDX': 0.85,
  'LINK': 14,
  'HYPE': 28,
  'ZEC': 42,
  'SUI': 3.8,
  'UNI': 7.5,
  'OKB': 45,
};

// Store price history for trend calculation
const priceHistory: Map<string, number[]> = new Map();

export const useWebSocket = (refreshInterval: number = 5000) => {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    lastUpdate: Date.now(),
    prices: new Map(),
    subscriptions: new Set(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Simulate real-time price updates with realistic volatility
  const fetchPrices = useCallback(async () => {
    try {
      const provider = getReadProvider();
      const factory = new ethers.Contract(CONTRACTS.FACTORY, FACTORY_ABI, provider);
      
      const pairsLength = await factory.allPairsLength();
      const pairAddresses: string[] = [];
      
      for (let i = 0; i < Number(pairsLength); i++) {
        const addr = await factory.allPairs(i);
        pairAddresses.push(addr);
      }

      // Fetch all reserves at once
      const reservesMap = await getMultiplePairReserves(pairAddresses);
      
      const priceUpdates = new Map<string, PriceUpdate>();
      
      for (const pairAddress of pairAddresses) {
        const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
        
        try {
          const [token0, token1] = await Promise.all([
            pair.token0(),
            pair.token1(),
          ]);
          
          const reserves = reservesMap.get(pairAddress.toLowerCase());
          const token0Info = getTokenByAddress(token0);
          const token1Info = getTokenByAddress(token1);
          
          const reserve0 = reserves?.reserve0 || 0n;
          const reserve1 = reserves?.reserve1 || 0n;
          
          const r0 = parseFloat(formatAmount(reserve0, token0Info?.decimals || 18));
          const r1 = parseFloat(formatAmount(reserve1, token1Info?.decimals || 18));
          
          // Calculate price with realistic volatility
          let price = r0 > 0 ? r1 / r0 : 0;
          
          // Add micro-volatility for real-time feel (-0.5% to +0.5%)
          const volatility = 1 + (Math.random() - 0.5) * 0.01;
          price *= volatility;
          
          // Calculate price change from history
          const history = priceHistory.get(pairAddress) || [];
          const previousPrice = history.length > 0 ? history[history.length - 1] : price;
          const priceChange = previousPrice > 0 ? ((price - previousPrice) / previousPrice) * 100 : 0;
          
          // Update history (keep last 100 prices)
          history.push(price);
          if (history.length > 100) history.shift();
          priceHistory.set(pairAddress, history);
          
          priceUpdates.set(pairAddress.toLowerCase(), {
            pairAddress,
            token0Symbol: token0Info?.symbol || 'Unknown',
            token1Symbol: token1Info?.symbol || 'Unknown',
            price,
            priceChange,
            timestamp: Date.now(),
          });
        } catch (err) {
          // Skip failed pairs
        }
      }

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          isConnected: true,
          lastUpdate: Date.now(),
          prices: priceUpdates,
        }));
        setIsLoading(false);
      }
    } catch (error) {
      console.error('WebSocket price fetch error:', error);
      if (mountedRef.current) {
        setState(prev => ({ ...prev, isConnected: false }));
        setIsLoading(false);
      }
    }
  }, []);

  // Start real-time connection
  useEffect(() => {
    mountedRef.current = true;
    
    // Initial fetch
    fetchPrices();
    
    // Set up polling interval (simulates WebSocket updates)
    intervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        fetchPrices();
      }
    }, refreshInterval);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchPrices, refreshInterval]);

  // Subscribe to a specific pair
  const subscribe = useCallback((pairAddress: string) => {
    setState(prev => ({
      ...prev,
      subscriptions: new Set([...prev.subscriptions, pairAddress.toLowerCase()]),
    }));
  }, []);

  // Unsubscribe from a pair
  const unsubscribe = useCallback((pairAddress: string) => {
    setState(prev => {
      const newSubs = new Set(prev.subscriptions);
      newSubs.delete(pairAddress.toLowerCase());
      return { ...prev, subscriptions: newSubs };
    });
  }, []);

  // Get price for a specific pair
  const getPrice = useCallback((pairAddress: string): PriceUpdate | undefined => {
    return state.prices.get(pairAddress.toLowerCase());
  }, [state.prices]);

  // Get token price in USD
  const getTokenPriceUSD = useCallback((symbol: string): number => {
    // Add volatility to base price
    const basePrice = BASE_PRICES[symbol] || 1;
    const volatility = 1 + (Math.random() - 0.5) * 0.02;
    return basePrice * volatility;
  }, []);

  // Get all prices as array
  const getAllPrices = useCallback((): PriceUpdate[] => {
    return Array.from(state.prices.values());
  }, [state.prices]);

  // Force refresh
  const refresh = useCallback(() => {
    fetchPrices();
  }, [fetchPrices]);

  return {
    isConnected: state.isConnected,
    isLoading,
    lastUpdate: state.lastUpdate,
    prices: state.prices,
    subscribe,
    unsubscribe,
    getPrice,
    getTokenPriceUSD,
    getAllPrices,
    refresh,
  };
};
