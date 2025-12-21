import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { CONTRACTS, TOKEN_LIST, RPC_URL } from '@/config/contracts';
import { ERC20_ABI } from '@/config/abis';
import { toast } from 'sonner';

export interface StakingPoolInfo {
  id: number;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenLogo: string;
  tokenDecimals: number;
  apr: number;
  totalStaked: bigint;
  userStaked: bigint;
  userPendingReward: bigint;
  lockPeriod: number; // in days
  minStake: bigint;
  isActive: boolean;
}

export interface StakingState {
  pools: StakingPoolInfo[];
  isLoading: boolean;
  error: string | null;
}

const getProvider = () => new ethers.JsonRpcProvider(RPC_URL);

const getTokenLogo = (address: string): string => {
  const token = TOKEN_LIST.find(t => t.address.toLowerCase() === address.toLowerCase());
  return token?.logo || '/tokens/pc.png';
};

// Mock staking pools for demo - replace with actual contract integration
const MOCK_STAKING_POOLS: Omit<StakingPoolInfo, 'userStaked' | 'userPendingReward'>[] = [
  {
    id: 0,
    tokenAddress: '0x2Bf9ae7D36f6D057fC84d7f3165E9EB870f2e2e7', // PSDX
    tokenSymbol: 'PSDX',
    tokenName: 'PushDex Token',
    tokenLogo: '/tokens/psdx.png',
    tokenDecimals: 18,
    apr: 45.5,
    totalStaked: ethers.parseEther('125000'),
    lockPeriod: 0,
    minStake: ethers.parseEther('100'),
    isActive: true,
  },
  {
    id: 1,
    tokenAddress: '0x5b0AE944A4Ee6241a5A638C440A0dCD42411bD3C', // WPC
    tokenSymbol: 'WPC',
    tokenName: 'Wrapped Push Coin',
    tokenLogo: '/tokens/wpc.png',
    tokenDecimals: 18,
    apr: 32.0,
    totalStaked: ethers.parseEther('85000'),
    lockPeriod: 7,
    minStake: ethers.parseEther('50'),
    isActive: true,
  },
  {
    id: 2,
    tokenAddress: '0x70af1341F5D5c60F913F6a21C669586C38592510', // ETH
    tokenSymbol: 'ETH',
    tokenName: 'Ethereum',
    tokenLogo: '/tokens/eth.png',
    tokenDecimals: 18,
    apr: 18.5,
    totalStaked: ethers.parseEther('500'),
    lockPeriod: 30,
    minStake: ethers.parseEther('0.1'),
    isActive: true,
  },
  {
    id: 3,
    tokenAddress: '0x68F2458954032952d2ddd5D8Ee1d671e6E93Ae6C', // BNB
    tokenSymbol: 'BNB',
    tokenName: 'Binance Coin',
    tokenLogo: '/tokens/bnb.png',
    tokenDecimals: 18,
    apr: 25.0,
    totalStaked: ethers.parseEther('2500'),
    lockPeriod: 14,
    minStake: ethers.parseEther('1'),
    isActive: true,
  },
];

export const useStaking = () => {
  const { signer, address, isConnected } = useWallet();
  const [state, setState] = useState<StakingState>({
    pools: [],
    isLoading: true,
    error: null,
  });

  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const fetchPools = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const provider = getProvider();
      const pools: StakingPoolInfo[] = [];

      for (const mockPool of MOCK_STAKING_POOLS) {
        let userStaked = BigInt(0);
        let userPendingReward = BigInt(0);

        // In a real implementation, we would fetch from staking contract
        // For now, we simulate user data

        pools.push({
          ...mockPool,
          tokenLogo: getTokenLogo(mockPool.tokenAddress),
          userStaked,
          userPendingReward,
        });
      }

      setState({
        pools,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching staking pools:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load staking pools',
      }));
    }
  }, [isConnected, address]);

  const getTokenBalance = useCallback(async (tokenAddress: string): Promise<string> => {
    if (!address) return '0';
    
    try {
      const provider = getProvider();
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const balance = await tokenContract.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting token balance:', error);
      return '0';
    }
  }, [address]);

  const stake = useCallback(async (poolId: number, amount: string) => {
    if (!signer || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    try {
      setIsStaking(true);
      const pool = state.pools.find(p => p.id === poolId);
      if (!pool) throw new Error('Pool not found');

      const amountWei = ethers.parseEther(amount);

      // In real implementation, approve and stake to contract
      toast.info('Staking feature coming soon!');
      toast.info(`Would stake ${amount} ${pool.tokenSymbol}`);
      
      // Simulate success
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Staking contract integration pending');
      
      return true;
    } catch (error: any) {
      console.error('Stake error:', error);
      toast.error(error.message || 'Failed to stake');
      return false;
    } finally {
      setIsStaking(false);
    }
  }, [signer, address, state.pools]);

  const unstake = useCallback(async (poolId: number, amount: string) => {
    if (!signer || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    try {
      setIsUnstaking(true);
      const pool = state.pools.find(p => p.id === poolId);
      if (!pool) throw new Error('Pool not found');

      toast.info('Unstaking feature coming soon!');
      toast.info(`Would unstake ${amount} ${pool.tokenSymbol}`);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Unstaking contract integration pending');
      
      return true;
    } catch (error: any) {
      console.error('Unstake error:', error);
      toast.error(error.message || 'Failed to unstake');
      return false;
    } finally {
      setIsUnstaking(false);
    }
  }, [signer, address, state.pools]);

  const claimRewards = useCallback(async (poolId: number) => {
    if (!signer || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    try {
      setIsClaiming(true);
      const pool = state.pools.find(p => p.id === poolId);
      if (!pool) throw new Error('Pool not found');

      toast.info('Claim feature coming soon!');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Claim contract integration pending');
      
      return true;
    } catch (error: any) {
      console.error('Claim error:', error);
      toast.error(error.message || 'Failed to claim');
      return false;
    } finally {
      setIsClaiming(false);
    }
  }, [signer, address, state.pools]);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  return {
    ...state,
    stake,
    unstake,
    claimRewards,
    getTokenBalance,
    refreshPools: fetchPools,
    isStaking,
    isUnstaking,
    isClaiming,
  };
};
