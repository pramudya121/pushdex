import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Flame } from 'lucide-react';

// Campaign end date — adjust as needed
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

export const AirdropProgressCountdown: React.FC<Props> = ({ completed, total }) => {
  const [time, setTime] = useState(calcTimeLeft);

  useEffect(() => {
    const iv = setInterval(() => setTime(calcTimeLeft()), 1000);
    return () => clearInterval(iv);
  }, []);

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className="glass-card max-w-2xl mx-auto mb-8 sm:mb-10">
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-medium">
              <Flame className="w-4 h-4 text-primary" /> Quest Progress
            </span>
            <span className="text-muted-foreground">{completed}/{total} completed ({pct}%)</span>
          </div>
          <Progress value={pct} className="h-3" />
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          {time.ended ? (
            <span className="text-destructive font-medium">Campaign ended</span>
          ) : (
            <div className="flex gap-3">
              {[
                { v: time.days, l: 'd' },
                { v: time.hours, l: 'h' },
                { v: time.minutes, l: 'm' },
                { v: time.seconds, l: 's' },
              ].map(({ v, l }) => (
                <span key={l} className="font-mono">
                  <span className="text-foreground font-bold">{String(v).padStart(2, '0')}</span>
                  <span className="text-muted-foreground">{l}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
