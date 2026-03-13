import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  ArrowRightLeft,
  Droplets,
  Leaf,
  Coins,
  Link as LinkIcon,
  ArrowRight,
  Loader2,
  Twitter,
  Lock,
  Heart,
  Repeat2,
  MessageCircle,
  Users,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isActionVerified, getVerifiedTxHash, AirdropAction } from '@/lib/airdropTracker';

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
    case 'follow_twitter': return <Twitter className="w-5 h-5" />;
    case 'retweet': return <Repeat2 className="w-5 h-5" />;
    case 'like_tweet': return <Heart className="w-5 h-5" />;
    case 'join_telegram': return <MessageCircle className="w-5 h-5" />;
    case 'join_discord': return <Users className="w-5 h-5" />;
    case 'social': return <Twitter className="w-5 h-5" />;
    default: return <LinkIcon className="w-5 h-5" />;
  }
};

const ACTION_LABELS: Record<string, string> = {
  swap: 'Go to Swap',
  add_liquidity: 'Go to Liquidity',
  remove_liquidity: 'Go to Liquidity',
  farming: 'Go to Farming',
  staking: 'Go to Staking',
  follow_twitter: 'Follow on X',
  retweet: 'Retweet',
  like_tweet: 'Like Tweet',
  join_telegram: 'Join Telegram',
  join_discord: 'Join Discord',
};

const DAILY_RESET_MS = 24 * 60 * 60 * 1000;

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface Props {
  task: AirdropTask;
  index: number;
  completed: boolean;
  claiming: boolean;
  walletAddress: string | null;
  twitterConnected: boolean;
  onClaim: (task: AirdropTask) => void;
  onConnectTwitter: () => void;
  lastCompletedAt?: string | null;
}

export const AirdropTaskCard: React.FC<Props> = ({
  task, index, completed, claiming, walletAddress, twitterConnected, onClaim, onConnectTwitter, lastCompletedAt,
}) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState('');
  const [resetReady, setResetReady] = useState(false);

  // Countdown timer for on-chain tasks completed today
  useEffect(() => {
    if (task.type !== 'onchain' || !completed || !lastCompletedAt) {
      setCountdown('');
      setResetReady(false);
      return;
    }

    const update = () => {
      const completedTime = new Date(lastCompletedAt).getTime();
      const resetAt = completedTime + DAILY_RESET_MS;
      const remaining = resetAt - Date.now();
      if (remaining <= 0) {
        setCountdown('');
        setResetReady(true);
      } else {
        setCountdown(formatCountdown(remaining));
        setResetReady(false);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [task.type, completed, lastCompletedAt]);

  const handleGoToTask = () => {
    if (task.type === 'onchain' && ACTION_ROUTES[task.action]) {
      navigate(ACTION_ROUTES[task.action]);
    } else if (task.link) {
      window.open(task.link, '_blank', 'noopener,noreferrer');
    }
  };

  const isOnchainVerified = task.type === 'onchain' && walletAddress
    ? isActionVerified(walletAddress, task.action as AirdropAction)
    : false;
  const verifiedTxHash = task.type === 'onchain' && walletAddress
    ? getVerifiedTxHash(walletAddress, task.action as AirdropAction)
    : null;

  const canClaim = task.type === 'onchain' ? isOnchainVerified : twitterConnected;
  const isSocial = task.type === 'social';

  // If completed today but reset is ready, treat as not completed
  const effectiveCompleted = completed && !resetReady;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`glass-card transition-all ${effectiveCompleted ? 'border-success/30 bg-success/5' : 'hover:border-primary/30'}`}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Icon */}
            <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${effectiveCompleted ? 'bg-success/20 text-success' : 'bg-primary/10 text-primary'}`}>
              {effectiveCompleted ? <CheckCircle className="w-5 h-5" /> : getActionIcon(task.action)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm sm:text-base">{task.title}</div>
              <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{task.description}</div>

              {/* Status hints */}
              {!effectiveCompleted && task.type === 'onchain' && !isOnchainVerified && !resetReady && (
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>Complete a successful on-chain transaction to unlock claim</span>
                </div>
              )}
              {!effectiveCompleted && task.type === 'onchain' && isOnchainVerified && verifiedTxHash && (
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-success">
                  <CheckCircle className="w-3 h-3" />
                  <span>Tx verified: {verifiedTxHash.slice(0, 10)}…{verifiedTxHash.slice(-6)}</span>
                </div>
              )}
              {resetReady && task.type === 'onchain' && (
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-primary">
                  <RotateCcw className="w-3 h-3" />
                  <span>Daily reset! Complete the task again to earn more points</span>
                </div>
              )}
              {!effectiveCompleted && isSocial && !twitterConnected && (
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                  <Twitter className="w-3 h-3" />
                  <span>Connect your X account to unlock social tasks</span>
                </div>
              )}

              {/* Countdown for completed on-chain tasks */}
              {effectiveCompleted && task.type === 'onchain' && countdown && (
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Resets in <span className="font-mono text-foreground">{countdown}</span></span>
                </div>
              )}

              {/* Mobile buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-3 sm:hidden">
                <Badge variant="outline" className="text-primary border-primary/30 text-xs">
                  +{task.points} pts{task.type === 'onchain' ? '/day' : ''}
                </Badge>

                {!effectiveCompleted && isSocial && !twitterConnected && (
                  <Button size="sm" variant="outline" onClick={onConnectTwitter} className="gap-1 h-8 text-xs px-2">
                    <Twitter className="w-3 h-3" /> Connect X
                  </Button>
                )}

                {!effectiveCompleted && (
                  <Button size="sm" variant="outline" onClick={handleGoToTask} className="gap-1 h-8 text-xs px-2">
                    <ArrowRight className="w-3 h-3" />
                    {task.type === 'onchain' ? ACTION_LABELS[task.action] || 'Go' : task.link ? 'Visit' : 'Go'}
                  </Button>
                )}

                {effectiveCompleted ? (
                  <Badge className="bg-success/20 text-success border-success/30 text-xs">Done ✓</Badge>
                ) : canClaim ? (
                  <Button size="sm" onClick={() => onClaim(task)} disabled={claiming} className="h-8 text-xs">
                    {claiming ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Claim'}
                  </Button>
                ) : null}
              </div>
            </div>

            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <Badge variant="outline" className="text-primary border-primary/30">
                +{task.points} pts{task.type === 'onchain' ? '/day' : ''}
              </Badge>

              {!effectiveCompleted && isSocial && !twitterConnected && (
                <Button size="sm" variant="outline" onClick={onConnectTwitter} className="gap-1.5">
                  <Twitter className="w-3.5 h-3.5" /> Connect X
                </Button>
              )}

              {!effectiveCompleted && (
                <Button size="sm" variant="outline" onClick={handleGoToTask} className="gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  {task.type === 'onchain' ? ACTION_LABELS[task.action] || 'Go' : task.link ? 'Visit Link' : 'Go'}
                </Button>
              )}

              {effectiveCompleted ? (
                <div className="flex items-center gap-2">
                  <Badge className="bg-success/20 text-success border-success/30">Done ✓</Badge>
                  {countdown && (
                    <span className="text-xs text-muted-foreground font-mono">{countdown}</span>
                  )}
                </div>
              ) : canClaim ? (
                <Button size="sm" onClick={() => onClaim(task)} disabled={claiming}>
                  {claiming ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Claiming...</> : 'Claim Points'}
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
