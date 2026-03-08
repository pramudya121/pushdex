import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Crown, Medal, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTier } from '@/lib/tierSystem';
import { TierBadge } from './TierBadge';

interface LeaderboardEntry {
  wallet_address: string;
  total_points: number;
  tasks_completed: number;
  rank: number;
}

const PODIUM_CONFIG = [
  { order: 'order-1', bg: 'from-muted/40 to-muted/10', border: 'border-muted-foreground/20', icon: <Medal className="w-7 h-7 text-muted-foreground" />, mt: 'mt-4 sm:mt-6' },
  { order: 'order-0 sm:order-1', bg: 'from-yellow-500/20 to-yellow-500/5', border: 'border-yellow-500/30', icon: <Crown className="w-8 h-8 text-yellow-400" />, mt: '' },
  { order: 'order-2', bg: 'from-amber-700/20 to-amber-700/5', border: 'border-amber-600/20', icon: <Medal className="w-6 h-6 text-amber-600" />, mt: 'mt-8 sm:mt-10' },
];

const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

interface Props {
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  address: string | null;
}

export const AirdropLeaderboard: React.FC<Props> = ({ leaderboard, loading, address }) => (
  <div className="space-y-6">
    <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
      <Trophy className="w-5 h-5 text-yellow-400" /> Leaderboard
      {leaderboard.length > 0 && (
        <Badge variant="outline" className="text-xs text-muted-foreground ml-auto">
          {leaderboard.length} participants
        </Badge>
      )}
    </h2>

    {/* Top 3 Podium */}
    {leaderboard.length >= 3 && (
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 items-end">
        {[1, 0, 2].map((idx, col) => {
          const e = leaderboard[idx];
          const cfg = PODIUM_CONFIG[col];
          const isMe = address && e.wallet_address === address.toLowerCase();
          return (
            <motion.div
              key={e.wallet_address}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: col * 0.15, type: 'spring', stiffness: 150 }}
              className={cfg.order + ' ' + cfg.mt}
            >
              <Card className={`glass-card text-center p-3 sm:p-5 bg-gradient-to-b ${cfg.bg} ${cfg.border} hover:scale-[1.03] transition-all duration-300 relative overflow-hidden ${isMe ? 'ring-1 ring-primary/40' : ''}`}>
                {col === 1 && (
                  <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/5 to-transparent" />
                )}
                <div className="relative z-10">
                  <motion.div
                    animate={col === 1 ? { rotate: [0, -5, 5, 0] } : {}}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="mb-2 flex justify-center"
                  >
                    {cfg.icon}
                  </motion.div>
                  <div className="font-mono text-xs sm:text-sm mb-1 truncate text-muted-foreground">
                    {formatAddress(e.wallet_address)}
                    {isMe && <Badge className="ml-1 text-[8px] px-1" variant="secondary">You</Badge>}
                  </div>
                  <div className={`text-xl sm:text-2xl font-bold tabular-nums ${col === 1 ? 'text-yellow-400' : 'text-foreground'}`}>
                    {e.total_points}
                  </div>
                  {/* Tier Badge */}
                  <div className="mt-1.5 flex justify-center">
                    <TierBadge points={e.total_points} size="sm" />
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">{e.tasks_completed} tasks</div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    )}

    {/* Rest of leaderboard */}
    <div className="space-y-1.5">
      {leaderboard.length === 0 && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No participants yet. Be the first!</p>
        </motion.div>
      )}
      {leaderboard.slice(3).map((entry, i) => {
        const isMe = address && entry.wallet_address === address.toLowerCase();
        return (
          <motion.div
            key={entry.wallet_address}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.5) }}
            className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition-all duration-200 ${
              isMe
                ? 'bg-primary/10 border border-primary/20 shadow-sm shadow-primary/5'
                : 'bg-surface/40 hover:bg-surface/60 border border-transparent'
            }`}
          >
            <div className="w-8 sm:w-10 text-center">
              <span className="text-muted-foreground font-mono text-xs sm:text-sm font-medium">#{entry.rank}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs sm:text-sm truncate">
                {formatAddress(entry.wallet_address)}
                {isMe && <Badge className="ml-2 text-[10px]" variant="secondary">You</Badge>}
              </div>
              <div className="mt-1">
                <TierBadge points={entry.total_points} size="sm" />
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-bold text-sm tabular-nums">{entry.total_points} <span className="text-muted-foreground text-xs">pts</span></div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">{entry.tasks_completed} tasks</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  </div>
);
