import { ethers } from 'ethers';
import { CONTRACTS, TOKENS, TokenInfo, TOKEN_LIST, RPC_URL } from '@/config/contracts';
import { ROUTER_ABI, FACTORY_ABI, ERC20_ABI, PAIR_ABI, WETH_ABI, MULTICALL_ABI } from '@/config/abis';
import { getStoredSettings } from '@/hooks/useSettings';

// RPC Provider cache for better performance
let cachedProvider: ethers.JsonRpcProvider | null = null;
let providerLastUsed = 0;
let cachedRpcUrl = '';
const PROVIDER_CACHE_TTL = 60000; // 1 minute

// Get Multicall contract instance
export const getMulticallContract = (signerOrProvider: ethers.Signer | ethers.Provider) => {
  return new ethers.Contract(CONTRACTS.MULTICALL, MULTICALL_ABI, signerOrProvider);
};

// Get effective RPC URL based on settings
export const getEffectiveRpcUrl = (): string => {
  const settings = getStoredSettings();
  if (settings.useCustomRpc && settings.customRpcUrl) {
    return settings.customRpcUrl;
  }
  return RPC_URL;
};

// Get read-only provider with caching
export const getReadProvider = (): ethers.JsonRpcProvider => {
  const now = Date.now();
  const currentRpcUrl = getEffectiveRpcUrl();
  
  // Invalidate cache if RPC URL changed or TTL expired
  if (cachedProvider && cachedRpcUrl === currentRpcUrl && (now - providerLastUsed) < PROVIDER_CACHE_TTL) {
    providerLastUsed = now;
    return cachedProvider;
  }
  
  cachedProvider = new ethers.JsonRpcProvider(currentRpcUrl, undefined, {
    staticNetwork: true, // Prevent network detection calls
    batchMaxCount: 10,   // Batch RPC calls
  });
  cachedRpcUrl = currentRpcUrl;
  providerLastUsed = now;
  return cachedProvider;
};

// Get contract instances
export const getRouterContract = (signerOrProvider: ethers.Signer | ethers.Provider) => {
  return new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, signerOrProvider);
};

export const getFactoryContract = (signerOrProvider: ethers.Signer | ethers.Provider) => {
  return new ethers.Contract(CONTRACTS.FACTORY, FACTORY_ABI, signerOrProvider);
};

export const getTokenContract = (address: string, signerOrProvider: ethers.Signer | ethers.Provider) => {
  return new ethers.Contract(address, ERC20_ABI, signerOrProvider);
};

export const getPairContract = (address: string, signerOrProvider: ethers.Signer | ethers.Provider) => {
  return new ethers.Contract(address, PAIR_ABI, signerOrProvider);
};

export const getWETHContract = (signerOrProvider: ethers.Signer | ethers.Provider) => {
  return new ethers.Contract(CONTRACTS.WETH, WETH_ABI, signerOrProvider);
};

// Token utilities
export const getTokenByAddress = (address: string): TokenInfo | undefined => {
  return TOKEN_LIST.find(t => t.address.toLowerCase() === address.toLowerCase());
};

export const getTokenBySymbol = (symbol: string): TokenInfo | undefined => {
  return TOKEN_LIST.find(t => t.symbol.toLowerCase() === symbol.toLowerCase());
};

// Format utilities
export const formatAmount = (amount: bigint, decimals: number = 18): string => {
  try {
    return ethers.formatUnits(amount, decimals);
  } catch {
    return '0';
  }
};

// Validate and sanitize numeric input
export const sanitizeNumericInput = (value: string): string => {
  // Remove any non-numeric characters except decimal point
  const sanitized = value.replace(/[^\d.]/g, '');
  // Ensure only one decimal point
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  // Limit decimal places to 18
  if (parts.length === 2 && parts[1].length > 18) {
    return parts[0] + '.' + parts[1].slice(0, 18);
  }
  return sanitized;
};

