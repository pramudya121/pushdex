import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { CONTRACTS } from '@/config/contracts';
import { FARMING_ABI, ERC20_ABI, PAIR_ABI } from '@/config/abis';
import { toast } from 'sonner';

export interface PoolInfo {
  pid: number;
  lpToken: string;
  allocPoint: bigint;
  lastRewardBlock: bigint;
  accRewardPerShare: bigint;
  token0Symbol: string;
  token1Symbol: string;
  token0Address: string;
  token1Address: string;
  lpSymbol: string;
  userStaked: bigint;
  userPendingReward: bigint;
  totalStaked: bigint;
  apr: number;
}

export interface FarmingState {
  pools: PoolInfo[];
  rewardToken: string;
  rewardTokenSymbol: string;
  rewardPerBlock: bigint;
  totalAllocPoint: bigint;
  isLoading: boolean;
}

export const useFarming = () => {
  const { signer, address, isConnected } = useWallet();
  const [state, setState] = useState<FarmingState>({
    pools: [],
    rewardToken: '',
    rewardTokenSymbol: '',
    rewardPerBlock: BigInt(0),
    totalAllocPoint: BigInt(0),
    isLoading: true,
  });

  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isHarvesting, setIsHarvesting] = useState(false);

  const getFarmingContract = useCallback(() => {
    if (!signer) return null;
    return new ethers.Contract(CONTRACTS.FARMING, FARMING_ABI, signer);
  }, [signer]);

  const getReadOnlyContract = useCallback(() => {
    const provider = new ethers.JsonRpcProvider('https://evm.donut.rpc.push.org');
    return new ethers.Contract(CONTRACTS.FARMING, FARMING_ABI, provider);
  }, []);

  const fetchPools = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const contract = getReadOnlyContract();
      const provider = new ethers.JsonRpcProvider('https://evm.donut.rpc.push.org');
      
      const [poolLength, rewardToken, rewardPerBlock, totalAllocPoint] = await Promise.all([
        contract.poolLength(),
        contract.rewardToken(),
        contract.rewardPerBlock(),
        contract.totalAllocPoint(),
      ]);

      // Get reward token symbol
      const rewardTokenContract = new ethers.Contract(rewardToken, ERC20_ABI, provider);
      const rewardTokenSymbol = await rewardTokenContract.symbol();

      const pools: PoolInfo[] = [];
      
      for (let i = 0; i < Number(poolLength); i++) {
        try {
          const poolInfo = await contract.poolInfo(i);
          const lpTokenAddress = poolInfo[0];
          
          // Get LP token info
          const lpContract = new ethers.Contract(lpTokenAddress, PAIR_ABI, provider);
          
          const [token0, token1, totalStaked] = await Promise.all([
            lpContract.token0(),
            lpContract.token1(),
            lpContract.balanceOf(CONTRACTS.FARMING),
          ]);

          // Get token symbols
          const token0Contract = new ethers.Contract(token0, ERC20_ABI, provider);
          const token1Contract = new ethers.Contract(token1, ERC20_ABI, provider);
          
          const [token0Symbol, token1Symbol] = await Promise.all([
            token0Contract.symbol(),
            token1Contract.symbol(),
          ]);

          let userStaked = BigInt(0);
          let userPendingReward = BigInt(0);

          if (isConnected && address) {
            try {
              const userInfo = await contract.userInfo(i, address);
              userStaked = userInfo[0];
              userPendingReward = await contract.pendingReward(i, address);
            } catch (e) {
              console.log('Error fetching user info:', e);
            }
          }

          // Calculate APR (simplified estimate)
          const poolAllocPoint = poolInfo[1];
          const apr = totalAllocPoint > 0 && totalStaked > 0 
            ? (Number(rewardPerBlock) * Number(poolAllocPoint) * 31536000 / Number(totalAllocPoint) / Number(totalStaked)) * 100
            : 0;

          pools.push({
            pid: i,
            lpToken: lpTokenAddress,
            allocPoint: poolInfo[1],
            lastRewardBlock: poolInfo[2],
            accRewardPerShare: poolInfo[3],
            token0Symbol,
            token1Symbol,
            token0Address: token0,
            token1Address: token1,
            lpSymbol: `${token0Symbol}-${token1Symbol} LP`,
            userStaked,
            userPendingReward,
            totalStaked,
            apr: isFinite(apr) ? apr : 0,
          });
        } catch (e) {
          console.log(`Error fetching pool ${i}:`, e);
        }
      }

      setState({
        pools,
        rewardToken,
        rewardTokenSymbol,
        rewardPerBlock,
        totalAllocPoint,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching farming pools:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [getReadOnlyContract, isConnected, address]);

  const stake = useCallback(async (pid: number, amount: string) => {
    if (!signer || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    try {
      setIsStaking(true);
      const contract = getFarmingContract();
      if (!contract) throw new Error('Contract not available');

      const pool = state.pools.find(p => p.pid === pid);
      if (!pool) throw new Error('Pool not found');

      const amountWei = ethers.parseEther(amount);

      // First approve LP token
      const lpContract = new ethers.Contract(pool.lpToken, ERC20_ABI, signer);
      const allowance = await lpContract.allowance(address, CONTRACTS.FARMING);
      
      if (allowance < amountWei) {
        toast.info('Approving LP token...');
        const approveTx = await lpContract.approve(CONTRACTS.FARMING, ethers.MaxUint256);
        await approveTx.wait();
        toast.success('LP token approved!');
      }

      // Deposit
      toast.info('Staking LP tokens...');
      const tx = await contract.deposit(pid, amountWei);
      await tx.wait();
      
      toast.success('Successfully staked!');
      await fetchPools();
      return true;
    } catch (error: any) {
      console.error('Stake error:', error);
      toast.error(error.reason || error.message || 'Failed to stake');
      return false;
    } finally {
      setIsStaking(false);
    }
  }, [signer, address, getFarmingContract, state.pools, fetchPools]);

  const unstake = useCallback(async (pid: number, amount: string) => {
    if (!signer || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    try {
      setIsUnstaking(true);
      const contract = getFarmingContract();
      if (!contract) throw new Error('Contract not available');

      const amountWei = ethers.parseEther(amount);

      toast.info('Unstaking LP tokens...');
      const tx = await contract.withdraw(pid, amountWei);
      await tx.wait();
      
      toast.success('Successfully unstaked!');
      await fetchPools();
      return true;
    } catch (error: any) {
      console.error('Unstake error:', error);
      toast.error(error.reason || error.message || 'Failed to unstake');
      return false;
    } finally {
      setIsUnstaking(false);
    }
  }, [signer, address, getFarmingContract, fetchPools]);

  const harvest = useCallback(async (pid: number) => {
    if (!signer || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    try {
      setIsHarvesting(true);
      const contract = getFarmingContract();
      if (!contract) throw new Error('Contract not available');

      // Deposit 0 to harvest rewards
      toast.info('Harvesting rewards...');
      const tx = await contract.deposit(pid, 0);
      await tx.wait();
      
      toast.success('Successfully harvested rewards!');
      await fetchPools();
      return true;
    } catch (error: any) {
      console.error('Harvest error:', error);
      toast.error(error.reason || error.message || 'Failed to harvest');
      return false;
    } finally {
      setIsHarvesting(false);
    }
  }, [signer, address, getFarmingContract, fetchPools]);

  const emergencyWithdraw = useCallback(async (pid: number) => {
    if (!signer || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    try {
      const contract = getFarmingContract();
      if (!contract) throw new Error('Contract not available');

      toast.info('Emergency withdrawing...');
      const tx = await contract.emergencyWithdraw(pid);
      await tx.wait();
      
      toast.success('Emergency withdraw successful!');
      await fetchPools();
      return true;
    } catch (error: any) {
      console.error('Emergency withdraw error:', error);
      toast.error(error.reason || error.message || 'Failed to emergency withdraw');
      return false;
    }
  }, [signer, address, getFarmingContract, fetchPools]);

  const getLpBalance = useCallback(async (lpToken: string): Promise<string> => {
    if (!signer || !address) return '0';
    
    try {
      const lpContract = new ethers.Contract(lpToken, ERC20_ABI, signer);
      const balance = await lpContract.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting LP balance:', error);
      return '0';
    }
  }, [signer, address]);

  useEffect(() => {
    fetchPools();
    const interval = setInterval(fetchPools, 30000);
    return () => clearInterval(interval);
  }, [fetchPools]);

  return {
    ...state,
    stake,
    unstake,
    harvest,
    emergencyWithdraw,
    getLpBalance,
    refreshPools: fetchPools,
    isStaking,
    isUnstaking,
    isHarvesting,
  };
};
