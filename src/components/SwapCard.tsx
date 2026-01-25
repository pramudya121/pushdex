import React, { useState, useEffect, useMemo } from 'react';
import { useSwap } from '@/hooks/useSwap';
import { useWallet } from '@/contexts/WalletContext';
import { useSmartRouter } from '@/hooks/useSmartRouter';
import { useGasEstimation } from '@/hooks/useGasEstimation';
import { useSlippageProtection, SlippageAnalysis } from '@/hooks/useSlippageProtection';
import { TokenSelector } from '@/components/TokenSelector';
import { ImportToken } from '@/components/ImportToken';
import { RouteDisplay } from '@/components/RouteDisplay';
import { GasEstimateDisplay } from '@/components/GasEstimateDisplay';
import { SlippageProtectionBadge } from '@/components/SlippageProtectionBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ArrowDown, Settings, RefreshCw, AlertTriangle, Loader2, Plus, Route, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MovingBorder } from '@/components/ui/aceternity/moving-border';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { ethers } from 'ethers';
import { CONTRACTS } from '@/config/contracts';

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
  const { bestRoute, allRoutes, isSearching, findBestRoute } = useSmartRouter();
  const { gasEstimate, isLoading: gasLoading, error: gasError, estimateSwapGas } = useGasEstimation();
  const { analyzeSlippageRisk, validateSlippage, getRecommendedDeadline } = useSlippageProtection();
  
  const [showSettings, setShowSettings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);
  const [slippageAnalysis, setSlippageAnalysis] = useState<SlippageAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Auto-find best route and estimate gas when inputs change
  useEffect(() => {
    if (amountIn && parseFloat(amountIn) > 0 && tokenIn && tokenOut) {
      const debounceTimer = setTimeout(async () => {
        findBestRoute(tokenIn, tokenOut, amountIn);
        
        // Estimate gas for the swap
        if (isConnected) {
          estimateSwapGas(
            tokenIn.address,
            tokenOut.address,
            ethers.parseUnits(amountIn, tokenIn.decimals)
          );
        }
      }, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [amountIn, tokenIn, tokenOut, findBestRoute, isConnected, estimateSwapGas]);

  // Analyze slippage risk when we have a quote
  useEffect(() => {
    const analyzeRisk = async () => {
      if (amountIn && amountOut && parseFloat(amountIn) > 0 && parseFloat(amountOut) > 0) {
        setIsAnalyzing(true);
        try {
          // Use the factory to get pair address (simplified - in production use proper pair lookup)
          const pairAddress = bestRoute?.path?.[0] || CONTRACTS.FACTORY;
          const analysis = await analyzeSlippageRisk(
            pairAddress,
            ethers.parseUnits(amountIn, tokenIn.decimals),
            ethers.parseUnits(amountOut, tokenOut.decimals)
          );
          setSlippageAnalysis(analysis);
        } catch (error) {
          console.error('Slippage analysis error:', error);
          setSlippageAnalysis(null);
        } finally {
          setIsAnalyzing(false);
        }
      } else {
        setSlippageAnalysis(null);
      }
    };
    
    const timer = setTimeout(analyzeRisk, 500);
    return () => clearTimeout(timer);
  }, [amountIn, amountOut, tokenIn, tokenOut, bestRoute, analyzeSlippageRisk]);

  // Validate current slippage against analysis
  const slippageValidation = useMemo(() => {
    if (!slippageAnalysis) return null;
    return validateSlippage(slippage, slippageAnalysis);
  }, [slippage, slippageAnalysis, validateSlippage]);

  // Get recommended deadline based on risk
  const recommendedDeadline = useMemo(() => {
    if (!slippageAnalysis) return deadline;
    return getRecommendedDeadline(slippageAnalysis.riskLevel);
  }, [slippageAnalysis, deadline, getRecommendedDeadline]);

  const handleMaxClick = () => {
    setAmountIn(balanceIn);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (amountIn && parseFloat(amountIn) > 0) {
      await findBestRoute(tokenIn, tokenOut, amountIn);
    }
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsRefreshing(false);
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

  // Skeleton loading for amounts
  const AmountSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="h-8 w-32 bg-muted/50" />
    </div>
  );

  return (
    <MovingBorder
      duration={3000}
      containerClassName="w-full max-w-md mx-auto rounded-3xl"
      className="bg-card rounded-3xl"
    >
    <div className="p-6 w-full animate-scale-in transition-all duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Swap
        </h2>
        <div className="flex items-center gap-1">
          <ImportToken
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-surface/80 transition-all duration-200 hover:scale-105 active:scale-95"
                title="Import Token"
              >
                <Plus className="w-4 h-4" />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className={cn(
              "text-muted-foreground hover:text-foreground hover:bg-surface/80 transition-all duration-200 hover:scale-105 active:scale-95",
              isRefreshing && "animate-spin"
            )}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Popover open={showSettings} onOpenChange={setShowSettings}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "text-muted-foreground hover:text-foreground hover:bg-surface/80 transition-all duration-200 hover:scale-105 active:scale-95",
                  showSettings && "text-primary bg-surface/80"
                )}
              >
                <Settings className={cn("w-4 h-4 transition-transform duration-300", showSettings && "rotate-90")} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="glass-card w-80 p-4 animate-scale-in" align="end">
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
                          "transition-all duration-200 hover:scale-105 active:scale-95",
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
                        className="w-16 h-8 text-center text-sm bg-surface border-border focus:ring-2 focus:ring-primary/50 transition-all duration-200"
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
                          "transition-all duration-200 hover:scale-105 active:scale-95",
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
                        className="w-16 h-8 text-center text-sm bg-surface border-border focus:ring-2 focus:ring-primary/50 transition-all duration-200"
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
      <div className="token-input mb-2 group hover:border-primary/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">You pay</span>
          <span className="text-sm text-muted-foreground">
            Balance: {parseFloat(balanceIn).toFixed(4)}
            <button
              onClick={handleMaxClick}
              className="ml-2 text-primary hover:text-primary/80 font-medium transition-colors duration-200 hover:underline"
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
            className="border-0 bg-transparent text-2xl font-semibold p-0 h-auto focus-visible:ring-0 transition-all duration-200"
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
          className="p-2.5 rounded-xl bg-surface border border-border hover:border-primary/50 hover:bg-surface-hover transition-all duration-300 group hover:scale-110 active:scale-95 hover:shadow-lg hover:shadow-primary/10"
        >
          <ArrowDown className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:rotate-180" />
        </button>
      </div>

      {/* Token Out */}
      <div className="token-input mt-2 group hover:border-primary/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">You receive</span>
          <span className="text-sm text-muted-foreground">
            Balance: {parseFloat(balanceOut).toFixed(4)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            {isLoading ? (
              <AmountSkeleton />
            ) : (
              <Input
                type="number"
                placeholder="0.0"
                value={amountOut}
                readOnly
                className={cn(
                  "border-0 bg-transparent text-2xl font-semibold p-0 h-auto focus-visible:ring-0 transition-all duration-300",
                  amountOut && "animate-fade-in"
                )}
              />
            )}
          </div>
          <TokenSelector
            selectedToken={tokenOut}
            onSelect={setTokenOut}
            excludeToken={tokenIn}
          />
        </div>
      </div>

      {/* Smart Route Display */}
      {amountIn && parseFloat(amountIn) > 0 && (bestRoute || isSearching) && (
        <div className="mt-4 animate-fade-in">
          {isSearching ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-surface/80 border border-border">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Finding best route...</span>
            </div>
          ) : bestRoute && (
            <Collapsible open={showRoutes} onOpenChange={setShowRoutes}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface/80 border border-border hover:border-primary/30 transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Smart Route</span>
                    {allRoutes.length > 1 && (
                      <span className="text-xs text-muted-foreground">
                        ({allRoutes.length} routes found)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <RouteDisplay 
                      routes={[bestRoute]} 
                      bestRoute={bestRoute} 
                      isCompact={true} 
                    />
                    <ChevronDown className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform duration-200",
                      showRoutes && "rotate-180"
                    )} />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-4 rounded-xl bg-surface/50 border border-border/50">
                  <RouteDisplay 
                    routes={allRoutes} 
                    bestRoute={bestRoute}
                    selectedRoute={bestRoute}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}

      {/* MEV Protection & Gas Estimation */}
      {amountIn && parseFloat(amountIn) > 0 && (
        <div className="mt-4 space-y-3 animate-fade-in">
          {/* Slippage Protection Badge */}
          {(slippageAnalysis || isAnalyzing) && (
            <div className="p-3 rounded-xl bg-surface/80 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">MEV Protection</span>
              </div>
              {isAnalyzing ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing risk...</span>
                </div>
              ) : (
                <SlippageProtectionBadge analysis={slippageAnalysis} showDetails={true} />
              )}
              
              {/* Slippage Validation Warning */}
              {slippageValidation && !slippageValidation.isValid && (
                <div className="mt-2 flex items-center gap-2 text-xs text-warning">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{slippageValidation.message}</span>
                </div>
              )}
              {slippageValidation && slippageValidation.isValid && slippageValidation.message && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {slippageValidation.message}
                </div>
              )}
            </div>
          )}

          {/* Gas Estimation */}
          {isConnected && (
            <GasEstimateDisplay
              estimatedCost={gasEstimate?.estimatedCost || '0'}
              estimatedCostUSD={gasEstimate?.estimatedCostUSD || 0}
              isLoading={gasLoading}
              error={gasError}
            />
          )}
        </div>
      )}

      {/* Price Info */}
      {amountIn && amountOut && !error && (
        <div className="mt-4 space-y-2 animate-fade-in">
          {/* High Price Impact Warning */}
          {(bestRoute?.priceImpact || priceImpact) > 5 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 animate-shake">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-destructive">High Price Impact!</p>
                <p className="text-xs text-destructive/80">This trade will move the price significantly.</p>
              </div>
            </div>
          )}
          
          {(bestRoute?.priceImpact || priceImpact) > 3 && (bestRoute?.priceImpact || priceImpact) <= 5 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 border border-warning/30">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
              <p className="text-xs text-warning">Price impact is high ({(bestRoute?.priceImpact || priceImpact).toFixed(2)}%).</p>
            </div>
          )}
          
          <div className="p-3 rounded-xl bg-surface/80 border border-border space-y-2 backdrop-blur-sm">
            <div className="flex items-center justify-between text-sm group/item hover:bg-surface/50 -mx-2 px-2 py-1 rounded-lg transition-colors duration-200">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-medium">
                1 {tokenIn.symbol} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {tokenOut.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm group/item hover:bg-surface/50 -mx-2 px-2 py-1 rounded-lg transition-colors duration-200">
              <span className="text-muted-foreground">Price Impact</span>
              <span className={cn(
                'font-medium transition-colors duration-200',
                (bestRoute?.priceImpact || priceImpact) <= 1 && 'text-success',
                (bestRoute?.priceImpact || priceImpact) > 1 && (bestRoute?.priceImpact || priceImpact) <= 3 && 'text-foreground',
                (bestRoute?.priceImpact || priceImpact) > 3 && (bestRoute?.priceImpact || priceImpact) <= 5 && 'text-warning',
                (bestRoute?.priceImpact || priceImpact) > 5 && 'text-destructive'
              )}>
                {(bestRoute?.priceImpact || priceImpact) > 0 ? `~${(bestRoute?.priceImpact || priceImpact).toFixed(2)}%` : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm group/item hover:bg-surface/50 -mx-2 px-2 py-1 rounded-lg transition-colors duration-200">
              <span className="text-muted-foreground">Minimum Received</span>
              <span className="font-medium">
                {(parseFloat(amountOut) * (1 - slippage / 100)).toFixed(6)} {tokenOut.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm group/item hover:bg-surface/50 -mx-2 px-2 py-1 rounded-lg transition-colors duration-200">
              <span className="text-muted-foreground">Slippage Tolerance</span>
              <span className="font-medium">{slippage}%</span>
            </div>
            <div className="flex items-center justify-between text-sm group/item hover:bg-surface/50 -mx-2 px-2 py-1 rounded-lg transition-colors duration-200">
              <span className="text-muted-foreground">Trading Fee</span>
              <span className="font-medium">{bestRoute?.fee || 0.3}%</span>
            </div>
            {bestRoute && bestRoute.pathSymbols.length > 2 && (
              <div className="flex items-center justify-between text-sm group/item hover:bg-surface/50 -mx-2 px-2 py-1 rounded-lg transition-colors duration-200">
                <span className="text-muted-foreground">Route Hops</span>
                <span className="font-medium">{bestRoute.pathSymbols.length - 1}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-sm text-destructive animate-shake">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Button */}
      <Button
        className={cn(
          "w-full mt-4 h-14 text-lg font-semibold bg-gradient-pink hover:opacity-90 disabled:opacity-50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary/20",
          (isApproving || isSwapping) && "animate-pulse"
        )}
        disabled={isButtonDisabled()}
        onClick={handleButtonClick}
      >
        {getButtonContent()}
      </Button>
    </div>
    </MovingBorder>
  );
};
