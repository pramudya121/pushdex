import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PoolInfo } from '@/hooks/useFarming';
import { useWallet } from '@/contexts/WalletContext';
import { FarmPoolChart } from '@/components/FarmPoolChart';
import { 
  TrendingUp, 
  Coins, 
  ArrowDownToLine, 
  ArrowUpFromLine,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Zap,
  AlertTriangle,
  Clock,
  BarChart3
} from 'lucide-react';
import { BLOCK_EXPLORER } from '@/config/contracts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FarmCardProps {
  pool: PoolInfo;
  rewardTokenSymbol: string;
  rewardTokenLogo: string;
  onStake: (pid: number, amount: string) => Promise<boolean>;
  onUnstake: (pid: number, amount: string) => Promise<boolean>;
  onHarvest: (pid: number) => Promise<boolean>;
  onEmergencyWithdraw: (pid: number) => Promise<boolean>;
  getLpBalance: (lpToken: string) => Promise<string>;
  onRefresh: () => void;
  isStaking: boolean;
  isUnstaking: boolean;
  isHarvesting: boolean;
  hasEnoughRewards?: boolean;
}

export const FarmCard: React.FC<FarmCardProps> = memo(({
  pool,
  rewardTokenSymbol,
  rewardTokenLogo,
  onStake,
  onUnstake,
  onHarvest,
  onEmergencyWithdraw,
  getLpBalance,
  onRefresh,
  isStaking,
  isUnstaking,
  isHarvesting,
  hasEnoughRewards = true,
}) => {
  const { isConnected } = useWallet();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [lpBalance, setLpBalance] = useState('0');
  const [activeTab, setActiveTab] = useState('stake');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  // Animated pending rewards display
  const [displayedReward, setDisplayedReward] = useState('0.000000');
  const lastRewardRef = useRef(BigInt(0));
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!isConnected) return;
      setIsLoadingBalance(true);
      const balance = await getLpBalance(pool.lpToken);
      setLpBalance(balance);
      setIsLoadingBalance(false);
    };
    fetchBalance();
  }, [pool.lpToken, getLpBalance, isConnected, isExpanded]);

  // Animate the pending rewards counter - only animate when actually earning
  useEffect(() => {
    const currentReward = pool.userPendingReward;
    const targetValue = parseFloat(ethers.formatEther(currentReward));
    
    // Clear any existing animation
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    // Only animate if staked AND there are actual pending rewards (meaning rewards are working)
    if (pool.userStaked > BigInt(0) && hasEnoughRewards && currentReward > BigInt(0)) {
      // Calculate estimated reward per second based on current pending rewards
      const estimatedRewardPerSecond = Math.max(targetValue * 0.00001, 0.000001);
      
      animationRef.current = setInterval(() => {
        setDisplayedReward((prev) => {
          const current = parseFloat(prev);
          const increment = estimatedRewardPerSecond;
          const newValue = current + increment;
          // Cap at a reasonable limit above target until next refresh
          if (newValue > targetValue * 1.5) {
            return targetValue.toFixed(6);
          }
          return newValue.toFixed(6);
        });
      }, 1000);
    } else {
      setDisplayedReward(targetValue.toFixed(6));
    }

    lastRewardRef.current = currentReward;

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [pool.userPendingReward, pool.userStaked, hasEnoughRewards]);

  // Reset display when pool refreshes with new data
  useEffect(() => {
    const newValue = parseFloat(ethers.formatEther(pool.userPendingReward));
    setDisplayedReward(newValue.toFixed(6));
  }, [pool.userPendingReward]);

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;
    const success = await onStake(pool.pid, stakeAmount);
    if (success) {
      setStakeAmount('');
      onRefresh();
      const balance = await getLpBalance(pool.lpToken);
      setLpBalance(balance);
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) return;
    const success = await onUnstake(pool.pid, unstakeAmount);
    if (success) {
      setUnstakeAmount('');
      onRefresh();
    }
  };

  const handleHarvest = async () => {
    const success = await onHarvest(pool.pid);
    if (success) {
      onRefresh();
    }
  };

  const userStakedFormatted = ethers.formatEther(pool.userStaked);
  const pendingRewardFormatted = ethers.formatEther(pool.userPendingReward);
  const totalStakedFormatted = ethers.formatEther(pool.totalStaked);
  const hasStaked = pool.userStaked > BigInt(0);
  const hasPendingRewards = pool.userPendingReward > BigInt(0);
  const hasLpBalance = parseFloat(lpBalance) > 0;

  return (
    <Card className="glass-card-hover overflow-hidden group">
      {/* Header */}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Token Icons */}
            <div className="relative">
              <div className="flex -space-x-3">
                <img 
                  src={pool.token0Logo} 
                  alt={pool.token0Symbol}
                  className="w-10 h-10 rounded-full border-2 border-card bg-muted transition-transform group-hover:scale-105"
                  onError={(e) => { e.currentTarget.src = '/tokens/pc.png'; }}
                />
                <img 
                  src={pool.token1Logo} 
                  alt={pool.token1Symbol}
                  className="w-10 h-10 rounded-full border-2 border-card bg-muted transition-transform group-hover:scale-105"
                  onError={(e) => { e.currentTarget.src = '/tokens/pc.png'; }}
                />
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg text-foreground">{pool.lpSymbol}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Pool #{pool.pid}</span>
                <span>•</span>
                <span className="text-primary font-medium">{pool.multiplier}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {hasStaked && (
              <Badge variant="secondary" className="bg-success/20 text-success border-success/30 animate-pulse">
                <Zap className="w-3 h-3 mr-1" />
                Farming
              </Badge>
            )}
            <Badge className="bg-primary/20 text-primary border-primary/30">
              {pool.apr > 0 ? `${pool.apr.toFixed(2)}%` : 'TBD'} APR
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/30 p-3 rounded-xl transition-all hover:bg-muted/40">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="w-3 h-3" />
              <span>APR</span>
            </div>
            <p className="text-lg font-bold gradient-text">
              {pool.apr > 0 ? `${pool.apr.toFixed(2)}%` : 'TBD'}
            </p>
          </div>
          
          <div className="bg-muted/30 p-3 rounded-xl transition-all hover:bg-muted/40">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Coins className="w-3 h-3" />
              <span>Total Staked</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {parseFloat(totalStakedFormatted).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Chart Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-primary hover:bg-muted/30 transition-all"
          onClick={() => setShowChart(!showChart)}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          {showChart ? 'Hide Charts' : 'View Historical Charts'}
        </Button>

        {/* Historical Charts */}
        {showChart && (
          <div className="animate-fade-in">
            <FarmPoolChart
              poolId={pool.pid}
              currentApr={pool.apr}
              totalStaked={totalStakedFormatted}
            />
          </div>
        )}

        {/* User Info */}
        {isConnected && (
          <div className="bg-muted/20 rounded-xl p-4 space-y-3 border border-border/30 transition-all hover:border-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Your Staked</span>
              <span className="font-semibold text-foreground">
                {parseFloat(userStakedFormatted).toFixed(6)} LP
              </span>
            </div>
            
            {/* Earned Section - Always visible when staked */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Earned</span>
                {hasStaked && hasEnoughRewards && hasPendingRewards && (
                  <div className="flex items-center gap-1 text-xs text-success">
                    <div className="relative">
                      <Clock className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-success rounded-full animate-ping" />
                    </div>
                    <span className="animate-pulse">Earning</span>
                  </div>
                )}
                {hasStaked && !hasPendingRewards && hasEnoughRewards && (
                  <div className="flex items-center gap-1 text-xs text-warning">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Setup needed</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <img 
                  src={rewardTokenLogo} 
                  alt={rewardTokenSymbol}
                  className="w-5 h-5 rounded-full"
                  onError={(e) => { e.currentTarget.src = '/tokens/pc.png'; }}
                />
                <span className={`font-semibold tabular-nums transition-all ${hasPendingRewards ? 'text-primary scale-105' : 'text-muted-foreground'}`}>
                  {hasStaked ? displayedReward : parseFloat(pendingRewardFormatted).toFixed(6)} {rewardTokenSymbol}
                </span>
                {hasPendingRewards && (
                  <span className="text-xs text-success animate-bounce">↑</span>
                )}
              </div>
            </div>

            {/* No Rewards Warning - when staked but no rewards coming */}
            {hasStaked && !hasPendingRewards && hasEnoughRewards && (
              <div className="flex items-center gap-2 p-2 bg-warning/10 rounded-lg border border-warning/30">
                <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                <p className="text-xs text-warning">
                  Rewards not accruing. Check reward setup guide above for instructions.
                </p>
              </div>
            )}
            
            {hasPendingRewards && hasEnoughRewards && (
              <Button
                onClick={handleHarvest}
                disabled={isHarvesting}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transition-all hover:scale-[1.02]"
              >
                {isHarvesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Harvesting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Harvest {parseFloat(pendingRewardFormatted).toFixed(4)} {rewardTokenSymbol}
                  </>
                )}
              </Button>
            )}
            
            {!hasEnoughRewards && hasStaked && (
              <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg border border-destructive/30 animate-pulse">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-xs text-destructive">
                  Contract has insufficient rewards. Use Emergency Withdraw below.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Expand Button */}
        <Button
          variant="ghost"
          className="w-full hover:bg-muted/50 transition-all"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-2" />
              {isConnected ? 'Stake / Unstake' : 'View Details'}
            </>
          )}
        </Button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-4 pt-2 animate-fade-in">
            {isConnected ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                  <TabsTrigger value="stake" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                    <ArrowDownToLine className="w-4 h-4 mr-2" />
                    Stake
                  </TabsTrigger>
                  <TabsTrigger value="unstake" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                    <ArrowUpFromLine className="w-4 h-4 mr-2" />
                    Unstake
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="stake" className="space-y-3 mt-4 animate-fade-in">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Available LP</span>
                    <span className="text-foreground">
                      {isLoadingBalance ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        parseFloat(lpBalance).toFixed(6)
                      )}
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      className="pr-16 bg-muted/50 border-border/50 focus:border-primary/50 transition-all"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-all"
                      onClick={() => setStakeAmount(lpBalance)}
                      disabled={!hasLpBalance}
                    >
                      MAX
                    </Button>
                  </div>
                  <Button
                    onClick={handleStake}
                    disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > parseFloat(lpBalance) || !hasEnoughRewards}
                    className="w-full bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02]"
                  >
                    {isStaking ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Staking...
                      </>
                    ) : (
                      <>
                        <ArrowDownToLine className="w-4 h-4 mr-2" />
                        Stake LP
                      </>
                    )}
                  </Button>
                  {!hasEnoughRewards && (
                    <p className="text-xs text-destructive text-center animate-pulse">
                      Staking disabled: Contract needs more reward tokens.
                    </p>
                  )}
                  {!hasLpBalance && hasEnoughRewards && (
                    <p className="text-xs text-muted-foreground text-center">
                      You need LP tokens to stake. Add liquidity first.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="unstake" className="space-y-3 mt-4 animate-fade-in">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Staked LP</span>
                    <span className="text-foreground">{parseFloat(userStakedFormatted).toFixed(6)}</span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={unstakeAmount}
                      onChange={(e) => setUnstakeAmount(e.target.value)}
                      className="pr-16 bg-muted/50 border-border/50 focus:border-primary/50 transition-all"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-all"
                      onClick={() => setUnstakeAmount(userStakedFormatted)}
                      disabled={!hasStaked}
                    >
                      MAX
                    </Button>
                  </div>
                  <Button
                    onClick={handleUnstake}
                    disabled={isUnstaking || !unstakeAmount || parseFloat(unstakeAmount) <= 0 || parseFloat(unstakeAmount) > parseFloat(userStakedFormatted)}
                    className="w-full bg-destructive hover:bg-destructive/90 transition-all hover:scale-[1.02]"
                  >
                    {isUnstaking ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Unstaking...
                      </>
                    ) : (
                      <>
                        <ArrowUpFromLine className="w-4 h-4 mr-2" />
                        Unstake LP
                      </>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Connect wallet to stake/unstake</p>
              </div>
            )}

            {/* Emergency Withdraw & Contract Links */}
            <div className="pt-2 border-t border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <a
                  href={`${BLOCK_EXPLORER}/address/${pool.lpToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  View LP Contract
                  <ExternalLink className="w-3 h-3" />
                </a>

                {hasStaked && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive transition-all">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Emergency
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass-card border-destructive/30">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Emergency Withdraw</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will withdraw your staked LP tokens without claiming rewards. 
                          You will lose all pending rewards. Only use this if normal unstaking fails.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onEmergencyWithdraw(pool.pid)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Emergency Withdraw
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
