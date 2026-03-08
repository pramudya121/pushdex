import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Flame, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const CAMPAIGN_END = new Date('2026-12-31T23:59:59Z');

const calcTimeLeft = () => {
  const diff = CAMPAIGN_END.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    ended: false,
  };
};

interface Props {
  completed: number;
  total: number;
}

const TimeBlock: React.FC<{ value: number; label: string; index: number }> = ({ value, label, index }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.1 }}
    className="flex flex-col items-center"
  >
    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-surface border border-border/50 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
      <motion.span
        key={value}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-lg sm:text-xl font-bold font-mono text-foreground relative z-10"
      >
        {String(value).padStart(2, '0')}
      </motion.span>
    </div>
    <span className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 uppercase tracking-wider">{label}</span>
  </motion.div>
);

export const AirdropProgressCountdown: React.FC<Props> = ({ completed, total }) => {
  const [time, setTime] = useState(calcTimeLeft);

  useEffect(() => {
    const iv = setInterval(() => setTime(calcTimeLeft()), 1000);
    return () => clearInterval(iv);
  }, []);

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone = completed === total && total > 0;

  return (
    <Card className="glass-card max-w-2xl mx-auto mb-8 sm:mb-10 overflow-hidden relative">
      {/* Glow effect when all tasks done */}
      {allDone && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 animate-pulse" />
      )}
      <CardContent className="p-4 sm:p-6 space-y-5 relative z-10">
        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-semibold">
              {allDone ? (
                <><Sparkles className="w-4 h-4 text-primary" /> All Quests Complete!</>
              ) : (
                <><Flame className="w-4 h-4 text-primary" /> Quest Progress</>
              )}
            </span>
            <span className="text-muted-foreground font-mono text-xs">
              {completed}/{total} <span className="text-foreground/70">({pct}%)</span>
            </span>
          </div>
          <div className="relative">
            <Progress value={pct} className="h-3" />
            {pct > 0 && pct < 100 && (
              <motion.div
                className="absolute top-0 h-3 w-6 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
                animate={{ left: ['0%', `${pct}%`] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </div>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
          {time.ended ? (
            <span className="text-destructive font-semibold text-sm">Campaign ended</span>
          ) : (
            <div className="flex gap-2 sm:gap-3">
              <TimeBlock value={time.days} label="Days" index={0} />
              <div className="flex items-center text-muted-foreground/40 text-lg font-bold self-start mt-3">:</div>
              <TimeBlock value={time.hours} label="Hrs" index={1} />
              <div className="flex items-center text-muted-foreground/40 text-lg font-bold self-start mt-3">:</div>
              <TimeBlock value={time.minutes} label="Min" index={2} />
              <div className="flex items-center text-muted-foreground/40 text-lg font-bold self-start mt-3">:</div>
              <TimeBlock value={time.seconds} label="Sec" index={3} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
