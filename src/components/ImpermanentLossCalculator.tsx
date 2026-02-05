import React, { useState, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { HoverGlowCard } from '@/components/ui/pushdex/hover-glow-card';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Info,
  DollarSign,
  Percent
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalculationResult {
  impermanentLoss: number;
  impermanentLossPercent: number;
  holdValue: number;
  lpValue: number;
  feesNeededToBreakeven: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
}

const calculateImpermanentLoss = (
  priceChangeA: number,
  priceChangeB: number,
  initialInvestment: number
): CalculationResult => {
  // Price ratios
  const priceRatioA = 1 + priceChangeA / 100;
  const priceRatioB = 1 + priceChangeB / 100;
  
  // Calculate LP value using AMM formula
  const k = Math.sqrt(priceRatioA * priceRatioB);
  const lpValue = initialInvestment * (2 * k) / (priceRatioA + priceRatioB);
  
  // Hold value (50/50 split)
  const holdValue = initialInvestment * (priceRatioA + priceRatioB) / 2;
  
  // Impermanent loss
  const impermanentLoss = holdValue - lpValue;
  const impermanentLossPercent = (impermanentLoss / holdValue) * 100;
  
  // Fees needed to breakeven (assuming 0.3% swap fee)
  const feesNeededToBreakeven = impermanentLoss / 0.003;
  
  // Risk level
  let riskLevel: CalculationResult['riskLevel'] = 'low';
  if (impermanentLossPercent > 2 && impermanentLossPercent <= 5) riskLevel = 'medium';
  else if (impermanentLossPercent > 5 && impermanentLossPercent <= 10) riskLevel = 'high';
  else if (impermanentLossPercent > 10) riskLevel = 'extreme';
  
  return {
    impermanentLoss: Math.max(0, impermanentLoss),
    impermanentLossPercent: Math.max(0, impermanentLossPercent),
    holdValue,
    lpValue,
    feesNeededToBreakeven: Math.max(0, feesNeededToBreakeven),
    riskLevel,
  };
};

const getRiskColor = (risk: CalculationResult['riskLevel']) => {
  switch (risk) {
    case 'low': return 'text-success bg-success/10 border-success/30';
    case 'medium': return 'text-warning bg-warning/10 border-warning/30';
    case 'high': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
    case 'extreme': return 'text-destructive bg-destructive/10 border-destructive/30';
  }
};

export const ImpermanentLossCalculator = memo(() => {
  const [initialInvestment, setInitialInvestment] = useState(1000);
  const [priceChangeA, setPriceChangeA] = useState(0);
  const [priceChangeB, setPriceChangeB] = useState(0);
  const [tokenASymbol, setTokenASymbol] = useState('ETH');
  const [tokenBSymbol, setTokenBSymbol] = useState('USDC');
  
  const result = useMemo(() => 
    calculateImpermanentLoss(priceChangeA, priceChangeB, initialInvestment),
    [priceChangeA, priceChangeB, initialInvestment]
  );

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="icon-container">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Impermanent Loss Calculator</CardTitle>
            <p className="text-sm text-muted-foreground">Estimate potential IL before adding liquidity</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Initial Investment */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Initial Investment (USD)
            </Label>
            <Input
              type="number"
              value={initialInvestment}
              onChange={(e) => setInitialInvestment(Number(e.target.value))}
              className="bg-surface border-border/60"
              min={0}
            />
          </div>
          
          {/* Token Pair */}
          <div className="space-y-2">
            <Label>Token Pair</Label>
            <div className="flex gap-2">
              <Input
                value={tokenASymbol}
                onChange={(e) => setTokenASymbol(e.target.value.toUpperCase())}
                className="bg-surface border-border/60"
                placeholder="Token A"
              />
              <span className="flex items-center text-muted-foreground">/</span>
              <Input
                value={tokenBSymbol}
                onChange={(e) => setTokenBSymbol(e.target.value.toUpperCase())}
                className="bg-surface border-border/60"
                placeholder="Token B"
              />
            </div>
          </div>
        </div>
        
        {/* Price Change Sliders */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2">
                {tokenASymbol} Price Change
                {priceChangeA >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-success" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                )}
              </Label>
              <Badge variant="outline" className={priceChangeA >= 0 ? 'text-success' : 'text-destructive'}>
                {priceChangeA >= 0 ? '+' : ''}{priceChangeA}%
              </Badge>
            </div>
            <Slider
              value={[priceChangeA]}
              onValueChange={([value]) => setPriceChangeA(value)}
              min={-90}
              max={500}
              step={5}
              className="py-2"
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2">
                {tokenBSymbol} Price Change
                {priceChangeB >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-success" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                )}
              </Label>
              <Badge variant="outline" className={priceChangeB >= 0 ? 'text-success' : 'text-destructive'}>
                {priceChangeB >= 0 ? '+' : ''}{priceChangeB}%
              </Badge>
            </div>
            <Slider
              value={[priceChangeB]}
              onValueChange={([value]) => setPriceChangeB(value)}
              min={-90}
              max={500}
              step={5}
              className="py-2"
            />
          </div>
        </div>
        
        {/* Results Section */}
        <motion.div
          key={`${priceChangeA}-${priceChangeB}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Risk Badge */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Risk Level</span>
            <Badge className={getRiskColor(result.riskLevel)}>
              {result.riskLevel === 'extreme' && <AlertTriangle className="w-3 h-3 mr-1" />}
              {result.riskLevel.toUpperCase()}
            </Badge>
          </div>
          
          {/* Comparison Cards */}
          <div className="grid grid-cols-2 gap-4">
            <HoverGlowCard className="p-4 rounded-xl bg-surface/60 border border-border/40">
              <div className="text-sm text-muted-foreground mb-1">If You HODL</div>
              <div className="text-2xl font-bold text-foreground">
                ${result.holdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className={`text-sm ${result.holdValue >= initialInvestment ? 'text-success' : 'text-destructive'}`}>
                {result.holdValue >= initialInvestment ? '+' : ''}
                {((result.holdValue - initialInvestment) / initialInvestment * 100).toFixed(2)}%
              </div>
            </HoverGlowCard>
            
            <HoverGlowCard className="p-4 rounded-xl bg-surface/60 border border-border/40">
              <div className="text-sm text-muted-foreground mb-1">If You LP</div>
              <div className="text-2xl font-bold text-foreground">
                ${result.lpValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className={`text-sm ${result.lpValue >= initialInvestment ? 'text-success' : 'text-destructive'}`}>
                {result.lpValue >= initialInvestment ? '+' : ''}
                {((result.lpValue - initialInvestment) / initialInvestment * 100).toFixed(2)}%
              </div>
            </HoverGlowCard>
          </div>
          
          {/* IL Amount */}
          <HoverGlowCard 
            className={`p-4 rounded-xl border ${
              result.impermanentLossPercent > 5 
                ? 'bg-destructive/5 border-destructive/30' 
                : 'bg-surface/60 border-border/40'
            }`}
            glowColor={result.impermanentLossPercent > 5 ? 'hsl(0, 84%, 60%)' : 'hsl(330, 100%, 55%)'}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                  Impermanent Loss
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          IL is the difference between holding tokens vs providing liquidity.
                          It becomes "permanent" only when you withdraw.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-3xl font-bold text-destructive">
                  -${result.impermanentLoss.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-destructive">
                  -{result.impermanentLossPercent.toFixed(2)}%
                </div>
              </div>
            </div>
          </HoverGlowCard>
          
          {/* Breakeven Info */}
          {result.impermanentLoss > 0 && (
            <div className="p-4 rounded-xl bg-info/5 border border-info/20">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-info mt-0.5" />
                <div>
                  <div className="font-medium text-info mb-1">To Break Even</div>
                  <p className="text-sm text-muted-foreground">
                    You need approximately <span className="text-foreground font-semibold">
                      ${result.feesNeededToBreakeven.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span> in trading volume to earn enough fees (0.3%) to offset this IL.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
});

ImpermanentLossCalculator.displayName = 'ImpermanentLossCalculator';
