import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HoverGlowCard } from '@/components/ui/pushdex/hover-glow-card';
import { 
  Fish, 
  ArrowUpRight, 
  ArrowDownRight,
  Bell,
  BellOff,
  ExternalLink,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Waves
} from 'lucide-react';

interface WhaleTransaction {
  id: string;
  type: 'buy' | 'sell' | 'add_liquidity' | 'remove_liquidity';
  tokenIn: { symbol: string; amount: number; logoURI: string };
  tokenOut: { symbol: string; amount: number; logoURI: string };
  valueUSD: number;
  wallet: string;
  timestamp: Date;
  txHash: string;
  impact: 'bullish' | 'bearish' | 'neutral';
}

const MOCK_WHALE_TXS: WhaleTransaction[] = [
  {
    id: '1',
    type: 'buy',
    tokenIn: { symbol: 'USDC', amount: 250000, logoURI: '/tokens/eth.png' },
    tokenOut: { symbol: 'WPC', amount: 12500, logoURI: '/tokens/wpc.png' },
    valueUSD: 250000,
    wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bE68',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    txHash: '0xabc123...',
    impact: 'bullish',
  },
  {
    id: '2',
    type: 'sell',
    tokenIn: { symbol: 'ETH', amount: 150, logoURI: '/tokens/eth.png' },
    tokenOut: { symbol: 'USDC', amount: 375000, logoURI: '/tokens/eth.png' },
    valueUSD: 375000,
    wallet: '0x8ba1f109551bD432803012645Hg76543TyU8765',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    txHash: '0xdef456...',
    impact: 'bearish',
  },
  {
    id: '3',
    type: 'add_liquidity',
    tokenIn: { symbol: 'ETH', amount: 100, logoURI: '/tokens/eth.png' },
    tokenOut: { symbol: 'WPC', amount: 50000, logoURI: '/tokens/wpc.png' },
    valueUSD: 300000,
    wallet: '0x1234567890AbCdEf1234567890AbCdEf12345678',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    txHash: '0xghi789...',
    impact: 'bullish',
  },
  {
    id: '4',
    type: 'remove_liquidity',
    tokenIn: { symbol: 'BNB/WPC', amount: 5000, logoURI: '/tokens/bnb.png' },
    tokenOut: { symbol: 'BNB + WPC', amount: 0, logoURI: '/tokens/wpc.png' },
    valueUSD: 180000,
    wallet: '0xABCD1234EFGH5678IJKL9012MNOP3456QRST7890',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    txHash: '0xjkl012...',
    impact: 'bearish',
  },
];

const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
const formatValue = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
};
const formatTime = (date: Date) => {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000 / 60);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
};

const getTypeIcon = (type: WhaleTransaction['type']) => {
  switch (type) {
    case 'buy':
      return <ArrowUpRight className="w-4 h-4 text-success" />;
    case 'sell':
      return <ArrowDownRight className="w-4 h-4 text-destructive" />;
    case 'add_liquidity':
      return <TrendingUp className="w-4 h-4 text-info" />;
    case 'remove_liquidity':
      return <TrendingDown className="w-4 h-4 text-warning" />;
  }
};

const getTypeLabel = (type: WhaleTransaction['type']) => {
  switch (type) {
    case 'buy': return 'Bought';
    case 'sell': return 'Sold';
    case 'add_liquidity': return 'Added LP';
    case 'remove_liquidity': return 'Removed LP';
  }
};

const getImpactBadge = (impact: WhaleTransaction['impact']) => {
  switch (impact) {
    case 'bullish':
      return <Badge className="bg-success/10 text-success border-success/30">Bullish</Badge>;
    case 'bearish':
      return <Badge className="bg-destructive/10 text-destructive border-destructive/30">Bearish</Badge>;
    default:
      return <Badge className="bg-muted text-muted-foreground border-border">Neutral</Badge>;
  }
};

