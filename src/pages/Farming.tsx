import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { WaveBackground } from '@/components/WaveBackground';
import { HeroSection } from '@/components/HeroSection';
import { FarmCard } from '@/components/FarmCard';
import { FarmingCountdown } from '@/components/FarmingCountdown';
import { RewardSetupGuide } from '@/components/RewardSetupGuide';
import { RewardStatusCard } from '@/components/RewardStatusCard';
import { useFarming, UserLPPosition } from '@/hooks/useFarming';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Leaf, 
  Sparkles, 
  TrendingUp, 
  Coins,
  RefreshCw,
  Wallet,
  ExternalLink,
  TreeDeciduous,
  Sprout,
  AlertCircle,
  Layers,
  ArrowRight,
  Zap,
  ChevronRight,
  Clock
} from 'lucide-react';
import { ethers } from 'ethers';
import { BLOCK_EXPLORER, CONTRACTS, RPC_URL } from '@/config/contracts';
import { FARMING_ABI } from '@/config/abis';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Skeleton component for stats cards
const StatsSkeleton = () => (
  <Card className="glass-card">
    <CardContent className="p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Skeleton component for farm cards
const FarmCardSkeleton = () => (
  <Card className="glass-card overflow-hidden">
    <CardContent className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </CardContent>
  </Card>
);

// Component for user's LP positions that can be staked
const UserLPCard: React.FC<{
  position: UserLPPosition;
  onStake?: (lpToken: string, farmPid: number) => void;
  index: number;
}> = ({ position, onStake, index }) => {
  const balanceFormatted = ethers.formatEther(position.balance);

  return (
    <Card 
      className="glass-card hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 animate-fade-in"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <img 
                src={position.token0Logo} 
                alt={position.token0Symbol}
                className="w-8 h-8 rounded-full border-2 border-card bg-muted transition-transform hover:scale-110"
                onError={(e) => { e.currentTarget.src = '/tokens/pc.png'; }}
              />
              <img 
                src={position.token1Logo} 
                alt={position.token1Symbol}
                className="w-8 h-8 rounded-full border-2 border-card bg-muted transition-transform hover:scale-110"
                onError={(e) => { e.currentTarget.src = '/tokens/pc.png'; }}
              />
            </div>
            <div>
              <p className="font-semibold text-foreground">{position.lpSymbol}</p>
              <p className="text-sm text-muted-foreground">
                {parseFloat(balanceFormatted).toFixed(6)} LP
              </p>
            </div>
          </div>
          
          {position.isStakeable && position.farmPid !== undefined ? (
            <Link to="/farming" onClick={() => onStake?.(position.lpToken, position.farmPid!)}>
              <Button size="sm" className="bg-primary hover:bg-primary/90 transition-all hover:scale-105">
                <Zap className="w-4 h-4 mr-1" />
                Stake
              </Button>
            </Link>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Not Stakeable
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// LP Skeleton
const UserLPSkeleton = () => (
  <Card className="glass-card">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
    </CardContent>
  </Card>
);

const Farming: React.FC = () => {
  const { isConnected, connect } = useWallet();
  const {
    pools,
    userLPPositions,
    rewardTokenSymbol,
    rewardTokenLogo,
    rewardPerBlock,
    startBlock,
    isLoading,
    error,
    contractRewardBalance,
    hasEnoughRewards,
    stake,
    unstake,
    harvest,
    harvestAll,
    emergencyWithdraw,
    getLpBalance,
    updatePool,
    getContractRewardBalance,
    refreshPools,
    isStaking,
    isUnstaking,
    isHarvesting,
    isHarvestingAll,
  } = useFarming();

  const [hasUpdateFunction, setHasUpdateFunction] = useState(false);
  const [isCheckingFunction, setIsCheckingFunction] = useState(true);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  
  // Check if contract has updateRewardPerBlock function
  useEffect(() => {
    const checkUpdateFunction = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const functionNames = [
          'updateRewardPerBlock',
          'setRewardPerBlock', 
          'updateEmissionRate',
          'setEmissionRate'
        ];
        
        for (const funcName of functionNames) {
          const minAbi = [{
            inputs: [{ type: 'uint256', name: '_value' }],
            name: funcName,
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          }];
          
          try {
            const contract = new ethers.Contract(CONTRACTS.FARMING, minAbi, provider);
            await contract[funcName].estimateGas(0);
            setHasUpdateFunction(true);
            break;
          } catch (e: any) {
            // If we get a revert (not "function not found"), it means function exists
            if (e.message && !e.message.includes('no matching function')) {
              setHasUpdateFunction(true);
              break;
            }
          }
        }
      } catch (error) {
        console.error('Error checking update function:', error);
      } finally {
        setIsCheckingFunction(false);
      }
    };
    
    checkUpdateFunction();
  }, []);
  
  // Manual refresh handler
  const handleManualRefresh = async () => {
    if (isManualRefreshing) return;
    setIsManualRefreshing(true);
    try {
      await refreshPools();
    } finally {
      setIsManualRefreshing(false);
    }
  };

  // Calculate total stats
  const totalUserStaked = pools.reduce((acc, pool) => acc + pool.userStaked, BigInt(0));
  const totalPendingRewards = pools.reduce((acc, pool) => acc + pool.userPendingReward, BigInt(0));
  const avgApr = pools.length > 0 
    ? pools.reduce((acc, pool) => acc + pool.apr, 0) / pools.length 
    : 0;
  const hasPendingRewards = totalPendingRewards > BigInt(0);
  const stakeableLPs = userLPPositions.filter(p => p.isStakeable);
  const rewardBalanceFormatted = parseFloat(ethers.formatEther(contractRewardBalance)).toFixed(4);
  
  // Check if rewards are not fully configured
  const needsSetup = !isLoading && !isCheckingFunction && (rewardPerBlock === BigInt(0) || !hasEnoughRewards || !hasUpdateFunction);

  return (
    <div className="min-h-screen bg-background wave-bg">
      <WaveBackground />
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        {/* Hero Section */}
        <HeroSection
          title="Grow Your Assets"
          description={`Stake LP tokens and earn ${rewardTokenSymbol || 'rewards'}. Harvest your yield anytime.`}
          showSpotlight={true}
          showStars={true}
          spotlightColor="hsl(330, 100%, 60%)"
          badge={{
            text: "Yield Farming",
            icon: <TreeDeciduous className="w-4 h-4 text-primary" />,
          }}
        />

        {/* Countdown Timer */}
        {startBlock > BigInt(0) && (
          <FarmingCountdown startBlock={startBlock} className="mb-8" />
        )}

        {/* Reward Setup Guide - Comprehensive guide for enabling earned rewards */}
        {needsSetup && (
          <RewardSetupGuide
            rewardPerBlock={rewardPerBlock}
            contractRewardBalance={contractRewardBalance}
            rewardTokenSymbol={rewardTokenSymbol}
            hasUpdateFunction={hasUpdateFunction}
          />
        )}

        {/* Reward Balance Warning */}
        {!hasEnoughRewards && rewardPerBlock > BigInt(0) && (
          <Alert variant="destructive" className="mb-6 animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Contract has insufficient reward tokens ({rewardBalanceFormatted} {rewardTokenSymbol}).</strong>
              <br />
              Staking, unstaking, and harvesting will fail until the admin funds the contract.
              Use "Emergency Withdraw" to withdraw your LP tokens without rewards.
              <Link to="/admin" className="ml-2 underline text-destructive-foreground hover:no-underline">
                Go to Admin →
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && hasEnoughRewards && rewardPerBlock > BigInt(0) && (
          <Alert variant="destructive" className="mb-6 animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Reward Status Card - Always visible */}
          <div className="md:col-span-1">
            <RewardStatusCard
              rewardPerBlock={rewardPerBlock}
              contractRewardBalance={contractRewardBalance}
              rewardTokenSymbol={rewardTokenSymbol}
              hasUpdateFunction={hasUpdateFunction}
              className="h-full"
            />
          </div>
          
          {/* Stats Cards */}
          {isLoading ? (
            <>
              <StatsSkeleton />
              <StatsSkeleton />
              <StatsSkeleton />
            </>
          ) : (
            <>
              <Card className="glass-card hover:border-primary/30 transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center transition-transform hover:scale-110">
                      <Leaf className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Farms</p>
                      <p className="text-2xl font-bold text-foreground">{pools.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card hover:border-accent/30 transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center transition-transform hover:scale-110">
                      <TrendingUp className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. APR</p>
                      <p className="text-2xl font-bold gradient-text">
                        {avgApr > 0 ? `${avgApr.toFixed(2)}%` : 'TBD'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card hover:border-success/30 transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center transition-transform hover:scale-110">
                      <Coins className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Your Staked</p>
                      <p className="text-2xl font-bold text-foreground">
                        {isConnected ? parseFloat(ethers.formatEther(totalUserStaked)).toFixed(4) : '0.00'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center gap-4 flex-wrap">
            <Link to="/staking">
              <Button variant="outline" size="sm" className="hover:border-primary/50 transition-all">
                <Coins className="w-4 h-4 mr-2" />
                Single Staking
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="outline" size="sm" className="hover:border-warning/50 transition-all">
                <Zap className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
            <Badge 
              variant={rewardPerBlock > BigInt(0) ? "outline" : "destructive"} 
              className={`py-2 px-4 transition-all ${rewardPerBlock > BigInt(0) ? 'hover:bg-muted/50' : 'animate-pulse'}`}
            >
              <Sprout className="w-4 h-4 mr-2" />
              Reward: {rewardPerBlock > 0 ? parseFloat(ethers.formatEther(rewardPerBlock)).toFixed(6) : '0 (NOT SET)'} {rewardTokenSymbol}/block
            </Badge>
            <Badge 
              variant={hasEnoughRewards ? "outline" : "destructive"} 
              className={`py-2 px-4 transition-all ${hasEnoughRewards ? 'hover:bg-muted/50' : 'animate-pulse'}`}
            >
              <Coins className="w-4 h-4 mr-2" />
              Contract Balance: {rewardBalanceFormatted} {rewardTokenSymbol}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {isConnected && hasPendingRewards && hasEnoughRewards && (
              <Button
                onClick={harvestAll}
                disabled={isHarvestingAll}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all hover:scale-105 animate-glow-pulse"
              >
                {isHarvestingAll ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Harvest All ({parseFloat(ethers.formatEther(totalPendingRewards)).toFixed(4)} {rewardTokenSymbol})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshPools}
              disabled={isLoading}
              className="hover:border-primary/50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <a
              href={`${BLOCK_EXPLORER}/address/${CONTRACTS.FARMING}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="hover:border-primary/50 transition-all">
                <ExternalLink className="w-4 h-4 mr-2" />
                Contract
              </Button>
            </a>
          </div>
        </div>

        {/* Connect Wallet Message */}
        {!isConnected && (
          <Card className="glass-card mb-8 animate-fade-in">
            <CardContent className="py-8">
              <div className="text-center">
                <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-bounce" />
                <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your wallet to view your staked positions and rewards
                </p>
                <Button onClick={() => connect('metamask')} className="bg-primary hover:bg-primary/90 transition-all hover:scale-105">
                  Connect Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User's Available LP Tokens */}
        {isConnected && (
          <Card className="glass-card mb-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Your LP Tokens Ready to Stake
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <UserLPSkeleton />
                  <UserLPSkeleton />
                  <UserLPSkeleton />
                </div>
              ) : stakeableLPs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stakeableLPs.map((position, index) => (
                    <UserLPCard key={position.lpToken} position={position} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Layers className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground mb-4">
                    No LP tokens available for staking
                  </p>
                  <Link to="/liquidity">
                    <Button variant="outline" className="hover:border-primary/50">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Add Liquidity
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Farm Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FarmCardSkeleton />
            <FarmCardSkeleton />
            <FarmCardSkeleton />
          </div>
        ) : pools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pools.map((pool, index) => (
              <div 
                key={pool.pid} 
                className="animate-fade-in"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <FarmCard
                  pool={pool}
                  rewardTokenSymbol={rewardTokenSymbol}
                  rewardTokenLogo={rewardTokenLogo}
                  onStake={stake}
                  onUnstake={unstake}
                  onHarvest={harvest}
                  onEmergencyWithdraw={emergencyWithdraw}
                  getLpBalance={getLpBalance}
                  onRefresh={refreshPools}
                  isStaking={isStaking}
                  isUnstaking={isUnstaking}
                  isHarvesting={isHarvesting}
                  hasEnoughRewards={hasEnoughRewards}
                />
              </div>
            ))}
          </div>
        ) : (
          <Card className="glass-card animate-fade-in">
            <CardContent className="py-16">
              <div className="text-center">
                <Leaf className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50 animate-bounce" />
                <h3 className="text-xl font-semibold mb-2">No Active Farms</h3>
                <p className="text-muted-foreground mb-4">
                  There are currently no active farming pools. Check back later or add liquidity to start farming.
                </p>
                <Link to="/liquidity">
                  <Button className="bg-primary hover:bg-primary/90 transition-all hover:scale-105">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Add Liquidity
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: 1,
              title: 'Add Liquidity',
              description: 'First, add liquidity to any pool to receive LP tokens that represent your share.',
              delay: '0.1s'
            },
            {
              step: 2,
              title: 'Stake LP Tokens',
              description: 'Stake your LP tokens in the farm to start earning rewards automatically.',
              delay: '0.2s'
            },
            {
              step: 3,
              title: 'Harvest Rewards',
              description: `Harvest your earned ${rewardTokenSymbol || 'tokens'} anytime. Rewards accumulate every block.`,
              delay: '0.3s'
            }
          ].map((item) => (
            <Card 
              key={item.step} 
              className="glass-card hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: item.delay }}
            >
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-4 transition-transform hover:scale-110">
                  <span className="text-xl font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Farming;
