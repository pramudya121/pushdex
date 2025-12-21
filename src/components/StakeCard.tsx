import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StakingPoolInfo } from '@/hooks/useStaking';
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
  Lock,
  Clock,
  Gift
} from 'lucide-react';

interface StakeCardProps {
  pool: StakingPoolInfo;
  onStake: (poolId: number, amount: string) => Promise<boolean>;
  onUnstake: (poolId: number, amount: string) => Promise<boolean>;
  onClaim: (poolId: number) => Promise<boolean>;
  getTokenBalance: (tokenAddress: string) => Promise<string>;
  isStaking: boolean;
  isUnstaking: boolean;
  isClaiming: boolean;
}

export const StakeCard: React.FC<StakeCardProps> = ({
  pool,
  onStake,
  onUnstake,
  onClaim,
  getTokenBalance,
  isStaking,
  isUnstaking,
  isClaiming,
}) => {
  const { isConnected } = useWallet();
  const [isExpanded, setIsExpanded] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [activeTab, setActiveTab] = useState('stake');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!isConnected) return;
      setIsLoadingBalance(true);
      const balance = await getTokenBalance(pool.tokenAddress);
      setTokenBalance(balance);
      setIsLoadingBalance(false);
    };
    if (isExpanded) {
      fetchBalance();
    }
  }, [pool.tokenAddress, getTokenBalance, isConnected, isExpanded]);

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;
    const success = await onStake(pool.id, stakeAmount);
    if (success) {
      setStakeAmount('');
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) return;
    const success = await onUnstake(pool.id, unstakeAmount);
    if (success) {
      setUnstakeAmount('');
    }
  };

  const handleClaim = async () => {
    await onClaim(pool.id);
  };

  const userStakedFormatted = ethers.formatEther(pool.userStaked);
  const pendingRewardFormatted = ethers.formatEther(pool.userPendingReward);
  const totalStakedFormatted = ethers.formatEther(pool.totalStaked);
  const minStakeFormatted = ethers.formatEther(pool.minStake);
  const hasStaked = pool.userStaked > BigInt(0);
  const hasPendingRewards = pool.userPendingReward > BigInt(0);
  const hasBalance = parseFloat(tokenBalance) > 0;

  return (
    <Card className="glass-card-hover overflow-hidden group">
      {/* Header */}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Token Icon */}
            <div className="relative">
              <img 
                src={pool.tokenLogo} 
                alt={pool.tokenSymbol}
                className="w-12 h-12 rounded-full border-2 border-primary/30 bg-muted"
                onError={(e) => { e.currentTarget.src = '/tokens/pc.png'; }}
              />
              {pool.lockPeriod > 0 && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-warning flex items-center justify-center border-2 border-card">
                  <Lock className="w-3 h-3 text-warning-foreground" />
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-bold text-lg text-foreground">{pool.tokenSymbol}</h3>
              <p className="text-sm text-muted-foreground">{pool.tokenName}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            {hasStaked && (
              <Badge variant="secondary" className="bg-success/20 text-success border-success/30">
                <Coins className="w-3 h-3 mr-1" />
                Staking
              </Badge>
            )}
            <Badge className="bg-primary/20 text-primary border-primary/30">
              {pool.apr.toFixed(2)}% APR
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/30 p-3 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
              <TrendingUp className="w-3 h-3" />
              <span>APR</span>
            </div>
            <p className="text-lg font-bold gradient-text">{pool.apr}%</p>
          </div>
          
          <div className="bg-muted/30 p-3 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
              <Clock className="w-3 h-3" />
              <span>Lock</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {pool.lockPeriod === 0 ? 'None' : `${pool.lockPeriod}d`}
            </p>
          </div>
          
          <div className="bg-muted/30 p-3 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
              <Coins className="w-3 h-3" />
              <span>TVL</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {parseFloat(totalStakedFormatted).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* User Info */}
        {isConnected && (
          <div className="bg-muted/20 rounded-xl p-4 space-y-3 border border-border/30">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Your Staked</span>
              <span className="font-semibold text-foreground">
                {parseFloat(userStakedFormatted).toFixed(4)} {pool.tokenSymbol}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Earned</span>
              <span className="font-semibold text-primary">
                {parseFloat(pendingRewardFormatted).toFixed(4)} {pool.tokenSymbol}
              </span>
            </div>
            
            {hasPendingRewards && (
              <Button
                onClick={handleClaim}
                disabled={isClaiming}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Claim Rewards
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Min Stake Info */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Min. Stake: {parseFloat(minStakeFormatted).toLocaleString()} {pool.tokenSymbol}</span>
        </div>

        {/* Expand Button */}
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-2" />
              Hide
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
                    <span className="text-muted-foreground">Available</span>
                    <span className="text-foreground">
                      {isLoadingBalance ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        `${parseFloat(tokenBalance).toFixed(4)} ${pool.tokenSymbol}`
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
                      onClick={() => setStakeAmount(tokenBalance)}
                      disabled={!hasBalance}
                    >
                      MAX
                    </Button>
                  </div>
                  <Button
                    onClick={handleStake}
                    disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0}
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
                        Stake {pool.tokenSymbol}
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="unstake" className="space-y-3 mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Staked</span>
                    <span className="text-foreground">{parseFloat(userStakedFormatted).toFixed(4)} {pool.tokenSymbol}</span>
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
                  {pool.lockPeriod > 0 && (
                    <div className="flex items-center gap-2 text-xs text-warning">
                      <Lock className="w-3 h-3" />
                      <span>{pool.lockPeriod}-day lock period applies</span>
                    </div>
                  )}
                  <Button
                    onClick={handleUnstake}
                    disabled={isUnstaking || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
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
                        Unstake {pool.tokenSymbol}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};
