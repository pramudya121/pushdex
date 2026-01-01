import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { CONTRACTS, TOKENS, TokenInfo } from '@/config/contracts';
import { ROUTER_ABI, ERC20_ABI } from '@/config/abis';
import {
  getAmountsOut,
  getPairAddress,
  getTokenBalance,
  getTokenAllowance,
  parseAmount,
  formatAmount,
  calculateMinimumReceived,
  getDeadline,
} from '@/lib/dex';
import { toast } from 'sonner';

export interface SwapState {
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  amountIn: string;
  amountOut: string;
  slippage: number;
  deadline: number;
  isLoading: boolean;
  isApproving: boolean;
  isSwapping: boolean;
  priceImpact: number;
  needsApproval: boolean;
  balanceIn: string;
  balanceOut: string;
  error: string | null;
}

export const useSwap = () => {
  const { address, signer, isConnected, isCorrectNetwork, provider } = useWallet();
  
  const [state, setState] = useState<SwapState>({
    tokenIn: TOKENS.PC,
    tokenOut: TOKENS.PSDX,
    amountIn: '',
    amountOut: '',
    slippage: 0.5,
    deadline: 20,
    isLoading: false,
    isApproving: false,
    isSwapping: false,
    priceImpact: 0,
    needsApproval: false,
    balanceIn: '0',
    balanceOut: '0',
    error: null,
  });

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    if (!address) return;
    
    try {
      const [balIn, balOut] = await Promise.all([
        getTokenBalance(state.tokenIn.address, address),
        getTokenBalance(state.tokenOut.address, address),
      ]);
      
      setState(prev => ({
        ...prev,
        balanceIn: formatAmount(balIn, state.tokenIn.decimals),
        balanceOut: formatAmount(balOut, state.tokenOut.decimals),
      }));
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  }, [address, state.tokenIn, state.tokenOut]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Check approval
  const checkApproval = useCallback(async () => {
    if (!address || !state.amountIn || state.tokenIn.address === ethers.ZeroAddress) {
      setState(prev => ({ ...prev, needsApproval: false }));
      return;
    }

    try {
      const amountInWei = parseAmount(state.amountIn, state.tokenIn.decimals);
      const allowance = await getTokenAllowance(
        state.tokenIn.address,
        address,
        CONTRACTS.ROUTER
      );
      
      setState(prev => ({ ...prev, needsApproval: allowance < amountInWei }));
    } catch (error) {
      console.error('Error checking approval:', error);
    }
  }, [address, state.amountIn, state.tokenIn]);

  useEffect(() => {
    checkApproval();
  }, [checkApproval]);

  // Get quote
  const getQuote = useCallback(async (amountIn: string) => {
    if (!amountIn || parseFloat(amountIn) === 0) {
      setState(prev => ({ ...prev, amountOut: '', priceImpact: 0, error: null }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const amountInWei = parseAmount(amountIn, state.tokenIn.decimals);
      
      // Build path
      const tokenInAddress = state.tokenIn.address === ethers.ZeroAddress 
        ? CONTRACTS.WETH 
        : state.tokenIn.address;
      const tokenOutAddress = state.tokenOut.address === ethers.ZeroAddress 
        ? CONTRACTS.WETH 
        : state.tokenOut.address;

      const path = [tokenInAddress, tokenOutAddress];
      
      const amounts = await getAmountsOut(amountInWei, path);
      
      if (amounts && amounts.length > 1) {
        const amountOut = formatAmount(amounts[amounts.length - 1], state.tokenOut.decimals);
        setState(prev => ({ 
          ...prev, 
          amountOut, 
          isLoading: false,
          priceImpact: 0.1, // Simplified for now
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          amountOut: '', 
          isLoading: false,
          error: 'No liquidity available for this pair',
        }));
      }
    } catch (error: any) {
      console.error('Error getting quote:', error);
      setState(prev => ({ 
        ...prev, 
        amountOut: '', 
        isLoading: false,
        error: 'Unable to get quote. Pair may not exist.',
      }));
    }
  }, [state.tokenIn, state.tokenOut]);

  // Set amount in
  const setAmountIn = useCallback((amount: string) => {
    setState(prev => ({ ...prev, amountIn: amount }));
    getQuote(amount);
  }, [getQuote]);

  // Set tokens
  const setTokenIn = useCallback((token: TokenInfo) => {
    if (token.address === state.tokenOut.address) {
      // Swap tokens
      setState(prev => ({
        ...prev,
        tokenIn: token,
        tokenOut: prev.tokenIn,
        amountIn: prev.amountOut,
        amountOut: prev.amountIn,
      }));
    } else {
      setState(prev => ({ ...prev, tokenIn: token, amountOut: '' }));
    }
  }, [state.tokenOut]);

  const setTokenOut = useCallback((token: TokenInfo) => {
    if (token.address === state.tokenIn.address) {
      // Swap tokens
      setState(prev => ({
        ...prev,
        tokenOut: token,
        tokenIn: prev.tokenOut,
        amountIn: prev.amountOut,
        amountOut: prev.amountIn,
      }));
    } else {
      setState(prev => ({ ...prev, tokenOut: token, amountOut: '' }));
    }
  }, [state.tokenIn]);

  // Swap tokens position
  const swapTokens = useCallback(() => {
    setState(prev => ({
      ...prev,
      tokenIn: prev.tokenOut,
      tokenOut: prev.tokenIn,
      amountIn: prev.amountOut,
      amountOut: prev.amountIn,
    }));
  }, []);

  // Set slippage
  const setSlippage = useCallback((slippage: number) => {
    setState(prev => ({ ...prev, slippage }));
  }, []);

  // Set deadline
  const setDeadline = useCallback((deadline: number) => {
    setState(prev => ({ ...prev, deadline }));
  }, []);

  // Approve token
  const approve = useCallback(async () => {
    if (!signer || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!isCorrectNetwork) {
      toast.error('Please switch to Push Testnet');
      return;
    }

    setState(prev => ({ ...prev, isApproving: true }));

    try {
      const token = new ethers.Contract(state.tokenIn.address, ERC20_ABI, signer);
      const tx = await token.approve(CONTRACTS.ROUTER, ethers.MaxUint256);
      
      toast.loading('Approving token...', { id: 'approve' });
      await tx.wait();
      
      toast.success('Token approved!', { id: 'approve' });
      setState(prev => ({ ...prev, needsApproval: false, isApproving: false }));
    } catch (error: any) {
      console.error('Approval error:', error);
      toast.error(error.reason || 'Approval failed', { id: 'approve' });
      setState(prev => ({ ...prev, isApproving: false }));
    }
  }, [signer, address, isCorrectNetwork, state.tokenIn]);

  // Execute swap
  const swap = useCallback(async () => {
    if (!signer || !address || !provider) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!isCorrectNetwork) {
      toast.error('Please switch to Push Testnet');
      return;
    }

    if (!state.amountIn || !state.amountOut) {
      toast.error('Please enter an amount');
      return;
    }

    setState(prev => ({ ...prev, isSwapping: true }));

    try {
      const router = new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, signer);
      const amountIn = parseAmount(state.amountIn, state.tokenIn.decimals);
      const amountOutMin = calculateMinimumReceived(
        parseAmount(state.amountOut, state.tokenOut.decimals),
        state.slippage
      );
      const deadline = getDeadline(state.deadline);

      const isNativeIn = state.tokenIn.address === ethers.ZeroAddress;
      const isNativeOut = state.tokenOut.address === ethers.ZeroAddress;

      const tokenInAddress = isNativeIn ? CONTRACTS.WETH : state.tokenIn.address;
      const tokenOutAddress = isNativeOut ? CONTRACTS.WETH : state.tokenOut.address;
      const path = [tokenInAddress, tokenOutAddress];

      let tx;

      if (isNativeIn) {
        // Swap native PC for tokens
        tx = await router.swapExactETHForTokens(
          amountOutMin,
          path,
          address,
          deadline,
          { value: amountIn, gasLimit: 300000n }
        );
      } else if (isNativeOut) {
        // Swap tokens for native PC
        tx = await router.swapExactTokensForETH(
          amountIn,
          amountOutMin,
          path,
          address,
          deadline,
          { gasLimit: 300000n }
        );
      } else {
        // Swap tokens for tokens
        tx = await router.swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          path,
          address,
          deadline,
          { gasLimit: 300000n }
        );
      }

      toast.loading('Swapping...', { id: 'swap' });
      const receipt = await tx.wait();

      toast.success(
        `Swapped ${state.amountIn} ${state.tokenIn.symbol} for ${state.amountOut} ${state.tokenOut.symbol}`,
        { id: 'swap' }
      );

      // Reset form
      setState(prev => ({
        ...prev,
        amountIn: '',
        amountOut: '',
        isSwapping: false,
      }));

      // Refresh balances
      fetchBalances();

      return receipt;
    } catch (error: any) {
      console.error('Swap error:', error);
      toast.error(error.reason || 'Swap failed', { id: 'swap' });
      setState(prev => ({ ...prev, isSwapping: false }));
    }
  }, [signer, address, provider, isCorrectNetwork, state, fetchBalances]);

  return {
    ...state,
    setAmountIn,
    setTokenIn,
    setTokenOut,
    setSlippage,
    setDeadline,
    swapTokens,
    approve,
    swap,
    fetchBalances,
    isConnected,
    isCorrectNetwork,
  };
};
