import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { TOKEN_LIST } from '@/config/contracts';
import {
  getMultipleBalances,
  getMultiplePairReserves,
  getMultipleTokenInfo,
  getEthBalanceMulticall,
} from '@/lib/multicall';
import { formatAmount } from '@/lib/dex';

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceRaw: bigint;
}

export interface UseMulticallState {
  balances: TokenBalance[];
  isLoading: boolean;
  error: string | null;
}

export const useMulticall = () => {
  const { address, isConnected } = useWallet();
  
  const [state, setState] = useState<UseMulticallState>({
    balances: [],
    isLoading: false,
    error: null,
  });

  // Fetch all token balances using multicall
  const fetchAllBalances = useCallback(async () => {
    if (!address || !isConnected) {
      setState(prev => ({ ...prev, balances: [], error: 'Wallet not connected' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const tokenAddresses = TOKEN_LIST.map(t => t.address);
      const balancesMap = await getMultipleBalances(tokenAddresses, address);
      
      const balances: TokenBalance[] = TOKEN_LIST.map(token => {
        const balanceRaw = balancesMap.get(token.address.toLowerCase()) || 0n;
        return {
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          balance: formatAmount(balanceRaw, token.decimals),
          balanceRaw,
        };
      });

      setState(prev => ({
        ...prev,
        balances,
        isLoading: false,
      }));

      return balances;
    } catch (error: any) {
      console.error('Error fetching balances via multicall:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to fetch balances',
      }));
      return [];
    }
  }, [address, isConnected]);

  // Fetch pair reserves using multicall
  const fetchPairReserves = useCallback(async (pairAddresses: string[]) => {
    try {
      const reserves = await getMultiplePairReserves(pairAddresses);
      return reserves;
    } catch (error) {
      console.error('Error fetching pair reserves:', error);
      return new Map();
    }
  }, []);

  // Fetch token info using multicall
  const fetchTokenInfo = useCallback(async (tokenAddresses: string[]) => {
    try {
      const info = await getMultipleTokenInfo(tokenAddresses);
      return info;
    } catch (error) {
      console.error('Error fetching token info:', error);
      return new Map();
    }
  }, []);

  // Get ETH balance via multicall
  const fetchEthBalance = useCallback(async (addr: string) => {
    try {
      const balance = await getEthBalanceMulticall(addr);
      return formatAmount(balance);
    } catch (error) {
      console.error('Error fetching ETH balance via multicall:', error);
      return '0';
    }
  }, []);

  return {
    ...state,
    fetchAllBalances,
    fetchPairReserves,
    fetchTokenInfo,
    fetchEthBalance,
  };
};
