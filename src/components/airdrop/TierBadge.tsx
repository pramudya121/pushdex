import React from 'react';
import { motion } from 'framer-motion';
import { getTier, getNextTier, getTierProgress } from '@/lib/tierSystem';
import { Progress } from '@/components/ui/progress';

interface Props {
  points: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const TierBadge: React.FC<Props> = ({ points, showProgress = false, size = 'md' }) => {
  const tier = getTier(points);
  const next = getNextTier(points);
  const progress = getTierProgress(points);

  const sizes = {
    sm: { icon: 'w-3.5 h-3.5', text: 'text-[10px]', wrapper: 'px-2 py-0.5 gap-1' },
    md: { icon: 'w-4 h-4', text: 'text-xs', wrapper: 'px-2.5 py-1 gap-1.5' },
    lg: { icon: 'w-5 h-5', text: 'text-sm', wrapper: 'px-3 py-1.5 gap-2' },
  };

  const s = sizes[size];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`inline-flex items-center ${s.wrapper} rounded-full ${tier.bgColor} border ${tier.borderColor}`}
      >
        <span className={`${s.icon} ${tier.color} shrink-0`}>{tier.icon}</span>
        <span className={`${s.text} font-semibold ${tier.color}`}>{tier.name}</span>
      </motion.div>

      {showProgress && next && (
        <div className="w-full max-w-[140px] space-y-1">
          <Progress value={progress} className="h-1.5" />
          <p className="text-[9px] text-muted-foreground text-center">
            {next.minPoints - points} pts to {next.name}
          </p>
        </div>
      )}
    </div>
  );
};
