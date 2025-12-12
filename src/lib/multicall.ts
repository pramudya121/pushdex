import { ethers } from 'ethers';
import { CONTRACTS } from '@/config/contracts';
import { MULTICALL_ABI } from '@/config/abis';
import { getReadProvider } from './dex';

export interface Call {
  target: string;
  callData: string;
}

export interface MulticallResult {
  blockNumber: bigint;
  returnData: string[];
}

// Get Multicall contract instance
export const getMulticallContract = (signerOrProvider: ethers.Signer | ethers.Provider) => {
  return new ethers.Contract(CONTRACTS.MULTICALL, MULTICALL_ABI, signerOrProvider);
};

// Execute multiple calls in a single transaction
export const multicall = async (calls: Call[]): Promise<MulticallResult> => {
  const provider = getReadProvider();
  const multicallContract = getMulticallContract(provider);
  
  const result = await multicallContract.aggregate(calls);
  
  return {
    blockNumber: result[0],
    returnData: result[1],
  };
};

// Helper to encode function calls
export const encodeCall = (
  contractInterface: ethers.Interface,
  functionName: string,
  args: any[]
): string => {
  return contractInterface.encodeFunctionData(functionName, args);
};

// Helper to decode function results
export const decodeResult = (
  contractInterface: ethers.Interface,
  functionName: string,
  data: string
): any => {
  return contractInterface.decodeFunctionResult(functionName, data);
};

// Get multiple token balances in one call
export const getMultipleBalances = async (
  tokenAddresses: string[],
  userAddress: string
): Promise<Map<string, bigint>> => {
  const provider = getReadProvider();
  const balances = new Map<string, bigint>();
  
  if (tokenAddresses.length === 0) {
    return balances;
  }
  
  const erc20Interface = new ethers.Interface([
    'function balanceOf(address) view returns (uint256)',
  ]);
  
  const calls: Call[] = tokenAddresses
    .filter(addr => addr !== ethers.ZeroAddress)
    .map(tokenAddress => ({
      target: tokenAddress,
      callData: encodeCall(erc20Interface, 'balanceOf', [userAddress]),
    }));
  
  // Handle native balance separately
  const hasNative = tokenAddresses.includes(ethers.ZeroAddress);
  if (hasNative) {
    const nativeBalance = await provider.getBalance(userAddress);
    balances.set(ethers.ZeroAddress, nativeBalance);
  }
  
  if (calls.length > 0) {
    try {
      const result = await multicall(calls);
      
      let callIndex = 0;
      for (const tokenAddress of tokenAddresses) {
        if (tokenAddress !== ethers.ZeroAddress) {
          const decoded = decodeResult(erc20Interface, 'balanceOf', result.returnData[callIndex]);
          balances.set(tokenAddress.toLowerCase(), decoded[0]);
          callIndex++;
        }
      }
    } catch (error) {
      console.error('Multicall failed, falling back to individual calls:', error);
      // Fallback to individual calls
      for (const tokenAddress of tokenAddresses) {
        if (tokenAddress !== ethers.ZeroAddress) {
          try {
            const contract = new ethers.Contract(tokenAddress, ['function balanceOf(address) view returns (uint256)'], provider);
            const balance = await contract.balanceOf(userAddress);
            balances.set(tokenAddress.toLowerCase(), balance);
          } catch (err) {
            console.error(`Failed to get balance for ${tokenAddress}:`, err);
            balances.set(tokenAddress.toLowerCase(), 0n);
          }
        }
      }
    }
  }
  
  return balances;
};

// Get multiple pair reserves in one call
export const getMultiplePairReserves = async (
  pairAddresses: string[]
): Promise<Map<string, { reserve0: bigint; reserve1: bigint; blockTimestampLast: number }>> => {
  const reserves = new Map();
  
  if (pairAddresses.length === 0) {
    return reserves;
  }
  
  const pairInterface = new ethers.Interface([
    'function getReserves() view returns (uint112, uint112, uint32)',
  ]);
  
  const calls: Call[] = pairAddresses.map(pairAddress => ({
    target: pairAddress,
    callData: encodeCall(pairInterface, 'getReserves', []),
  }));
  
  try {
    const result = await multicall(calls);
    
    for (let i = 0; i < pairAddresses.length; i++) {
      const decoded = decodeResult(pairInterface, 'getReserves', result.returnData[i]);
      reserves.set(pairAddresses[i].toLowerCase(), {
        reserve0: decoded[0],
        reserve1: decoded[1],
        blockTimestampLast: Number(decoded[2]),
      });
    }
  } catch (error) {
    console.error('Multicall getReserves failed:', error);
  }
  
  return reserves;
};

// Get ETH balance using Multicall
export const getEthBalanceMulticall = async (address: string): Promise<bigint> => {
  const provider = getReadProvider();
  const multicallContract = getMulticallContract(provider);
  
  try {
    const balance = await multicallContract.getEthBalance(address);
    return balance;
  } catch (error) {
    console.error('getEthBalance failed:', error);
    return 0n;
  }
};

// Get multiple token info (name, symbol, decimals) in one call
export const getMultipleTokenInfo = async (
  tokenAddresses: string[]
): Promise<Map<string, { name: string; symbol: string; decimals: number }>> => {
  const tokenInfo = new Map();
  
  if (tokenAddresses.length === 0) {
    return tokenInfo;
  }
  
  const erc20Interface = new ethers.Interface([
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
  ]);
  
  const calls: Call[] = [];
  
  for (const tokenAddress of tokenAddresses) {
    if (tokenAddress !== ethers.ZeroAddress) {
      calls.push({
        target: tokenAddress,
        callData: encodeCall(erc20Interface, 'name', []),
      });
      calls.push({
        target: tokenAddress,
        callData: encodeCall(erc20Interface, 'symbol', []),
      });
      calls.push({
        target: tokenAddress,
        callData: encodeCall(erc20Interface, 'decimals', []),
      });
    }
  }
  
  if (calls.length === 0) {
    return tokenInfo;
  }
  
  try {
    const result = await multicall(calls);
    
    let callIndex = 0;
    for (const tokenAddress of tokenAddresses) {
      if (tokenAddress !== ethers.ZeroAddress) {
        const name = decodeResult(erc20Interface, 'name', result.returnData[callIndex])[0];
        const symbol = decodeResult(erc20Interface, 'symbol', result.returnData[callIndex + 1])[0];
        const decimals = Number(decodeResult(erc20Interface, 'decimals', result.returnData[callIndex + 2])[0]);
        
        tokenInfo.set(tokenAddress.toLowerCase(), { name, symbol, decimals });
        callIndex += 3;
      }
    }
  } catch (error) {
    console.error('Multicall token info failed:', error);
  }
  
  return tokenInfo;
};
