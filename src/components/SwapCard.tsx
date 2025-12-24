import React, { useState } from 'react';
import { useSwap } from '@/hooks/useSwap';
import { useWallet } from '@/contexts/WalletContext';
import { TokenSelector } from '@/components/TokenSelector';
import { ImportToken } from '@/components/ImportToken';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ArrowDown, Settings, RefreshCw, AlertTriangle, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SwapCard: React.FC = () => {
  const {
    tokenIn,
    tokenOut,
    amountIn,
    amountOut,
    slippage,
    deadline,
    isLoading,
    isApproving,
    isSwapping,
    priceImpact,
    needsApproval,
    balanceIn,
    balanceOut,
    error,
    setAmountIn,
    setTokenIn,
    setTokenOut,
    setSlippage,
    setDeadline,
    swapTokens,
    approve,
    swap,
    isConnected,
    isCorrectNetwork,
  } = useSwap();

  const { switchNetwork } = useWallet();
  const [showSettings, setShowSettings] = useState(false);

  const handleMaxClick = () => {
    setAmountIn(balanceIn);
  };

  const getButtonContent = () => {
    if (!isConnected) {
      return 'Connect Wallet';
    }
    if (!isCorrectNetwork) {
      return 'Switch to Push Testnet';
    }
    if (!amountIn || parseFloat(amountIn) === 0) {
      return 'Enter an amount';
    }
    if (parseFloat(amountIn) > parseFloat(balanceIn)) {
      return 'Insufficient balance';
    }
    if (error) {
      return error;
    }
    if (isApproving) {
      return (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Approving...
        </span>
      );
    }
    if (needsApproval) {
      return `Approve ${tokenIn.symbol}`;
    }
    if (isSwapping) {
      return (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Swapping...
        </span>
      );
    }
    return 'Swap';
  };

  const isButtonDisabled = () => {
    if (!isConnected) return false;
    if (!isCorrectNetwork) return false;
    if (!amountIn || parseFloat(amountIn) === 0) return true;
    if (parseFloat(amountIn) > parseFloat(balanceIn)) return true;
    if (error) return true;
    if (isApproving || isSwapping) return true;
    return false;
  };

  const handleButtonClick = async () => {
    if (!isConnected) {
      // Will trigger wallet modal
      return;
    }
    if (!isCorrectNetwork) {
      await switchNetwork();
      return;
    }
    if (needsApproval) {
      await approve();
      return;
    }
    await swap();
  };

  return (
    <div className="glass-card p-6 w-full max-w-md mx-auto animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Swap</h2>
        <div className="flex items-center gap-2">
          <ImportToken
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                title="Import Token"
              >
                <Plus className="w-4 h-4" />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {}}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Popover open={showSettings} onOpenChange={setShowSettings}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="glass-card w-80 p-4" align="end">
              <div className="space-y-6">
                <h3 className="font-semibold">Transaction Settings</h3>
                
                {/* Slippage Settings */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Slippage Tolerance</span>
                    <span className="text-sm font-medium">{slippage}%</span>
                  </div>
                  <div className="flex gap-2">
                    {[0.1, 0.5, 1.0].map((value) => (
                      <Button
                        key={value}
                        variant={slippage === value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSlippage(value)}
                        className={cn(
                          slippage === value && 'bg-gradient-pink'
                        )}
                      >
                        {value}%
                      </Button>
                    ))}
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={slippage}
                        onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                        className="w-16 h-8 text-center text-sm bg-surface border-border"
                        min={0.1}
                        max={50}
                        step={0.1}
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <Slider
                    value={[slippage]}
                    onValueChange={([v]) => setSlippage(v)}
                    min={0.1}
                    max={5}
                    step={0.1}
                    className="mt-2"
                  />
                </div>

                {/* Deadline Settings */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Transaction Deadline</span>
                    <span className="text-sm font-medium">{deadline} min</span>
                  </div>
                  <div className="flex gap-2">
                    {[10, 20, 30].map((value) => (
                      <Button
                        key={value}
                        variant={deadline === value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDeadline(value)}
                        className={cn(
                          deadline === value && 'bg-gradient-pink'
                        )}
                      >
                        {value}m
                      </Button>
                    ))}
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={deadline}
                        onChange={(e) => setDeadline(parseInt(e.target.value) || 20)}
                        className="w-16 h-8 text-center text-sm bg-surface border-border"
                        min={1}
                        max={120}
                      />
                      <span className="text-sm text-muted-foreground">min</span>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Token In */}
      <div className="token-input mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">You pay</span>
          <span className="text-sm text-muted-foreground">
            Balance: {parseFloat(balanceIn).toFixed(4)}
            <button
              onClick={handleMaxClick}
              className="ml-2 text-primary hover:text-primary/80 font-medium"
            >
              MAX
            </button>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            placeholder="0.0"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            className="border-0 bg-transparent text-2xl font-semibold p-0 h-auto focus-visible:ring-0"
          />
          <TokenSelector
            selectedToken={tokenIn}
            onSelect={setTokenIn}
            excludeToken={tokenOut}
          />
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center -my-1 relative z-10">
        <button
          onClick={swapTokens}
          className="p-2 rounded-xl bg-surface border border-border hover:border-primary/50 hover:bg-surface-hover transition-all duration-200 group"
        >
          <ArrowDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      </div>

      {/* Token Out */}
      <div className="token-input mt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">You receive</span>
          <span className="text-sm text-muted-foreground">
            Balance: {parseFloat(balanceOut).toFixed(4)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Input
              type="number"
              placeholder="0.0"
              value={amountOut}
              readOnly
              className="border-0 bg-transparent text-2xl font-semibold p-0 h-auto focus-visible:ring-0"
            />
            {isLoading && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            )}
          </div>
          <TokenSelector
            selectedToken={tokenOut}
            onSelect={setTokenOut}
            excludeToken={tokenIn}
          />
        </div>
      </div>

      {/* Price Info */}
      {amountIn && amountOut && !error && (
        <div className="mt-4 space-y-2">
          {/* High Price Impact Warning */}
          {priceImpact > 5 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-destructive">High Price Impact!</p>
                <p className="text-xs text-destructive/80">This trade will move the price significantly. Consider trading a smaller amount.</p>
              </div>
            </div>
          )}
          
          {priceImpact > 3 && priceImpact <= 5 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 border border-warning/30">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
              <p className="text-xs text-warning">Price impact is high ({priceImpact.toFixed(2)}%). Proceed with caution.</p>
            </div>
          )}
          
          <div className="p-3 rounded-xl bg-surface border border-border space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rate</span>
              <span>
                1 {tokenIn.symbol} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {tokenOut.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Price Impact</span>
              <span className={cn(
                'font-medium',
                priceImpact <= 1 && 'text-success',
                priceImpact > 1 && priceImpact <= 3 && 'text-foreground',
                priceImpact > 3 && priceImpact <= 5 && 'text-warning',
                priceImpact > 5 && 'text-destructive'
              )}>
                {priceImpact > 0 ? `~${priceImpact.toFixed(2)}%` : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Minimum Received</span>
              <span>
                {(parseFloat(amountOut) * (1 - slippage / 100)).toFixed(6)} {tokenOut.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Slippage Tolerance</span>
              <span>{slippage}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Trading Fee</span>
              <span>0.3%</span>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Button */}
      <Button
        className="w-full mt-4 h-14 text-lg font-semibold bg-gradient-pink hover:opacity-90 disabled:opacity-50"
        disabled={isButtonDisabled()}
        onClick={handleButtonClick}
      >
        {getButtonContent()}
      </Button>
    </div>
  );
};
