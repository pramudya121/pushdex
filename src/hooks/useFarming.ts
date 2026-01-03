import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/contexts/WalletContext';
import { CONTRACTS, TOKEN_LIST, RPC_URL } from '@/config/contracts';
import { FARMING_ABI, ERC20_ABI, PAIR_ABI, FACTORY_ABI } from '@/config/abis';
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
  token0Logo: string;
  token1Logo: string;
  lpSymbol: string;
  userStaked: bigint;
  userPendingReward: bigint;
  totalStaked: bigint;
  apr: number;
  multiplier: string;
}

export interface UserLPPosition {
  lpToken: string;
  lpSymbol: string;
  balance: bigint;
  token0Symbol: string;
  token1Symbol: string;
  token0Logo: string;
  token1Logo: string;
  token0Address: string;
  token1Address: string;
  isStakeable: boolean;
  farmPid?: number;
}

export interface FarmingState {
  pools: PoolInfo[];
  userLPPositions: UserLPPosition[];
  rewardToken: string;
  rewardTokenSymbol: string;
  rewardTokenLogo: string;
  rewardPerBlock: bigint;
  totalAllocPoint: bigint;
  startBlock: bigint;
  isLoading: boolean;
  error: string | null;
}

const getProvider = () => new ethers.JsonRpcProvider(RPC_URL);

const getTokenLogo = (address: string): string => {
  const token = TOKEN_LIST.find(t => t.address.toLowerCase() === address.toLowerCase());
  return token?.logo || '/tokens/pc.png';
};

const getTokenSymbol = (address: string): string | null => {
  const token = TOKEN_LIST.find(t => t.address.toLowerCase() === address.toLowerCase());
  return token?.symbol || null;
};

