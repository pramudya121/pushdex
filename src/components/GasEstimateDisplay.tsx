import React from 'react';
import { Fuel, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface GasEstimateDisplayProps {
  estimatedCost: string;
  estimatedCostUSD: number;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  compact?: boolean;
}

export const GasEstimateDisplay: React.FC<GasEstimateDisplayProps> = ({
  estimatedCost,
  estimatedCostUSD,
  isLoading = false,
  error = null,
  className,
  compact = false,
}) => {
  if (error) {
    return (
      <div className={cn("flex items-center gap-2 text-destructive text-sm", className)}>
        <AlertCircle className="w-4 h-4" />
        <span>Gas estimation failed</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground text-sm", className)}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Estimating gas...</span>
      </div>
    );
  }

  const costNum = parseFloat(estimatedCost);
  
  if (costNum === 0) {
    return null;
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center gap-1.5 text-muted-foreground text-xs", className)}>
              <Fuel className="w-3 h-3" />
              <span>~{costNum.toFixed(4)} PC</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div>Estimated Gas: {estimatedCost} PC</div>
              <div>≈ ${estimatedCostUSD.toFixed(4)} USD</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-xl bg-surface border border-border",
      className
    )}>
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Fuel className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Estimated Gas</div>
          <div className="text-sm font-medium">{costNum.toFixed(4)} PC</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs text-muted-foreground">USD Value</div>
        <div className="text-sm font-medium text-primary">
          ${estimatedCostUSD.toFixed(4)}
        </div>
      </div>
    </div>
  );
};
