import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, ShieldX, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SlippageAnalysis } from '@/hooks/useSlippageProtection';

interface SlippageProtectionBadgeProps {
  analysis: SlippageAnalysis | null;
  className?: string;
  showDetails?: boolean;
}

export const SlippageProtectionBadge: React.FC<SlippageProtectionBadgeProps> = ({
  analysis,
  className,
  showDetails = true,
}) => {
  if (!analysis) return null;

  const getRiskIcon = () => {
    switch (analysis.riskLevel) {
      case 'low':
        return <ShieldCheck className="w-4 h-4" />;
      case 'medium':
        return <Shield className="w-4 h-4" />;
      case 'high':
        return <ShieldAlert className="w-4 h-4" />;
      case 'extreme':
        return <ShieldX className="w-4 h-4" />;
    }
  };

  const getRiskColor = () => {
    switch (analysis.riskLevel) {
      case 'low':
        return 'bg-success/20 text-green-500 border-success/30';
      case 'medium':
        return 'bg-warning/20 text-yellow-500 border-warning/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
      case 'extreme':
        return 'bg-destructive/20 text-destructive border-destructive/30';
    }
  };

  const getRiskLabel = () => {
    switch (analysis.riskLevel) {
      case 'low':
        return 'Low Risk';
      case 'medium':
        return 'Medium Risk';
      case 'high':
        return 'High Risk';
      case 'extreme':
        return 'Extreme Risk';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex flex-col gap-2", className)}>
            <Badge 
              variant="outline" 
              className={cn("gap-1.5 px-3 py-1", getRiskColor())}
            >
              {getRiskIcon()}
              <span>{getRiskLabel()}</span>
            </Badge>
            
            {showDetails && analysis.warnings.length > 0 && (
              <div className="space-y-1">
                {analysis.warnings.map((warning, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <AlertTriangle className="w-3 h-3 mt-0.5 text-warning flex-shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px]">
          <div className="space-y-2 text-sm">
            <div className="font-semibold">Risk Analysis</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Price Impact:</div>
              <div className="text-right">{analysis.priceImpact.toFixed(2)}%</div>
              <div>Sandwich Risk:</div>
              <div className="text-right">{analysis.sandwichRisk ? 'Yes' : 'No'}</div>
              <div>Front-run Risk:</div>
              <div className="text-right">{analysis.frontRunRisk ? 'Yes' : 'No'}</div>
              <div>Recommended Slippage:</div>
              <div className="text-right">{analysis.recommendedSlippage}%</div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
