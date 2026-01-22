import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { getReadProvider } from '@/lib/dex';
import { CONTRACTS } from '@/config/contracts';
import { PAIR_ABI } from '@/config/abis';

export interface SlippageAnalysis {
  isHighRisk: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  priceImpact: number;
  sandwichRisk: boolean;
  frontRunRisk: boolean;
  recommendedSlippage: number;
  warnings: string[];
}

export interface MempoolTx {
  hash: string;
  to: string;
  value: bigint;
  data: string;
  timestamp: number;
}

export const useSlippageProtection = () => {
  const [pendingTxs, setPendingTxs] = useState<MempoolTx[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Analyze slippage risk for a swap
  const analyzeSlippageRisk = useCallback(async (
    pairAddress: string,
    amountIn: bigint,
    amountOut: bigint,
    isExactIn: boolean = true
  ): Promise<SlippageAnalysis> => {
    const warnings: string[] = [];
    let sandwichRisk = false;
    let frontRunRisk = false;

    try {
      const provider = getReadProvider();
      const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
      
      // Get current reserves
      const reserves = await pair.getReserves();
      const reserve0 = reserves[0];
      const reserve1 = reserves[1];
      
      // Calculate price impact
      const totalLiquidity = reserve0 + reserve1;
      const tradeSize = amountIn;
      const impactRatio = Number(tradeSize) / Number(totalLiquidity) * 100;
      
      // Determine price impact percentage
      let priceImpact = impactRatio * 2; // Simplified calculation
      
      // Analyze risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';
      let recommendedSlippage = 0.5;

      if (priceImpact < 1) {
        riskLevel = 'low';
        recommendedSlippage = 0.5;
      } else if (priceImpact < 3) {
        riskLevel = 'medium';
        recommendedSlippage = 1;
        warnings.push('Moderate price impact detected');
      } else if (priceImpact < 5) {
        riskLevel = 'high';
        recommendedSlippage = 3;
        warnings.push('High price impact - consider smaller trade');
        frontRunRisk = true;
      } else {
        riskLevel = 'extreme';
        recommendedSlippage = 5;
        warnings.push('Extreme price impact - high risk of sandwich attack');
        sandwichRisk = true;
        frontRunRisk = true;
      }

      // Check for low liquidity pools
      const liquidityUSD = Number(ethers.formatEther(totalLiquidity)) * 1.5; // Rough USD estimate
      if (liquidityUSD < 10000) {
        warnings.push('Low liquidity pool - higher slippage expected');
        sandwichRisk = true;
        if (riskLevel === 'low') riskLevel = 'medium';
      }

      // Check trade size relative to pool
      if (impactRatio > 1) {
        warnings.push('Large trade relative to pool size');
        frontRunRisk = true;
      }

      const isHighRisk = riskLevel === 'high' || riskLevel === 'extreme';

      return {
        isHighRisk,
        riskLevel,
        priceImpact: Math.min(priceImpact, 100),
        sandwichRisk,
        frontRunRisk,
        recommendedSlippage,
        warnings,
      };
    } catch (error) {
      console.error('Error analyzing slippage risk:', error);
      return {
        isHighRisk: false,
        riskLevel: 'low',
        priceImpact: 0,
        sandwichRisk: false,
        frontRunRisk: false,
        recommendedSlippage: 0.5,
        warnings: ['Unable to analyze risk - proceed with caution'],
      };
    }
  }, []);

  // Calculate safe minimum output with MEV protection
  const calculateSafeMinOutput = useCallback((
    expectedOutput: bigint,
    slippageTolerance: number,
    riskLevel: 'low' | 'medium' | 'high' | 'extreme'
  ): bigint => {
    // Apply additional safety margin based on risk level
    const riskMargins: Record<string, number> = {
      'low': 0,
      'medium': 0.5,
      'high': 1,
      'extreme': 2,
    };

    const totalSlippage = slippageTolerance + riskMargins[riskLevel];
    const minOutput = expectedOutput * BigInt(Math.floor((100 - totalSlippage) * 100)) / 10000n;
    
    return minOutput;
  }, []);

  // Check if current slippage setting is safe
  const validateSlippage = useCallback((
    currentSlippage: number,
    analysis: SlippageAnalysis
  ): { isValid: boolean; message: string } => {
    if (currentSlippage < analysis.recommendedSlippage) {
      return {
        isValid: false,
        message: `Slippage too low for this trade. Recommended: ${analysis.recommendedSlippage}%`,
      };
    }

    if (currentSlippage > 10 && analysis.riskLevel === 'low') {
      return {
        isValid: true,
        message: 'High slippage set for low-risk trade. Consider reducing.',
      };
    }

    if (analysis.sandwichRisk && currentSlippage > 5) {
      return {
        isValid: true,
        message: 'Warning: High slippage with sandwich attack risk. Consider splitting trade.',
      };
    }

    return { isValid: true, message: '' };
  }, []);

  // Get recommended deadline based on network conditions
  const getRecommendedDeadline = useCallback((riskLevel: 'low' | 'medium' | 'high' | 'extreme'): number => {
    const deadlines: Record<string, number> = {
      'low': 20,
      'medium': 15,
      'high': 10,
      'extreme': 5,
    };
    return deadlines[riskLevel];
  }, []);

  return {
    pendingTxs,
    isMonitoring,
    analyzeSlippageRisk,
    calculateSafeMinOutput,
    validateSlippage,
    getRecommendedDeadline,
  };
};
