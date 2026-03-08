import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Trophy, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  myPoints: number;
  myRank: number | string;
  myCompleted: number;
  totalTasks: number;
}

const stats = [
  { key: 'points', icon: Star, label: 'Points', color: 'text-yellow-400' },
  { key: 'rank', icon: Trophy, label: 'Rank', color: 'text-primary' },
  { key: 'done', icon: Target, label: 'Done', color: 'text-success' },
] as const;

export const AirdropStatsBar: React.FC<Props> = ({ myPoints, myRank, myCompleted, totalTasks }) => {
  const values = [myPoints, myRank, `${myCompleted}/${totalTasks}`];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto mb-8 sm:mb-10">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-card text-center hover:border-primary/20 transition-colors">
              <CardContent className="p-4 sm:pt-6">
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${s.color} mx-auto mb-1.5`} />
                <div className="text-2xl sm:text-3xl font-bold tabular-nums">{values[i]}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
