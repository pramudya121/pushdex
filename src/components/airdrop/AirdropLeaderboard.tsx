import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Crown, Medal } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  wallet_address: string;
  total_points: number;
  tasks_completed: number;
  rank: number;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
    case 2: return <Medal className="w-6 h-6 text-muted-foreground" />;
    case 3: return <Medal className="w-6 h-6 text-amber-600" />;
    default: return <span className="text-muted-foreground font-mono text-sm">#{rank}</span>;
  }
};

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
    </h2>

    {/* Top 3 Podium */}
    {leaderboard.length >= 3 && (
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        {[1, 0, 2].map((idx, col) => {
          const e = leaderboard[idx];
          const borderColors = [
            'border-muted/30 bg-muted/5',
            'border-primary/30 bg-primary/5',
            'border-accent/30 bg-accent/5',
          ];
          const isCenter = col === 1;
          return (
            <motion.div
              key={e.wallet_address}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: col * 0.1 }}
              className={isCenter ? 'order-1 sm:order-1 -mt-2 sm:-mt-4' : col === 0 ? 'order-0' : 'order-2'}
            >
              <Card className={`glass-card text-center p-3 sm:p-5 ${borderColors[col]} hover:scale-[1.02] transition-transform`}>
                <div className="mb-2">{getRankIcon(e.rank)}</div>
                <div className="font-mono text-xs sm:text-sm mb-1 truncate">{formatAddress(e.wallet_address)}</div>
                <div className={`text-xl sm:text-2xl font-bold tabular-nums ${e.rank === 1 ? 'text-primary !text-2xl sm:!text-3xl' : ''}`}>
                  {e.total_points}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">{e.tasks_completed} tasks</div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    )}

    {/* Rest */}
    <div className="space-y-2">
      {leaderboard.length === 0 && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-muted-foreground">
          No participants yet. Be the first!
        </motion.div>
      )}
      {leaderboard.slice(3).map((entry, i) => (
        <motion.div
          key={entry.wallet_address}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
          className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl ${
            address && entry.wallet_address === address.toLowerCase()
              ? 'bg-primary/10 border border-primary/20'
              : 'bg-surface/40 hover:bg-surface/60'
          } transition-colors`}
        >
          <div className="w-8 sm:w-10 text-center">
            <span className="text-muted-foreground font-mono text-xs sm:text-sm">#{entry.rank}</span>
          </div>
          <div className="flex-1 font-mono text-xs sm:text-sm truncate">
            {formatAddress(entry.wallet_address)}
            {address && entry.wallet_address === address.toLowerCase() && (
              <Badge className="ml-2 text-[10px]" variant="secondary">You</Badge>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="font-bold text-sm tabular-nums">{entry.total_points} pts</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">{entry.tasks_completed} tasks</div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);
