import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PoolInfo } from '@/hooks/useFarming';
import { useWallet } from '@/contexts/WalletContext';
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
  AlertTriangle
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

export const FarmCard: React.FC<FarmCardProps> = ({
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
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [lpBalance, setLpBalance] = useState('0');
  const [activeTab, setActiveTab] = useState('stake');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

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
                  className="w-10 h-10 rounded-full border-2 border-card bg-muted"
                  onError={(e) => { e.currentTarget.src = '/tokens/pc.png'; }}
                />
                <img 
                  src={pool.token1Logo} 
                  alt={pool.token1Symbol}
                  className="w-10 h-10 rounded-full border-2 border-card bg-muted"
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
              <Badge variant="secondary" className="bg-success/20 text-success border-success/30">
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
          <div className="bg-muted/30 p-3 rounded-xl">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="w-3 h-3" />
              <span>APR</span>
            </div>
            <p className="text-lg font-bold gradient-text">
              {pool.apr > 0 ? `${pool.apr.toFixed(2)}%` : 'TBD'}
            </p>
          </div>
          
          <div className="bg-muted/30 p-3 rounded-xl">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Coins className="w-3 h-3" />
              <span>Total Staked</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {parseFloat(totalStakedFormatted).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* User Info */}
        {isConnected && (
          <div className="bg-muted/20 rounded-xl p-4 space-y-3 border border-border/30">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Your Staked</span>
              <span className="font-semibold text-foreground">
                {parseFloat(userStakedFormatted).toFixed(6)} LP
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Earned</span>
              <div className="flex items-center gap-2">
                <img 
                  src={rewardTokenLogo} 
                  alt={rewardTokenSymbol}
                  className="w-5 h-5 rounded-full"
                  onError={(e) => { e.currentTarget.src = '/tokens/pc.png'; }}
                />
                <span className="font-semibold text-primary">
                  {parseFloat(pendingRewardFormatted).toFixed(6)} {rewardTokenSymbol}
                </span>
              </div>
            </div>
            
            {hasPendingRewards && hasEnoughRewards && (
              <Button
                onClick={handleHarvest}
                disabled={isHarvesting}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
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
              <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg border border-destructive/30">
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
          className="w-full"
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
                  <TabsTrigger value="stake" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <ArrowDownToLine className="w-4 h-4 mr-2" />
                    Stake
                  </TabsTrigger>
                  <TabsTrigger value="unstake" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <ArrowUpFromLine className="w-4 h-4 mr-2" />
                    Unstake
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="stake" className="space-y-3 mt-4">
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
                      className="pr-16 bg-muted/50 border-border/50"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80"
                      onClick={() => setStakeAmount(lpBalance)}
                      disabled={!hasLpBalance}
                    >
                      MAX
                    </Button>
                  </div>
                  <Button
                    onClick={handleStake}
                    disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > parseFloat(lpBalance) || !hasEnoughRewards}
                    className="w-full bg-primary hover:bg-primary/90"
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
                    <p className="text-xs text-destructive text-center">
                      Staking disabled: Contract needs more reward tokens.
                    </p>
                  )}
                  {!hasLpBalance && hasEnoughRewards && (
                    <p className="text-xs text-muted-foreground text-center">
                      You need LP tokens to stake. Add liquidity first.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="unstake" className="space-y-3 mt-4">
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
                      className="pr-16 bg-muted/50 border-border/50"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80"
                      onClick={() => setUnstakeAmount(userStakedFormatted)}
                      disabled={!hasStaked}
                    >
                      MAX
                    </Button>
                  </div>
                  <Button
                    onClick={handleUnstake}
                    disabled={isUnstaking || !unstakeAmount || parseFloat(unstakeAmount) <= 0 || parseFloat(unstakeAmount) > parseFloat(userStakedFormatted)}
                    className="w-full bg-destructive hover:bg-destructive/90"
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
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Emergency
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
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
};
