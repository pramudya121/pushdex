import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Trophy, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  myPoints: number;
  myRank: number | string;
  myCompleted: number;
  totalTasks: number;
}

const AnimatedNumber: React.FC<{ value: number; suffix?: string }> = ({ value, suffix }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const duration = 800;
    const steps = 20;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return <>{display}{suffix || ''}</>;
};

const stats = [
  { key: 'points', icon: Star, label: 'Points', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', borderColor: 'border-yellow-400/20' },
  { key: 'rank', icon: Trophy, label: 'Rank', color: 'text-primary', bgColor: 'bg-primary/10', borderColor: 'border-primary/20' },
  { key: 'done', icon: Target, label: 'Completed', color: 'text-success', bgColor: 'bg-success/10', borderColor: 'border-success/20' },
] as const;

export const AirdropStatsBar: React.FC<Props> = ({ myPoints, myRank, myCompleted, totalTasks }) => {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto mb-8 sm:mb-10">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
          >
            <Card className={`glass-card text-center hover:border-primary/20 transition-all duration-300 hover:scale-[1.02] ${s.borderColor}`}>
              <CardContent className="p-4 sm:pt-6">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${s.bgColor} flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${s.color}`} />
                </div>
                <div className="text-2xl sm:text-3xl font-bold tabular-nums">
                  {s.key === 'points' ? <AnimatedNumber value={myPoints} /> :
                   s.key === 'rank' ? (typeof myRank === 'number' ? `#${myRank}` : myRank) :
                   <><AnimatedNumber value={myCompleted} />/{totalTasks}</>}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">{s.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
