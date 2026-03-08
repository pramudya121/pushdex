import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, CalendarCheck, Loader2, Gift, Zap } from 'lucide-react';

interface Props {
  walletAddress: string | null;
  isConnected: boolean;
}

interface CheckinData {
  streak: number;
  bonus_points: number;
  checkin_date: string;
}

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const DailyCheckIn: React.FC<Props> = ({ walletAddress, isConnected }) => {
  const [loading, setLoading] = useState(false);
  const [checkedToday, setCheckedToday] = useState(false);
  const [streak, setStreak] = useState(0);
  const [lastBonus, setLastBonus] = useState(0);
  const [recentCheckins, setRecentCheckins] = useState<string[]>([]);
  const [showReward, setShowReward] = useState(false);

  const loadCheckinData = useCallback(async () => {
    if (!walletAddress) return;
    const wallet = walletAddress.toLowerCase();
    const today = new Date().toISOString().split('T')[0];

    // Get last 7 days of check-ins
    const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_checkins')
      .select('checkin_date, streak, bonus_points')
      .eq('wallet_address', wallet)
      .gte('checkin_date', sevenDaysAgo)
      .order('checkin_date', { ascending: false });

    if (data && data.length > 0) {
      const dates = data.map((d: any) => d.checkin_date);
      setRecentCheckins(dates);

      if (dates.includes(today)) {
        setCheckedToday(true);
        setStreak(data[0].streak);
        setLastBonus(data[0].bonus_points);
      } else {
        // Check if yesterday was checked in to show current potential streak
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (dates.includes(yesterday)) {
          setStreak(data.find((d: any) => d.checkin_date === yesterday)?.streak || 0);
        } else {
          setStreak(0);
        }
      }
    }
  }, [walletAddress]);

  useEffect(() => {
    loadCheckinData();
  }, [loadCheckinData]);

  const handleCheckIn = async () => {
    if (!walletAddress || !isConnected) {
      toast.error('Connect your wallet first');
      return;
    }
    if (checkedToday) {
      toast.info('You already checked in today!');
      return;
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke('daily-checkin', {
        body: { wallet_address: walletAddress },
      });

      const data = response.data;

      if (data?.error) {
        if (data.already_checked) {
          setCheckedToday(true);
          setStreak(data.streak || streak);
          toast.info('Already checked in today!');
        } else {
          toast.error(data.error);
        }
      } else if (data?.success) {
        setCheckedToday(true);
        setStreak(data.streak);
        setLastBonus(data.bonus_points);
        setShowReward(true);
        setTimeout(() => setShowReward(false), 2500);
        toast.success(data.message);
        await loadCheckinData();
      }
    } catch {
      toast.error('Check-in failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) return null;

  // Build week visualization
  const today = new Date();
  const weekDots = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const isChecked = recentCheckins.includes(dateStr);
    const isToday = i === 6;
    return { day: WEEK_DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1], isChecked, isToday, dateStr };
  });

  const nextMilestone = Math.ceil((streak + 1) / 7) * 7;

  return (
    <Card className="glass-card max-w-2xl mx-auto mb-8 sm:mb-10 overflow-hidden relative">
      {/* Streak glow */}
      {streak >= 7 && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 animate-pulse" />
      )}

      <CardContent className="p-4 sm:p-6 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Left: Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10">
                <CalendarCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base">Daily Check-In</h3>
                <p className="text-xs text-muted-foreground">Check in daily to earn bonus points & build streaks</p>
              </div>
            </div>

            {/* Week dots */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {weekDots.map((dot, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <motion.div
                    initial={false}
                    animate={dot.isChecked ? { scale: [1, 1.2, 1] } : {}}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                      dot.isChecked
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : dot.isToday
                        ? 'bg-surface border-2 border-dashed border-primary/40 text-muted-foreground'
                        : 'bg-surface/50 text-muted-foreground/50 border border-border/20'
                    }`}
                  >
                    {dot.isChecked ? '✓' : dot.day}
                  </motion.div>
                </div>
              ))}
            </div>

            {/* Streak info */}
            <div className="flex items-center gap-3 flex-wrap">
              {streak > 0 && (
                <Badge variant="outline" className="gap-1 text-xs border-primary/30 text-primary">
                  <Flame className="w-3 h-3" /> {streak} day streak
                </Badge>
              )}
              {streak > 0 && streak < nextMilestone && (
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  {nextMilestone - streak} days to next bonus milestone
                </span>
              )}
              {streak >= 7 && (
                <Badge className="gap-1 text-[10px] bg-accent/20 text-accent border-accent/30">
                  <Zap className="w-2.5 h-2.5" /> +{1 + Math.floor(streak / 7)} pts/day
                </Badge>
              )}
            </div>
          </div>

          {/* Right: Action */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <AnimatePresence>
              {showReward && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: -20, scale: 1.1 }}
                  exit={{ opacity: 0, y: -40 }}
                  className="text-primary font-bold text-lg"
                >
                  +{lastBonus} pts! 🔥
                </motion.div>
              )}
            </AnimatePresence>

            {checkedToday ? (
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center">
                  <CalendarCheck className="w-7 h-7 sm:w-8 sm:h-8 text-success" />
                </div>
                <span className="text-xs text-success font-medium">Checked in!</span>
                {lastBonus > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    <Gift className="w-2.5 h-2.5 mr-1" /> +{lastBonus} pts today
                  </Badge>
                )}
              </div>
            ) : (
              <Button
                onClick={handleCheckIn}
                disabled={loading}
                className="gap-2 h-14 sm:h-16 px-6 rounded-2xl text-base font-semibold"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CalendarCheck className="w-5 h-5" />
                    Check In
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