export const useFarming = () => {
  const { signer, address, isConnected } = useWallet();
  const [state, setState] = useState<FarmingState>({
    pools: [],
    userLPPositions: [],
    rewardToken: '',
    rewardTokenSymbol: '',
    rewardTokenLogo: '',
    rewardPerBlock: BigInt(0),
    totalAllocPoint: BigInt(0),
    startBlock: BigInt(0),
    isLoading: true,
    error: null,
  });

  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [isHarvestingAll, setIsHarvestingAll] = useState(false);

  const getFarmingContract = useCallback(() => {
    if (!signer) return null;
    return new ethers.Contract(CONTRACTS.FARMING, FARMING_ABI, signer);
  }, [signer]);

  const getReadOnlyContract = useCallback(() => {
    const provider = getProvider();
    return new ethers.Contract(CONTRACTS.FARMING, FARMING_ABI, provider);
  }, []);

  // Fetch all user LP positions from factory
  const fetchUserLPPositions = useCallback(async (farmPoolAddresses: string[]): Promise<UserLPPosition[]> => {
    if (!address) return [];

    try {
      const provider = getProvider();
      const factory = new ethers.Contract(CONTRACTS.FACTORY, FACTORY_ABI, provider);
      
      const pairsLength = await factory.allPairsLength();
      const positions: UserLPPosition[] = [];

      for (let i = 0; i < Number(pairsLength); i++) {
        try {
          const pairAddress = await factory.allPairs(i);
          const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, provider);
          
          const balance = await pairContract.balanceOf(address);
          
          if (balance > BigInt(0)) {
            const [token0, token1] = await Promise.all([
              pairContract.token0(),
              pairContract.token1(),
            ]);

            const token0Contract = new ethers.Contract(token0, ERC20_ABI, provider);
            const token1Contract = new ethers.Contract(token1, ERC20_ABI, provider);

            // Try to get symbol from TOKEN_LIST first, then from contract
            const token0SymbolFromList = getTokenSymbol(token0);
            const token1SymbolFromList = getTokenSymbol(token1);
            
            const [token0Symbol, token1Symbol] = await Promise.all([
              token0SymbolFromList ? Promise.resolve(token0SymbolFromList) : token0Contract.symbol().catch(() => 'Unknown'),
              token1SymbolFromList ? Promise.resolve(token1SymbolFromList) : token1Contract.symbol().catch(() => 'Unknown'),
            ]);

            const farmPidIndex = farmPoolAddresses.findIndex(
              addr => addr.toLowerCase() === pairAddress.toLowerCase()
            );

            positions.push({
              lpToken: pairAddress,
              lpSymbol: `${token0Symbol}-${token1Symbol} LP`,
              balance,
              token0Symbol,
              token1Symbol,
              token0Logo: getTokenLogo(token0),
              token1Logo: getTokenLogo(token1),
              token0Address: token0,
              token1Address: token1,
              isStakeable: farmPidIndex >= 0,
              farmPid: farmPidIndex >= 0 ? farmPidIndex : undefined,
            });
          }
        } catch (e) {
          console.log(`Error fetching pair ${i}:`, e);
        }
      }

      return positions;
    } catch (error) {
      console.error('Error fetching user LP positions:', error);
      return [];
    }
  }, [address]);

  const fetchPools = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const contract = getReadOnlyContract();
      const provider = getProvider();
      
      // Fetch basic farm info with error handling
      let poolLength: bigint;
      let rewardToken: string;
      let rewardPerBlock: bigint;
      let totalAllocPoint: bigint;
      let startBlock: bigint;

      try {
        [poolLength, rewardToken, rewardPerBlock, totalAllocPoint, startBlock] = await Promise.all([
          contract.poolLength(),
          contract.rewardToken(),
          contract.rewardPerBlock(),
          contract.totalAllocPoint(),
          contract.startBlock(),
        ]);
      } catch (e) {
        console.error('Error fetching farm info:', e);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Failed to fetch farming contract data. Please try again.' 
        }));
        return;
      }

      // Get reward token info
      let rewardTokenSymbol = getTokenSymbol(rewardToken) || 'REWARD';
      let rewardTokenLogo = getTokenLogo(rewardToken);
      
      if (rewardTokenSymbol === 'REWARD') {
        try {
          const rewardTokenContract = new ethers.Contract(rewardToken, ERC20_ABI, provider);
          rewardTokenSymbol = await rewardTokenContract.symbol();
        } catch {
          // Keep default
        }
      }

      const farmPoolAddresses: string[] = [];
      
      // Fetch all pool info in parallel
      const poolPromises = Array.from({ length: Number(poolLength) }, async (_, i) => {
        try {
          const poolInfo = await contract.poolInfo(i);
          const lpTokenAddress = poolInfo[0];
          farmPoolAddresses[i] = lpTokenAddress;
          
          const lpContract = new ethers.Contract(lpTokenAddress, PAIR_ABI, provider);
          
          const [token0, token1, lpTotalStaked] = await Promise.all([
            lpContract.token0(),
            lpContract.token1(),
            lpContract.balanceOf(CONTRACTS.FARMING),
          ]);

          // Get token symbols in parallel
          const token0SymbolFromList = getTokenSymbol(token0);
          const token1SymbolFromList = getTokenSymbol(token1);
          
          let token0Symbol = token0SymbolFromList;
          let token1Symbol = token1SymbolFromList;
          
          if (!token0Symbol || !token1Symbol) {
            const token0Contract = new ethers.Contract(token0, ERC20_ABI, provider);
            const token1Contract = new ethers.Contract(token1, ERC20_ABI, provider);
            const [s0, s1] = await Promise.all([
              token0Symbol ? Promise.resolve(token0Symbol) : token0Contract.symbol().catch(() => 'Unknown'),
              token1Symbol ? Promise.resolve(token1Symbol) : token1Contract.symbol().catch(() => 'Unknown'),
            ]);
            token0Symbol = s0;
            token1Symbol = s1;
          }

          let userStaked = BigInt(0);
          let userPendingReward = BigInt(0);

          if (isConnected && address) {
            try {
              const [userInfo, pending] = await Promise.all([
                contract.userInfo(i, address),
                contract.pendingReward(i, address).catch(() => BigInt(0))
              ]);
              userStaked = userInfo[0];
              userPendingReward = pending;
            } catch {
              // Keep defaults
            }
          }

          const poolAllocPoint = poolInfo[1];
          const multiplier = totalAllocPoint > 0 
            ? `${(Number(poolAllocPoint) / Number(totalAllocPoint) * 100).toFixed(0)}x`
            : '0x';
          
          const blocksPerYear = 31536000 / 3;
          const apr = totalAllocPoint > 0 && lpTotalStaked > 0 
            ? (Number(rewardPerBlock) * Number(poolAllocPoint) * blocksPerYear / Number(totalAllocPoint) / Number(lpTotalStaked)) * 100
            : 0;

          return {
            pid: i,
            lpToken: lpTokenAddress,
            allocPoint: poolInfo[1],
            lastRewardBlock: poolInfo[2],
            accRewardPerShare: poolInfo[3],
            token0Symbol: token0Symbol || 'Unknown',
            token1Symbol: token1Symbol || 'Unknown',
            token0Address: token0,
            token1Address: token1,
            token0Logo: getTokenLogo(token0),
            token1Logo: getTokenLogo(token1),
            lpSymbol: `${token0Symbol}-${token1Symbol} LP`,
            userStaked,
            userPendingReward,
            totalStaked: lpTotalStaked,
            apr: isFinite(apr) ? Math.min(apr, 99999) : 0,
            multiplier,
          };
        } catch (e) {
          console.log(`Error fetching pool ${i}:`, e);
          return null;
        }
      });
      
      const poolResults = await Promise.all(poolPromises);
      const pools: PoolInfo[] = poolResults.filter((p): p is PoolInfo => p !== null);

      // Fetch user LP positions
      const userLPPositions = await fetchUserLPPositions(farmPoolAddresses.filter(Boolean));

      setState({
        pools,
        userLPPositions,
        rewardToken,
        rewardTokenSymbol,
        rewardTokenLogo,
        rewardPerBlock,
        totalAllocPoint,
        startBlock,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching farming pools:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'Failed to load farming data. Please refresh.'
      }));
    }
  }, [getReadOnlyContract, isConnected, address, fetchUserLPPositions]);

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

      // Validate and parse amount
      const trimmedAmount = amount.trim();
      if (!trimmedAmount || isNaN(parseFloat(trimmedAmount)) || parseFloat(trimmedAmount) <= 0) {
        toast.error('Please enter a valid amount');
        return false;
      }

      const amountWei = ethers.parseEther(trimmedAmount);
      
      if (amountWei <= BigInt(0)) {
        toast.error('Please enter a valid amount greater than 0');
        return false;
      }

      // Create LP contract instance
      const lpContract = new ethers.Contract(pool.lpToken, ERC20_ABI, signer);
      
      // Check user's LP balance first
      const lpBalance = await lpContract.balanceOf(address);
      console.log('LP Balance:', ethers.formatEther(lpBalance), 'Amount to stake:', trimmedAmount);
      
      if (lpBalance < amountWei) {
        toast.error(`Insufficient LP token balance. You have ${ethers.formatEther(lpBalance)} LP`);
        return false;
      }

      // Check and handle approval
      const allowance = await lpContract.allowance(address, CONTRACTS.FARMING);
      console.log('Current allowance:', ethers.formatEther(allowance));
      
      if (allowance < amountWei) {
        toast.info('Approving LP token...');
        try {
          const approveTx = await lpContract.approve(CONTRACTS.FARMING, ethers.MaxUint256);
          await approveTx.wait();
          toast.success('LP token approved!');
          
          // Wait for approval to be confirmed on-chain
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (approveError: any) {
          console.error('Approve error:', approveError);
          toast.error('Failed to approve LP token. Please try again.');
          return false;
        }
      }

      // Simulate transaction first using staticCall to check if it will succeed
      toast.info('Checking transaction...');
      try {
        await contract.deposit.staticCall(pid, amountWei);
        console.log('Static call succeeded, proceeding with transaction');
      } catch (staticError: any) {
        console.error('Static call failed:', staticError);
        const reason = staticError.reason || staticError.message || '';
        
        // Provide specific error messages based on common issues
        if (reason.includes('transfer amount exceeds balance')) {
          toast.error('LP token transfer failed. Check your balance.');
        } else if (reason.includes('transfer amount exceeds allowance')) {
          toast.error('Approval issue. Please try again.');
        } else if (reason.includes('revert')) {
          toast.error('Transaction would fail. The contract may not have enough reward tokens or the pool may be inactive.');
        } else {
          toast.error(`Transaction simulation failed: ${reason.slice(0, 100)}`);
        }
        return false;
      }

      // Execute the actual deposit
      toast.info('Staking LP tokens...');
      try {
        const tx = await contract.deposit(pid, amountWei, {
          gasLimit: 500000n // Increased gas limit for safety
        });
        
        toast.info('Transaction submitted. Waiting for confirmation...');
        const receipt = await tx.wait();
        
        if (receipt.status === 0) {
          toast.error('Transaction failed on-chain');
          return false;
        }
        
        toast.success('Successfully staked!');
        await fetchPools();
        return true;
        
      } catch (depositError: any) {
        console.error('Deposit error:', depositError);
        const errorMessage = depositError.message || depositError.reason || '';
        
        if (errorMessage.includes('user rejected')) {
          toast.error('Transaction was rejected');
        } else if (errorMessage.includes('insufficient funds')) {
          toast.error('Insufficient gas for transaction');
        } else {
          toast.error('Staking failed. The farming contract may not have enough reward tokens to distribute.');
        }
        return false;
      }
    } catch (error: any) {
      console.error('Stake error:', error);
      toast.error('Failed to stake. Please try again.');
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

      // Validate and parse amount
      const trimmedAmount = amount.trim();
      if (!trimmedAmount || isNaN(parseFloat(trimmedAmount)) || parseFloat(trimmedAmount) <= 0) {
        toast.error('Please enter a valid amount');
        return false;
      }

      const amountWei = ethers.parseEther(trimmedAmount);
      
      if (amountWei <= BigInt(0)) {
        toast.error('Please enter a valid amount greater than 0');
        return false;
      }

      // Get fresh user info from contract to verify staked amount
      const provider = getProvider();
      const readContract = new ethers.Contract(CONTRACTS.FARMING, FARMING_ABI, provider);
      const userInfo = await readContract.userInfo(pid, address);
      const actualStaked = userInfo[0]; // amount field
      
      console.log('Actual staked amount:', ethers.formatEther(actualStaked), 'Amount to unstake:', trimmedAmount);
      
      if (actualStaked < amountWei) {
        toast.error(`Insufficient staked balance. You have ${ethers.formatEther(actualStaked)} LP staked`);
        return false;
      }

      // Simulate transaction first
      toast.info('Checking transaction...');
      try {
        await contract.withdraw.staticCall(pid, amountWei);
        console.log('Withdraw static call succeeded');
      } catch (staticError: any) {
        console.error('Withdraw static call failed:', staticError);
        const reason = staticError.reason || staticError.message || '';
        
        if (reason.includes('withdraw: not good') || reason.includes('exceeds')) {
          toast.error('Cannot withdraw more than your staked amount');
        } else if (reason.includes('revert')) {
          toast.error('Withdrawal would fail. The contract may not have enough reward tokens to pay out.');
        } else {
          toast.error(`Transaction simulation failed: ${reason.slice(0, 100)}`);
        }
        return false;
      }

      // Execute withdrawal
      toast.info('Unstaking LP tokens...');
      try {
        const tx = await contract.withdraw(pid, amountWei, {
          gasLimit: 500000n // Increased gas limit for safety
        });
        
        toast.info('Transaction submitted. Waiting for confirmation...');
        const receipt = await tx.wait();
        
        if (receipt.status === 0) {
          toast.error('Transaction failed on-chain');
          return false;
        }
        
        toast.success('Successfully unstaked!');
        await fetchPools();
        return true;
        
      } catch (withdrawError: any) {
        console.error('Withdraw error:', withdrawError);
        const errorMessage = withdrawError.message || withdrawError.reason || '';
        
        if (errorMessage.includes('user rejected')) {
          toast.error('Transaction was rejected');
        } else if (errorMessage.includes('insufficient funds')) {
          toast.error('Insufficient gas for transaction');
        } else {
          toast.error('Withdrawal failed. The farming contract may not have enough reward tokens.');
        }
        return false;
      }
    } catch (error: any) {
      console.error('Unstake error:', error);
      toast.error('Failed to unstake. Please try again.');
      return false;
    } finally {
      setIsUnstaking(false);
    }
  }, [signer, address, getFarmingContract, state.pools, fetchPools]);

  const harvest = useCallback(async (pid: number) => {
    if (!signer || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    try {
      setIsHarvesting(true);
      const contract = getFarmingContract();
      if (!contract) throw new Error('Contract not available');

      // Simulate harvest first (deposit 0)
      toast.info('Checking rewards...');
      try {
        await contract.deposit.staticCall(pid, 0);
      } catch (staticError: any) {
        console.error('Harvest static call failed:', staticError);
        toast.error('Cannot harvest rewards. The contract may not have enough reward tokens.');
        return false;
      }

      // Execute harvest
      toast.info('Harvesting rewards...');
      const tx = await contract.deposit(pid, 0, {
        gasLimit: 500000n
      });
      
      const receipt = await tx.wait();
      if (receipt.status === 0) {
        toast.error('Harvest transaction failed');
        return false;
      }
      
      toast.success('Successfully harvested rewards!');
      await fetchPools();
      return true;
    } catch (error: any) {
      console.error('Harvest error:', error);
      const msg = error.message || '';
      if (msg.includes('user rejected')) {
        toast.error('Transaction was rejected');
      } else {
        toast.error('Failed to harvest rewards');
      }
      return false;
    } finally {
      setIsHarvesting(false);
    }
  }, [signer, address, getFarmingContract, fetchPools]);

  const harvestAll = useCallback(async () => {
    if (!signer || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    const poolsWithRewards = state.pools.filter(p => p.userPendingReward > BigInt(0));
    if (poolsWithRewards.length === 0) {
      toast.info('No pending rewards to harvest');
      return false;
    }

    try {
      setIsHarvestingAll(true);
      const contract = getFarmingContract();
      if (!contract) throw new Error('Contract not available');

      toast.info(`Harvesting rewards from ${poolsWithRewards.length} pools...`);
      
      let successCount = 0;
      let failCount = 0;

      for (const pool of poolsWithRewards) {
        try {
          // Simulate first
          await contract.deposit.staticCall(pool.pid, 0);
          
          const tx = await contract.deposit(pool.pid, 0, {
            gasLimit: 500000n
          });
          await tx.wait();
          successCount++;
        } catch (e) {
          console.error(`Failed to harvest pool ${pool.pid}:`, e);
          failCount++;
        }
      }
      
      if (successCount > 0 && failCount === 0) {
        toast.success('Successfully harvested all rewards!');
      } else if (successCount > 0) {
        toast.success(`Harvested ${successCount} pools. ${failCount} pools failed.`);
      } else {
        toast.error('Failed to harvest. Contract may not have enough reward tokens.');
      }
      
      await fetchPools();
      return successCount > 0;
    } catch (error: any) {
      console.error('Harvest all error:', error);
      toast.error('Failed to harvest all rewards');
      return false;
    } finally {
      setIsHarvestingAll(false);
    }
  }, [signer, address, getFarmingContract, state.pools, fetchPools]);

  const emergencyWithdraw = useCallback(async (pid: number) => {
    if (!signer || !address) {
      toast.error('Please connect your wallet');
      return false;
    }

    try {
      const contract = getFarmingContract();
      if (!contract) throw new Error('Contract not available');

      // Simulate first
      toast.info('Checking emergency withdraw...');
      try {
        await contract.emergencyWithdraw.staticCall(pid);
      } catch (staticError: any) {
        console.error('Emergency withdraw static call failed:', staticError);
        toast.error('Emergency withdraw would fail. You may not have any staked tokens.');
        return false;
      }

      toast.info('Emergency withdrawing...');
      const tx = await contract.emergencyWithdraw(pid, {
        gasLimit: 500000n
      });
      
      const receipt = await tx.wait();
      if (receipt.status === 0) {
        toast.error('Emergency withdraw failed on-chain');
        return false;
      }
      
      toast.success('Emergency withdraw successful!');
      await fetchPools();
      return true;
    } catch (error: any) {
      console.error('Emergency withdraw error:', error);
      const msg = error.message || '';
      if (msg.includes('user rejected')) {
        toast.error('Transaction was rejected');
      } else {
        toast.error('Failed to emergency withdraw');
      }
      return false;
    }
  }, [signer, address, getFarmingContract, fetchPools]);

  const getLpBalance = useCallback(async (lpToken: string): Promise<string> => {
    if (!address) return '0';
    
    try {
      const provider = getProvider();
      const lpContract = new ethers.Contract(lpToken, ERC20_ABI, provider);
      const balance = await lpContract.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting LP balance:', error);
      return '0';
    }
  }, [address]);

  useEffect(() => {
    fetchPools();
  }, [isConnected, address]);

  return {
    ...state,
    stake,
    unstake,
    harvest,
    harvestAll,
    emergencyWithdraw,
    getLpBalance,
    refreshPools: fetchPools,
    isStaking,
    isUnstaking,
    isHarvesting,
    isHarvestingAll,
  };
};
