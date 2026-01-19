import React, { useEffect, useState, memo } from 'react';
import { Marquee } from '@/components/ui/magic-ui/marquee';
import { TOKEN_LIST } from '@/config/contracts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TokenPrice {
  symbol: string;
  name: string;
  logo: string;
  price: number;
  change24h: number;
}

// Simulated prices for demo - in production would fetch from API
const generateMockPrices = (): TokenPrice[] => {
  return TOKEN_LIST.map(token => ({
    symbol: token.symbol,
    name: token.name,
    logo: token.logo,
    price: Math.random() * 1000 + 0.1,
    change24h: (Math.random() - 0.5) * 20,
  }));
};

const TokenPriceCard = memo(({ token }: { token: TokenPrice }) => {
  const isPositive = token.change24h >= 0;
  
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card/60 backdrop-blur-sm border border-border/30 hover:border-primary/40 transition-all duration-300 min-w-[180px]">
      <img 
        src={token.logo} 
        alt={token.symbol}
        className="w-8 h-8 rounded-full"
        onError={(e) => {
          e.currentTarget.src = '/placeholder.svg';
        }}
      />
      <div className="flex flex-col">
        <span className="font-semibold text-foreground text-sm">{token.symbol}</span>
        <span className="text-xs text-muted-foreground">${token.price.toFixed(2)}</span>
      </div>
      <div className={`flex items-center gap-1 ml-auto ${isPositive ? 'text-success' : 'text-destructive'}`}>
        {isPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        <span className="text-xs font-medium">
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
    setPrices(generateMockPrices());
    
    // Update prices every 30 seconds
    const interval = setInterval(() => {
      setPrices(generateMockPrices());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (prices.length === 0) return null;

  return (
    <div className="w-full py-4 overflow-hidden">
      <div className="mb-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <span>Live Token Prices</span>
      </div>
      <Marquee pauseOnHover duration="60s" gap="1rem">
        {prices.map((token) => (
          <TokenPriceCard key={token.symbol} token={token} />
        ))}
      </Marquee>
    </div>
  );
});

TokenMarquee.displayName = 'TokenMarquee';
