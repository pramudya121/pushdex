import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Droplets, TrendingUp, ExternalLink } from 'lucide-react';
import { getTokenByAddress } from '@/lib/dex';

interface PoolCardProps {
  pairAddress: string;
  token0: string;
  token1: string;
  token0Symbol: string;
  token1Symbol: string;
  reserve0: string;
  reserve1: string;
  tvl: number;
  onSelect?: () => void;
  isSelected?: boolean;
}

export const PoolCard: React.FC<PoolCardProps> = ({
  pairAddress,
  token0,
  token1,
  token0Symbol,
  token1Symbol,
  reserve0,
  reserve1,
  tvl,
  onSelect,
  isSelected,
}) => {
  const token0Info = getTokenByAddress(token0);
  const token1Info = getTokenByAddress(token1);
  
  // Calculate mock 24h stats
  const volume24h = tvl * (0.05 + Math.random() * 0.15);
  const fees24h = volume24h * 0.003;
  const apy = ((fees24h * 365) / tvl) * 100;

  return (
    <div
      className={`glass-card-hover p-5 cursor-pointer transition-all duration-300 ${
        isSelected ? 'border-primary/50 shadow-[var(--shadow-glow)]' : ''
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3">
            {token0Info?.logo ? (
              <img 
                src={token0Info.logo} 
                alt={token0Symbol} 
                className="w-10 h-10 rounded-full border-2 border-background shadow-lg" 
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
                className="w-10 h-10 rounded-full border-2 border-background shadow-lg" 
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
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-[hsl(var(--success))]">Active</span>
            </div>
          </div>
        </div>
        
        <a
          href={`https://donut.push.network/address/${pairAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
        >
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </a>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-secondary/30 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
            <Droplets className="w-3.5 h-3.5" />
            TVL
          </div>
          <div className="font-bold text-lg">${tvl.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-secondary/30 rounded-xl p-3">
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
              <img src={token0Info.logo} alt={token0Symbol} className="w-5 h-5 rounded-full" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                {token0Symbol.charAt(0)}
              </div>
            )}
            <span className="text-muted-foreground">{token0Symbol}</span>
          </div>
          <span className="font-medium">{parseFloat(reserve0).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {token1Info?.logo ? (
              <img src={token1Info.logo} alt={token1Symbol} className="w-5 h-5 rounded-full" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                {token1Symbol.charAt(0)}
              </div>
            )}
            <span className="text-muted-foreground">{token1Symbol}</span>
          </div>
          <span className="font-medium">{parseFloat(reserve1).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
        </div>
      </div>
      
      {/* 24h Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
        <div>
          24h Volume: <span className="text-foreground font-medium">${volume24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
        <div>
          24h Fees: <span className="text-foreground font-medium">${fees24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <Link to={`/pools/${pairAddress}`} className="flex-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Details
          </Button>
        </Link>
        <Link to="/liquidity" className="flex-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" className="w-full gap-1.5 text-xs bg-gradient-to-r from-primary to-accent hover:opacity-90">
            <Droplets className="w-3.5 h-3.5" />
            Add Liquidity
          </Button>
        </Link>
      </div>
    </div>
  );
};
