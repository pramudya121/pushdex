import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Radio } from 'lucide-react';

interface LivePriceIndicatorProps {
  price: number;
  priceChange: number;
  showTrend?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LivePriceIndicator: React.FC<LivePriceIndicatorProps> = ({
  price,
  priceChange,
  showTrend = true,
  className,
  size = 'md',
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [prevPrice, setPrevPrice] = useState(price);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (price !== prevPrice) {
      setIsUpdating(true);
      setFlash(price > prevPrice ? 'up' : 'down');
      
      const timer = setTimeout(() => {
        setIsUpdating(false);
        setFlash(null);
        setPrevPrice(price);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [price, prevPrice]);

  const isPositive = priceChange >= 0;
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Live Indicator */}
      <div className="flex items-center gap-1">
        <Radio className={cn(
          "w-3 h-3 transition-colors",
          isUpdating ? "text-primary animate-pulse" : "text-green-500"
        )} />
        <span className="text-[10px] text-muted-foreground uppercase font-medium">Live</span>
      </div>

      {/* Price */}
      <span className={cn(
        sizeClasses[size],
        "font-bold tabular-nums transition-all duration-300",
        flash === 'up' && "text-[hsl(var(--success))] animate-pulse",
        flash === 'down' && "text-destructive animate-pulse",
        !flash && "text-foreground"
      )}>
        ${price.toLocaleString(undefined, { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        })}
      </span>

      {/* Trend */}
      {showTrend && (
        <div className={cn(
          "flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-medium transition-colors",
          isPositive 
            ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" 
            : "bg-destructive/10 text-destructive"
        )}>
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span className="tabular-nums">
            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );
};

// Pulsing dot component for connection status
export const PulseDot: React.FC<{ connected: boolean; className?: string }> = ({ 
  connected, 
  className 
}) => (
  <div className={cn("relative flex items-center justify-center", className)}>
    <span className={cn(
      "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
      connected ? "bg-green-400" : "bg-red-400"
    )} />
    <span className={cn(
      "relative inline-flex rounded-full h-2 w-2",
      connected ? "bg-green-500" : "bg-red-500"
    )} />
  </div>
);
