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
  Leaf, 
  TrendingUp, 
  Coins, 
  ArrowDownToLine, 
  ArrowUpFromLine,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BLOCK_EXPLORER } from '@/config/contracts';

interface FarmCardProps {
  pool: PoolInfo;
  rewardTokenSymbol: string;
  onStake: (pid: number, amount: string) => Promise<boolean>;
  onUnstake: (pid: number, amount: string) => Promise<boolean>;
  onHarvest: (pid: number) => Promise<boolean>;
  getLpBalance: (lpToken: string) => Promise<string>;
  isStaking: boolean;
  isUnstaking: boolean;
  isHarvesting: boolean;
}

export const FarmCard: React.FC<FarmCardProps> = ({
  pool,
  rewardTokenSymbol,
  onStake,
  onUnstake,
  onHarvest,
  getLpBalance,
  isStaking,
  isUnstaking,
  isHarvesting,
}) => {
  const { isConnected } = useWallet();
  const [isExpanded, setIsExpanded] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [lpBalance, setLpBalance] = useState('0');
  const [activeTab, setActiveTab] = useState('stake');

  useEffect(() => {
    const fetchBalance = async () => {
      const balance = await getLpBalance(pool.lpToken);
      setLpBalance(balance);
    };
    if (isConnected) {
      fetchBalance();
    }
  }, [pool.lpToken, getLpBalance, isConnected]);

  const handleStake = async () => {
    if (!stakeAmount) return;
    const success = await onStake(pool.pid, stakeAmount);
    if (success) {
      setStakeAmount('');
      const balance = await getLpBalance(pool.lpToken);
      setLpBalance(balance);
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount) return;
    const success = await onUnstake(pool.pid, unstakeAmount);
    if (success) {
      setUnstakeAmount('');
    }
  };

  const handleHarvest = async () => {
    await onHarvest(pool.pid);
  };

  const userStakedFormatted = ethers.formatEther(pool.userStaked);
  const pendingRewardFormatted = ethers.formatEther(pool.userPendingReward);
  const totalStakedFormatted = ethers.formatEther(pool.totalStaked);
  const hasStaked = pool.userStaked > BigInt(0);
  const hasPendingRewards = pool.userPendingReward > BigInt(0);

  return (
    <Card className="glass-card-hover overflow-hidden group">
      {/* Header */}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Token Icons */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/30">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent flex items-center justify-center border-2 border-card">
                <Sparkles className="w-3 h-3 text-accent-foreground" />
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg text-foreground">{pool.lpSymbol}</h3>
              <p className="text-sm text-muted-foreground">Pool #{pool.pid}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasStaked && (
              <Badge variant="secondary" className="bg-success/20 text-success border-success/30">
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
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-3 rounded-xl">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>APR</span>
            </div>
            <p className="text-xl font-bold gradient-text">
              {pool.apr > 0 ? `${pool.apr.toFixed(2)}%` : 'TBD'}
            </p>
          </div>
          
          <div className="glass-card p-3 rounded-xl">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Coins className="w-4 h-4" />
              <span>Total Staked</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {parseFloat(totalStakedFormatted).toFixed(4)}
            </p>
          </div>
        </div>

        {/* User Info */}
        {isConnected && (
          <div className="bg-muted/30 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Your Staked</span>
              <span className="font-semibold text-foreground">
                {parseFloat(userStakedFormatted).toFixed(6)} LP
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pending Rewards</span>
              <span className="font-semibold text-primary">
                {parseFloat(pendingRewardFormatted).toFixed(6)} {rewardTokenSymbol}
              </span>
            </div>
            
            {hasPendingRewards && (
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
                    <span className="text-foreground">{parseFloat(lpBalance).toFixed(6)}</span>
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
                        Stake LP
                      </>
                    )}
                  </Button>
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
                    >
                      MAX
                    </Button>
                  </div>
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

            {/* Contract Link */}
            <div className="pt-2 border-t border-border/50">
              <a
                href={`${BLOCK_EXPLORER}/address/${pool.lpToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                View LP Contract
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
