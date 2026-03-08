import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Award, Flame, Star, Zap, Crown, Trophy, Sparkles, Target } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  threshold: number;
  color: string;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_step', title: 'First Step', description: 'Complete your first task', icon: <Zap className="w-5 h-5" />, threshold: 1, color: 'text-primary' },
  { id: 'getting_started', title: 'Getting Started', description: 'Complete 3 tasks', icon: <Flame className="w-5 h-5" />, threshold: 3, color: 'text-orange-400' },
  { id: 'halfway', title: 'Halfway There', description: 'Complete 5 tasks', icon: <Star className="w-5 h-5" />, threshold: 5, color: 'text-yellow-400' },
  { id: 'dedicated', title: 'Dedicated', description: 'Complete 10 tasks', icon: <Award className="w-5 h-5" />, threshold: 10, color: 'text-emerald-400' },
  { id: 'power_user', title: 'Power User', description: 'Complete 15 tasks', icon: <Trophy className="w-5 h-5" />, threshold: 15, color: 'text-blue-400' },
  { id: 'legend', title: 'Legend', description: 'Complete all tasks', icon: <Crown className="w-5 h-5" />, threshold: -1, color: 'text-purple-400' }, // -1 = totalTasks
];

interface Props {
  completedCount: number;
  totalTasks: number;
}

export const AirdropAchievements: React.FC<Props> = ({ completedCount, totalTasks }) => {
  const achievements = ACHIEVEMENTS.map(a => ({
    ...a,
    threshold: a.threshold === -1 ? totalTasks : a.threshold,
    unlocked: completedCount >= (a.threshold === -1 ? totalTasks : a.threshold),
  }));

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Achievements
        </h3>
        <Badge variant="outline" className="text-xs">
          {unlockedCount}/{achievements.length} unlocked
        </Badge>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {achievements.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={`glass-card text-center p-2 sm:p-3 transition-all ${
              a.unlocked
                ? 'border-primary/30 bg-primary/5 hover:scale-105'
                : 'opacity-40 grayscale'
            }`}>
              <CardContent className="p-0">
                <div className={`mb-1 flex justify-center ${a.unlocked ? a.color : 'text-muted-foreground'}`}>
                  {a.icon}
                </div>
                <div className="text-[10px] sm:text-xs font-medium truncate">{a.title}</div>
                <div className="text-[9px] sm:text-[10px] text-muted-foreground hidden sm:block">{a.threshold} tasks</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
