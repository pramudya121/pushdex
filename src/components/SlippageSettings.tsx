import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Settings, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SlippageSettingsProps {
  slippage: number;
  deadline: number;
  onSlippageChange: (value: number) => void;
  onDeadlineChange: (value: number) => void;
}

const SLIPPAGE_PRESETS = [0.1, 0.5, 1.0, 3.0];
const DEADLINE_PRESETS = [10, 20, 30, 60];

export const SlippageSettings: React.FC<SlippageSettingsProps> = ({
  slippage,
  deadline,
  onSlippageChange,
  onDeadlineChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customSlippage, setCustomSlippage] = useState('');
  const [customDeadline, setCustomDeadline] = useState('');

  const isHighSlippage = slippage > 3;
  const isLowSlippage = slippage < 0.1;
  const isCustomSlippage = !SLIPPAGE_PRESETS.includes(slippage);
  const isCustomDeadline = !DEADLINE_PRESETS.includes(deadline);

  const handleCustomSlippage = (value: string) => {
    setCustomSlippage(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0.01 && parsed <= 50) {
      onSlippageChange(parsed);
    }
  };

  const handleCustomDeadline = (value: string) => {
    setCustomDeadline(value);
    const parsed = parseInt(value);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 180) {
      onDeadlineChange(parsed);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "text-muted-foreground hover:text-foreground transition-all duration-200",
            (isHighSlippage || isLowSlippage) && "text-warning"
          )}
        >
          <Settings className={cn("w-4 h-4 transition-transform duration-300", isOpen && "rotate-90")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="glass-card w-80 p-5 animate-scale-in" align="end">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Transaction Settings</h3>
          </div>
          
          {/* Slippage Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">Slippage Tolerance</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px]">
                      <p className="text-xs">Your transaction will revert if the price changes unfavorably by more than this percentage.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className={cn(
                "text-sm font-semibold px-2 py-0.5 rounded-md transition-colors",
                isHighSlippage ? "bg-warning/20 text-warning" : 
                isLowSlippage ? "bg-destructive/20 text-destructive" : 
                "bg-primary/20 text-primary"
              )}>
                {slippage}%
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {SLIPPAGE_PRESETS.map((value) => (
                <Button
                  key={value}
                  variant={slippage === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    onSlippageChange(value);
                    setCustomSlippage('');
                  }}
                  className={cn(
                    "flex-1 min-w-[60px] transition-all duration-200",
                    slippage === value && "bg-gradient-pink shadow-lg shadow-primary/20"
                  )}
                >
                  {value}%
                </Button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Custom:</span>
              <div className="flex-1 relative">
                <Input
                  type="number"
                  placeholder="0.5"
                  value={customSlippage || (isCustomSlippage ? slippage : '')}
                  onChange={(e) => handleCustomSlippage(e.target.value)}
                  className={cn(
                    "h-9 text-center text-sm bg-surface border-border pr-8 transition-all duration-200",
                    isCustomSlippage && "border-primary ring-1 ring-primary/30"
                  )}
                  min={0.01}
                  max={50}
                  step={0.01}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
            
            <Slider
              value={[slippage]}
              onValueChange={([v]) => {
                onSlippageChange(Math.round(v * 100) / 100);
                setCustomSlippage('');
              }}
              min={0.1}
              max={10}
              step={0.1}
              className="mt-1"
            />
            
            {/* Warnings */}
            {isHighSlippage && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 border border-warning/30 animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                <span className="text-xs text-warning">High slippage may result in unfavorable rates</span>
              </div>
            )}
            {isLowSlippage && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30 animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                <span className="text-xs text-destructive">Transaction may fail with low slippage</span>
              </div>
            )}
          </div>

          <div className="h-px bg-border" />

          {/* Deadline Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">Transaction Deadline</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px]">
                      <p className="text-xs">Your transaction will revert if it is pending for more than this period of time.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm font-semibold px-2 py-0.5 rounded-md bg-primary/20 text-primary">
                {deadline} min
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {DEADLINE_PRESETS.map((value) => (
                <Button
                  key={value}
                  variant={deadline === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    onDeadlineChange(value);
                    setCustomDeadline('');
                  }}
                  className={cn(
                    "flex-1 min-w-[50px] transition-all duration-200",
                    deadline === value && "bg-gradient-pink shadow-lg shadow-primary/20"
                  )}
                >
                  {value}m
                </Button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Custom:</span>
              <div className="flex-1 relative">
                <Input
                  type="number"
                  placeholder="20"
                  value={customDeadline || (isCustomDeadline ? deadline : '')}
                  onChange={(e) => handleCustomDeadline(e.target.value)}
                  className={cn(
                    "h-9 text-center text-sm bg-surface border-border pr-10 transition-all duration-200",
                    isCustomDeadline && "border-primary ring-1 ring-primary/30"
                  )}
                  min={1}
                  max={180}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">min</span>
              </div>
            </div>
          </div>

          {/* Auto Settings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSlippageChange(0.5);
              onDeadlineChange(20);
              setCustomSlippage('');
              setCustomDeadline('');
            }}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Reset to Default
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
