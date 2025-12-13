import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { WrapUnwrap } from '@/components/WrapUnwrap';
import { PoolCard } from '@/components/PoolCard';
import { PriceChart } from '@/components/PriceChart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CONTRACTS } from '@/config/contracts';
import { FACTORY_ABI } from '@/config/abis';
import { getReadProvider, getPairContract, getTokenByAddress, formatAmount } from '@/lib/dex';
import { getMultiplePairReserves } from '@/lib/multicall';
import { 
  Loader2, 
  Droplets, 
  Plus, 
  RefreshCcw, 
  Search, 
  TrendingUp,
  LayoutGrid,
  LayoutList,
  ChevronDown,
  ArrowUpDown
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
}

type SortField = 'tvl' | 'volume24h' | 'apy';
type ViewMode = 'grid' | 'list';

const Pools = () => {
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('tvl');
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedPool, setSelectedPool] = useState<PoolInfo | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const fetchPools = async () => {
    setIsLoading(true);
    try {
      const provider = getReadProvider();
      const factory = new ethers.Contract(CONTRACTS.FACTORY, FACTORY_ABI, provider);
      
      const pairsLength = await factory.allPairsLength();
      
      const pairInfoPromises = [];
      for (let i = 0; i < Number(pairsLength); i++) {
        pairInfoPromises.push(factory.allPairs(i));
      }
      
      const pairAddresses = await Promise.all(pairInfoPromises);
      const reservesMap = await getMultiplePairReserves(pairAddresses);
      
      const poolPromises = pairAddresses.map(async (pairAddress) => {
        try {
          const pair = getPairContract(pairAddress, provider);
          const [token0, token1] = await Promise.all([
            pair.token0(),
            pair.token1(),
          ]);
          
          const reserves = reservesMap.get(pairAddress.toLowerCase());
          const token0Info = getTokenByAddress(token0);
          const token1Info = getTokenByAddress(token1);
          
          const tvl = parseFloat(formatAmount(reserves?.reserve0 || 0n)) + parseFloat(formatAmount(reserves?.reserve1 || 0n));
          const volume24h = tvl * (0.05 + Math.random() * 0.15);
          const fees24h = volume24h * 0.003;
          const apy = tvl > 0 ? ((fees24h * 365) / tvl) * 100 : 0;
          
          return {
            pairAddress,
            token0,
            token1,
            token0Symbol: token0Info?.symbol || 'Unknown',
            token1Symbol: token1Info?.symbol || 'Unknown',
            reserve0: formatAmount(reserves?.reserve0 || 0n, token0Info?.decimals || 18),
            reserve1: formatAmount(reserves?.reserve1 || 0n, token1Info?.decimals || 18),
            tvl,
            volume24h,
            apy,
          };
        } catch (error) {
          console.error(`Error fetching pair ${pairAddress}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(poolPromises);
      const validPools = results.filter((p): p is PoolInfo => p !== null);
      setPools(validPools);
      
      if (validPools.length > 0 && !selectedPool) {
        setSelectedPool(validPools[0]);
      }
    } catch (error) {
      console.error('Error fetching pools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  // Filter and sort pools
  const filteredPools = pools
    .filter(pool => 
      pool.token0Symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.token1Symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.pairAddress.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const multiplier = sortDesc ? -1 : 1;
      return (a[sortField] - b[sortField]) * multiplier;
    });

  // Stats summary
  const totalTVL = pools.reduce((sum, p) => sum + p.tvl, 0);
  const totalVolume = pools.reduce((sum, p) => sum + p.volume24h, 0);
  const avgAPY = pools.length > 0 ? pools.reduce((sum, p) => sum + p.apy, 0) / pools.length : 0;

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  return (
    <div className="min-h-screen relative">
      <WaveBackground />
      <Header />
      
      <main className="relative z-10 pt-32 md:pt-24 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-10 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              <span className="gradient-text">Liquidity Pools</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Explore and provide liquidity to earn trading fees
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="glass-card p-5 text-center">
              <div className="text-muted-foreground text-sm mb-1">Total Value Locked</div>
              <div className="text-3xl font-bold gradient-text">${totalTVL.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            </div>
            <div className="glass-card p-5 text-center">
              <div className="text-muted-foreground text-sm mb-1">24h Volume</div>
              <div className="text-3xl font-bold text-foreground">${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            </div>
            <div className="glass-card p-5 text-center">
              <div className="text-muted-foreground text-sm mb-1">Average APY</div>
              <div className="text-3xl font-bold text-[hsl(var(--success))]">{avgAPY.toFixed(2)}%</div>
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

              <Button
                variant="outline"
                size="sm"
                onClick={fetchPools}
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

          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Pools List/Grid */}
            <div className="xl:col-span-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-32">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading pools...</p>
                  </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                  {filteredPools.map((pool) => (
                    <PoolCard
                      key={pool.pairAddress}
                      {...pool}
                      onSelect={() => setSelectedPool(pool)}
                      isSelected={selectedPool?.pairAddress === pool.pairAddress}
                    />
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
                  {filteredPools.map((pool) => {
                    const token0Info = getTokenByAddress(pool.token0);
                    const token1Info = getTokenByAddress(pool.token1);
                    
                    return (
                      <div
                        key={pool.pairAddress}
                        onClick={() => setSelectedPool(pool)}
                        className={`grid grid-cols-6 gap-4 px-6 py-4 items-center border-b border-border/30 hover:bg-secondary/30 cursor-pointer transition-colors ${
                          selectedPool?.pairAddress === pool.pairAddress ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                        }`}
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
                        <div className="text-right font-semibold">${pool.tvl.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                        <div className="text-right">${pool.volume24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                        <div className="text-right text-[hsl(var(--success))] font-semibold">{pool.apy.toFixed(2)}%</div>
                        <div className="text-right">
                          <Link to="/liquidity" onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="outline" className="text-xs">
                              Add Liquidity
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="xl:col-span-1 space-y-6">
              {/* Price Chart */}
              {selectedPool && (
                <div className="animate-fade-in">
                  <PriceChart
                    token0Symbol={selectedPool.token0Symbol}
                    token1Symbol={selectedPool.token1Symbol}
                    reserve0={selectedPool.reserve0}
                    reserve1={selectedPool.reserve1}
                  />
                </div>
              )}
              
              {/* Wrap/Unwrap */}
              <WrapUnwrap />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pools;
