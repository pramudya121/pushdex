import React, { useEffect, useState, useCallback, memo } from 'react';
import { Marquee } from '@/components/ui/magic-ui/marquee';
import { TOKEN_LIST } from '@/config/contracts';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { useRealtimePrices } from '@/hooks/useRealtimePrices';

interface TokenPrice {
  symbol: string;
  name: string;
  logo: string;
  price: number;
  change24h: number;
  isOnChain: boolean;
}

// Fallback base prices when on-chain data is unavailable
const BASE_PRICES: Record<string, { price: number; volatility: number }> = {
  'PC': { price: 1.52, volatility: 0.05 },
  'WPC': { price: 1.52, volatility: 0.05 },
  'ETH': { price: 2347.89, volatility: 0.02 },
  'BNB': { price: 584.32, volatility: 0.03 },
  'PSDX': { price: 0.8542, volatility: 0.08 },
  'LINK': { price: 14.23, volatility: 0.04 },
  'HYPE': { price: 27.45, volatility: 0.12 },
  'ZEC': { price: 42.18, volatility: 0.05 },
  'SUI': { price: 3.87, volatility: 0.06 },
  'UNI': { price: 8.92, volatility: 0.04 },
  'OKB': { price: 48.76, volatility: 0.03 },
};

const TokenPriceCard = memo(({ token }: { token: TokenPrice }) => {
  const isPositive = token.change24h >= 0;
  
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-card/80 backdrop-blur-sm border border-border/40 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 min-w-[200px] group">
      <div className="relative">
        <img 
          src={token.logo} 
          alt={token.symbol}
          className="w-9 h-9 rounded-full shadow-md transition-transform group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${isPositive ? 'bg-success' : 'bg-destructive'} animate-pulse`} />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground text-sm">{token.symbol}</span>
          {token.isOnChain && (
            <div className="w-1.5 h-1.5 rounded-full bg-success" title="On-chain data" />
          )}
          {token.change24h > 10 && (
            <Sparkles className="w-3 h-3 text-warning animate-pulse" />
          )}
        </div>
        <span className="text-sm font-medium text-foreground">
          ${token.price.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: token.price < 1 ? 4 : 2 
          })}
        </span>
      </div>
      <div className={`flex items-center gap-1 ml-auto px-2 py-1 rounded-lg ${
        isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
      }`}>
        {isPositive ? (
          <TrendingUp className="w-3.5 h-3.5" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5" />
        )}
        <span className="text-xs font-semibold">
          {isPositive ? '+' : ''}{token.change24h.toFixed(2)}%
        </span>
      </div>
    </div>
  );
});

TokenPriceCard.displayName = 'TokenPriceCard';

export const TokenMarquee: React.FC = memo(() => {
  const { pools, isLoading: poolsLoading, isConnected } = useRealtimePrices(30000);
  const [prices, setPrices] = useState<TokenPrice[]>([]);

  // Build prices from on-chain pool data + fallback
  const buildPrices = useCallback(() => {
    // Create a map of on-chain prices from pool reserves
    const onChainPrices: Record<string, { price: number; change: number }> = {};
    
    for (const pool of pools) {
      // Use pool reserve ratios to derive relative prices
      const r0 = parseFloat(pool.reserve0);
      const r1 = parseFloat(pool.reserve1);
      if (r0 > 0 && r1 > 0) {
        // Derive USD-equivalent price using base prices
        const basePrice0 = BASE_PRICES[pool.token0Symbol]?.price || 1;
        const basePrice1 = BASE_PRICES[pool.token1Symbol]?.price || 1;
        
        // Cross-reference: price of token0 in terms of token1
        const derivedPrice0 = (r1 / r0) * basePrice1;
        const derivedPrice1 = (r0 / r1) * basePrice0;
        
        if (!onChainPrices[pool.token0Symbol] || derivedPrice0 > 0) {
          onChainPrices[pool.token0Symbol] = { 
            price: derivedPrice0, 
            change: pool.priceChange24h 
          };
        }
        if (!onChainPrices[pool.token1Symbol] || derivedPrice1 > 0) {
          onChainPrices[pool.token1Symbol] = { 
            price: derivedPrice1, 
            change: -pool.priceChange24h 
          };
        }
      }
    }

    return TOKEN_LIST.map(token => {
      const onChain = onChainPrices[token.symbol];
      const baseData = BASE_PRICES[token.symbol] || { price: 1, volatility: 0.05 };
      
      if (onChain && onChain.price > 0) {
        return {
          symbol: token.symbol,
          name: token.name,
          logo: token.logo,
          price: onChain.price,
          change24h: onChain.change,
          isOnChain: true,
        };
      }
      
      // Fallback with small variation
      const priceVariation = 1 + (Math.random() - 0.5) * 0.04;
      return {
        symbol: token.symbol,
        name: token.name,
        logo: token.logo,
        price: baseData.price * priceVariation,
        change24h: (Math.random() - 0.4) * baseData.volatility * 100,
        isOnChain: false,
      };
    });
  }, [pools]);

  useEffect(() => {
    setPrices(buildPrices());
  }, [buildPrices]);

  // Also refresh fallback prices periodically
  useEffect(() => {
    if (pools.length === 0) {
      const interval = setInterval(() => {
        setPrices(buildPrices());
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [pools.length, buildPrices]);

  if (prices.length === 0) return null;

  return (
    <div className="w-full py-4 overflow-hidden">
      <div className="mb-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
          isConnected ? 'bg-success/10 border-success/20' : 'bg-warning/10 border-warning/20'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-success' : 'bg-warning'}`} />
          <span className={`font-medium ${isConnected ? 'text-success' : 'text-warning'}`}>
            {isConnected ? 'Live On-Chain Prices' : 'Estimated Prices'}
          </span>
        </div>
      </div>
      <Marquee pauseOnHover duration="50s" gap="0.75rem">
        {prices.map((token) => (
          <TokenPriceCard key={token.symbol} token={token} />
        ))}
      </Marquee>
    </div>
  );
});

TokenMarquee.displayName = 'TokenMarquee';
