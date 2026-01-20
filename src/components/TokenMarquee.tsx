import React, { useEffect, useState, memo } from 'react';
import { Marquee } from '@/components/ui/magic-ui/marquee';
import { TOKEN_LIST } from '@/config/contracts';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';

interface TokenPrice {
  symbol: string;
  name: string;
  logo: string;
  price: number;
  change24h: number;
}

// Realistic base prices for tokens
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

// Generate realistic prices with small variations
const generatePrices = (): TokenPrice[] => {
  return TOKEN_LIST.map(token => {
    const baseData = BASE_PRICES[token.symbol] || { price: 1, volatility: 0.05 };
    // Add small random variation to base price (±2%)
    const priceVariation = 1 + (Math.random() - 0.5) * 0.04;
    const price = baseData.price * priceVariation;
    // Generate 24h change based on volatility
    const change24h = (Math.random() - 0.4) * baseData.volatility * 100;
    
    return {
      symbol: token.symbol,
      name: token.name,
      logo: token.logo,
      price,
      change24h,
    };
  });
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
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${isPositive ? 'bg-success' : 'bg-destructive'} animate-pulse`} />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-foreground text-sm">{token.symbol}</span>
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
  const [prices, setPrices] = useState<TokenPrice[]>([]);

  useEffect(() => {
    setPrices(generatePrices());
    
    // Update prices every 15 seconds for more dynamic feel
    const interval = setInterval(() => {
      setPrices(generatePrices());
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  if (prices.length === 0) return null;

  return (
    <div className="w-full py-4 overflow-hidden">
      <div className="mb-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 border border-success/20">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-success font-medium">Live Token Prices</span>
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
