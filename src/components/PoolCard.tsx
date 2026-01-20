import React, { memo, useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Droplets, TrendingUp, TrendingDown, ExternalLink, Star, Radio } from 'lucide-react';
import { getTokenByAddress } from '@/lib/dex';
import { useFavorites } from '@/hooks/useFavorites';
import { BackgroundGradient } from '@/components/ui/aceternity/background-gradient';
import { cn } from '@/lib/utils';

interface PoolCardProps {
  pairAddress: string;
  token0: string;
  token1: string;
  token0Symbol: string;
  token1Symbol: string;
  reserve0: string;
  reserve1: string;
  tvl: number;
  volume24h?: number;
  apy?: number;
  priceChange24h?: number;
  lastUpdate?: number;
}

export const PoolCard: React.FC<PoolCardProps> = memo(({
  pairAddress,
  token0,
  token1,
  token0Symbol,
  token1Symbol,
  reserve0,
  reserve1,
  tvl,
  volume24h: propVolume24h,
  apy: propApy,
  priceChange24h = 0,
  lastUpdate,
}) => {
  const token0Info = useMemo(() => getTokenByAddress(token0), [token0]);
  const token1Info = useMemo(() => getTokenByAddress(token1), [token1]);
  const { isFavoritePool, toggleFavoritePool } = useFavorites();
  const [isFlashing, setIsFlashing] = useState(false);
  const [prevTvl, setPrevTvl] = useState(tvl);
  
  const isFavorite = isFavoritePool(pairAddress);
  
  // Flash effect when price updates
  useEffect(() => {
    if (tvl !== prevTvl) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 500);
      setPrevTvl(tvl);
      return () => clearTimeout(timer);
    }
  }, [tvl, prevTvl]);
  
  // Use provided values or calculate mock stats - memoized to prevent recalculation
  const { volume24h, fees24h, apy } = useMemo(() => {
    const vol = propVolume24h ?? tvl * 0.1;
    const fees = vol * 0.003;
    const apyVal = propApy ?? (tvl > 0 ? ((fees * 365) / tvl) * 100 : 0);
    return { volume24h: vol, fees24h: fees, apy: apyVal };
  }, [propVolume24h, propApy, tvl]);

  const isPositiveChange = priceChange24h >= 0;

  return (
    <BackgroundGradient
      className="rounded-2xl"
      containerClassName="w-full"
    >
    <div className={cn(
      "bg-card rounded-2xl p-5 transition-all duration-300 group hover:shadow-lg",
      isFlashing && (tvl > prevTvl ? "ring-2 ring-[hsl(var(--success))]/50" : "ring-2 ring-destructive/50")
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Live Indicator */}
          <div className="relative">
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          </div>
          <div className="flex -space-x-3">
            {token0Info?.logo ? (
              <img 
                src={token0Info.logo} 
                alt={token0Symbol} 
                className="w-10 h-10 rounded-full border-2 border-background shadow-lg transition-transform group-hover:scale-105" 
                loading="lazy"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-primary-foreground border-2 border-background shadow-lg">
                {token0Symbol.charAt(0)}
              </div>
            )}
            {token1Info?.logo ? (
              <img 
                src={token1Info.logo} 
                alt={token1Symbol} 
                className="w-10 h-10 rounded-full border-2 border-background shadow-lg transition-transform group-hover:scale-105" 
                loading="lazy"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-sm font-bold text-primary-foreground border-2 border-background shadow-lg">
                {token1Symbol.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{token0Symbol}/{token1Symbol}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Fee: 0.3%</span>
              <div className={cn(
                "flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded",
                isPositiveChange 
                  ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" 
                  : "bg-destructive/10 text-destructive"
              )}>
                {isPositiveChange ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositiveChange ? '+' : ''}{priceChange24h.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavoritePool({ pairAddress, token0Symbol, token1Symbol });
            }}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isFavorite 
                ? 'text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20 scale-110' 
                : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:scale-105'
            }`}
          >
            <Star className={`w-4 h-4 transition-all ${isFavorite ? 'fill-yellow-500' : ''}`} />
          </button>
          <a
            href={`https://donut.push.network/address/${pairAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-200 hover:scale-105"
          >
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-secondary/30 rounded-xl p-3 transition-all hover:bg-secondary/40">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
            <Droplets className="w-3.5 h-3.5" />
            TVL
          </div>
          <div className="font-bold text-lg">${tvl.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-secondary/30 rounded-xl p-3 transition-all hover:bg-secondary/40">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            APY
          </div>
          <div className="font-bold text-lg text-[hsl(var(--success))]">{apy.toFixed(2)}%</div>
        </div>
      </div>
      
      {/* Reserves */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {token0Info?.logo ? (
              <img src={token0Info.logo} alt={token0Symbol} className="w-5 h-5 rounded-full" loading="lazy" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                {token0Symbol.charAt(0)}
              </div>
            )}
            <span className="text-muted-foreground">{token0Symbol}</span>
          </div>
          <span className="font-medium tabular-nums">{parseFloat(reserve0).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {token1Info?.logo ? (
              <img src={token1Info.logo} alt={token1Symbol} className="w-5 h-5 rounded-full" loading="lazy" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                {token1Symbol.charAt(0)}
              </div>
            )}
            <span className="text-muted-foreground">{token1Symbol}</span>
          </div>
          <span className="font-medium tabular-nums">{parseFloat(reserve1).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
        </div>
      </div>
      
      {/* 24h Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
        <div>
          24h Volume: <span className="text-foreground font-medium tabular-nums">${volume24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
        <div>
          24h Fees: <span className="text-foreground font-medium tabular-nums">${fees24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <Link to={`/pools/${pairAddress}`} className="flex-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs transition-all hover:scale-[1.02] hover:border-primary/50">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Details
          </Button>
        </Link>
        <Link to="/liquidity" className="flex-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" className="w-full gap-1.5 text-xs bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all hover:scale-[1.02]">
            <Droplets className="w-3.5 h-3.5" />
            Add Liquidity
          </Button>
        </Link>
      </div>
    </div>
    </BackgroundGradient>
  );
});
