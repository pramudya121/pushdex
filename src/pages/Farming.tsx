import React from 'react';
import { Header } from '@/components/Header';
import { WaveBackground } from '@/components/WaveBackground';
import { FarmCard } from '@/components/FarmCard';
import { useFarming } from '@/hooks/useFarming';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Leaf, 
  Sparkles, 
  TrendingUp, 
  Coins,
  RefreshCw,
  Wallet,
  ExternalLink,
  Loader2,
  TreeDeciduous,
  Sprout
} from 'lucide-react';
import { ethers } from 'ethers';
import { BLOCK_EXPLORER, CONTRACTS } from '@/config/contracts';
import { Link } from 'react-router-dom';

const Farming: React.FC = () => {
  const { isConnected, connect } = useWallet();
  const {
    pools,
    rewardTokenSymbol,
    rewardPerBlock,
    isLoading,
    stake,
    unstake,
    harvest,
    getLpBalance,
    refreshPools,
    isStaking,
    isUnstaking,
    isHarvesting,
  } = useFarming();

  // Calculate total stats
  const totalUserStaked = pools.reduce((acc, pool) => acc + pool.userStaked, BigInt(0));
  const totalPendingRewards = pools.reduce((acc, pool) => acc + pool.userPendingReward, BigInt(0));
  const avgApr = pools.length > 0 
    ? pools.reduce((acc, pool) => acc + pool.apr, 0) / pools.length 
    : 0;

  return (
    <div className="min-h-screen bg-background wave-bg">
      <WaveBackground />
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <TreeDeciduous className="w-5 h-5 text-primary" />
            <span className="text-primary font-medium">Yield Farming</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Grow Your Assets</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Stake LP tokens and earn {rewardTokenSymbol || 'rewards'}. 
            Harvest your yield anytime.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Farms</p>
                  <p className="text-2xl font-bold text-foreground">{pools.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
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

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
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

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Rewards</p>
                  <p className="text-2xl font-bold text-primary">
                    {isConnected ? parseFloat(ethers.formatEther(totalPendingRewards)).toFixed(4) : '0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="py-2 px-4">
              <Sprout className="w-4 h-4 mr-2" />
              Reward: {rewardPerBlock > 0 ? ethers.formatEther(rewardPerBlock) : '0'} {rewardTokenSymbol}/block
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshPools}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <a
              href={`${BLOCK_EXPLORER}/address/${CONTRACTS.FARMING}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Contract
              </Button>
            </a>
          </div>
        </div>

        {/* Connect Wallet Message */}
        {!isConnected && (
          <Card className="glass-card mb-8">
            <CardContent className="py-8">
              <div className="text-center">
                <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your wallet to view your staked positions and rewards
                </p>
                <Button onClick={() => connect('metamask')} className="bg-primary hover:bg-primary/90">
                  Connect Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Farm Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : pools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pools.map((pool) => (
              <FarmCard
                key={pool.pid}
                pool={pool}
                rewardTokenSymbol={rewardTokenSymbol}
                onStake={stake}
                onUnstake={unstake}
                onHarvest={harvest}
                getLpBalance={getLpBalance}
                isStaking={isStaking}
                isUnstaking={isUnstaking}
                isHarvesting={isHarvesting}
              />
            ))}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="py-16">
              <div className="text-center">
                <Leaf className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No Active Farms</h3>
                <p className="text-muted-foreground mb-4">
                  There are currently no active farming pools. Check back later or add liquidity to start farming.
                </p>
                <Link to="/liquidity">
                  <Button className="bg-primary hover:bg-primary/90">
                    Add Liquidity
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold mb-2">Add Liquidity</h3>
              <p className="text-sm text-muted-foreground">
                First, add liquidity to any pool to receive LP tokens that represent your share.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold mb-2">Stake LP Tokens</h3>
              <p className="text-sm text-muted-foreground">
                Stake your LP tokens in the farm to start earning rewards automatically.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold mb-2">Harvest Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Harvest your earned {rewardTokenSymbol || 'tokens'} anytime. Rewards accumulate every block.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Farming;
