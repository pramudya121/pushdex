import React from 'react';
import { useWebSocket, PriceUpdate } from '@/hooks/useWebSocket';
import { TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LivePriceTickerProps {
  className?: string;
  showStatus?: boolean;
}

export const LivePriceTicker: React.FC<LivePriceTickerProps> = ({
  className,
  showStatus = true,
}) => {
  const { isConnected, lastUpdate, getAllPrices, isLoading } = useWebSocket(5000);
  
  const prices = getAllPrices();
  
  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground text-sm", className)}>
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        <span>Connecting...</span>
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {/* Connection Status */}
      {showStatus && (
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
              </div>
              <Wifi className="w-4 h-4 text-green-500" />
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <WifiOff className="w-4 h-4 text-red-500" />
            </>
          )}
          <span className="text-xs text-muted-foreground">
            {formatTime(lastUpdate)}
          </span>
        </div>
      )}

      {/* Price Ticker */}
      <div className="flex-1 overflow-hidden">
        <div className="flex gap-6 animate-marquee">
          {prices.slice(0, 8).map((price: PriceUpdate) => (
            <div
              key={price.pairAddress}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <span className="text-sm font-medium">
                {price.token0Symbol}/{price.token1Symbol}
              </span>
              <span className="text-sm text-foreground">
                {price.price > 0.0001 ? price.price.toFixed(4) : price.price.toExponential(2)}
              </span>
              <span
                className={cn(
                  "flex items-center gap-0.5 text-xs",
                  price.priceChange >= 0 ? "text-green-500" : "text-red-500"
                )}
              >
                {price.priceChange >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(price.priceChange).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