const WhaleTransactionCard = memo(({ tx, index }: { tx: WhaleTransaction; index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <HoverGlowCard className="p-4 rounded-xl bg-surface/60 border border-border/40 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            tx.type === 'buy' || tx.type === 'add_liquidity' 
              ? 'bg-success/10' 
              : 'bg-destructive/10'
          }`}>
            {getTypeIcon(tx.type)}
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">{getTypeLabel(tx.type)}</span>
              <span className="text-muted-foreground">
                {tx.tokenIn.amount.toLocaleString()} {tx.tokenIn.symbol}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{formatAddress(tx.wallet)}</span>
              <span>•</span>
              <span>{formatTime(tx.timestamp)}</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-bold text-foreground mb-1">
            {formatValue(tx.valueUSD)}
          </div>
          {getImpactBadge(tx.impact)}
        </div>
      </div>
    </HoverGlowCard>
  </motion.div>
));

WhaleTransactionCard.displayName = 'WhaleTransactionCard';

export const WhaleTracker = memo(() => {
  const [transactions, setTransactions] = useState<WhaleTransaction[]>(MOCK_WHALE_TXS);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [minValue, setMinValue] = useState(100000);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const types: WhaleTransaction['type'][] = ['buy', 'sell', 'add_liquidity', 'remove_liquidity'];
      const impacts: WhaleTransaction['impact'][] = ['bullish', 'bearish', 'neutral'];
      
      const newTx: WhaleTransaction = {
        id: Date.now().toString(),
        type: types[Math.floor(Math.random() * types.length)],
        tokenIn: { 
          symbol: ['ETH', 'WPC', 'BNB', 'PSDX'][Math.floor(Math.random() * 4)], 
          amount: Math.floor(Math.random() * 100000), 
          logoURI: '/tokens/eth.png' 
        },
        tokenOut: { 
          symbol: ['USDC', 'WPC', 'ETH'][Math.floor(Math.random() * 3)], 
          amount: Math.floor(Math.random() * 500000), 
          logoURI: '/tokens/wpc.png' 
        },
        valueUSD: Math.floor(Math.random() * 500000) + 100000,
        wallet: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
        timestamp: new Date(),
        txHash: `0x${Math.random().toString(16).slice(2, 10)}...`,
        impact: impacts[Math.floor(Math.random() * impacts.length)],
      };
      
      setTransactions(prev => [newTx, ...prev.slice(0, 9)]);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const bullishCount = transactions.filter(t => t.impact === 'bullish').length;
  const bearishCount = transactions.filter(t => t.impact === 'bearish').length;
  const sentiment = bullishCount > bearishCount ? 'bullish' : bullishCount < bearishCount ? 'bearish' : 'neutral';

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="icon-container bg-gradient-to-br from-blue-500/20 to-cyan-500/10">
              <Waves className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Whale Tracker
                <Fish className="w-4 h-4 text-blue-400" />
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Large transactions (&gt;{formatValue(minValue)})
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAlertsEnabled(!alertsEnabled)}
            className={alertsEnabled ? 'text-primary' : 'text-muted-foreground'}
          >
            {alertsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* Sentiment Overview */}
        <HoverGlowCard 
          className={`p-4 rounded-xl border ${
            sentiment === 'bullish' 
              ? 'bg-success/5 border-success/30' 
              : sentiment === 'bearish'
                ? 'bg-destructive/5 border-destructive/30'
                : 'bg-surface/60 border-border/40'
          }`}
          glowColor={
            sentiment === 'bullish' 
              ? 'hsl(142, 76%, 46%)' 
              : sentiment === 'bearish'
                ? 'hsl(0, 84%, 60%)'
                : 'hsl(240, 10%, 40%)'
          }
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Market Sentiment</div>
              <div className={`text-2xl font-bold capitalize ${
                sentiment === 'bullish' ? 'text-success' : sentiment === 'bearish' ? 'text-destructive' : 'text-foreground'
              }`}>
                {sentiment}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-success">🟢 {bullishCount} Bullish</span>
                <span className="text-destructive">🔴 {bearishCount} Bearish</span>
              </div>
            </div>
          </div>
        </HoverGlowCard>
        
        {/* Recent Whale Transactions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Recent Activity</h4>
            <Badge variant="outline" className="text-xs">
              Last 24h
            </Badge>
          </div>
          
          <AnimatePresence mode="popLayout">
            {transactions.map((tx, index) => (
              <WhaleTransactionCard key={tx.id} tx={tx} index={index} />
            ))}
          </AnimatePresence>
        </div>
        
        {/* Warning */}
        <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
          <div className="flex items-center gap-2 text-sm text-warning">
            <AlertTriangle className="w-4 h-4" />
            <span>Whale activity may indicate significant price movements</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

WhaleTracker.displayName = 'WhaleTracker';
