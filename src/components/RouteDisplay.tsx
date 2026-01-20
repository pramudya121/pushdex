import React from 'react';
import { Route } from '@/hooks/useSmartRouter';
import { TOKEN_LIST } from '@/config/contracts';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Zap, TrendingUp, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RouteDisplayProps {
  routes: Route[];
  bestRoute: Route | null;
  selectedRoute?: Route | null;
  onSelectRoute?: (route: Route) => void;
  isCompact?: boolean;
}

export const RouteDisplay: React.FC<RouteDisplayProps> = ({
  routes,
  bestRoute,
  selectedRoute,
  onSelectRoute,
  isCompact = false,
}) => {
  if (routes.length === 0) {
    return null;
  }

  const getTokenLogo = (symbol: string) => {
    const token = TOKEN_LIST.find(t => t.symbol === symbol);
    return token?.logo;
  };

  if (isCompact && bestRoute) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-surface/50 border border-border/50">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground">Best Route:</span>
        <div className="flex items-center gap-1">
          {bestRoute.pathSymbols.map((symbol, index) => (
            <React.Fragment key={`${symbol}-${index}`}>
              <div className="flex items-center gap-1">
                {getTokenLogo(symbol) && (
                  <img src={getTokenLogo(symbol)} alt={symbol} className="w-4 h-4 rounded-full" />
                )}
                <span className="text-xs font-medium">{symbol}</span>
              </div>
              {index < bestRoute.pathSymbols.length - 1 && (
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
              )}
            </React.Fragment>
          ))}
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 ml-auto">
          {bestRoute.fee}% fee
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Available Routes</span>
        <Badge variant="secondary" className="text-xs">
          {routes.length} found
        </Badge>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {routes.map((route, index) => {
          const isBest = bestRoute && route.path.join('') === bestRoute.path.join('');
          const isSelected = selectedRoute && route.path.join('') === selectedRoute.path.join('');

          return (
            <button
              key={route.path.join('-')}
              onClick={() => onSelectRoute?.(route)}
              className={cn(
                "w-full p-3 rounded-xl border transition-all duration-200 text-left",
                isBest && "border-primary/50 bg-primary/5",
                isSelected && "border-primary ring-2 ring-primary/20",
                !isBest && !isSelected && "border-border/50 bg-surface/30 hover:border-border"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isBest && (
                    <Badge className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 gap-1">
                      <Zap className="w-3 h-3" />
                      Best
                    </Badge>
                  )}
                  {isSelected && !isBest && (
                    <CheckCircle className="w-4 h-4 text-primary" />
                  )}
                </div>
                <span className="text-lg font-bold">
                  {parseFloat(route.amountOutFormatted).toFixed(6)}
                </span>
              </div>

              <div className="flex items-center gap-1 mb-2">
                {route.pathSymbols.map((symbol, i) => (
                  <React.Fragment key={`${symbol}-${i}`}>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/50">
                      {getTokenLogo(symbol) && (
                        <img src={getTokenLogo(symbol)} alt={symbol} className="w-4 h-4 rounded-full" />
                      )}
                      <span className="text-xs font-medium">{symbol}</span>
                    </div>
                    {i < route.pathSymbols.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {route.pathSymbols.length - 1} hop{route.pathSymbols.length > 2 ? 's' : ''}
                </span>
                <span>Fee: {route.fee}%</span>
                <span className={cn(
                  route.priceImpact > 3 ? 'text-destructive' : 'text-muted-foreground'
                )}>
                  Impact: {route.priceImpact.toFixed(2)}%
                </span>
                <span>~{(route.gasEstimate / 1000).toFixed(0)}k gas</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
