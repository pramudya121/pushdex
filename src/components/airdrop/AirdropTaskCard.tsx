import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  ExternalLink,
  ArrowRightLeft,
  Droplets,
  Leaf,
  Coins,
  Link as LinkIcon,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AirdropTask {
  id: string;
  title: string;
  description: string;
  type: 'onchain' | 'social';
  action: string;
  points: number;
  link: string | null;
  active: boolean;
}

const ACTION_ROUTES: Record<string, string> = {
  swap: '/swap',
  add_liquidity: '/liquidity',
  remove_liquidity: '/liquidity',
  farming: '/farming',
  staking: '/staking',
};

const getActionIcon = (action: string) => {
  switch (action) {
    case 'swap': return <ArrowRightLeft className="w-5 h-5" />;
    case 'add_liquidity': return <Droplets className="w-5 h-5" />;
    case 'remove_liquidity': return <Droplets className="w-5 h-5" />;
    case 'farming': return <Leaf className="w-5 h-5" />;
    case 'staking': return <Coins className="w-5 h-5" />;
    default: return <LinkIcon className="w-5 h-5" />;
  }
};

const ACTION_LABELS: Record<string, string> = {
  swap: 'Go to Swap',
  add_liquidity: 'Go to Liquidity',
  remove_liquidity: 'Go to Liquidity',
  farming: 'Go to Farming',
  staking: 'Go to Staking',
};

interface Props {
  task: AirdropTask;
  index: number;
  completed: boolean;
  visited: boolean;
  claiming: boolean;
  onClaim: (task: AirdropTask) => void;
  onVisit: (taskId: string) => void;
}

export const AirdropTaskCard: React.FC<Props> = ({
  task, index, completed, visited, claiming, onClaim, onVisit,
}) => {
  const navigate = useNavigate();

  const handleGoToTask = () => {
    onVisit(task.id);
    if (task.type === 'onchain' && ACTION_ROUTES[task.action]) {
      navigate(ACTION_ROUTES[task.action]);
    } else if (task.link) {
      window.open(task.link, '_blank', 'noopener,noreferrer');
    }
  };

  const canClaim = task.type === 'social' ? visited || !!task.link : visited;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`glass-card transition-all ${completed ? 'border-success/30 bg-success/5' : 'hover:border-primary/30'}`}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${completed ? 'bg-success/20 text-success' : 'bg-primary/10 text-primary'}`}>
              {completed ? <CheckCircle className="w-5 h-5" /> : getActionIcon(task.action)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm sm:text-base">{task.title}</div>
              <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{task.description}</div>

              {/* Mobile buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-3 sm:hidden">
                <Badge variant="outline" className="text-primary border-primary/30 text-xs">
                  +{task.points} pts
                </Badge>
                {!completed && (
                  <Button size="sm" variant="outline" onClick={handleGoToTask} className="gap-1 h-8 text-xs px-2">
                    <ArrowRight className="w-3 h-3" />
                    {task.type === 'onchain' ? ACTION_LABELS[task.action] || 'Go' : task.link ? 'Visit' : 'Go'}
                  </Button>
                )}
                {completed ? (
                  <Badge className="bg-success/20 text-success border-success/30 text-xs">Done ✓</Badge>
                ) : canClaim ? (
                  <Button size="sm" onClick={() => onClaim(task)} disabled={claiming} className="h-8 text-xs">
                    {claiming ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Claim'}
                  </Button>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">Complete task first</span>
                )}
              </div>
            </div>

            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <Badge variant="outline" className="text-primary border-primary/30">
                +{task.points} pts
              </Badge>
              {!completed && (
                <Button size="sm" variant="outline" onClick={handleGoToTask} className="gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  {task.type === 'onchain' ? ACTION_LABELS[task.action] || 'Go' : task.link ? 'Visit Link' : 'Go'}
                </Button>
              )}
              {completed ? (
                <Badge className="bg-success/20 text-success border-success/30">Done ✓</Badge>
              ) : canClaim ? (
                <Button size="sm" onClick={() => onClaim(task)} disabled={claiming}>
                  {claiming ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Claiming...</> : 'Claim Points'}
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground italic">Do the task first</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
