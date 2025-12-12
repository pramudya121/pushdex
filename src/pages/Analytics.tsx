import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { CONTRACTS } from '@/config/contracts';
import { FACTORY_ABI } from '@/config/abis';
import { getReadProvider, getPairContract, getTokenByAddress, formatAmount } from '@/lib/dex';
import { getMultiplePairReserves } from '@/lib/multicall';
import { BarChart3, TrendingUp, Droplets, Activity, Loader2 } from 'lucide-react';

interface AnalyticsData {
  totalPools: number;
  totalTVL: number;
  pools: {
    name: string;
    tvl: number;
    volume24h: number;
  }[];
}

const Analytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const provider = getReadProvider();
        const factory = new ethers.Contract(CONTRACTS.FACTORY, FACTORY_ABI, provider);
        
        const pairsLength = await factory.allPairsLength();
        
        // First get all pair addresses
        const pairAddresses: string[] = [];
        const pairPromises = [];
        
        for (let i = 0; i < Number(pairsLength); i++) {
          pairPromises.push(factory.allPairs(i));
        }
        
        const addresses = await Promise.all(pairPromises);
        pairAddresses.push(...addresses);
        
        // Use multicall to get all reserves at once
        const reservesMap = await getMultiplePairReserves(pairAddresses);
        
        let totalTVL = 0;
        const pools: { name: string; tvl: number; volume24h: number }[] = [];
        
        // Get token info for each pair
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
            const tvl = reserve0 + reserve1;
            
            totalTVL += tvl;
            pools.push({
              name: `${token0Info?.symbol || 'Unknown'}/${token1Info?.symbol || 'Unknown'}`,
              tvl,
              volume24h: Math.random() * 10000, // Placeholder - would need event indexing
            });
          } catch (error) {
            console.error(`Error fetching pair ${pairAddress}:`, error);
          }
        }
        
        setData({
          totalPools: Number(pairsLength),
          totalTVL,
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
      label: 'Total Pools',
      value: data?.totalPools || 0,
      icon: Droplets,
      suffix: '',
      prefix: '',
    },
    {
      label: 'Total TVL',
      value: data?.totalTVL.toFixed(2) || '0',
      icon: TrendingUp,
      prefix: '~$',
      suffix: '',
    },
    {
      label: 'Volume 24h',
      value: '0', // Would need event indexing
      icon: Activity,
      prefix: '~$',
      suffix: '',
    },
    {
      label: 'Total Fees 24h',
      value: '0', // Would need event indexing
      icon: BarChart3,
      prefix: '~$',
      suffix: '',
    },
  ];

  return (
    <div className="min-h-screen relative">
      <WaveBackground />
      <Header />
      
      <main className="relative z-10 pt-32 md:pt-24 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">
              <span className="gradient-text">Analytics</span>
            </h1>
            <p className="text-muted-foreground">
              PUSHDEX protocol statistics
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
                {stats.map((stat) => (
                  <div key={stat.label} className="glass-card-hover p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <stat.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {stat.prefix}{stat.value}{stat.suffix}
                    </div>
                  </div>
                ))}
              </div>

              {/* Top Pools */}
              <div className="glass-card p-6 animate-scale-in">
                <h2 className="text-xl font-bold mb-6">Top Pools by TVL</h2>
                
                {data?.pools.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pools available yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="hidden md:grid grid-cols-4 gap-4 px-4 py-2 text-sm text-muted-foreground">
                      <div>Pool</div>
                      <div className="text-right">TVL</div>
                      <div className="text-right">Volume 24h</div>
                      <div className="text-right">Fees 24h</div>
                    </div>

                    {data?.pools.map((pool, index) => (
                      <div
                        key={pool.name}
                        className="p-4 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-colors"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground font-mono text-sm">
                              #{index + 1}
                            </span>
                            <span className="font-semibold">{pool.name}</span>
                          </div>
                          
                          <div className="text-right">
                            <div className="md:hidden text-xs text-muted-foreground mb-1">TVL</div>
                            <div className="font-semibold text-primary">~${pool.tvl.toFixed(2)}</div>
                          </div>
                          
                          <div className="text-right">
                            <div className="md:hidden text-xs text-muted-foreground mb-1">Volume 24h</div>
                            <div>~${pool.volume24h.toFixed(2)}</div>
                          </div>
                          
                          <div className="text-right">
                            <div className="md:hidden text-xs text-muted-foreground mb-1">Fees 24h</div>
                            <div>~${(pool.volume24h * 0.003).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Note */}
              <div className="mt-6 text-center text-sm text-muted-foreground">
                Note: Volume and fee data requires event indexing (The Graph subgraph). 
                Currently showing placeholder values.
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Analytics;
