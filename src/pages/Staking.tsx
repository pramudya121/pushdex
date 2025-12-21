import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { WaveBackground } from '@/components/WaveBackground';
import { StakeCard } from '@/components/StakeCard';
import { useStaking } from '@/hooks/useStaking';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Coins, 
  TrendingUp, 
  RefreshCw,
  Wallet,
  AlertCircle,
  Lock,
  Percent,
  Shield,
  Zap,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';
import { BLOCK_EXPLORER, CONTRACTS } from '@/config/contracts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Staking: React.FC = () => {
  const { isConnected, connect } = useWallet();
  const {
    pools,
    isLoading,
    error,
    stake,
    unstake,
    claimRewards,
    getTokenBalance,
    getRemainingLockTime,
    refreshPools,
    isStaking,
    isUnstaking,
    isClaiming,
  } = useStaking();

  const [sortBy, setSortBy] = useState<'apr' | 'tvl' | 'lock'>('apr');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'staked'>('all');

  // Calculate stats
  const totalUserStaked = pools.reduce((acc, pool) => acc + pool.userStaked, BigInt(0));
  const totalPendingRewards = pools.reduce((acc, pool) => acc + pool.userPendingReward, BigInt(0));
  const highestApr = pools.length > 0 ? Math.max(...pools.map(p => p.apr)) : 0;
  const activePools = pools.filter(p => p.isActive).length;
  const totalTVL = pools.reduce((acc, pool) => acc + pool.totalStaked, BigInt(0));

  // Filter and sort pools
  const filteredPools = pools
    .filter(pool => {
      if (filterActive === 'active') return pool.isActive;
      if (filterActive === 'staked') return pool.userStaked > BigInt(0);
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'apr') return b.apr - a.apr;
      if (sortBy === 'tvl') return Number(b.totalStaked - a.totalStaked);
      if (sortBy === 'lock') return a.lockPeriodDays - b.lockPeriodDays;
      return 0;
    });

  return (
    <div className="min-h-screen bg-background wave-bg">
      <WaveBackground />
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
            <Coins className="w-5 h-5 text-accent" />
            <span className="text-accent font-medium">Single Token Staking</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Earn Passive Income</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Stake your tokens and earn rewards. Choose from multiple pools with different APRs and lock periods.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Pools</p>
                  <p className="text-2xl font-bold text-foreground">{activePools}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total TVL</p>
                  <p className="text-2xl font-bold text-foreground">
                    {parseFloat(ethers.formatEther(totalTVL)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Percent className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Highest APR</p>
                  <p className="text-2xl font-bold gradient-text">
                    {highestApr.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Staked</p>
                  <p className="text-2xl font-bold text-foreground">
                    {isConnected ? parseFloat(ethers.formatEther(totalUserStaked)).toFixed(2) : '0.00'}
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
            <Link to="/farming">
              <Button variant="outline" size="sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                LP Farming
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="outline" size="sm">
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Filter */}
            <Select value={filterActive} onValueChange={(v) => setFilterActive(v as any)}>
              <SelectTrigger className="w-[130px] bg-muted/50">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pools</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="staked">My Stakes</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[130px] bg-muted/50">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apr">Highest APR</SelectItem>
                <SelectItem value="tvl">Highest TVL</SelectItem>
                <SelectItem value="lock">Shortest Lock</SelectItem>
              </SelectContent>
            </Select>
            
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
              href={`${BLOCK_EXPLORER}/address/${CONTRACTS.STAKING}`}
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
                  Connect your wallet to stake tokens and earn rewards
                </p>
                <Button onClick={() => connect('metamask')} className="bg-primary hover:bg-primary/90">
                  Connect Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Notice */}
        {pools.length === 0 && !isLoading && (
          <Alert className="mb-8 border-primary/30 bg-primary/5">
            <Shield className="h-4 w-4 text-primary" />
            <AlertDescription className="text-foreground">
              <strong>No Staking Pools:</strong> There are currently no active staking pools. 
              Pools will appear here once they are added to the staking contract.
            </AlertDescription>
          </Alert>
        )}

        {/* Staking Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPools.map((pool) => (
              <StakeCard
                key={pool.id}
                pool={pool}
                onStake={stake}
                onUnstake={unstake}
                onClaim={claimRewards}
                getTokenBalance={getTokenBalance}
                getRemainingLockTime={getRemainingLockTime}
                isStaking={isStaking}
                isUnstaking={isUnstaking}
                isClaiming={isClaiming}
              />
            ))}
          </div>
        ) : pools.length > 0 ? (
          <Card className="glass-card">
            <CardContent className="py-16">
              <div className="text-center">
                <Filter className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No Matching Pools</h3>
                <p className="text-muted-foreground mb-4">
                  No pools match your current filters. Try adjusting the filter settings.
                </p>
                <Button variant="outline" onClick={() => setFilterActive('all')}>
                  Show All Pools
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card">
            <CardContent className="py-16">
              <div className="text-center">
                <Coins className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No Staking Pools</h3>
                <p className="text-muted-foreground mb-4">
                  Staking pools are coming soon. Check back later!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <Coins className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Simple Staking</h3>
              <p className="text-sm text-muted-foreground">
                Stake single tokens without needing to provide liquidity pairs. Just stake and earn.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Competitive APRs</h3>
              <p className="text-sm text-muted-foreground">
                Earn attractive returns on your staked tokens with our competitive APR rates.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5 text-success" />
              </div>
              <h3 className="font-semibold mb-2">Flexible Lock Periods</h3>
              <p className="text-sm text-muted-foreground">
                Choose pools with different lock periods. Higher locks often mean higher rewards.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Staking;
