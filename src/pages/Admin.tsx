import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { WaveBackground } from '@/components/WaveBackground';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Plus, 
  Settings, 
  Loader2, 
  AlertCircle,
  Wallet,
  Coins,
  Leaf,
  ExternalLink,
  CheckCircle,
  XCircle,
  RefreshCw,
  DollarSign,
  ArrowUpFromLine,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { ethers } from 'ethers';
import { CONTRACTS, TOKEN_LIST, BLOCK_EXPLORER, RPC_URL } from '@/config/contracts';
import { STAKING_ABI, FARMING_ABI, ERC20_ABI } from '@/config/abis';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';

interface StakingPoolData {
  id: number;
  token: string;
  tokenSymbol: string;
  apr: number;
  lockPeriod: number;
  minStake: bigint;
  totalStaked: bigint;
  active: boolean;
}

interface FarmingPoolData {
  id: number;
  lpToken: string;
  lpSymbol: string;
  allocPoint: bigint;
  totalStaked: bigint;
}

interface FarmingContractInfo {
  rewardToken: string;
  rewardTokenSymbol: string;
  rewardTokenLogo: string;
  rewardPerBlock: bigint;
  startBlock: bigint;
  totalAllocPoint: bigint;
  contractRewardBalance: bigint;
  userRewardBalance: bigint;
}

const getProvider = () => new ethers.JsonRpcProvider(RPC_URL);

