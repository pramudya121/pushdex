import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { CONTRACTS, TokenInfo, TOKEN_LIST } from '@/config/contracts';
import { ROUTER_ABI, ERC20_ABI, PAIR_ABI, FACTORY_ABI } from '@/config/abis';
import {
  getReadProvider,
  getPairAddress,
  getReserves,
  getTokenAllowance,
  parseAmount,
  formatAmount,
  getDeadline,
  getPairContract,
} from '@/lib/dex';
import { toast } from 'sonner';

export interface LiquidityState {
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  amountA: string;
  amountB: string;
  pairAddress: string | null;
  lpBalance: string;
  reserveA: string;
  reserveB: string;
  shareOfPool: string;
  needsApprovalA: boolean;
  needsApprovalB: boolean;
  needsLPApproval: boolean;
  isLoading: boolean;
  isAdding: boolean;
  isRemoving: boolean;
}

export const useLiquidity = () => {
  const { address, signer, isConnected, isCorrectNetwork, provider } = useWallet();
  
  const [state, setState] = useState<LiquidityState>({
    tokenA: TOKEN_LIST[0],
    tokenB: TOKEN_LIST[1],
    amountA: '',
    amountB: '',
    pairAddress: null,
    lpBalance: '0',
    reserveA: '0',
    reserveB: '0',
    shareOfPool: '0',
    needsApprovalA: false,
    needsApprovalB: false,
    needsLPApproval: false,
    isLoading: false,
    isAdding: false,
    isRemoving: false,
  });

  // Fetch pair info
  const fetchPairInfo = useCallback(async () => {
    const tokenAAddr = state.tokenA.address === ethers.ZeroAddress ? CONTRACTS.WETH : state.tokenA.address;
    const tokenBAddr = state.tokenB.address === ethers.ZeroAddress ? CONTRACTS.WETH : state.tokenB.address;
    
    const pair = await getPairAddress(tokenAAddr, tokenBAddr);
    
    if (pair && address) {
      const reserves = await getReserves(pair);
      const readProvider = getReadProvider();
      const pairContract = getPairContract(pair, readProvider);
      
      const [lpBalance, totalSupply] = await Promise.all([
        pairContract.balanceOf(address),
        pairContract.totalSupply(),
      ]);
      
      const share = totalSupply > 0n ? (lpBalance * 10000n / totalSupply) : 0n;
      
      setState(prev => ({
        ...prev,
        pairAddress: pair,
        lpBalance: formatAmount(lpBalance),
        reserveA: formatAmount(reserves?.reserve0 || 0n, state.tokenA.decimals),
        reserveB: formatAmount(reserves?.reserve1 || 0n, state.tokenB.decimals),
        shareOfPool: (Number(share) / 100).toFixed(2),
      }));
    } else {
      setState(prev => ({
        ...prev,
        pairAddress: pair,
        lpBalance: '0',
        reserveA: '0',
        reserveB: '0',
        shareOfPool: '0',
      }));
    }
  }, [state.tokenA, state.tokenB, address]);

  useEffect(() => {
    fetchPairInfo();
  }, [fetchPairInfo]);

  // Check approvals
  const checkApprovals = useCallback(async () => {
    if (!address || !state.amountA || !state.amountB) {
      setState(prev => ({ ...prev, needsApprovalA: false, needsApprovalB: false }));
      return;
    }

    try {
      let needsA = false;
      let needsB = false;

      if (state.tokenA.address !== ethers.ZeroAddress && parseFloat(state.amountA) > 0) {
        const allowanceA = await getTokenAllowance(state.tokenA.address, address, CONTRACTS.ROUTER);
        needsA = allowanceA < parseAmount(state.amountA, state.tokenA.decimals);
      }

      if (state.tokenB.address !== ethers.ZeroAddress && parseFloat(state.amountB) > 0) {
        const allowanceB = await getTokenAllowance(state.tokenB.address, address, CONTRACTS.ROUTER);
        needsB = allowanceB < parseAmount(state.amountB, state.tokenB.decimals);
      }

      setState(prev => ({ ...prev, needsApprovalA: needsA, needsApprovalB: needsB }));
    } catch (error) {
      console.error('Error checking approvals:', error);
    }
  }, [address, state.amountA, state.amountB, state.tokenA, state.tokenB]);

  useEffect(() => {
    checkApprovals();
  }, [checkApprovals]);

  // Set tokens
  const setTokenA = useCallback((token: TokenInfo) => {
    setState(prev => ({ ...prev, tokenA: token, amountA: '', amountB: '' }));
  }, []);

  const setTokenB = useCallback((token: TokenInfo) => {
    setState(prev => ({ ...prev, tokenB: token, amountA: '', amountB: '' }));
  }, []);

  // Set amounts
  const setAmountA = useCallback((amount: string) => {
    setState(prev => ({ ...prev, amountA: amount }));
  }, []);

  const setAmountB = useCallback((amount: string) => {
    setState(prev => ({ ...prev, amountB: amount }));
  }, []);

  // Approve token
  const approveToken = useCallback(async (token: TokenInfo) => {
    if (!signer) {
      toast.error('Please connect your wallet');
      return false;
    }

    try {
      const tokenContract = new ethers.Contract(token.address, ERC20_ABI, signer);
      const tx = await tokenContract.approve(CONTRACTS.ROUTER, ethers.MaxUint256);
      
      toast.loading(`Approving ${token.symbol}...`, { id: 'approve' });
      await tx.wait();
      
      toast.success(`${token.symbol} approved!`, { id: 'approve' });
      await checkApprovals();
      return true;
    } catch (error: any) {
      toast.error(error.reason || 'Approval failed', { id: 'approve' });
      return false;
    }
  }, [signer, checkApprovals]);

  // Add liquidity
  const addLiquidity = useCallback(async () => {
    if (!signer || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    if (!isCorrectNetwork) {
      toast.error('Please switch to Push Testnet');
      return false;
    }

    setState(prev => ({ ...prev, isAdding: true }));

    try {
      const router = new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, signer);
      const deadline = getDeadline(20);
      
      const amountAWei = parseAmount(state.amountA, state.tokenA.decimals);
      const amountBWei = parseAmount(state.amountB, state.tokenB.decimals);
      const amountAMin = amountAWei * 95n / 100n;
      const amountBMin = amountBWei * 95n / 100n;

      let tx;

      if (state.tokenA.address === ethers.ZeroAddress) {
        tx = await router.addLiquidityETH(
          state.tokenB.address,
          amountBWei,
          amountBMin,
          amountAMin,
          address,
          deadline,
          { value: amountAWei }
        );
      } else if (state.tokenB.address === ethers.ZeroAddress) {
        tx = await router.addLiquidityETH(
          state.tokenA.address,
          amountAWei,
          amountAMin,
          amountBMin,
          address,
          deadline,
          { value: amountBWei }
        );
      } else {
        tx = await router.addLiquidity(
          state.tokenA.address,
          state.tokenB.address,
          amountAWei,
          amountBWei,
          amountAMin,
          amountBMin,
          address,
          deadline
        );
      }

      toast.loading('Adding liquidity...', { id: 'add-liq' });
      await tx.wait();
      
      toast.success('Liquidity added!', { id: 'add-liq' });
      
      setState(prev => ({ ...prev, amountA: '', amountB: '', isAdding: false }));
      await fetchPairInfo();
      
      return true;
    } catch (error: any) {
      console.error('Add liquidity error:', error);
      toast.error(error.reason || 'Failed to add liquidity', { id: 'add-liq' });
      setState(prev => ({ ...prev, isAdding: false }));
      return false;
    }
  }, [signer, address, isCorrectNetwork, state, fetchPairInfo]);

  // Remove liquidity
  const removeLiquidity = useCallback(async (lpAmount: string) => {
    if (!signer || !address || !state.pairAddress) {
      toast.error('Please connect your wallet');
      return false;
    }

    if (!isCorrectNetwork) {
      toast.error('Please switch to Push Testnet');
      return false;
    }

    setState(prev => ({ ...prev, isRemoving: true }));

    try {
      const router = new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, signer);
      const deadline = getDeadline(20);
      const lpAmountWei = parseAmount(lpAmount);

      let tx;

      if (state.tokenA.address === ethers.ZeroAddress || state.tokenB.address === ethers.ZeroAddress) {
        const token = state.tokenA.address === ethers.ZeroAddress ? state.tokenB : state.tokenA;
        tx = await router.removeLiquidityETH(
          token.address,
          lpAmountWei,
          0,
          0,
          address,
          deadline
        );
      } else {
        tx = await router.removeLiquidity(
          state.tokenA.address,
          state.tokenB.address,
          lpAmountWei,
          0,
          0,
          address,
          deadline
        );
      }

      toast.loading('Removing liquidity...', { id: 'remove-liq' });
      await tx.wait();
      
      toast.success('Liquidity removed!', { id: 'remove-liq' });
      
      setState(prev => ({ ...prev, isRemoving: false }));
      await fetchPairInfo();
      
      return true;
    } catch (error: any) {
      console.error('Remove liquidity error:', error);
      toast.error(error.reason || 'Failed to remove liquidity', { id: 'remove-liq' });
      setState(prev => ({ ...prev, isRemoving: false }));
      return false;
    }
  }, [signer, address, isCorrectNetwork, state.pairAddress, state.tokenA, state.tokenB, fetchPairInfo]);

  return {
    ...state,
    setTokenA,
    setTokenB,
    setAmountA,
    setAmountB,
    approveToken,
    addLiquidity,
    removeLiquidity,
    fetchPairInfo,
    isConnected,
    isCorrectNetwork,
  };
};
