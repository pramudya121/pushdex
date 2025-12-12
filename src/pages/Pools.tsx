import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { WrapUnwrap } from '@/components/WrapUnwrap';
import { Button } from '@/components/ui/button';
import { CONTRACTS } from '@/config/contracts';
import { FACTORY_ABI } from '@/config/abis';
import { getReadProvider, getPairContract, getTokenByAddress, formatAmount } from '@/lib/dex';
import { getMultiplePairReserves } from '@/lib/multicall';
import { Loader2, Droplets, Plus, RefreshCcw } from 'lucide-react';

interface PoolInfo {
  pairAddress: string;
  token0: string;
  token1: string;
  token0Symbol: string;
  token1Symbol: string;
  reserve0: string;
  reserve1: string;
  tvl: number;
}

const Pools = () => {
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPools = async () => {
    setIsLoading(true);
    try {
      const provider = getReadProvider();
      const factory = new ethers.Contract(CONTRACTS.FACTORY, FACTORY_ABI, provider);
      
      const pairsLength = await factory.allPairsLength();
      
      // First, get all pair addresses
      const pairAddresses: string[] = [];
      const pairInfoPromises = [];
      
      for (let i = 0; i < Number(pairsLength); i++) {
        pairInfoPromises.push(factory.allPairs(i));
      }
      
      const addresses = await Promise.all(pairInfoPromises);
      pairAddresses.push(...addresses);
      
      // Use multicall to get reserves for all pairs at once
      const reservesMap = await getMultiplePairReserves(pairAddresses);
      
      // Fetch token info for each pair
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
          
          return {
            pairAddress,
            token0,
            token1,
            token0Symbol: token0Info?.symbol || 'Unknown',
            token1Symbol: token1Info?.symbol || 'Unknown',
            reserve0: formatAmount(reserves?.reserve0 || 0n, token0Info?.decimals || 18),
            reserve1: formatAmount(reserves?.reserve1 || 0n, token1Info?.decimals || 18),
            tvl: parseFloat(formatAmount(reserves?.reserve0 || 0n)) + parseFloat(formatAmount(reserves?.reserve1 || 0n)),
          };
        } catch (error) {
          console.error(`Error fetching pair ${pairAddress}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(poolPromises);
      setPools(results.filter((p): p is PoolInfo => p !== null));
    } catch (error) {
      console.error('Error fetching pools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  return (
    <div className="min-h-screen relative">
      <WaveBackground />
      <Header />
      
      <main className="relative z-10 pt-32 md:pt-24 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 animate-fade-in">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold mb-2">
                <span className="gradient-text">Pools</span>
              </h1>
              <p className="text-muted-foreground">
                Explore all liquidity pools on PUSHDEX
              </p>
            </div>
            <div className="flex items-center gap-3">
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
                <Button className="gap-2 bg-gradient-pink hover:opacity-90">
                  <Plus className="w-4 h-4" />
                  Create Pool
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pools List */}
            <div className="lg:col-span-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : pools.length === 0 ? (
                <div className="glass-card p-12 text-center animate-scale-in">
                  <Droplets className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Pools Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to create a liquidity pool!
                  </p>
                  <Link to="/pools/create">
                    <Button className="gap-2 bg-gradient-pink hover:opacity-90">
                      <Plus className="w-4 h-4" />
                      Create Pool
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  {/* Header */}
                  <div className="hidden md:grid grid-cols-5 gap-4 px-6 py-3 text-sm text-muted-foreground">
                    <div>Pool</div>
                    <div className="text-right">Reserve 0</div>
                    <div className="text-right">Reserve 1</div>
                    <div className="text-right">TVL</div>
                    <div className="text-right">Address</div>
                  </div>

                  {/* Pools */}
                  {pools.map((pool) => {
                    const token0Info = getTokenByAddress(pool.token0);
                    const token1Info = getTokenByAddress(pool.token1);
                    
                    return (
                    <div
                      key={pool.pairAddress}
                      className="glass-card-hover p-4 md:p-6"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {token0Info?.logo ? (
                              <img src={token0Info.logo} alt={pool.token0Symbol} className="w-8 h-8 rounded-full border-2 border-background" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-pink flex items-center justify-center text-xs font-bold text-primary-foreground border-2 border-background">
                                {pool.token0Symbol.charAt(0)}
                              </div>
                            )}
                            {token1Info?.logo ? (
                              <img src={token1Info.logo} alt={pool.token1Symbol} className="w-8 h-8 rounded-full border-2 border-background" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-pink flex items-center justify-center text-xs font-bold text-primary-foreground border-2 border-background">
                                {pool.token1Symbol.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="font-semibold">
                            {pool.token0Symbol}/{pool.token1Symbol}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="md:hidden text-xs text-muted-foreground mb-1">Reserve 0</div>
                          <div className="font-medium">{parseFloat(pool.reserve0).toFixed(4)}</div>
                          <div className="text-xs text-muted-foreground">{pool.token0Symbol}</div>
                        </div>
                        
                        <div className="text-right">
                          <div className="md:hidden text-xs text-muted-foreground mb-1">Reserve 1</div>
                          <div className="font-medium">{parseFloat(pool.reserve1).toFixed(4)}</div>
                          <div className="text-xs text-muted-foreground">{pool.token1Symbol}</div>
                        </div>
                        
                        <div className="text-right">
                          <div className="md:hidden text-xs text-muted-foreground mb-1">TVL</div>
                          <div className="font-semibold text-primary">
                            ~${pool.tvl.toFixed(2)}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="md:hidden text-xs text-muted-foreground mb-1">Address</div>
                          <a
                            href={`https://donut.push.network/address/${pool.pairAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-sm text-primary hover:underline"
                          >
                            {pool.pairAddress.slice(0, 6)}...{pool.pairAddress.slice(-4)}
                          </a>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Wrap/Unwrap Sidebar */}
            <div className="lg:col-span-1">
              <WrapUnwrap />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pools;
