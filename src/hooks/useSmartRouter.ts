import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS, TOKEN_LIST, TokenInfo } from '@/config/contracts';
import { FACTORY_ABI, ROUTER_ABI, PAIR_ABI } from '@/config/abis';
import { getReadProvider, formatAmount, parseAmount } from '@/lib/dex';

export interface Route {
  path: string[];
  pathSymbols: string[];
  amountOut: bigint;
  amountOutFormatted: string;
  priceImpact: number;
  gasEstimate: number;
  fee: number;
}

export interface SmartRouterResult {
  bestRoute: Route | null;
  allRoutes: Route[];
  isSearching: boolean;
}

// Common intermediate tokens for routing
const INTERMEDIATE_TOKENS = [
  CONTRACTS.WETH, // WPC
];

export const useSmartRouter = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);
  const [bestRoute, setBestRoute] = useState<Route | null>(null);

  // Get all possible routes between two tokens
  const findAllRoutes = useCallback(async (
    tokenIn: TokenInfo,
    tokenOut: TokenInfo,
    amountIn: string
  ): Promise<Route[]> => {
    if (!amountIn || parseFloat(amountIn) === 0) {
      return [];
    }

    const provider = getReadProvider();
    const factory = new ethers.Contract(CONTRACTS.FACTORY, FACTORY_ABI, provider);
    const router = new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, provider);
    
    const amountInWei = parseAmount(amountIn, tokenIn.decimals);
    
    // Normalize addresses
    const tokenInAddress = tokenIn.address === ethers.ZeroAddress 
      ? CONTRACTS.WETH 
      : tokenIn.address;
    const tokenOutAddress = tokenOut.address === ethers.ZeroAddress 
      ? CONTRACTS.WETH 
      : tokenOut.address;

    const routes: Route[] = [];

    // Route 1: Direct path (tokenIn -> tokenOut)
    try {
      const directPair = await factory.getPair(tokenInAddress, tokenOutAddress);
      if (directPair !== ethers.ZeroAddress) {
        const path = [tokenInAddress, tokenOutAddress];
        const amounts = await router.getAmountsOut(amountInWei, path);
        const amountOut = amounts[amounts.length - 1];
        
        // Calculate price impact
        const pairContract = new ethers.Contract(directPair, PAIR_ABI, provider);
        const reserves = await pairContract.getReserves();
        const token0 = await pairContract.token0();
        
        const [reserveIn, reserveOut] = token0.toLowerCase() === tokenInAddress.toLowerCase()
          ? [reserves[0], reserves[1]]
          : [reserves[1], reserves[0]];
        
        const priceImpact = calculatePriceImpact(amountInWei, reserveIn, reserveOut);
        
        routes.push({
          path,
          pathSymbols: [tokenIn.symbol, tokenOut.symbol],
          amountOut,
          amountOutFormatted: formatAmount(amountOut, tokenOut.decimals),
          priceImpact,
          gasEstimate: 150000,
          fee: 0.3,
        });
      }
    } catch (error) {
      console.log('Direct route not available');
    }

    // Route 2: Through intermediate tokens
    for (const intermediate of INTERMEDIATE_TOKENS) {
      if (intermediate.toLowerCase() === tokenInAddress.toLowerCase() || 
          intermediate.toLowerCase() === tokenOutAddress.toLowerCase()) {
        continue;
      }

      try {
        // Check if both pairs exist
        const [pair1, pair2] = await Promise.all([
          factory.getPair(tokenInAddress, intermediate),
          factory.getPair(intermediate, tokenOutAddress),
        ]);

        if (pair1 !== ethers.ZeroAddress && pair2 !== ethers.ZeroAddress) {
          const path = [tokenInAddress, intermediate, tokenOutAddress];
          const amounts = await router.getAmountsOut(amountInWei, path);
          const amountOut = amounts[amounts.length - 1];
          
          // Get intermediate token symbol
          const intermediateToken = TOKEN_LIST.find(t => 
            t.address.toLowerCase() === intermediate.toLowerCase()
          );
          
          // Calculate combined price impact
          const pair1Contract = new ethers.Contract(pair1, PAIR_ABI, provider);
          const reserves1 = await pair1Contract.getReserves();
          const token0_1 = await pair1Contract.token0();
          
          const [reserveIn1, reserveOut1] = token0_1.toLowerCase() === tokenInAddress.toLowerCase()
            ? [reserves1[0], reserves1[1]]
            : [reserves1[1], reserves1[0]];
          
          const priceImpact1 = calculatePriceImpact(amountInWei, reserveIn1, reserveOut1);
          const priceImpact2 = calculatePriceImpact(amounts[1], reserveIn1, reserveOut1);
          const totalPriceImpact = priceImpact1 + priceImpact2;
          
          routes.push({
            path,
            pathSymbols: [tokenIn.symbol, intermediateToken?.symbol || 'WPC', tokenOut.symbol],
            amountOut,
            amountOutFormatted: formatAmount(amountOut, tokenOut.decimals),
            priceImpact: totalPriceImpact,
            gasEstimate: 200000,
            fee: 0.6, // Two hops = 2 x 0.3%
          });
        }
      } catch (error) {
        console.log(`Route through ${intermediate} not available`);
      }
    }

    // Route 3: Through other liquid tokens
    const intermediateAddresses = INTERMEDIATE_TOKENS.map(a => a.toLowerCase());
    const liquidTokens = TOKEN_LIST.filter(t => 
      t.address !== ethers.ZeroAddress &&
      t.address.toLowerCase() !== tokenInAddress.toLowerCase() &&
      t.address.toLowerCase() !== tokenOutAddress.toLowerCase() &&
      !intermediateAddresses.includes(t.address.toLowerCase())
    ).slice(0, 3); // Limit to 3 additional tokens to check

    for (const liquidToken of liquidTokens) {
      const liquidTokenAddress = liquidToken.address as string;
      try {
        const [pair1, pair2] = await Promise.all([
          factory.getPair(tokenInAddress, liquidTokenAddress),
          factory.getPair(liquidTokenAddress, tokenOutAddress),
        ]);

        if (pair1 !== ethers.ZeroAddress && pair2 !== ethers.ZeroAddress) {
          const path = [tokenInAddress, liquidTokenAddress, tokenOutAddress];
          const amounts = await router.getAmountsOut(amountInWei, path);
          const amountOut = amounts[amounts.length - 1];
          
          routes.push({
            path,
            pathSymbols: [tokenIn.symbol, liquidToken.symbol, tokenOut.symbol],
            amountOut,
            amountOutFormatted: formatAmount(amountOut, tokenOut.decimals),
            priceImpact: 0.5, // Simplified
            gasEstimate: 200000,
            fee: 0.6,
          });
        }
      } catch (error) {
        // Route not available
      }
    }

    // Sort by best output amount
    routes.sort((a, b) => {
      const amountA = BigInt(a.amountOut);
      const amountB = BigInt(b.amountOut);
      return amountB > amountA ? 1 : amountB < amountA ? -1 : 0;
    });

    return routes;
  }, []);

  // Calculate price impact
  const calculatePriceImpact = (amountIn: bigint, reserveIn: bigint, reserveOut: bigint): number => {
    if (reserveIn === 0n || reserveOut === 0n) return 0;
    
    const amountInWithFee = amountIn * 997n;
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * 1000n + amountInWithFee;
    const amountOut = numerator / denominator;
    
    const idealAmountOut = (amountIn * reserveOut) / reserveIn;
    if (idealAmountOut === 0n) return 0;
    
    const impact = Number((idealAmountOut - amountOut) * 10000n / idealAmountOut) / 100;
    return Math.max(0, impact);
  };

  // Find best route
  const findBestRoute = useCallback(async (
    tokenIn: TokenInfo,
    tokenOut: TokenInfo,
    amountIn: string
  ) => {
    setIsSearching(true);
    setBestRoute(null);
    setAllRoutes([]);

    try {
      const routes = await findAllRoutes(tokenIn, tokenOut, amountIn);
      setAllRoutes(routes);
      
      if (routes.length > 0) {
        // Best route is already sorted first
        setBestRoute(routes[0]);
      }
    } catch (error) {
      console.error('Error finding routes:', error);
    } finally {
      setIsSearching(false);
    }
  }, [findAllRoutes]);

  return {
    bestRoute,
    allRoutes,
    isSearching,
    findBestRoute,
    findAllRoutes,
  };
};
