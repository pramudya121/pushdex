import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { CONTRACTS, TOKEN_LIST } from '@/config/contracts';
import { FACTORY_ABI } from '@/config/abis';
import { getReadProvider, getPairContract, getTokenByAddress, formatAmount } from '@/lib/dex';
import { getMultiplePairReserves } from '@/lib/multicall';
import { 
  BarChart3, 
  TrendingUp, 
  Droplets, 
  Activity, 
  Loader2, 
  Coins, 
  Users, 
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Flame
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface PoolData {
  name: string;
  address: string;
  token0Symbol: string;
  token1Symbol: string;
  token0Logo: string;
  token1Logo: string;
  tvl: number;
  volume24h: number;
  fees24h: number;
  apr: number;
}

interface AnalyticsData {
  totalPools: number;
  totalTVL: number;
  totalVolume24h: number;
  totalFees24h: number;
  pools: PoolData[];
}

const CHART_COLORS = ['hsl(330, 100%, 50%)', 'hsl(330, 100%, 65%)', 'hsl(330, 100%, 35%)', 'hsl(280, 80%, 50%)'];

// Mock historical data for charts
const generateHistoricalData = (days: number) => {
  const data = [];
  const now = Date.now();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tvl: Math.random() * 50000 + 10000,
      volume: Math.random() * 10000 + 1000,
    });
  }
  return data;
};

const Analytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [historicalData, setHistoricalData] = useState(generateHistoricalData(7));

  useEffect(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    setHistoricalData(generateHistoricalData(days));
  }, [timeRange]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const provider = getReadProvider();
        const factory = new ethers.Contract(CONTRACTS.FACTORY, FACTORY_ABI, provider);
        
        const pairsLength = await factory.allPairsLength();
        
        const pairAddresses: string[] = [];
        const pairPromises = [];
        
        for (let i = 0; i < Number(pairsLength); i++) {
          pairPromises.push(factory.allPairs(i));
        }
        
        const addresses = await Promise.all(pairPromises);
        pairAddresses.push(...addresses);
        
        const reservesMap = await getMultiplePairReserves(pairAddresses);
        
        let totalTVL = 0;
        let totalVolume24h = 0;
        let totalFees24h = 0;
        const pools: PoolData[] = [];
        
        for (const pairAddress of pairAddresses) {
          try {
            const pair = getPairContract(pairAddress, provider);
            const [token0, token1] = await Promise.all([
              pair.token0(),
              pair.token1(),
            ]);
            
            const reserves = reservesMap.get(pairAddress.toLowerCase());
            const token0Info = getTokenByAddress(token0);
            const token1Info = getTokenByAddress(token1);
            
            const reserve0 = parseFloat(formatAmount(reserves?.reserve0 || 0n, token0Info?.decimals || 18));
            const reserve1 = parseFloat(formatAmount(reserves?.reserve1 || 0n, token1Info?.decimals || 18));
            const tvl = (reserve0 + reserve1) * 1.5; // Mock USD value
            const volume24h = Math.random() * tvl * 0.2; // Mock volume
            const fees24h = volume24h * 0.003; // 0.3% fee
            const apr = (fees24h * 365 / tvl) * 100;
            
            totalTVL += tvl;
            totalVolume24h += volume24h;
            totalFees24h += fees24h;
            
            pools.push({
              name: `${token0Info?.symbol || 'Unknown'}/${token1Info?.symbol || 'Unknown'}`,
              address: pairAddress,
              token0Symbol: token0Info?.symbol || 'Unknown',
              token1Symbol: token1Info?.symbol || 'Unknown',
              token0Logo: token0Info?.logo || '',
              token1Logo: token1Info?.logo || '',
              tvl,
              volume24h,
              fees24h,
              apr,
            });
          } catch (error) {
            console.error(`Error fetching pair ${pairAddress}:`, error);
          }
        }
        
        setData({
          totalPools: Number(pairsLength),
          totalTVL,
          totalVolume24h,
          totalFees24h,
          pools: pools.sort((a, b) => b.tvl - a.tvl),
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);

  const stats = [
    {
      label: 'Total Value Locked',
      value: `$${(data?.totalTVL || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      change: '+12.5%',
      positive: true,
      gradient: 'from-pink-500/20 to-transparent',
    },
    {
      label: 'Volume (24h)',
      value: `$${(data?.totalVolume24h || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: Activity,
      change: '+8.3%',
      positive: true,
      gradient: 'from-purple-500/20 to-transparent',
    },
    {
      label: 'Fees (24h)',
      value: `$${(data?.totalFees24h || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: Coins,
      change: '+5.2%',
      positive: true,
      gradient: 'from-blue-500/20 to-transparent',
    },
    {
      label: 'Total Pools',
      value: data?.totalPools || 0,
      icon: Droplets,
      change: '+2',
      positive: true,
      gradient: 'from-green-500/20 to-transparent',
    },
  ];

  const topTokens = TOKEN_LIST.filter(t => t.symbol !== 'PC').slice(0, 4).map((token, i) => ({
    ...token,
    volume: Math.random() * 50000 + 10000,
    change: (Math.random() - 0.3) * 20,
  }));

  return (
    <div className="min-h-screen relative">
      <WaveBackground />
      <Header />
      
      <main className="relative z-10 pt-32 md:pt-24 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Live Analytics</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              <span className="gradient-text">Protocol Analytics</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Real-time statistics and insights for PUSHDEX
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading analytics...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
                {stats.map((stat, index) => (
                  <div 
                    key={stat.label} 
                    className="glass-card-hover p-6 relative overflow-hidden"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50`} />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-primary/10">
                          <stat.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-medium ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
                          {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {stat.change}
                        </div>
                      </div>
                      <div className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                {/* TVL Chart */}
                <div className="glass-card p-6 animate-scale-in">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold">Total Value Locked</h3>
                      <p className="text-sm text-muted-foreground">Historical TVL over time</p>
                    </div>
                    <div className="flex gap-1 p-1 bg-surface rounded-lg">
                      {['7d', '30d', '90d'].map((range) => (
                        <button
                          key={range}
                          onClick={() => setTimeRange(range as any)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            timeRange === range 
                              ? 'bg-primary text-primary-foreground' 
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={historicalData}>
                        <defs>
                          <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(330, 100%, 50%)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(330, 100%, 50%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 18%)" />
                        <XAxis dataKey="date" stroke="hsl(240, 5%, 65%)" fontSize={12} />
                        <YAxis stroke="hsl(240, 5%, 65%)" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(240, 10%, 8%)', 
                            border: '1px solid hsl(240, 10%, 18%)',
                            borderRadius: '12px'
                          }}
                          formatter={(value: number) => [`$${value.toLocaleString()}`, 'TVL']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="tvl" 
                          stroke="hsl(330, 100%, 50%)" 
                          strokeWidth={2}
                          fill="url(#tvlGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Volume Chart */}
                <div className="glass-card p-6 animate-scale-in" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold">Trading Volume</h3>
                      <p className="text-sm text-muted-foreground">Daily trading volume</p>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 18%)" />
                        <XAxis dataKey="date" stroke="hsl(240, 5%, 65%)" fontSize={12} />
                        <YAxis stroke="hsl(240, 5%, 65%)" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(240, 10%, 8%)', 
                            border: '1px solid hsl(240, 10%, 18%)',
                            borderRadius: '12px'
                          }}
                          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Volume']}
                        />
                        <Bar 
                          dataKey="volume" 
                          fill="hsl(330, 100%, 50%)" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Top Tokens & Pools */}
              <div className="grid lg:grid-cols-3 gap-6 mb-8">
                {/* Top Tokens */}
                <div className="glass-card p-6 animate-fade-in">
                  <div className="flex items-center gap-2 mb-6">
                    <Flame className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold">Top Tokens</h3>
                  </div>
                  <div className="space-y-4">
                    {topTokens.map((token, index) => (
                      <div key={token.symbol} className="flex items-center justify-between p-3 rounded-xl bg-surface hover:bg-surface-hover transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground font-mono text-sm w-4">#{index + 1}</span>
                          <img src={token.logo} alt={token.symbol} className="w-8 h-8 rounded-full" />
                          <div>
                            <div className="font-semibold">{token.symbol}</div>
                            <div className="text-xs text-muted-foreground">{token.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${token.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                          <div className={`text-xs ${token.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {token.change >= 0 ? '+' : ''}{token.change.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Pools Table */}
                <div className="lg:col-span-2 glass-card p-6 animate-scale-in" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center gap-2 mb-6">
                    <Droplets className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold">Top Pools</h3>
                  </div>
                  
                  {data?.pools.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Droplets className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No pools available yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-sm text-muted-foreground border-b border-border">
                            <th className="pb-3 font-medium">#</th>
                            <th className="pb-3 font-medium">Pool</th>
                            <th className="pb-3 font-medium text-right">TVL</th>
                            <th className="pb-3 font-medium text-right">Volume 24h</th>
                            <th className="pb-3 font-medium text-right">APR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data?.pools.slice(0, 5).map((pool, index) => (
                            <tr key={pool.address} className="border-b border-border/50 hover:bg-surface/50 transition-colors">
                              <td className="py-4 text-muted-foreground font-mono">{index + 1}</td>
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex -space-x-2">
                                    <img src={pool.token0Logo} alt={pool.token0Symbol} className="w-7 h-7 rounded-full border-2 border-background" />
                                    <img src={pool.token1Logo} alt={pool.token1Symbol} className="w-7 h-7 rounded-full border-2 border-background" />
                                  </div>
                                  <span className="font-semibold">{pool.name}</span>
                                </div>
                              </td>
                              <td className="py-4 text-right font-medium">${pool.tvl.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                              <td className="py-4 text-right">${pool.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                              <td className="py-4 text-right">
                                <span className="text-green-400 font-medium">{pool.apr.toFixed(2)}%</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Protocol Stats */}
              <div className="grid md:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="glass-card p-6 text-center">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto mb-4">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold mb-2">1,234</div>
                  <div className="text-muted-foreground">Unique Traders</div>
                </div>
                <div className="glass-card p-6 text-center">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto mb-4">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold mb-2">5,678</div>
                  <div className="text-muted-foreground">Total Transactions</div>
                </div>
                <div className="glass-card p-6 text-center">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto mb-4">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold mb-2">0.3%</div>
                  <div className="text-muted-foreground">Swap Fee</div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Analytics;
