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
      
      // First, quickly discover how many pools exist
      const poolIndices: number[] = [];
      let poolIndex = 0;
      let hasMore = true;
      
      while (hasMore && poolIndex < 50) {
        try {
          await contract.pools(poolIndex);
          poolIndices.push(poolIndex);
          poolIndex++;
        } catch {
          hasMore = false;
        }
      }
      
      if (poolIndices.length === 0) {
        setState({ pools: [], isLoading: false, error: null, poolCount: 0 });
        return;
      }
      
      // Fetch all pools data in parallel
      const poolDataPromises = poolIndices.map(async (idx) => {
        try {
          const poolData = await contract.pools(idx);
          const tokenAddress = poolData[0];
          const apr = Number(poolData[1]);
          const lockPeriod = Number(poolData[2]);
          const minStake = poolData[3];
          const totalStaked = poolData[4];
          const isActive = poolData[5];
          
          const tokenInfo = getTokenInfo(tokenAddress);
          let symbol = tokenInfo.symbol;
          let name = tokenInfo.name;
          
          // Only call contract if token not in our list
          if (symbol === 'Unknown' && tokenAddress !== '0x0000000000000000000000000000000000000000') {
            try {
              const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
              [symbol, name] = await Promise.all([
                tokenContract.symbol(),
                tokenContract.name()
              ]);
            } catch {
              // Keep defaults
            }
          }
          
          // Get user info if connected
          let userStaked = BigInt(0);
          let userPendingReward = BigInt(0);
          let userStartTime = BigInt(0);
          let canUnstake = true;
          
          if (isConnected && address) {
            try {
              const [userStakeData, pendingReward] = await Promise.all([
                contract.userStakes(idx, address),
                contract.pendingReward(idx, address).catch(() => BigInt(0))
              ]);
              userStaked = userStakeData[0];
              userStartTime = userStakeData[1];
              userPendingReward = pendingReward;
              
              if (userStaked > BigInt(0) && lockPeriod > 0) {
                const currentTime = BigInt(Math.floor(Date.now() / 1000));
                const unlockTime = userStartTime + BigInt(lockPeriod);
                canUnstake = currentTime >= unlockTime;
              }
            } catch {
              // Keep defaults
            }
          }
          
          return {
            id: idx,
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
            lockPeriodDays: Math.floor(lockPeriod / 86400),
            minStake,
            isActive,
            canUnstake,
          };
        } catch {
          return null;
        }
      });
      
      const poolResults = await Promise.all(poolDataPromises);
      const pools: StakingPoolInfo[] = poolResults.filter((p) => p !== null) as StakingPoolInfo[];

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
      
      // Update pool data immediately after successful stake
      await fetchPools();
      
      return true;
    } catch (error: any) {
      // Handle "Already staking" error from contract
      const errorMessage = error.reason || error.message || '';
      if (errorMessage.includes('Already staking')) {
        toast.error('You already have an active stake in this pool. Unstake first to stake a different amount.');
      } else if (errorMessage.includes('unknown custom error')) {
        toast.error('Transaction failed. You may already have an active stake in this pool.');
      } else {
        toast.error(errorMessage || 'Failed to stake');
      }
      return false;
    } finally {
      setIsStaking(false);
    }
  }, [signer, address, getStakingContract, state.pools, fetchPools]);

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
      
      // Update pool data immediately after successful unstake
      await fetchPools();
      
      return true;
    } catch (error: any) {
      console.error('Unstake error:', error);
      toast.error(error.reason || error.message || 'Failed to unstake');
      return false;
    } finally {
      setIsUnstaking(false);
    }
  }, [signer, address, getStakingContract, state.pools, fetchPools]);

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
    // No auto-refresh - data updates after transactions
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
