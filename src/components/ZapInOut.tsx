import React, { useState, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TokenSelector } from '@/components/TokenSelector';
import { HoverGlowCard } from '@/components/ui/pushdex/hover-glow-card';
import { useToast } from '@/hooks/use-toast';
import { TOKEN_LIST, TokenInfo } from '@/config/contracts';
import { 
  Zap, 
  ArrowDown,
  Loader2,
  AlertCircle,
  Sparkles,
  Coins
} from 'lucide-react';

interface ZapEstimate {
  tokenAAmount: string;
  tokenBAmount: string;
  lpTokensReceived: string;
  priceImpact: number;
  fee: string;
}

export const ZapInOut = memo(() => {
  const [mode, setMode] = useState<'in' | 'out'>('in');
  const [selectedToken, setSelectedToken] = useState<TokenInfo>(TOKEN_LIST[0]);
  const [poolTokenA] = useState<TokenInfo>(TOKEN_LIST[1]);
  const [poolTokenB] = useState<TokenInfo>(TOKEN_LIST[2]);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [estimate, setEstimate] = useState<ZapEstimate | null>(null);
  const { toast } = useToast();
  
  const handleAmountChange = useCallback((value: string) => {
    setAmount(value);
    if (value && parseFloat(value) > 0) {
      const amountNum = parseFloat(value);
      setEstimate({
        tokenAAmount: (amountNum * 0.48).toFixed(6),
        tokenBAmount: (amountNum * 0.48).toFixed(6),
        lpTokensReceived: (amountNum * 0.95).toFixed(6),
        priceImpact: Math.random() * 2,
        fee: (amountNum * 0.003).toFixed(6),
      });
    } else {
      setEstimate(null);
    }
  }, []);
  
  const handleZap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: mode === 'in' ? "Zap In Successful!" : "Zap Out Successful!",
        description: mode === 'in' 
          ? `Successfully added liquidity with ${amount} ${selectedToken.symbol}`
          : `Successfully removed liquidity to ${selectedToken.symbol}`,
      });
      
      setAmount('');
      setEstimate(null);
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="icon-container bg-gradient-to-br from-primary/20 to-accent/10">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Zap {mode === 'in' ? 'In' : 'Out'}
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {mode === 'in' 
                  ? 'Add liquidity with a single token' 
                  : 'Remove liquidity to a single token'
                }
              </p>
            </div>
          </div>
          
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'in' | 'out')}>
            <TabsList className="bg-surface">
              <TabsTrigger value="in" className="gap-2">
                <ArrowDown className="w-4 h-4" />
                Zap In
              </TabsTrigger>
              <TabsTrigger value="out" className="gap-2">
                <Zap className="w-4 h-4" />
                Zap Out
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Pool Selection */}
        <div className="space-y-3">
          <label className="text-sm text-muted-foreground">Select Pool</label>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-surface/60 border border-border/40">
            <div className="flex items-center gap-2">
              <img src={poolTokenA.logo} alt={poolTokenA.symbol} className="w-8 h-8 rounded-full" />
              <img src={poolTokenB.logo} alt={poolTokenB.symbol} className="w-8 h-8 rounded-full -ml-4" />
            </div>
            <div>
              <div className="font-semibold">{poolTokenA.symbol}/{poolTokenB.symbol}</div>
              <div className="text-sm text-muted-foreground">TVL: $1.2M • APR: 24.5%</div>
            </div>
          </div>
        </div>
        
        {/* Token & Amount Input */}
        <div className="space-y-3">
          <label className="text-sm text-muted-foreground">
            {mode === 'in' ? 'You Provide' : 'LP Tokens to Remove'}
          </label>
          <div className="token-input">
            <div className="flex items-center justify-between mb-3">
              <TokenSelector
                selectedToken={selectedToken}
                onSelect={setSelectedToken}
                label=""
              />
              <div className="text-sm text-muted-foreground">
                Balance: 0.00
              </div>
            </div>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="text-2xl font-semibold bg-transparent border-none p-0 h-auto focus-visible:ring-0"
            />
          </div>
        </div>
        
        {/* Arrow */}
        <div className="flex justify-center">
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="p-2 rounded-full bg-surface border border-border/40"
          >
            <ArrowDown className="w-5 h-5 text-primary" />
          </motion.div>
        </div>
        
        {/* Estimate Output */}
        <AnimatePresence mode="wait">
          {estimate && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-3"
            >
              <label className="text-sm text-muted-foreground">
                {mode === 'in' ? 'You Will Receive' : 'You Will Get'}
              </label>
              
              {mode === 'in' ? (
                <HoverGlowCard className="p-4 rounded-xl bg-surface/60 border border-border/40">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-primary" />
                      <span className="font-medium">LP Tokens</span>
                    </div>
                    <div className="text-xl font-bold">{estimate.lpTokensReceived}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ≈ {estimate.tokenAAmount} {poolTokenA.symbol} + {estimate.tokenBAmount} {poolTokenB.symbol}
                  </div>
                </HoverGlowCard>
              ) : (
                <HoverGlowCard className="p-4 rounded-xl bg-surface/60 border border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={selectedToken.logo} alt={selectedToken.symbol} className="w-6 h-6 rounded-full" />
                      <span className="font-medium">{selectedToken.symbol}</span>
                    </div>
                    <div className="text-xl font-bold">{estimate.lpTokensReceived}</div>
                  </div>
                </HoverGlowCard>
              )}
              
              {/* Details */}
              <div className="space-y-2 p-4 rounded-xl bg-surface/40 border border-border/30">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price Impact</span>
                  <span className={estimate.priceImpact > 1 ? 'text-warning' : 'text-foreground'}>
                    {estimate.priceImpact.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Swap Fee</span>
                  <span>{estimate.fee} {selectedToken.symbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Slippage Tolerance</span>
                  <span>0.5%</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Action Button */}
        <Button
          onClick={handleZap}
          disabled={isLoading || !amount || parseFloat(amount) <= 0}
          className="w-full py-6 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              {mode === 'in' ? 'Zap In' : 'Zap Out'}
            </>
          )}
        </Button>
        
        {/* Info Box */}
        <div className="p-4 rounded-xl bg-info/5 border border-info/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-info mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="mb-1 text-foreground font-medium">How Zap Works</p>
              {mode === 'in' 
                ? "Zap automatically swaps half of your token to the other pair token and adds liquidity in one transaction, saving gas fees."
                : "Zap removes your LP position and swaps everything to your chosen token in one transaction."
              }
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ZapInOut.displayName = 'ZapInOut';