const Admin: React.FC = () => {
  const { signer, address, isConnected } = useWallet();
  
  // State for staking admin
  const [stakingOwner, setStakingOwner] = useState<string>('');
  const [isStakingOwner, setIsStakingOwner] = useState(false);
  const [stakingPools, setStakingPools] = useState<StakingPoolData[]>([]);
  const [isLoadingStaking, setIsLoadingStaking] = useState(true);
  
  // State for farming admin
  const [farmingPools, setFarmingPools] = useState<FarmingPoolData[]>([]);
  const [isLoadingFarming, setIsLoadingFarming] = useState(true);
  const [farmingInfo, setFarmingInfo] = useState<FarmingContractInfo | null>(null);
  
  // Add Pool Form State
  const [selectedToken, setSelectedToken] = useState('');
  const [apr, setApr] = useState('');
  const [lockPeriodDays, setLockPeriodDays] = useState('');
  const [minStake, setMinStake] = useState('');
  const [isAddingPool, setIsAddingPool] = useState(false);
  
  // Add Farm Form State
  const [lpTokenAddress, setLpTokenAddress] = useState('');
  const [allocPoint, setAllocPoint] = useState('');
  const [isAddingFarm, setIsAddingFarm] = useState(false);

  // Funding Form State
  const [fundAmount, setFundAmount] = useState('');
  const [isFunding, setIsFunding] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Check ownership and fetch pools
  useEffect(() => {
    const fetchData = async () => {
      const provider = getProvider();
      
      // Fetch staking data
      try {
        setIsLoadingStaking(true);
        const stakingContract = new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, provider);
        const owner = await stakingContract.owner();
        setStakingOwner(owner);
        setIsStakingOwner(address?.toLowerCase() === owner.toLowerCase());
        
        // Fetch staking pools
        const pools: StakingPoolData[] = [];
        let poolIndex = 0;
        let hasMore = true;
        
        while (hasMore && poolIndex < 50) {
          try {
            const poolData = await stakingContract.pools(poolIndex);
            const tokenAddress = poolData[0];
            
            let tokenSymbol = 'Unknown';
            const token = TOKEN_LIST.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());
            if (token) {
              tokenSymbol = token.symbol;
            } else {
              try {
                const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
                tokenSymbol = await tokenContract.symbol();
              } catch {}
            }
            
            pools.push({
              id: poolIndex,
              token: tokenAddress,
              tokenSymbol,
              apr: Number(poolData[1]),
              lockPeriod: Number(poolData[2]),
              minStake: poolData[3],
              totalStaked: poolData[4],
              active: poolData[5],
            });
            poolIndex++;
          } catch {
            hasMore = false;
          }
        }
        setStakingPools(pools);
      } catch (error) {
        console.error('Error fetching staking data:', error);
      } finally {
        setIsLoadingStaking(false);
      }
      
      // Fetch farming data
      try {
        setIsLoadingFarming(true);
        const farmingContract = new ethers.Contract(CONTRACTS.FARMING, FARMING_ABI, provider);
        
        // Get farming contract info
        const [poolLength, rewardToken, rewardPerBlock, totalAllocPoint, startBlock] = await Promise.all([
          farmingContract.poolLength(),
          farmingContract.rewardToken(),
          farmingContract.rewardPerBlock(),
          farmingContract.totalAllocPoint(),
          farmingContract.startBlock(),
        ]);

        // Get reward token details
        const rewardTokenContract = new ethers.Contract(rewardToken, ERC20_ABI, provider);
        const [contractRewardBalance, rewardTokenSymbol] = await Promise.all([
          rewardTokenContract.balanceOf(CONTRACTS.FARMING),
          rewardTokenContract.symbol(),
        ]);

        // Get user's reward token balance if connected
        let userRewardBalance = BigInt(0);
        if (address) {
          userRewardBalance = await rewardTokenContract.balanceOf(address);
        }

        const tokenFromList = TOKEN_LIST.find(t => t.address.toLowerCase() === rewardToken.toLowerCase());
        
        setFarmingInfo({
          rewardToken,
          rewardTokenSymbol,
          rewardTokenLogo: tokenFromList?.logo || '/tokens/pc.png',
          rewardPerBlock,
          startBlock,
          totalAllocPoint,
          contractRewardBalance,
          userRewardBalance,
        });
        
        const farms: FarmingPoolData[] = [];
        for (let i = 0; i < Number(poolLength); i++) {
          try {
            const poolInfo = await farmingContract.poolInfo(i);
            const lpAddress = poolInfo[0];
            
            // Get LP token info using PAIR_ABI for token0/token1
            const PAIR_ABI_MINI = [
              'function token0() view returns (address)',
              'function token1() view returns (address)',
              'function balanceOf(address) view returns (uint256)',
            ];
            const lpContract = new ethers.Contract(lpAddress, PAIR_ABI_MINI, provider);
            
            const [token0, token1] = await Promise.all([
              lpContract.token0(),
              lpContract.token1(),
            ]);
            
            // Get token symbols from TOKEN_LIST first, then from contract
            const getSymbolFromList = (addr: string) => {
              const token = TOKEN_LIST.find(t => t.address.toLowerCase() === addr.toLowerCase());
              return token?.symbol || null;
            };
            
            let token0Symbol = getSymbolFromList(token0);
            let token1Symbol = getSymbolFromList(token1);
            
            if (!token0Symbol || !token1Symbol) {
              const [t0Symbol, t1Symbol] = await Promise.all([
                token0Symbol ? Promise.resolve(token0Symbol) : new ethers.Contract(token0, ERC20_ABI, provider).symbol().catch(() => 'Unknown'),
                token1Symbol ? Promise.resolve(token1Symbol) : new ethers.Contract(token1, ERC20_ABI, provider).symbol().catch(() => 'Unknown'),
              ]);
              token0Symbol = t0Symbol;
              token1Symbol = t1Symbol;
            }
            
            const totalStaked = await lpContract.balanceOf(CONTRACTS.FARMING);
            
            farms.push({
              id: i,
              lpToken: lpAddress,
              lpSymbol: `${token0Symbol}-${token1Symbol}`,
              allocPoint: poolInfo[1],
              totalStaked,
            });
          } catch (e) {
            console.log('Error fetching farm pool', i, e);
          }
        }
        setFarmingPools(farms);
      } catch (error) {
        console.error('Error fetching farming data:', error);
      } finally {
        setIsLoadingFarming(false);
      }
    };
    
    fetchData();
  }, [address]);

  const handleAddStakingPool = async () => {
    if (!signer || !isStakingOwner) {
      toast.error('You must be the contract owner');
      return;
    }
    
    if (!selectedToken || !apr || !minStake) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      setIsAddingPool(true);
      const contract = new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, signer);
      
      const lockPeriodSeconds = parseInt(lockPeriodDays || '0') * 86400; // Convert days to seconds
      const minStakeWei = ethers.parseEther(minStake);
      
      toast.info('Adding staking pool...');
      const tx = await contract.addPool(
        selectedToken,
        parseInt(apr),
        lockPeriodSeconds,
        minStakeWei
      );
      await tx.wait();
      
      toast.success('Staking pool added successfully!');
      
      // Reset form
      setSelectedToken('');
      setApr('');
      setLockPeriodDays('');
      setMinStake('');
      
      // Refresh pools
      window.location.reload();
    } catch (error: any) {
      console.error('Error adding pool:', error);
      toast.error(error.reason || error.message || 'Failed to add pool');
    } finally {
      setIsAddingPool(false);
    }
  };

  const handleSetPoolStatus = async (poolId: number, status: boolean) => {
    if (!signer || !isStakingOwner) {
      toast.error('You must be the contract owner');
      return;
    }
    
    try {
      const contract = new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, signer);
      
      toast.info(`${status ? 'Activating' : 'Deactivating'} pool...`);
      const tx = await contract.setPoolStatus(poolId, status);
      await tx.wait();
      
      toast.success(`Pool ${status ? 'activated' : 'deactivated'} successfully!`);
      
      // Update local state
      setStakingPools(prev => prev.map(p => 
        p.id === poolId ? { ...p, active: status } : p
      ));
    } catch (error: any) {
      console.error('Error setting pool status:', error);
      toast.error(error.reason || error.message || 'Failed to update pool status');
    }
  };

  const handleAddFarmingPool = async () => {
    if (!signer) {
      toast.error('Please connect your wallet');
      return;
    }
    
    if (!lpTokenAddress || !allocPoint) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      setIsAddingFarm(true);
      const contract = new ethers.Contract(CONTRACTS.FARMING, FARMING_ABI, signer);
      
      toast.info('Adding farming pool...');
      const tx = await contract.add(parseInt(allocPoint), lpTokenAddress);
      await tx.wait();
      
      toast.success('Farming pool added successfully!');
      
      // Reset form
      setLpTokenAddress('');
      setAllocPoint('');
      
      // Refresh
      window.location.reload();
    } catch (error: any) {
      console.error('Error adding farm:', error);
      toast.error(error.reason || error.message || 'Failed to add farm');
    } finally {
      setIsAddingFarm(false);
    }
  };

  const handleFundFarming = async () => {
    if (!signer || !address || !farmingInfo) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setIsFunding(true);
      const rewardTokenContract = new ethers.Contract(farmingInfo.rewardToken, ERC20_ABI, signer);
      const amountWei = ethers.parseEther(fundAmount);

      // Check user's balance
      if (farmingInfo.userRewardBalance < amountWei) {
        toast.error(`Insufficient balance. You have ${ethers.formatEther(farmingInfo.userRewardBalance)} ${farmingInfo.rewardTokenSymbol}`);
        return;
      }

      // Check allowance
      const allowance = await rewardTokenContract.allowance(address, CONTRACTS.FARMING);
      
      if (allowance < amountWei) {
        setIsApproving(true);
        toast.info(`Approving ${farmingInfo.rewardTokenSymbol}...`);
        const approveTx = await rewardTokenContract.approve(CONTRACTS.FARMING, ethers.MaxUint256);
        await approveTx.wait();
        toast.success('Approval successful!');
        setIsApproving(false);
      }

      // Transfer tokens to farming contract
      toast.info(`Transferring ${fundAmount} ${farmingInfo.rewardTokenSymbol} to farming contract...`);
      const transferTx = await rewardTokenContract.transfer(CONTRACTS.FARMING, amountWei);
      await transferTx.wait();

      toast.success(`Successfully funded farming contract with ${fundAmount} ${farmingInfo.rewardTokenSymbol}!`);
      setFundAmount('');
      
      // Refresh
      window.location.reload();
    } catch (error: any) {
      console.error('Error funding farming:', error);
      toast.error(error.reason || error.message || 'Failed to fund farming contract');
    } finally {
      setIsFunding(false);
      setIsApproving(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background wave-bg">
        <WaveBackground />
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
          <Card className="glass-card max-w-md mx-auto animate-fade-in">
            <CardContent className="py-12">
              <div className="text-center">
                <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                <p className="text-muted-foreground">
                  Connect your wallet to access admin functions
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const contractBalanceFormatted = farmingInfo ? parseFloat(ethers.formatEther(farmingInfo.contractRewardBalance)).toFixed(4) : '0';
  const userBalanceFormatted = farmingInfo ? parseFloat(ethers.formatEther(farmingInfo.userRewardBalance)).toFixed(4) : '0';
  const hasLowBalance = farmingInfo ? farmingInfo.contractRewardBalance < ethers.parseEther('100') : true;

  return (
    <div className="min-h-screen bg-background wave-bg">
      <WaveBackground />
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-warning/10 border border-warning/20">
            <Shield className="w-5 h-5 text-warning" />
            <span className="text-warning font-medium">Admin Panel</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Contract Management</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Manage staking and farming pools. Only contract owners can add new pools.
          </p>
        </div>

        {/* Ownership Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 animate-stagger">
          <Card className="glass-card hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Staking Contract</p>
                    <p className="font-medium text-foreground truncate max-w-[200px]">
                      {CONTRACTS.STAKING.slice(0, 10)}...{CONTRACTS.STAKING.slice(-8)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isStakingOwner ? (
                    <Badge className="bg-success/20 text-success border-success/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Owner
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <XCircle className="w-3 h-3 mr-1" />
                      Not Owner
                    </Badge>
                  )}
                  <a
                    href={`${BLOCK_EXPLORER}/address/${CONTRACTS.STAKING}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover:border-accent/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Farming Contract</p>
                    <p className="font-medium text-foreground truncate max-w-[200px]">
                      {CONTRACTS.FARMING.slice(0, 10)}...{CONTRACTS.FARMING.slice(-8)}
                    </p>
                  </div>
                </div>
                <a
                  href={`${BLOCK_EXPLORER}/address/${CONTRACTS.FARMING}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="staking" className="space-y-6">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3">
            <TabsTrigger value="staking" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Coins className="w-4 h-4 mr-2" />
              Staking
            </TabsTrigger>
            <TabsTrigger value="farming" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Leaf className="w-4 h-4 mr-2" />
              Farming
            </TabsTrigger>
            <TabsTrigger value="funding" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <DollarSign className="w-4 h-4 mr-2" />
              Funding
            </TabsTrigger>
          </TabsList>

          {/* Staking Tab */}
          <TabsContent value="staking" className="space-y-6 animate-fade-in">
            {/* Add Pool Form */}
            {isStakingOwner && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add Staking Pool
                  </CardTitle>
                  <CardDescription>
                    Create a new single-token staking pool
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Token</Label>
                      <Select value={selectedToken} onValueChange={setSelectedToken}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select token" />
                        </SelectTrigger>
                        <SelectContent>
                          {TOKEN_LIST.map((token) => (
                            <SelectItem key={token.address || 'native'} value={token.address || 'native'}>
                              <div className="flex items-center gap-2">
                                <img src={token.logo} alt={token.symbol} className="w-5 h-5 rounded-full" />
                                {token.symbol}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>APR (%)</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 50"
                        value={apr}
                        onChange={(e) => setApr(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Lock Period (Days)</Label>
                      <Input
                        type="number"
                        placeholder="0 for no lock"
                        value={lockPeriodDays}
                        onChange={(e) => setLockPeriodDays(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Minimum Stake</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 100"
                        value={minStake}
                        onChange={(e) => setMinStake(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleAddStakingPool}
                    disabled={isAddingPool}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {isAddingPool ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding Pool...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Staking Pool
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {!isStakingOwner && (
              <Alert className="border-warning/30 bg-warning/5">
                <AlertCircle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-foreground">
                  You are not the owner of the staking contract. Only the owner ({stakingOwner.slice(0, 10)}...{stakingOwner.slice(-8)}) can add new pools.
                </AlertDescription>
              </Alert>
            )}

            {/* Existing Pools */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Existing Staking Pools ({stakingPools.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStaking ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-4">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                    ))}
                  </div>
                ) : stakingPools.length > 0 ? (
                  <div className="space-y-4">
                    {stakingPools.map((pool, index) => (
                      <div 
                        key={pool.id} 
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/30 hover:border-primary/30 transition-all duration-300"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="font-bold text-primary">{pool.id}</span>
                          </div>
                          <div>
                            <p className="font-semibold">{pool.tokenSymbol}</p>
                            <p className="text-sm text-muted-foreground">
                              APR: {pool.apr}% | Lock: {pool.lockPeriod / 86400}d | Min: {ethers.formatEther(pool.minStake)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total Staked</p>
                            <p className="font-semibold">{parseFloat(ethers.formatEther(pool.totalStaked)).toFixed(2)}</p>
                          </div>
                          {isStakingOwner && (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={pool.active}
                                onCheckedChange={(checked) => handleSetPoolStatus(pool.id, checked)}
                              />
                              <span className={`text-sm ${pool.active ? 'text-success' : 'text-muted-foreground'}`}>
                                {pool.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          )}
                          {!isStakingOwner && (
                            <Badge variant={pool.active ? 'default' : 'secondary'}>
                              {pool.active ? 'Active' : 'Inactive'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Coins className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No staking pools found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Farming Tab */}
          <TabsContent value="farming" className="space-y-6 animate-fade-in">
            {/* Add Farm Form */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Farming Pool
                </CardTitle>
                <CardDescription>
                  Add a new LP token farming pool (requires owner permissions)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>LP Token Address</Label>
                    <Input
                      placeholder="0x..."
                      value={lpTokenAddress}
                      onChange={(e) => setLpTokenAddress(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Allocation Points</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 100"
                      value={allocPoint}
                      onChange={(e) => setAllocPoint(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleAddFarmingPool}
                  disabled={isAddingFarm}
                  className="w-full bg-accent hover:bg-accent/90"
                >
                  {isAddingFarm ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding Farm...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Farming Pool
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Farms */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Existing Farming Pools ({farmingPools.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingFarming ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-4">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : farmingPools.length > 0 ? (
                  <div className="space-y-4">
                    {farmingPools.map((farm, index) => (
                      <div 
                        key={farm.id} 
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/30 hover:border-accent/30 transition-all duration-300"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                            <span className="font-bold text-accent">{farm.id}</span>
                          </div>
                          <div>
                            <p className="font-semibold">{farm.lpSymbol} LP</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {farm.lpToken.slice(0, 10)}...{farm.lpToken.slice(-8)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Alloc Points</p>
                            <p className="font-semibold">{farm.allocPoint.toString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total Staked</p>
                            <p className="font-semibold">{parseFloat(ethers.formatEther(farm.totalStaked)).toFixed(4)}</p>
                          </div>
                          <a
                            href={`${BLOCK_EXPLORER}/address/${farm.lpToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Leaf className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No farming pools found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Funding Tab */}
          <TabsContent value="funding" className="space-y-6 animate-fade-in">
            {/* Contract Balance Overview */}
            <Card className={`glass-card ${hasLowBalance ? 'border-destructive/50' : 'border-success/30'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-warning" />
                  Farming Contract Reward Balance
                </CardTitle>
                <CardDescription>
                  Fund the farming contract with reward tokens to enable staking/harvesting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingFarming ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : farmingInfo ? (
                  <>
                    {/* Balance Display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-muted/30 rounded-xl p-6 border border-border/30">
                        <div className="flex items-center gap-3 mb-4">
                          <img 
                            src={farmingInfo.rewardTokenLogo}
                            alt={farmingInfo.rewardTokenSymbol}
                            className="w-10 h-10 rounded-full"
                            onError={(e) => { e.currentTarget.src = '/tokens/pc.png'; }}
                          />
                          <div>
                            <p className="text-sm text-muted-foreground">Contract Balance</p>
                            <p className={`text-2xl font-bold ${hasLowBalance ? 'text-destructive' : 'text-success'}`}>
                              {contractBalanceFormatted} {farmingInfo.rewardTokenSymbol}
                            </p>
                          </div>
                        </div>
                        {hasLowBalance && (
                          <div className="flex items-center gap-2 text-destructive text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>Low balance! Users cannot stake/harvest.</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-muted/30 rounded-xl p-6 border border-border/30">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Your Balance</p>
                            <p className="text-2xl font-bold text-foreground">
                              {userBalanceFormatted} {farmingInfo.rewardTokenSymbol}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contract Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted/20 rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Reward Per Block</p>
                        <p className="font-semibold text-foreground">
                          {parseFloat(ethers.formatEther(farmingInfo.rewardPerBlock)).toFixed(6)}
                        </p>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Start Block</p>
                        <p className="font-semibold text-foreground">
                          {farmingInfo.startBlock.toString()}
                        </p>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Total Alloc Points</p>
                        <p className="font-semibold text-foreground">
                          {farmingInfo.totalAllocPoint.toString()}
                        </p>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Active Pools</p>
                        <p className="font-semibold text-foreground">
                          {farmingPools.length}
                        </p>
                      </div>
                    </div>

                    {/* Fund Form */}
                    <div className="border-t border-border/30 pt-6 space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <ArrowUpFromLine className="w-4 h-4" />
                        Fund Farming Contract
                      </h4>
                      <div className="flex gap-4">
                        <div className="flex-1 relative">
                          <Input
                            type="number"
                            placeholder={`Amount of ${farmingInfo.rewardTokenSymbol}`}
                            value={fundAmount}
                            onChange={(e) => setFundAmount(e.target.value)}
                            className="pr-20"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80"
                            onClick={() => setFundAmount(ethers.formatEther(farmingInfo.userRewardBalance))}
                          >
                            MAX
                          </Button>
                        </div>
                        <Button
                          onClick={handleFundFarming}
                          disabled={isFunding || !fundAmount || parseFloat(fundAmount) <= 0}
                          className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 min-w-[150px]"
                        >
                          {isFunding ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {isApproving ? 'Approving...' : 'Funding...'}
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4 mr-2" />
                              Fund Contract
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Tokens will be transferred directly to the farming contract to pay user rewards.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Failed to load farming info</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {farmingInfo && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="glass-card hover:border-primary/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Est. Daily Rewards</p>
                        <p className="text-xl font-bold text-foreground">
                          {(parseFloat(ethers.formatEther(farmingInfo.rewardPerBlock)) * 28800).toFixed(2)} {farmingInfo.rewardTokenSymbol}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card hover:border-accent/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Days of Rewards Left</p>
                        <p className={`text-xl font-bold ${hasLowBalance ? 'text-destructive' : 'text-foreground'}`}>
                          {farmingInfo.rewardPerBlock > 0 
                            ? Math.floor(Number(farmingInfo.contractRewardBalance) / (Number(farmingInfo.rewardPerBlock) * 28800)).toLocaleString()
                            : '∞'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card hover:border-success/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                        <Leaf className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total LP Staked</p>
                        <p className="text-xl font-bold text-foreground">
                          {farmingPools.reduce((acc, pool) => acc + parseFloat(ethers.formatEther(pool.totalStaked)), 0).toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
