import React, { useState, useMemo, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { HeroSection } from '@/components/HeroSection';
import { PoolCard } from '@/components/PoolCard';
import { QuickStats } from '@/components/QuickStats';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { getTokenByAddress } from '@/lib/dex';
import { useFavorites } from '@/hooks/useFavorites';
import { useRealtimePrices } from '@/hooks/useRealtimePrices';
import { PulseDot } from '@/components/LivePriceIndicator';
import { 
  Droplets, 
  Plus, 
  RefreshCcw, 
  Search, 
  TrendingUp,
  LayoutGrid,
  LayoutList,
  ChevronDown,
  ArrowUpDown,
  Star,
  Radio
} from 'lucide-react';

interface PoolInfo {
  pairAddress: string;
  token0: string;
  token1: string;
  token0Symbol: string;
  token1Symbol: string;
  reserve0: string;
  reserve1: string;
  tvl: number;
  volume24h: number;
  apy: number;
  priceChange24h: number;
  lastUpdate: number;
}

type SortField = 'tvl' | 'volume24h' | 'apy';
type ViewMode = 'grid' | 'list';
type FilterMode = 'all' | 'favorites';

// Pool Card Skeleton for loading state
const PoolCardSkeleton = memo(() => (
  <div className="glass-card p-5 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="flex gap-1">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-16 rounded-xl" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
    </div>
    <Skeleton className="h-4 w-full" />
    <div className="flex gap-2">
      <Skeleton className="h-8 flex-1 rounded-lg" />
      <Skeleton className="h-8 flex-1 rounded-lg" />
    </div>
  </div>
));

const Pools = memo(() => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('tvl');
  const [sortDesc, setSortDesc] = useState(true);
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const { favoritePools, isFavoritePool } = useFavorites();
  
  // Use real-time price hook with 10 second refresh
  const { pools: realtimePools, isLoading, lastUpdate, isConnected, refresh } = useRealtimePrices(10000);

  // Transform realtime pools to PoolInfo format
  const pools: PoolInfo[] = useMemo(() => {
    return realtimePools.map(p => ({
      pairAddress: p.pairAddress,
      token0: p.token0,
      token1: p.token1,
      token0Symbol: p.token0Symbol,
      token1Symbol: p.token1Symbol,
      reserve0: p.reserve0,
      reserve1: p.reserve1,
      tvl: p.tvl,
      volume24h: p.volume24h,
      apy: p.apy,
      priceChange24h: p.priceChange24h,
      lastUpdate: p.lastUpdate,
    }));
  }, [realtimePools]);

  // Memoized filter and sort
  const filteredPools = useMemo(() => {
    return pools
      .filter(pool => {
        const matchesSearch = pool.token0Symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pool.token1Symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pool.pairAddress.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFavorites = filterMode === 'all' || isFavoritePool(pool.pairAddress);
        return matchesSearch && matchesFavorites;
      })
      .sort((a, b) => {
        const multiplier = sortDesc ? -1 : 1;
        return (a[sortField] - b[sortField]) * multiplier;
      });
  }, [pools, searchTerm, filterMode, isFavoritePool, sortField, sortDesc]);

  // Memoized stats
  const { totalTVL, totalVolume, avgAPY } = useMemo(() => ({
    totalTVL: pools.reduce((sum, p) => sum + p.tvl, 0),
    totalVolume: pools.reduce((sum, p) => sum + p.volume24h, 0),
    avgAPY: pools.length > 0 ? pools.reduce((sum, p) => sum + p.apy, 0) / pools.length : 0
  }), [pools]);

  const toggleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDesc(prev => !prev);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  }, [sortField]);

  // Format last update time
  const lastUpdateFormatted = useMemo(() => {
    const seconds = Math.floor((Date.now() - lastUpdate) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  }, [lastUpdate]);

  return (
    <div className="min-h-screen relative">
      <WaveBackground />
      <Header />
      
      <main className="relative z-10 pt-32 md:pt-24 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <HeroSection
            title="Liquidity Pools"
            description="Explore and provide liquidity to earn trading fees"
            showSpotlight={true}
            showStars={true}
            spotlightColor="hsl(280, 80%, 50%)"
          />

          {/* Quick Stats */}
          <QuickStats className="mb-6 animate-fade-in" />

          {/* Stats Cards - Now showing on-chain data */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="glass-card p-5 text-center">
              <div className="text-muted-foreground text-sm mb-1">Total Value Locked</div>
              <div className="text-3xl font-bold gradient-text">${totalTVL.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              <div className="text-xs text-muted-foreground mt-1">From on-chain reserves</div>
            </div>
            <div className="glass-card p-5 text-center">
              <div className="text-muted-foreground text-sm mb-1">24h Volume</div>
              <div className="text-3xl font-bold text-foreground">${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              <div className="text-xs text-muted-foreground mt-1">Estimated from TVL</div>
            </div>
            <div className="glass-card p-5 text-center">
              <div className="text-muted-foreground text-sm mb-1">Average APY</div>
              <div className="text-3xl font-bold text-[hsl(var(--success))]">{avgAPY.toFixed(2)}%</div>
              <div className="text-xs text-muted-foreground mt-1">Based on trading fees</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search pools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50"
                />
              </div>
              
              {/* Favorites Filter */}
              <div className="flex bg-secondary/50 rounded-lg p-1 border border-border/50">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filterMode === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterMode('favorites')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    filterMode === 'favorites' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  Favorites
                  {favoritePools.length > 0 && (
                    <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                      {favoritePools.length}
                    </span>
                  )}
                </button>
              </div>
              
              {/* View Toggle */}
              <div className="flex bg-secondary/50 rounded-lg p-1 border border-border/50">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Sort */}
              <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-1 border border-border/50">
                <button
                  onClick={() => toggleSort('tvl')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    sortField === 'tvl' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Droplets className="w-3.5 h-3.5" />
                  TVL
                  {sortField === 'tvl' && <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortDesc ? '' : 'rotate-180'}`} />}
                </button>
                <button
                  onClick={() => toggleSort('volume24h')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    sortField === 'volume24h' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Volume
                  {sortField === 'volume24h' && <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortDesc ? '' : 'rotate-180'}`} />}
                </button>
                <button
                  onClick={() => toggleSort('apy')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    sortField === 'apy' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  APY
                  {sortField === 'apy' && <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortDesc ? '' : 'rotate-180'}`} />}
                </button>
              </div>

              {/* Live Status & Refresh */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface/50 border border-border/50">
                <PulseDot connected={isConnected} />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? `Updated ${lastUpdateFormatted}` : 'Reconnecting...'}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link to="/pools/create">
                <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  <Plus className="w-4 h-4" />
                  Create Pool
                </Button>
              </Link>
            </div>
          </div>

          {/* Pools Grid - 3 columns */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <PoolCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredPools.length === 0 ? (
            <div className="glass-card p-16 text-center animate-scale-in">
              <Droplets className="w-20 h-20 text-muted-foreground mx-auto mb-6 opacity-50" />
              <h3 className="text-2xl font-semibold mb-3">
                {searchTerm ? 'No Pools Found' : 'No Pools Yet'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm 
                  ? 'Try adjusting your search criteria'
                  : 'Be the first to create a liquidity pool and start earning fees!'
                }
              </p>
              {!searchTerm && (
                <Link to="/pools/create">
                  <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
                    <Plus className="w-4 h-4" />
                    Create First Pool
                  </Button>
                </Link>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
              {filteredPools.map((pool, index) => (
                <div 
                  key={pool.pairAddress} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <PoolCard
                    {...pool}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card overflow-hidden animate-fade-in">
              {/* Table Header */}
              <div className="grid grid-cols-6 gap-4 px-6 py-4 bg-secondary/30 border-b border-border/50 text-sm font-medium text-muted-foreground">
                <div className="col-span-2">Pool</div>
                <div className="text-right">TVL</div>
                <div className="text-right">Volume 24h</div>
                <div className="text-right">APY</div>
                <div className="text-right">Action</div>
              </div>
              
              {/* Table Rows */}
              {filteredPools.map((pool, index) => {
                const token0Info = getTokenByAddress(pool.token0);
                const token1Info = getTokenByAddress(pool.token1);
                
                return (
                  <div
                    key={pool.pairAddress}
                    className="grid grid-cols-6 gap-4 px-6 py-4 items-center border-b border-border/30 hover:bg-secondary/30 transition-all animate-fade-in"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <div className="col-span-2 flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {token0Info?.logo ? (
                          <img src={token0Info.logo} alt={pool.token0Symbol} className="w-8 h-8 rounded-full border-2 border-background" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-primary-foreground border-2 border-background">
                            {pool.token0Symbol.charAt(0)}
                          </div>
                        )}
                        {token1Info?.logo ? (
                          <img src={token1Info.logo} alt={pool.token1Symbol} className="w-8 h-8 rounded-full border-2 border-background" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-xs font-bold text-primary-foreground border-2 border-background">
                            {pool.token1Symbol.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">{pool.token0Symbol}/{pool.token1Symbol}</div>
                        <div className="text-xs text-muted-foreground">Fee: 0.3%</div>
                      </div>
                    </div>
                    <div className="text-right font-medium">${pool.tvl.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <div className="text-right">${pool.volume24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    <div className="text-right text-[hsl(var(--success))]">{pool.apy.toFixed(2)}%</div>
                    <div className="text-right">
                      <Link to={`/pools/${pool.pairAddress}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
});

export default Pools;
