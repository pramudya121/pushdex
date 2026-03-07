import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Trophy, Target } from 'lucide-react';

interface Props {
  myPoints: number;
  myRank: number | string;
  myCompleted: number;
  totalTasks: number;
}

export const AirdropStatsBar: React.FC<Props> = ({ myPoints, myRank, myCompleted, totalTasks }) => (
  <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto mb-8 sm:mb-10">
    <Card className="glass-card text-center">
      <CardContent className="p-4 sm:pt-6">
        <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 mx-auto mb-1.5" />
        <div className="text-2xl sm:text-3xl font-bold">{myPoints}</div>
        <div className="text-xs sm:text-sm text-muted-foreground">Points</div>
      </CardContent>
    </Card>
    <Card className="glass-card text-center">
      <CardContent className="p-4 sm:pt-6">
        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-primary mx-auto mb-1.5" />
        <div className="text-2xl sm:text-3xl font-bold">{myRank}</div>
        <div className="text-xs sm:text-sm text-muted-foreground">Rank</div>
      </CardContent>
    </Card>
    <Card className="glass-card text-center">
      <CardContent className="p-4 sm:pt-6">
        <Target className="w-5 h-5 sm:w-6 sm:h-6 text-success mx-auto mb-1.5" />
        <div className="text-2xl sm:text-3xl font-bold">{myCompleted}/{totalTasks}</div>
        <div className="text-xs sm:text-sm text-muted-foreground">Done</div>
      </CardContent>
    </Card>
  </div>
);
