import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { getReadProvider } from '@/lib/dex';
import { CONTRACTS } from '@/config/contracts';
import { ROUTER_ABI } from '@/config/abis';

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  estimatedCost: string;
  estimatedCostUSD: number;
}

const PC_USD_PRICE = 1.5; // Mock price for Push Coin

export const useGasEstimation = () => {
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimateGas = useCallback(async (
    contract: ethers.Contract,
    method: string,
    args: any[],
    value?: bigint
  ): Promise<GasEstimate | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const provider = getReadProvider();
      
      // Get current gas price
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || 0n;
      
      // Estimate gas for the transaction
      let gasLimit: bigint;
      try {
        const txData = await contract[method].populateTransaction(...args);
        if (value) txData.value = value;
        
        const signerAddress = contract.runner && 'getAddress' in contract.runner 
          ? await (contract.runner as ethers.Signer).getAddress() 
          : ethers.ZeroAddress;
        
        gasLimit = await provider.estimateGas({
          ...txData,
          from: signerAddress,
        });
        
        // Add 20% buffer for safety
        gasLimit = gasLimit * 120n / 100n;
      } catch (err) {
        // Fallback to default gas limits based on method type
        const defaultLimits: Record<string, bigint> = {
          'swap': 200000n,
          'swapExactETHForTokens': 200000n,
          'swapExactTokensForETH': 200000n,
          'swapExactTokensForTokens': 250000n,
          'addLiquidity': 300000n,
          'addLiquidityETH': 300000n,
          'removeLiquidity': 250000n,
          'removeLiquidityETH': 250000n,
          'deposit': 150000n,
          'withdraw': 150000n,
          'stake': 150000n,
          'unstake': 150000n,
          'approve': 50000n,
        };
        
        gasLimit = defaultLimits[method] || 300000n;
      }

      // Calculate estimated cost
      const estimatedCostWei = gasLimit * gasPrice;
      const estimatedCost = ethers.formatEther(estimatedCostWei);
      const estimatedCostUSD = parseFloat(estimatedCost) * PC_USD_PRICE;

      const result: GasEstimate = {
        gasLimit,
        gasPrice,
        maxFeePerGas: feeData.maxFeePerGas || undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || undefined,
        estimatedCost,
        estimatedCostUSD,
      };

      setGasEstimate(result);
      setIsLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to estimate gas');
      setIsLoading(false);
      return null;
    }
  }, []);

  // Simplified swap gas estimation
  const estimateSwapGas = useCallback(async (
    tokenInAddress: string,
    tokenOutAddress: string,
    amountIn: bigint
  ): Promise<GasEstimate | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const provider = getReadProvider();
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || 0n;

      // Determine swap type and get appropriate gas limit
      const isNativeIn = tokenInAddress.toLowerCase() === CONTRACTS.WETH.toLowerCase();
      const isNativeOut = tokenOutAddress.toLowerCase() === CONTRACTS.WETH.toLowerCase();

      let gasLimit: bigint;
      if (isNativeIn) {
        gasLimit = 200000n; // swapExactETHForTokens
      } else if (isNativeOut) {
        gasLimit = 200000n; // swapExactTokensForETH
      } else {
        gasLimit = 250000n; // swapExactTokensForTokens
      }

      // Add buffer for multi-hop routes
      gasLimit = gasLimit * 120n / 100n;

      const estimatedCostWei = gasLimit * gasPrice;
      const estimatedCost = ethers.formatEther(estimatedCostWei);
      const estimatedCostUSD = parseFloat(estimatedCost) * PC_USD_PRICE;

      const result: GasEstimate = {
        gasLimit,
        gasPrice,
        maxFeePerGas: feeData.maxFeePerGas || undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || undefined,
        estimatedCost,
        estimatedCostUSD,
      };

      setGasEstimate(result);
      setIsLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to estimate gas');
      setIsLoading(false);
      return null;
    }
  }, []);

  // Simple gas price fetch without contract call
  const fetchGasPrice = useCallback(async () => {
    try {
      const provider = getReadProvider();
      const feeData = await provider.getFeeData();
      
      return {
        gasPrice: feeData.gasPrice || 0n,
        maxFeePerGas: feeData.maxFeePerGas || undefined,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || undefined,
      };
    } catch {
      return null;
    }
  }, []);

  // Format gas cost for display
  const formatGasCost = useCallback((gasLimit: bigint, gasPrice: bigint): string => {
    const costWei = gasLimit * gasPrice;
    const costPC = parseFloat(ethers.formatEther(costWei));
    
    if (costPC < 0.0001) return '< 0.0001 PC';
    return `${costPC.toFixed(4)} PC`;
  }, []);

  return {
    gasEstimate,
    isLoading,
    error,
    estimateGas,
    estimateSwapGas,
    fetchGasPrice,
    formatGasCost,
  };
};