export const parseAmount = (amount: string, decimals: number = 18): bigint => {
  try {
    const sanitized = sanitizeNumericInput(amount || '0');
    if (!sanitized || sanitized === '.' || isNaN(parseFloat(sanitized))) {
      return 0n;
    }
    return ethers.parseUnits(sanitized, decimals);
  } catch {
    return 0n;
  }
};

export const shortenAddress = (address: string, chars: number = 4): string => {
  if (!address || address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

// Price calculation utilities
export const calculatePriceImpact = (
  amountIn: bigint,
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): number => {
  if (reserveIn === 0n || reserveOut === 0n) return 0;
  
  const exactQuote = (amountIn * reserveOut) / reserveIn;
  if (exactQuote === 0n) return 0;
  
  const impact = Number((exactQuote - amountOut) * 10000n / exactQuote) / 100;
  return Math.max(0, impact);
};

export const calculateMinimumReceived = (amount: bigint, slippage: number): bigint => {
  const slippageBps = BigInt(Math.floor(slippage * 100));
  return amount - (amount * slippageBps / 10000n);
};

// Get pair address
export const getPairAddress = async (tokenA: string, tokenB: string): Promise<string | null> => {
  try {
    const provider = getReadProvider();
    const factory = getFactoryContract(provider);
    const pairAddress = await factory.getPair(tokenA, tokenB);
    
    if (pairAddress === ethers.ZeroAddress) {
      return null;
    }
    
    return pairAddress;
  } catch (error) {
    console.error('Error getting pair address:', error);
    return null;
  }
};

// Get reserves
export const getReserves = async (pairAddress: string): Promise<{
  reserve0: bigint;
  reserve1: bigint;
  token0: string;
  token1: string;
} | null> => {
  try {
    const provider = getReadProvider();
    const pair = getPairContract(pairAddress, provider);
    
    const [reserves, token0, token1] = await Promise.all([
      pair.getReserves(),
      pair.token0(),
      pair.token1(),
    ]);
    
    return {
      reserve0: reserves[0],
      reserve1: reserves[1],
      token0,
      token1,
    };
  } catch (error) {
    console.error('Error getting reserves:', error);
    return null;
  }
};

// Get amounts out
export const getAmountsOut = async (
  amountIn: bigint,
  path: string[]
): Promise<bigint[] | null> => {
  try {
    const provider = getReadProvider();
    const router = getRouterContract(provider);
    const amounts = await router.getAmountsOut(amountIn, path);
    return amounts;
  } catch (error) {
    console.error('Error getting amounts out:', error);
    return null;
  }
};

// Get token balance
export const getTokenBalance = async (
  tokenAddress: string,
  userAddress: string
): Promise<bigint> => {
  try {
    const provider = getReadProvider();
    
    if (tokenAddress === ethers.ZeroAddress || tokenAddress === TOKENS.PC.address) {
      return await provider.getBalance(userAddress);
    }
    
    const token = getTokenContract(tokenAddress, provider);
    return await token.balanceOf(userAddress);
  } catch (error) {
    console.error('Error getting token balance:', error);
    return 0n;
  }
};

// Get token allowance
export const getTokenAllowance = async (
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string
): Promise<bigint> => {
  try {
    const provider = getReadProvider();
    const token = getTokenContract(tokenAddress, provider);
    return await token.allowance(ownerAddress, spenderAddress);
  } catch (error) {
    console.error('Error getting allowance:', error);
    return 0n;
  }
};

// Deadline utility
export const getDeadline = (minutes: number = 20): bigint => {
  return BigInt(Math.floor(Date.now() / 1000) + minutes * 60);
};

// Transaction utilities
export const waitForTransaction = async (
  provider: ethers.Provider,
  txHash: string
): Promise<ethers.TransactionReceipt | null> => {
  try {
    const receipt = await provider.waitForTransaction(txHash);
    return receipt;
  } catch (error) {
    console.error('Error waiting for transaction:', error);
    return null;
  }
};
