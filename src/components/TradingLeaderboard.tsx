import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HoverGlowCard } from '@/components/ui/pushdex/hover-glow-card';
import { NumberTicker } from '@/components/ui/magic-ui/number-ticker';
import { 
  Trophy, 
  Medal, 
  TrendingUp, 
  Flame, 
  Crown,
  Star,
  Zap,
  Award
} from 'lucide-react';

interface TraderStats {
  rank: number;
  address: string;
  totalVolume: number;
  totalTrades: number;
  profitLoss: number;
  winRate: number;
  streak: number;
  badge: 'whale' | 'diamond' | 'gold' | 'silver' | 'bronze' | null;
}

const MOCK_TRADERS: TraderStats[] = [
  { rank: 1, address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bE68', totalVolume: 1250000, totalTrades: 342, profitLoss: 45000, winRate: 78, streak: 12, badge: 'whale' },
  { rank: 2, address: '0x8ba1f109551bD432803012645Hg76543TyU8765', totalVolume: 890000, totalTrades: 256, profitLoss: 32000, winRate: 72, streak: 8, badge: 'diamond' },
  { rank: 3, address: '0x1234567890AbCdEf1234567890AbCdEf12345678', totalVolume: 567000, totalTrades: 189, profitLoss: 18500, winRate: 68, streak: 5, badge: 'gold' },
  { rank: 4, address: '0xABCD1234EFGH5678IJKL9012MNOP3456QRST7890', totalVolume: 345000, totalTrades: 145, profitLoss: 12000, winRate: 65, streak: 3, badge: 'silver' },
  { rank: 5, address: '0x9876WXYZ5432LMNO1098PQRS7654TUVW3210ABCD', totalVolume: 234000, totalTrades: 98, profitLoss: 8500, winRate: 62, streak: 2, badge: 'bronze' },
  { rank: 6, address: '0xDEF456GHI789JKL012MNO345PQR678STU901VWX', totalVolume: 189000, totalTrades: 76, profitLoss: 5200, winRate: 58, streak: 1, badge: null },
  { rank: 7, address: '0x111222333444555666777888999000AAABBBCCC', totalVolume: 156000, totalTrades: 65, profitLoss: 3800, winRate: 55, streak: 0, badge: null },
  { rank: 8, address: '0xZZZYYYXXXWWWVVVUUUTTTSSSRRRQQQPPPOOONNN', totalVolume: 123000, totalTrades: 54, profitLoss: 2100, winRate: 52, streak: 0, badge: null },
  { rank: 9, address: '0xMMMNNNOOOPPPQQQRRRSSSsTTTUUUVVVWWWXXX', totalVolume: 98000, totalTrades: 43, profitLoss: 1500, winRate: 50, streak: 0, badge: null },
  { rank: 10, address: '0xAAABBBCCCDDDEEEFFFGGGHHHIIIJJJKKKLLL', totalVolume: 76000, totalTrades: 32, profitLoss: 800, winRate: 48, streak: 0, badge: null },
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-400" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-300" />;
    case 3:
      return <Medal className="w-5 h-5 text-amber-600" />;
    default:
      return <span className="text-muted-foreground font-medium">#{rank}</span>;
  }
};

const getBadgeColor = (badge: TraderStats['badge']) => {
  switch (badge) {
    case 'whale':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'diamond':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    case 'gold':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'silver':
      return 'bg-gray-400/20 text-gray-300 border-gray-400/30';
    case 'bronze':
      return 'bg-amber-600/20 text-amber-500 border-amber-600/30';
    default:
      return '';
  }
};

const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatVolume = (volume: number) => {
  if (volume >= 1000000) return `$${(volume / 1000000).toFixed(2)}M`;
  if (volume >= 1000) return `$${(volume / 1000).toFixed(1)}K`;
  return `$${volume.toFixed(2)}`;
};

const TraderRow = memo(({ trader, index }: { trader: TraderStats; index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    className={`table-row-hover p-4 rounded-xl flex items-center gap-4 ${
      trader.rank <= 3 ? 'bg-surface/60 border border-border/40' : ''
    }`}
  >
    <div className="w-10 flex justify-center">
      {getRankIcon(trader.rank)}
    </div>
    
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-foreground">
          {formatAddress(trader.address)}
        </span>
        {trader.badge && (
          <Badge variant="outline" className={`text-xs ${getBadgeColor(trader.badge)}`}>
            {trader.badge}
          </Badge>
        )}
        {trader.streak >= 5 && (
          <div className="flex items-center gap-1 text-orange-400">
            <Flame className="w-3 h-3" />
            <span className="text-xs">{trader.streak}</span>
          </div>
        )}
      </div>
    </div>
    
    <div className="text-right">
      <div className="font-semibold text-foreground">{formatVolume(trader.totalVolume)}</div>
      <div className="text-xs text-muted-foreground">{trader.totalTrades} trades</div>
    </div>
    
    <div className="text-right w-24">
      <div className={`font-semibold ${trader.profitLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
        {trader.profitLoss >= 0 ? '+' : ''}{formatVolume(trader.profitLoss)}
      </div>
      <div className="text-xs text-muted-foreground">{trader.winRate}% win</div>
    </div>
  </motion.div>
));

TraderRow.displayName = 'TraderRow';

export const TradingLeaderboard = memo(() => {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('24h');
  const [traders, setTraders] = useState<TraderStats[]>(MOCK_TRADERS);

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="icon-container">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Trading Leaderboard</CardTitle>
              <p className="text-sm text-muted-foreground">Top traders by volume</p>
            </div>
          </div>
          
          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as typeof timeframe)}>
            <TabsList className="bg-surface">
              <TabsTrigger value="24h" className="text-xs">24H</TabsTrigger>
              <TabsTrigger value="7d" className="text-xs">7D</TabsTrigger>
              <TabsTrigger value="30d" className="text-xs">30D</TabsTrigger>
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Top 3 Highlight */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {traders.slice(0, 3).map((trader, index) => (
            <HoverGlowCard
              key={trader.address}
              className={`p-4 text-center rounded-xl ${
                index === 0 
                  ? 'bg-gradient-to-br from-yellow-500/10 to-amber-600/5 border border-yellow-500/20' 
                  : index === 1 
                    ? 'bg-gradient-to-br from-gray-400/10 to-gray-500/5 border border-gray-400/20'
                    : 'bg-gradient-to-br from-amber-600/10 to-orange-600/5 border border-amber-600/20'
              }`}
              glowColor={index === 0 ? 'hsl(45, 100%, 50%)' : index === 1 ? 'hsl(0, 0%, 70%)' : 'hsl(30, 100%, 40%)'}
            >
              <div className="mb-2">{getRankIcon(trader.rank)}</div>
              <div className="font-mono text-sm mb-1">{formatAddress(trader.address)}</div>
              <div className="text-lg font-bold text-foreground">{formatVolume(trader.totalVolume)}</div>
              <div className={`text-sm ${trader.profitLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
                {trader.profitLoss >= 0 ? '+' : ''}{formatVolume(trader.profitLoss)} P&L
              </div>
            </HoverGlowCard>
          ))}
        </div>
        
        {/* Rest of leaderboard */}
        <div className="space-y-2">
          {traders.slice(3).map((trader, index) => (
            <TraderRow key={trader.address} trader={trader} index={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

TradingLeaderboard.displayName = 'TradingLeaderboard';
