import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { CONTRACTS, TOKEN_LIST, RPC_URL } from '@/config/contracts';
import { STAKING_ABI, ERC20_ABI } from '@/config/abis';
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
  userStartTime: bigint;
  lockPeriod: number; // in seconds from contract
  lockPeriodDays: number; // converted to days
  minStake: bigint;
  isActive: boolean;
  canUnstake: boolean; // whether lock period has passed
}

export interface StakingState {
  pools: StakingPoolInfo[];
  isLoading: boolean;
  error: string | null;
  poolCount: number;
}

const getProvider = () => new ethers.JsonRpcProvider(RPC_URL);

const getTokenInfo = (address: string) => {
  const token = TOKEN_LIST.find(t => t.address.toLowerCase() === address.toLowerCase());
  return {
    symbol: token?.symbol || 'Unknown',
    name: token?.name || 'Unknown Token',
    logo: token?.logo || '/tokens/pc.png',
    decimals: token?.decimals || 18,
  };
};

export const useStaking = () => {
  const { signer, address, isConnected } = useWallet();
  const [state, setState] = useState<StakingState>({
    pools: [],
    isLoading: true,
    error: null,
    poolCount: 0,
  });

  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const getStakingContract = useCallback(() => {
    if (!signer) return null;
    return new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, signer);
  }, [signer]);

  const getReadOnlyContract = useCallback(() => {
    const provider = getProvider();
    return new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, provider);
  }, []);

  const fetchPools = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const contract = getReadOnlyContract();
      const provider = getProvider();
      const pools: StakingPoolInfo[] = [];
      
      // The contract doesn't have a poolLength function, so we'll try to fetch pools until we get an error
      let poolIndex = 0;
      let hasMore = true;
      
      while (hasMore && poolIndex < 50) { // Max 50 pools to prevent infinite loop
        try {
          const poolData = await contract.pools(poolIndex);
          const tokenAddress = poolData[0];
          const apr = Number(poolData[1]);
          const lockPeriod = Number(poolData[2]);
          const minStake = poolData[3];
          const totalStaked = poolData[4];
          const isActive = poolData[5];
          
          // Get token info
          const tokenInfo = getTokenInfo(tokenAddress);
          
          // Try to get symbol from contract if not in our list
          let symbol = tokenInfo.symbol;
          let name = tokenInfo.name;
          if (symbol === 'Unknown') {
            try {
              const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
              symbol = await tokenContract.symbol();
              name = await tokenContract.name();
            } catch (e) {
              console.log('Error fetching token info:', e);
            }
          }
          
          // Get user info if connected
          let userStaked = BigInt(0);
          let userPendingReward = BigInt(0);
          let userStartTime = BigInt(0);
          let canUnstake = true;
          
          if (isConnected && address) {
            try {
              const userStakeData = await contract.userStakes(poolIndex, address);
              userStaked = userStakeData[0];
              userStartTime = userStakeData[1];
              
              // Check pending reward
              try {
                userPendingReward = await contract.pendingReward(poolIndex, address);
              } catch (e) {
                console.log('Error fetching pending reward:', e);
              }
              
              // Check if lock period has passed
              if (userStaked > BigInt(0) && lockPeriod > 0) {
                const currentTime = BigInt(Math.floor(Date.now() / 1000));
                const unlockTime = userStartTime + BigInt(lockPeriod);
                canUnstake = currentTime >= unlockTime;
              }
            } catch (e) {
              console.log('Error fetching user stake info:', e);
            }
          }
          
          pools.push({
            id: poolIndex,
            tokenAddress,
            tokenSymbol: symbol,
            tokenName: name,
            tokenLogo: tokenInfo.logo,
            tokenDecimals: tokenInfo.decimals,
            apr,
            totalStaked,
            userStaked,
            userPendingReward,
            userStartTime,
            lockPeriod,
            lockPeriodDays: Math.floor(lockPeriod / 86400), // Convert seconds to days
            minStake,
            isActive,
            canUnstake,
          });
          
          poolIndex++;
        } catch (e: any) {
          // If we get an error, assume no more pools
          hasMore = false;
        }
      }

      setState({
        pools,
        isLoading: false,
        error: null,
        poolCount: pools.length,
      });
    } catch (error) {
      console.error('Error fetching staking pools:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load staking pools',
      }));
    }
  }, [isConnected, address, getReadOnlyContract]);

  const getTokenBalance = useCallback(async (tokenAddress: string): Promise<string> => {
    if (!address) return '0';
    
    try {
      const provider = getProvider();
      
      // Check if it's native token (PC)
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        const balance = await provider.getBalance(address);
        return ethers.formatEther(balance);
      }
      
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
      const contract = getStakingContract();
      if (!contract) throw new Error('Contract not available');

      const pool = state.pools.find(p => p.id === poolId);
      if (!pool) throw new Error('Pool not found');

      // Check if user already staking
      if (pool.userStaked > BigInt(0)) {
        toast.error('You are already staking in this pool. Unstake first before staking again.');
        return false;
      }

      const amountWei = ethers.parseEther(amount);

      // Check minimum stake
      if (amountWei < pool.minStake) {
        toast.error(`Minimum stake is ${ethers.formatEther(pool.minStake)} ${pool.tokenSymbol}`);
        return false;
      }

      // Check if it's native token (PC)
      const isNativeToken = pool.tokenAddress === '0x0000000000000000000000000000000000000000';

      if (!isNativeToken) {
        // Approve ERC20 token
        const tokenContract = new ethers.Contract(pool.tokenAddress, ERC20_ABI, signer);
        const allowance = await tokenContract.allowance(address, CONTRACTS.STAKING);
        
        if (allowance < amountWei) {
          toast.info('Approving token...');
          const approveTx = await tokenContract.approve(CONTRACTS.STAKING, ethers.MaxUint256);
          await approveTx.wait();
          toast.success('Token approved!');
        }
      }

      // Stake
      toast.info('Staking tokens...');
      const tx = isNativeToken 
        ? await contract.stake(poolId, amountWei, { value: amountWei })
        : await contract.stake(poolId, amountWei);
      await tx.wait();
      
      toast.success(`Successfully staked ${amount} ${pool.tokenSymbol}!`);
      return true;
    } catch (error: any) {
      console.error('Stake error:', error);
      const errorMessage = error.reason || error.message || 'Failed to stake';
      if (errorMessage.includes('Already staking')) {
        toast.error('You are already staking in this pool. Unstake first before staking again.');
      } else {
        toast.error(errorMessage);
      }
      return false;
    } finally {
      setIsStaking(false);
    }
  }, [signer, address, getStakingContract, state.pools]);

  const unstake = useCallback(async (poolId: number) => {
    if (!signer || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    try {
      setIsUnstaking(true);
      const contract = getStakingContract();
      if (!contract) throw new Error('Contract not available');

      const pool = state.pools.find(p => p.id === poolId);
      if (!pool) throw new Error('Pool not found');

      // Check lock period
      if (!pool.canUnstake) {
        const unlockTime = new Date(Number(pool.userStartTime + BigInt(pool.lockPeriod)) * 1000);
        toast.error(`Tokens are locked until ${unlockTime.toLocaleString()}`);
        return false;
      }

      toast.info('Unstaking tokens...');
      const tx = await contract.unstake(poolId);
      await tx.wait();
      
      toast.success(`Successfully unstaked ${pool.tokenSymbol}!`);
      return true;
    } catch (error: any) {
      console.error('Unstake error:', error);
      toast.error(error.reason || error.message || 'Failed to unstake');
      return false;
    } finally {
      setIsUnstaking(false);
    }
  }, [signer, address, getStakingContract, state.pools]);

  const claimRewards = useCallback(async (poolId: number) => {
    if (!signer || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    try {
      setIsClaiming(true);
      const contract = getStakingContract();
      if (!contract) throw new Error('Contract not available');

      const pool = state.pools.find(p => p.id === poolId);
      if (!pool) throw new Error('Pool not found');

      // The contract uses unstake to claim rewards along with principal
      toast.info('Rewards are claimed when you unstake. Unstaking now...');
      
      const tx = await contract.unstake(poolId);
      await tx.wait();
      
      toast.success('Successfully claimed rewards and unstaked!');
      return true;
    } catch (error: any) {
      console.error('Claim error:', error);
      toast.error(error.reason || error.message || 'Failed to claim rewards');
      return false;
    } finally {
      setIsClaiming(false);
    }
  }, [signer, address, getStakingContract, state.pools]);

  const getUnlockTime = useCallback((pool: StakingPoolInfo): Date | null => {
    if (pool.userStaked === BigInt(0) || pool.lockPeriod === 0) return null;
    return new Date(Number(pool.userStartTime + BigInt(pool.lockPeriod)) * 1000);
  }, []);

  const getRemainingLockTime = useCallback((pool: StakingPoolInfo): string => {
    if (pool.userStaked === BigInt(0) || pool.lockPeriod === 0) return '';
    
    const unlockTime = Number(pool.userStartTime) + pool.lockPeriod;
    const currentTime = Math.floor(Date.now() / 1000);
    const remaining = unlockTime - currentTime;
    
    if (remaining <= 0) return 'Unlocked';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  }, []);

  useEffect(() => {
    fetchPools();
    // Refresh every 60 seconds to reduce auto-refresh frequency
    const interval = setInterval(fetchPools, 60000);
    return () => clearInterval(interval);
  }, [isConnected, address]);

  return {
    ...state,
    stake,
    unstake,
    claimRewards,
    getTokenBalance,
    getUnlockTime,
    getRemainingLockTime,
    refreshPools: fetchPools,
    isStaking,
    isUnstaking,
    isClaiming,
  };
};
