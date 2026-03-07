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
    case 2: return <Medal className="w-6 h-6 text-gray-300" />;
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
          const borderColors = ['border-gray-400/30 bg-gray-400/5', 'border-yellow-500/30 bg-yellow-500/5', 'border-amber-600/30 bg-amber-600/5'];
          const order = col === 0 ? 'order-1' : col === 1 ? 'order-0 sm:order-1 -mt-2 sm:-mt-4' : 'order-2';
          return (
            <Card key={e.wallet_address} className={`glass-card text-center p-3 sm:p-5 ${borderColors[col]} ${order}`}>
              <div className="mb-2">{getRankIcon(e.rank)}</div>
              <div className="font-mono text-xs sm:text-sm mb-1">{formatAddress(e.wallet_address)}</div>
              <div className={`text-xl sm:text-2xl font-bold ${e.rank === 1 ? 'text-yellow-500 !text-2xl sm:!text-3xl' : ''}`}>{e.total_points}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">{e.tasks_completed} tasks</div>
            </Card>
          );
        })}
      </div>
    )}

    {/* Rest */}
    <div className="space-y-2">
      {leaderboard.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">No participants yet. Be the first!</div>
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
            <div className="font-bold text-sm">{entry.total_points} pts</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">{entry.tasks_completed} tasks</div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);
