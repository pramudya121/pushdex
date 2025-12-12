import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { CONTRACTS } from '@/config/contracts';
import { wrapPC, unwrapPC, getWPCBalance, getWPCAllowance, approveWPC } from '@/lib/weth';
import { formatAmount, parseAmount } from '@/lib/dex';
import { toast } from 'sonner';

export interface WETHState {
  wpcBalance: string;
  pcBalance: string;
  isLoading: boolean;
  isWrapping: boolean;
  isUnwrapping: boolean;
}

export const useWETH = () => {
  const { address, signer, isConnected, isCorrectNetwork, provider } = useWallet();
  
  const [state, setState] = useState<WETHState>({
    wpcBalance: '0',
    pcBalance: '0',
    isLoading: false,
    isWrapping: false,
    isUnwrapping: false,
  });

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    if (!address || !provider) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const [wpcBal, pcBal] = await Promise.all([
        getWPCBalance(address),
        provider.getBalance(address),
      ]);
      
      setState(prev => ({
        ...prev,
        wpcBalance: formatAmount(wpcBal),
        pcBalance: formatAmount(pcBal),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error fetching WETH balances:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [address, provider]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Wrap PC to WPC
  const wrap = useCallback(async (amount: string) => {
    if (!signer || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    if (!isCorrectNetwork) {
      toast.error('Please switch to Push Testnet');
      return false;
    }

    setState(prev => ({ ...prev, isWrapping: true }));

    try {
      const amountWei = parseAmount(amount);
      const tx = await wrapPC(signer, amountWei);
      
      toast.loading('Wrapping PC to WPC...', { id: 'wrap' });
      await tx.wait();
      
      toast.success(`Wrapped ${amount} PC to WPC!`, { id: 'wrap' });
      await fetchBalances();
      
      setState(prev => ({ ...prev, isWrapping: false }));
      return true;
    } catch (error: any) {
      console.error('Wrap error:', error);
      toast.error(error.reason || 'Wrap failed', { id: 'wrap' });
      setState(prev => ({ ...prev, isWrapping: false }));
      return false;
    }
  }, [signer, address, isCorrectNetwork, fetchBalances]);

  // Unwrap WPC to PC
  const unwrap = useCallback(async (amount: string) => {
    if (!signer || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    if (!isCorrectNetwork) {
      toast.error('Please switch to Push Testnet');
      return false;
    }

    setState(prev => ({ ...prev, isUnwrapping: true }));

    try {
      const amountWei = parseAmount(amount);
      const tx = await unwrapPC(signer, amountWei);
      
      toast.loading('Unwrapping WPC to PC...', { id: 'unwrap' });
      await tx.wait();
      
      toast.success(`Unwrapped ${amount} WPC to PC!`, { id: 'unwrap' });
      await fetchBalances();
      
      setState(prev => ({ ...prev, isUnwrapping: false }));
      return true;
    } catch (error: any) {
      console.error('Unwrap error:', error);
      toast.error(error.reason || 'Unwrap failed', { id: 'unwrap' });
      setState(prev => ({ ...prev, isUnwrapping: false }));
      return false;
    }
  }, [signer, address, isCorrectNetwork, fetchBalances]);

  // Check and approve WPC
  const checkAndApprove = useCallback(async (spender: string, amount: string): Promise<boolean> => {
    if (!signer || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    try {
      const amountWei = parseAmount(amount);
      const allowance = await getWPCAllowance(address, spender);
      
      if (allowance >= amountWei) {
        return true;
      }

      toast.loading('Approving WPC...', { id: 'approve-wpc' });
      const tx = await approveWPC(signer, spender);
      await tx.wait();
      
      toast.success('WPC approved!', { id: 'approve-wpc' });
      return true;
    } catch (error: any) {
      console.error('Approve WPC error:', error);
      toast.error(error.reason || 'Approval failed', { id: 'approve-wpc' });
      return false;
    }
  }, [signer, address]);

  return {
    ...state,
    wrap,
    unwrap,
    checkAndApprove,
    fetchBalances,
    isConnected,
    isCorrectNetwork,
  };
};
