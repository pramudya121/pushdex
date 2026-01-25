import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowDown, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Fuel, 
  Clock, 
  Shield, 
  ShieldAlert,
  Route,
  Info,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TokenInfo, BLOCK_EXPLORER } from '@/config/contracts';
import { SlippageAnalysis } from '@/hooks/useSlippageProtection';
import { GasEstimate } from '@/hooks/useGasEstimation';

export type TransactionStatus = 'preview' | 'confirming' | 'pending' | 'success' | 'error';

interface TransactionConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'swap' | 'addLiquidity' | 'removeLiquidity' | 'stake' | 'unstake';
  tokenIn?: TokenInfo;
  tokenOut?: TokenInfo;
  amountIn: string;
  amountOut: string;
  slippage: number;
  deadline: number;
  priceImpact?: number;
  gasEstimate?: GasEstimate | null;
  slippageAnalysis?: SlippageAnalysis | null;
  route?: string[];
  status: TransactionStatus;
  txHash?: string;
  error?: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export const TransactionConfirmModal: React.FC<TransactionConfirmModalProps> = ({
  open,
  onOpenChange,
  type,
  tokenIn,
  tokenOut,
  amountIn,
  amountOut,
  slippage,
  deadline,
  priceImpact = 0,
  gasEstimate,
  slippageAnalysis,
  route,
  status,
  txHash,
  error,
  onConfirm,
  onCancel,
}) => {
  const [copied, setCopied] = useState(false);

  const minimumReceived = useMemo(() => {
    const amount = parseFloat(amountOut);
    return (amount * (1 - slippage / 100)).toFixed(6);
  }, [amountOut, slippage]);

  const estimatedTime = useMemo(() => {
    // Estimate based on network conditions
    if (slippageAnalysis?.riskLevel === 'extreme') return '~30s';
    if (slippageAnalysis?.riskLevel === 'high') return '~20s';
    if (slippageAnalysis?.riskLevel === 'medium') return '~15s';
    return '~10s';
  }, [slippageAnalysis]);

  const getTypeLabel = () => {
    switch (type) {
      case 'swap': return 'Swap';
      case 'addLiquidity': return 'Add Liquidity';
      case 'removeLiquidity': return 'Remove Liquidity';
      case 'stake': return 'Stake';
      case 'unstake': return 'Unstake';
      default: return 'Transaction';
    }
  };

  const copyTxHash = async () => {
    if (!txHash) return;
    await navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status === 'success' ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : status === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-destructive" />
            ) : status === 'pending' || status === 'confirming' ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <Info className="w-5 h-5 text-primary" />
            )}
            {status === 'success' ? 'Transaction Successful' :
             status === 'error' ? 'Transaction Failed' :
             status === 'pending' ? 'Transaction Pending' :
             status === 'confirming' ? 'Confirm in Wallet' :
             `Confirm ${getTypeLabel()}`}
          </DialogTitle>
          <DialogDescription>
            {status === 'preview' && 'Review the transaction details before confirming'}
            {status === 'confirming' && 'Please confirm this transaction in your wallet'}
            {status === 'pending' && 'Your transaction is being processed on the blockchain'}
            {status === 'success' && 'Your transaction has been confirmed'}
            {status === 'error' && 'There was an error processing your transaction'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Token Exchange Preview */}
          {tokenIn && tokenOut && (
            <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
              {/* From Token */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {tokenIn.logo ? (
                    <img src={tokenIn.logo} alt={tokenIn.symbol} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-pink flex items-center justify-center text-sm font-bold">
                      {tokenIn.symbol.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">You Pay</p>
                    <p className="text-lg font-bold">{parseFloat(amountIn).toFixed(6)}</p>
                  </div>
                </div>
                <Badge variant="secondary">{tokenIn.symbol}</Badge>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="p-2 rounded-full bg-muted">
                  <ArrowDown className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {/* To Token */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {tokenOut.logo ? (
                    <img src={tokenOut.logo} alt={tokenOut.symbol} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-pink flex items-center justify-center text-sm font-bold">
                      {tokenOut.symbol.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">You Receive</p>
                    <p className="text-lg font-bold">{parseFloat(amountOut).toFixed(6)}</p>
                  </div>
                </div>
                <Badge variant="secondary">{tokenOut.symbol}</Badge>
              </div>
            </div>
          )}

          {/* Route Visualization */}
          {route && route.length > 0 && status === 'preview' && (
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Route className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Route</span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {route.map((symbol, i) => (
                  <React.Fragment key={i}>
                    <Badge variant="outline" className="text-xs">
                      {symbol}
                    </Badge>
                    {i < route.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Transaction Details */}
          {status === 'preview' && (
            <div className="space-y-2 text-sm">
              {/* Exchange Rate */}
              {tokenIn && tokenOut && (
                <div className="flex justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-medium">
                    1 {tokenIn.symbol} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {tokenOut.symbol}
                  </span>
                </div>
              )}

              {/* Price Impact */}
              <div className="flex justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="text-muted-foreground">Price Impact</span>
                <span className={cn(
                  "font-medium",
                  priceImpact <= 1 && "text-success",
                  priceImpact > 1 && priceImpact <= 3 && "text-foreground",
                  priceImpact > 3 && priceImpact <= 5 && "text-warning",
                  priceImpact > 5 && "text-destructive"
                )}>
                  {priceImpact > 0 ? `~${priceImpact.toFixed(2)}%` : '-'}
                </span>
              </div>

              {/* Minimum Received */}
              {tokenOut && (
                <div className="flex justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="text-muted-foreground">Minimum Received</span>
                  <span className="font-medium">{minimumReceived} {tokenOut.symbol}</span>
                </div>
              )}

              {/* Slippage */}
              <div className="flex justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="text-muted-foreground">Slippage Tolerance</span>
                <span className="font-medium">{slippage}%</span>
              </div>

              {/* Deadline */}
              <div className="flex justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Deadline
                </span>
                <span className="font-medium">{deadline} minutes</span>
              </div>

              {/* Gas Estimate */}
              {gasEstimate && (
                <div className="flex justify-between p-2 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Fuel className="w-3 h-3" />
                    Estimated Gas
                  </span>
                  <div className="text-right">
                    <span className="font-medium">{parseFloat(gasEstimate.estimatedCost).toFixed(4)} PC</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      (~${gasEstimate.estimatedCostUSD.toFixed(4)})
                    </span>
                  </div>
                </div>
              )}

              {/* Estimated Time */}
              <div className="flex justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Estimated Time
                </span>
                <span className="font-medium">{estimatedTime}</span>
              </div>
            </div>
          )}

          {/* MEV Protection Warning */}
          {slippageAnalysis && status === 'preview' && (
            <div className={cn(
              "flex items-start gap-2 p-3 rounded-lg border",
              slippageAnalysis.riskLevel === 'low' && "bg-success/10 border-success/20",
              slippageAnalysis.riskLevel === 'medium' && "bg-warning/10 border-warning/20",
              slippageAnalysis.riskLevel === 'high' && "bg-orange-500/10 border-orange-500/20",
              slippageAnalysis.riskLevel === 'extreme' && "bg-destructive/10 border-destructive/20",
            )}>
              {slippageAnalysis.riskLevel === 'low' ? (
                <Shield className="w-4 h-4 text-success shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className={cn(
                  "w-4 h-4 shrink-0 mt-0.5",
                  slippageAnalysis.riskLevel === 'medium' && "text-warning",
                  slippageAnalysis.riskLevel === 'high' && "text-orange-500",
                  slippageAnalysis.riskLevel === 'extreme' && "text-destructive",
                )} />
              )}
              <div className="flex-1">
                <p className={cn(
                  "text-xs font-medium",
                  slippageAnalysis.riskLevel === 'low' && "text-success",
                  slippageAnalysis.riskLevel === 'medium' && "text-warning",
                  slippageAnalysis.riskLevel === 'high' && "text-orange-500",
                  slippageAnalysis.riskLevel === 'extreme' && "text-destructive",
                )}>
                  {slippageAnalysis.riskLevel === 'low' ? 'Low Risk Trade' :
                   slippageAnalysis.riskLevel === 'medium' ? 'Moderate Risk' :
                   slippageAnalysis.riskLevel === 'high' ? 'High Risk Trade' :
                   'Extreme Risk Trade'}
                </p>
                {slippageAnalysis.warnings.length > 0 && (
                  <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    {slippageAnalysis.warnings.slice(0, 2).map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Pending Progress */}
          {status === 'pending' && (
            <div className="space-y-3">
              <Progress value={66} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                Waiting for blockchain confirmation...
              </p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && txHash && (
            <div className="p-4 rounded-xl bg-success/10 border border-success/20 space-y-3">
              <div className="flex items-center justify-center">
                <div className="p-3 rounded-full bg-success/20">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
              </div>
              <p className="text-center text-sm text-success font-medium">
                Transaction confirmed successfully!
              </p>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <p className="text-xs font-mono text-muted-foreground truncate flex-1">
                  {txHash}
                </p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyTxHash}>
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
                <a
                  href={`${BLOCK_EXPLORER}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </a>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && error && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <p className="text-sm font-medium text-destructive">Transaction Failed</p>
              </div>
              <p className="text-xs text-destructive/80">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {status === 'preview' && (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-pink hover:opacity-90"
                  onClick={handleConfirm}
                >
                  Confirm {getTypeLabel()}
                </Button>
              </>
            )}
            
            {(status === 'confirming' || status === 'pending') && (
              <Button
                variant="outline"
                className="w-full"
                disabled
              >
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {status === 'confirming' ? 'Waiting for Wallet...' : 'Processing...'}
              </Button>
            )}

            {(status === 'success' || status === 'error') && (
              <Button
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
