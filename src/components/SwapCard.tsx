import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useSwap } from '@/hooks/useSwap';
import { useWallet } from '@/contexts/WalletContext';
import { useSmartRouter } from '@/hooks/useSmartRouter';
import { useGasEstimation } from '@/hooks/useGasEstimation';
import { markActionVerified } from '@/lib/airdropTracker';
import { useSlippageProtection, SlippageAnalysis } from '@/hooks/useSlippageProtection';
import { TokenSelector } from '@/components/TokenSelector';
import { ImportToken } from '@/components/ImportToken';
import { RouteDisplay } from '@/components/RouteDisplay';
import { GasEstimateDisplay } from '@/components/GasEstimateDisplay';
import { SlippageProtectionBadge } from '@/components/SlippageProtectionBadge';
import { TransactionConfirmModal, TransactionStatus } from '@/components/TransactionConfirmModal';
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
import { motion, AnimatePresence } from 'framer-motion';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { ethers } from 'ethers';
import { CONTRACTS, TOKENS } from '@/config/contracts';
import { useWETH } from '@/hooks/useWETH';

// Percentage quick-select buttons
const PERCENT_OPTIONS = [25, 50, 75, 100] as const;

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

  const { switchNetwork, address } = useWallet();
  const { wrap, unwrap, isWrapping, isUnwrapping } = useWETH();
  const { bestRoute, allRoutes, isSearching, findBestRoute } = useSmartRouter();

  // Detect wrap/unwrap mode
  const isWrapMode = tokenIn.address === ethers.ZeroAddress && tokenOut.address === CONTRACTS.WETH;
  const isUnwrapMode = tokenIn.address === CONTRACTS.WETH && tokenOut.address === ethers.ZeroAddress;
  const isWrapUnwrap = isWrapMode || isUnwrapMode;
  const { gasEstimate, isLoading: gasLoading, error: gasError, estimateSwapGas } = useGasEstimation();
  const { analyzeSlippageRisk, validateSlippage, getRecommendedDeadline } = useSlippageProtection();

  const [showSettings, setShowSettings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);
  const [slippageAnalysis, setSlippageAnalysis] = useState<SlippageAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [swapDirection, setSwapDirection] = useState(0); // rotation counter for flip animation

  // Transaction confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>('preview');
  const [txHash, setTxHash] = useState<string | undefined>();
  const [txError, setTxError] = useState<string | undefined>();

  // Auto-find best route
  useEffect(() => {
    if (amountIn && parseFloat(amountIn) > 0 && tokenIn && tokenOut) {
      const debounceTimer = setTimeout(async () => {
        findBestRoute(tokenIn, tokenOut, amountIn);
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

  // Analyze slippage risk
  useEffect(() => {
    const analyzeRisk = async () => {
      if (amountIn && amountOut && parseFloat(amountIn) > 0 && parseFloat(amountOut) > 0) {
        setIsAnalyzing(true);
        try {
          const pairAddress = bestRoute?.path?.[0] || CONTRACTS.FACTORY;
          const analysis = await analyzeSlippageRisk(
            pairAddress,
            ethers.parseUnits(amountIn, tokenIn.decimals),
            ethers.parseUnits(amountOut, tokenOut.decimals)
          );
          setSlippageAnalysis(analysis);
        } catch {
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

  const slippageValidation = useMemo(() => {
    if (!slippageAnalysis) return null;
    return validateSlippage(slippage, slippageAnalysis);
  }, [slippage, slippageAnalysis, validateSlippage]);

  const recommendedDeadline = useMemo(() => {
    if (!slippageAnalysis) return deadline;
    return getRecommendedDeadline(slippageAnalysis.riskLevel);
  }, [slippageAnalysis, deadline, getRecommendedDeadline]);

  const handlePercentClick = (percent: number) => {
    const bal = parseFloat(balanceIn);
    if (bal <= 0) return;
    const amount = (bal * percent / 100).toString();
    setAmountIn(amount);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (amountIn && parseFloat(amountIn) > 0) {
      await findBestRoute(tokenIn, tokenOut, amountIn);
    }
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsRefreshing(false);
  };

  const handleSwapTokens = () => {
    setSwapDirection(prev => prev + 1);
    swapTokens();
  };

  const getButtonContent = () => {
    if (!isConnected) return 'Connect Wallet';
    if (!isCorrectNetwork) return 'Switch to Push Testnet';
    if (!amountIn || parseFloat(amountIn) === 0) return 'Enter an amount';
    if (parseFloat(amountIn) > parseFloat(balanceIn)) return 'Insufficient balance';
    if (error && !isWrapUnwrap) return error;
    if (isApproving) return (
      <span className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Approving...
      </span>
    );
    if (!isWrapUnwrap && needsApproval) return `Approve ${tokenIn.symbol}`;
    if (isWrapping) return (
      <span className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Wrapping...
      </span>
    );
    if (isUnwrapping) return (
      <span className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Unwrapping...
      </span>
    );
    if (isSwapping) return (
      <span className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Swapping...
      </span>
    );
    if (isWrapMode) return `Wrap ${tokenIn.symbol} → ${tokenOut.symbol}`;
    if (isUnwrapMode) return `Unwrap ${tokenIn.symbol} → ${tokenOut.symbol}`;
    return 'Swap';
  };

  const isButtonDisabled = () => {
    if (!isConnected) return false;
    if (!isCorrectNetwork) return false;
    if (!amountIn || parseFloat(amountIn) === 0) return true;
    if (parseFloat(amountIn) > parseFloat(balanceIn)) return true;
    if (isWrapUnwrap) return isWrapping || isUnwrapping;
    if (error) return true;
    if (isApproving || isSwapping) return true;
    return false;
  };

  const handleButtonClick = async () => {
    if (!isConnected) return;
    if (!isCorrectNetwork) { await switchNetwork(); return; }
    if (isWrapMode) { await wrap(amountIn); return; }
    if (isUnwrapMode) { await unwrap(amountIn); return; }
    if (needsApproval) { await approve(); return; }
    setTxStatus('preview');
    setTxHash(undefined);
    setTxError(undefined);
    setShowConfirmModal(true);
  };

  const handleConfirmSwap = useCallback(async () => {
    setTxStatus('confirming');
    try {
      setTxStatus('pending');
      const receipt = await swap();
      setTxStatus('success');
      if (address && receipt?.hash) {
        markActionVerified(address, 'swap', receipt.hash);
      }
    } catch (err: any) {
      setTxStatus('error');
      setTxError(err.reason || err.message || 'Transaction failed');
    }
  }, [swap, address]);

  const handleCancelSwap = useCallback(() => {
    setShowConfirmModal(false);
    setTxStatus('preview');
  }, []);

  const hasValidOutput = amountIn && amountOut && parseFloat(amountIn) > 0 && parseFloat(amountOut) > 0;
  const effectivePriceImpact = bestRoute?.priceImpact || priceImpact;

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md mx-auto"
    >
      <div className="relative rounded-3xl bg-card/90 backdrop-blur-xl border border-border/60 shadow-[var(--shadow-card)] overflow-hidden">
        {/* Subtle glow accent at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-foreground">Swap</h2>
            <div className="flex items-center gap-0.5">
              <ImportToken
                onTokenImported={(token) => {
                  toast.success(`${token.symbol} imported!`);
                }}
                trigger={
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors" title="Import Token">
                    <Plus className="w-4 h-4" />
                  </Button>
                }
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className={cn("w-4 h-4 transition-transform duration-500", isRefreshing && "animate-spin")} />
              </Button>
              <Popover open={showSettings} onOpenChange={setShowSettings}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className={cn("h-8 w-8 text-muted-foreground hover:text-foreground transition-colors", showSettings && "text-primary")}>
                    <Settings className={cn("w-4 h-4 transition-transform duration-300", showSettings && "rotate-90")} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="glass-card w-80 p-4" align="end">
                  <div className="space-y-5">
                    <h3 className="font-semibold text-sm">Settings</h3>
                    {/* Slippage */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Slippage</span>
                        <span className="text-xs font-medium text-foreground">{slippage}%</span>
                      </div>
                      <div className="flex gap-1.5">
                        {[0.1, 0.5, 1.0].map((value) => (
                          <Button
                            key={value}
                            variant={slippage === value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSlippage(value)}
                            className={cn("h-7 text-xs px-3 transition-all", slippage === value && 'bg-gradient-pink')}
                          >
                            {value}%
                          </Button>
                        ))}
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={slippage}
                            onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                            className="w-14 h-7 text-center text-xs bg-surface border-border"
                            min={0.1} max={50} step={0.1}
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      </div>
                      <Slider value={[slippage]} onValueChange={([v]) => setSlippage(v)} min={0.1} max={5} step={0.1} />
                    </div>
                    {/* Deadline */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Deadline</span>
                        <span className="text-xs font-medium text-foreground">{deadline} min</span>
                      </div>
                      <div className="flex gap-1.5">
                        {[10, 20, 30].map((value) => (
                          <Button
                            key={value}
                            variant={deadline === value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDeadline(value)}
                            className={cn("h-7 text-xs px-3 transition-all", deadline === value && 'bg-gradient-pink')}
                          >
                            {value}m
                          </Button>
                        ))}
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={deadline}
                            onChange={(e) => setDeadline(parseInt(e.target.value) || 20)}
                            className="w-14 h-7 text-center text-xs bg-surface border-border"
                            min={1} max={120}
                          />
                          <span className="text-xs text-muted-foreground">min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Token In Panel */}
          <div className="rounded-2xl bg-surface/80 border border-border/50 p-4 transition-all duration-300 focus-within:border-primary/40 focus-within:bg-surface hover:border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">You pay</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">
                  {parseFloat(balanceIn).toFixed(4)}
                </span>
                {/* Quick percentage buttons */}
                <div className="flex gap-0.5">
                  {PERCENT_OPTIONS.map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePercentClick(p)}
                      className="text-[10px] font-semibold text-primary/70 hover:text-primary px-1.5 py-0.5 rounded-md hover:bg-primary/10 transition-colors"
                    >
                      {p === 100 ? 'MAX' : `${p}%`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="0.0"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                className="flex-1 bg-transparent text-2xl font-semibold text-foreground placeholder:text-muted-foreground/40 outline-none min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <TokenSelector selectedToken={tokenIn} onSelect={setTokenIn} excludeToken={tokenOut} />
            </div>
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <motion.button
              onClick={handleSwapTokens}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-xl bg-card border border-border shadow-md hover:shadow-lg hover:border-primary/40 transition-all duration-200"
            >
              <motion.div
                animate={{ rotate: swapDirection * 180 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <ArrowDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </motion.button>
          </div>

          {/* Token Out Panel */}
          <div className="rounded-2xl bg-surface/80 border border-border/50 p-4 transition-all duration-300 hover:border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">You receive</span>
              <span className="text-xs text-muted-foreground">{parseFloat(balanceOut).toFixed(4)}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  {isLoading && !isWrapUnwrap ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="h-8 w-28 rounded-lg bg-muted/30 animate-pulse" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={isWrapUnwrap ? amountIn : amountOut}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      <input
                        type="text"
                        placeholder="0.0"
                        value={isWrapUnwrap ? amountIn : (amountOut ? parseFloat(amountOut).toFixed(6) : '')}
                        readOnly
                        className="w-full bg-transparent text-2xl font-semibold text-foreground placeholder:text-muted-foreground/40 outline-none cursor-default [appearance:textfield]"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <TokenSelector selectedToken={tokenOut} onSelect={setTokenOut} excludeToken={tokenIn} />
            </div>
          </div>

          {/* Price Rate - inline when available */}
          <AnimatePresence>
            {hasValidOutput && !error && !isWrapUnwrap && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-between mt-3 px-1">
                  <span className="text-xs text-muted-foreground">
                    1 {tokenIn.symbol} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {tokenOut.symbol}
                  </span>
                  {effectivePriceImpact > 0 && (
                    <span className={cn(
                      'text-xs font-medium',
                      effectivePriceImpact <= 1 && 'text-success',
                      effectivePriceImpact > 1 && effectivePriceImpact <= 3 && 'text-muted-foreground',
                      effectivePriceImpact > 3 && effectivePriceImpact <= 5 && 'text-warning',
                      effectivePriceImpact > 5 && 'text-destructive'
                    )}>
                      Impact ~{effectivePriceImpact.toFixed(2)}%
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Smart Route - Hidden during wrap/unwrap */}
          <AnimatePresence>
            {!isWrapUnwrap && amountIn && parseFloat(amountIn) > 0 && (bestRoute || isSearching) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-3 overflow-hidden"
              >
                {isSearching ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-surface/60 border border-border/50">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Finding best route...</span>
                  </div>
                ) : bestRoute && (
                  <Collapsible open={showRoutes} onOpenChange={setShowRoutes}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-surface/60 border border-border/50 hover:border-primary/30 transition-all duration-200">
                        <div className="flex items-center gap-2">
                          <Route className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-medium">Route</span>
                          {allRoutes.length > 1 && (
                            <span className="text-[10px] text-muted-foreground">({allRoutes.length})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <RouteDisplay routes={[bestRoute]} bestRoute={bestRoute} isCompact={true} />
                          <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform duration-200", showRoutes && "rotate-180")} />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-1.5 p-3 rounded-xl bg-surface/40 border border-border/30">
                        <RouteDisplay routes={allRoutes} bestRoute={bestRoute} selectedRoute={bestRoute} />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* MEV Protection & Gas */}
          <AnimatePresence>
            {!isWrapUnwrap && amountIn && parseFloat(amountIn) > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-3 space-y-2 overflow-hidden"
              >
                {(slippageAnalysis || isAnalyzing) && (
                  <div className="p-3 rounded-xl bg-surface/60 border border-border/50">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-medium">MEV Protection</span>
                    </div>
                    {isAnalyzing ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Analyzing...</span>
                      </div>
                    ) : (
                      <SlippageProtectionBadge analysis={slippageAnalysis} showDetails={true} />
                    )}
                    {slippageValidation && !slippageValidation.isValid && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-warning">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{slippageValidation.message}</span>
                      </div>
                    )}
                  </div>
                )}
                {isConnected && (
                  <GasEstimateDisplay
                    estimatedCost={gasEstimate?.estimatedCost || '0'}
                    estimatedCostUSD={gasEstimate?.estimatedCostUSD || 0}
                    isLoading={gasLoading}
                    error={gasError}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trade Details Collapsible */}
          <AnimatePresence>
            {hasValidOutput && !error && !isWrapUnwrap && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-3 overflow-hidden"
              >
                {/* High Price Impact Warning */}
                {effectivePriceImpact > 5 && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 mb-2">
                    <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-destructive">High Price Impact!</p>
                      <p className="text-[10px] text-destructive/80">This trade will move the price significantly.</p>
                    </div>
                  </div>
                )}
                {effectivePriceImpact > 3 && effectivePriceImpact <= 5 && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-warning/10 border border-warning/30 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                    <p className="text-[10px] text-warning">Price impact is high ({effectivePriceImpact.toFixed(2)}%)</p>
                  </div>
                )}

                <Collapsible>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between px-1 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <span>Trade details</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-3 rounded-xl bg-surface/50 border border-border/40 space-y-1.5">
                      {[
                        { label: 'Minimum Received', value: `${(parseFloat(amountOut) * (1 - slippage / 100)).toFixed(6)} ${tokenOut.symbol}` },
                        { label: 'Slippage Tolerance', value: `${slippage}%` },
                        { label: 'Trading Fee', value: `${bestRoute?.fee || 0.3}%` },
                        ...(bestRoute && bestRoute.pathSymbols.length > 2 ? [{ label: 'Route Hops', value: `${bestRoute.pathSymbols.length - 1}` }] : []),
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between text-xs py-0.5">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium text-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && !isWrapUnwrap && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-3 p-3 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-xs text-destructive"
              >
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          <motion.div className="mt-4" whileTap={{ scale: 0.98 }}>
            <Button
              className={cn(
                "w-full h-13 text-base font-semibold rounded-2xl bg-gradient-pink hover:opacity-90 disabled:opacity-40 transition-all duration-200",
                "shadow-[0_4px_20px_hsl(330,100%,55%,0.2)] hover:shadow-[0_4px_30px_hsl(330,100%,55%,0.35)]",
                (isApproving || isSwapping || isWrapping || isUnwrapping) && "animate-pulse"
              )}
              disabled={isButtonDisabled()}
              onClick={handleButtonClick}
            >
              {getButtonContent()}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>

    {/* Transaction Confirmation Modal */}
    <TransactionConfirmModal
      open={showConfirmModal}
      onOpenChange={setShowConfirmModal}
      type="swap"
      tokenIn={tokenIn}
      tokenOut={tokenOut}
      amountIn={amountIn}
      amountOut={amountOut}
      slippage={slippage}
      deadline={deadline}
      priceImpact={effectivePriceImpact}
      gasEstimate={gasEstimate}
      slippageAnalysis={slippageAnalysis}
      route={bestRoute?.pathSymbols}
      status={txStatus}
      txHash={txHash}
      error={txError}
      onConfirm={handleConfirmSwap}
      onCancel={handleCancelSwap}
    />
    </>
  );
};
