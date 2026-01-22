import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { TokenInfo } from '@/config/contracts';
import { toast } from 'sonner';

export interface LimitOrder {
  id: string;
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  amountIn: string;
  targetPrice: number;
  currentPrice: number;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  createdAt: number;
  expiresAt: number;
  filledAt?: number;
  txHash?: string;
}

const STORAGE_KEY = 'pushdex_limit_orders';

export const useLimitOrders = () => {
  const { address } = useWallet();
  const [orders, setOrders] = useState<LimitOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load orders from localStorage
  useEffect(() => {
    if (!address) {
      setOrders([]);
      return;
    }

    const stored = localStorage.getItem(`${STORAGE_KEY}_${address}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setOrders(parsed);
      } catch {
        setOrders([]);
      }
    }
  }, [address]);

  // Save orders to localStorage
  const saveOrders = useCallback((newOrders: LimitOrder[]) => {
    if (!address) return;
    localStorage.setItem(`${STORAGE_KEY}_${address}`, JSON.stringify(newOrders));
    setOrders(newOrders);
  }, [address]);

  // Create a new limit order
  const createOrder = useCallback((
    tokenIn: TokenInfo,
    tokenOut: TokenInfo,
    amountIn: string,
    targetPrice: number,
    currentPrice: number,
    expiresInHours: number = 24
  ): LimitOrder => {
    const now = Date.now();
    const order: LimitOrder = {
      id: `order_${now}_${Math.random().toString(36).substr(2, 9)}`,
      tokenIn,
      tokenOut,
      amountIn,
      targetPrice,
      currentPrice,
      status: 'pending',
      createdAt: now,
      expiresAt: now + expiresInHours * 60 * 60 * 1000,
    };

    const newOrders = [order, ...orders];
    saveOrders(newOrders);
    
    toast.success(`Limit order created: ${amountIn} ${tokenIn.symbol} → ${tokenOut.symbol} @ ${targetPrice}`);
    
    return order;
  }, [orders, saveOrders]);

  // Cancel an order
  const cancelOrder = useCallback((orderId: string) => {
    const newOrders = orders.map(o => 
      o.id === orderId ? { ...o, status: 'cancelled' as const } : o
    );
    saveOrders(newOrders);
    toast.success('Order cancelled');
  }, [orders, saveOrders]);

  // Fill an order (mark as executed)
  const fillOrder = useCallback((orderId: string, txHash: string) => {
    const newOrders = orders.map(o => 
      o.id === orderId 
        ? { ...o, status: 'filled' as const, filledAt: Date.now(), txHash } 
        : o
    );
    saveOrders(newOrders);
  }, [orders, saveOrders]);

  // Update order prices
  const updateOrderPrices = useCallback((priceUpdates: Map<string, number>) => {
    const now = Date.now();
    let hasUpdates = false;

    const newOrders = orders.map(order => {
      // Check for expiry
      if (order.status === 'pending' && order.expiresAt < now) {
        hasUpdates = true;
        return { ...order, status: 'expired' as const };
      }

      // Update current price
      const pairKey = `${order.tokenIn.symbol}_${order.tokenOut.symbol}`;
      const newPrice = priceUpdates.get(pairKey);
      
      if (newPrice !== undefined && newPrice !== order.currentPrice) {
        hasUpdates = true;
        return { ...order, currentPrice: newPrice };
      }

      return order;
    });

    if (hasUpdates) {
      saveOrders(newOrders);
    }
  }, [orders, saveOrders]);

  // Get orders that can be executed
  const getExecutableOrders = useCallback((): LimitOrder[] => {
    return orders.filter(order => {
      if (order.status !== 'pending') return false;
      
      // Check if target price is reached
      // For buy orders: current price <= target price
      // For sell orders: current price >= target price
      return order.currentPrice >= order.targetPrice;
    });
  }, [orders]);

  // Clear all cancelled/expired orders
  const clearOldOrders = useCallback(() => {
    const newOrders = orders.filter(o => 
      o.status === 'pending' || o.status === 'filled'
    );
    saveOrders(newOrders);
    toast.success('Cleared old orders');
  }, [orders, saveOrders]);

  // Get orders by status
  const getOrdersByStatus = useCallback((status: LimitOrder['status']): LimitOrder[] => {
    return orders.filter(o => o.status === status);
  }, [orders]);

  // Statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    filled: orders.filter(o => o.status === 'filled').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    expired: orders.filter(o => o.status === 'expired').length,
  };

  return {
    orders,
    isLoading,
    stats,
    createOrder,
    cancelOrder,
    fillOrder,
    updateOrderPrices,
    getExecutableOrders,
    getOrdersByStatus,
    clearOldOrders,
  };
};
