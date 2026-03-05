import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WaveBackground } from '@/components/WaveBackground';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  Trophy,
  Star,
  Zap,
  Gift,
  CheckCircle,
  ExternalLink,
  Crown,
  Medal,
  Target,
  Link as LinkIcon,
  ArrowRightLeft,
  Droplets,
  Leaf,
  Coins,
} from 'lucide-react';
import { toast } from 'sonner';

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

interface Completion {
  id: string;
  wallet_address: string;
  task_id: string;
  tx_hash: string | null;
  completed_at: string;
}

interface LeaderboardEntry {
  wallet_address: string;
  total_points: number;
  tasks_completed: number;
  rank: number;
}

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

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
    case 2: return <Medal className="w-6 h-6 text-gray-300" />;
    case 3: return <Medal className="w-6 h-6 text-amber-600" />;
    default: return <span className="text-muted-foreground font-mono text-sm">#{rank}</span>;
  }
};

const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

const Airdrop: React.FC = () => {
  const { address, isConnected } = useWallet();
  const [tasks, setTasks] = useState<AirdropTask[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [tab, setTab] = useState('quests');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: tasksData } = await supabase
        .from('airdrop_tasks')
        .select('*')
        .eq('active', true)
        .order('type', { ascending: true })
        .order('points', { ascending: false });

      const { data: completionsData } = await supabase
        .from('airdrop_completions')
        .select('*');

      setTasks((tasksData as AirdropTask[]) || []);
      setCompletions((completionsData as Completion[]) || []);

      if (completionsData && tasksData) {
        const pointsMap = new Map<string, { points: number; count: number }>();
        for (const c of completionsData) {
          const task = (tasksData as AirdropTask[]).find(t => t.id === c.task_id);
          if (task) {
            const existing = pointsMap.get(c.wallet_address) || { points: 0, count: 0 };
            existing.points += task.points;
            existing.count += 1;
            pointsMap.set(c.wallet_address, existing);
          }
        }
        const sorted = Array.from(pointsMap.entries())
          .map(([wallet_address, { points, count }]) => ({
            wallet_address,
            total_points: points,
            tasks_completed: count,
            rank: 0,
          }))
          .sort((a, b) => b.total_points - a.total_points);
        sorted.forEach((e, i) => e.rank = i + 1);
        setLeaderboard(sorted);
      }
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isTaskCompleted = (taskId: string) => {
    if (!address) return false;
    return completions.some(c => c.task_id === taskId && c.wallet_address.toLowerCase() === address.toLowerCase());
  };

  const handleClaimTask = async (task: AirdropTask) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }
    if (isTaskCompleted(task.id)) {
      toast.info('Task already completed!');
      return;
    }

    setClaiming(task.id);
    try {
      const { error } = await supabase.from('airdrop_completions').insert({
        wallet_address: address.toLowerCase(),
        task_id: task.id,
        tx_hash: null,
      });

      if (error) {
        if (error.code === '23505') {
          toast.info('Task already completed!');
        } else {
          throw error;
        }
      } else {
        toast.success(`+${task.points} points! Task completed 🎉`);
        await fetchData();
      }
    } catch {
      toast.error('Failed to claim task');
    } finally {
      setClaiming(null);
    }
  };

  const myPoints = address
    ? leaderboard.find(e => e.wallet_address === address.toLowerCase())?.total_points || 0
    : 0;
  const myRank = address
    ? leaderboard.find(e => e.wallet_address === address.toLowerCase())?.rank || '-'
    : '-';
  const myCompleted = address
    ? completions.filter(c => c.wallet_address.toLowerCase() === address?.toLowerCase()).length
    : 0;

  const onchainTasks = tasks.filter(t => t.type === 'onchain');
  const socialTasks = tasks.filter(t => t.type === 'social');

  const TaskCard = ({ task, index }: { task: AirdropTask; index: number }) => {
    const completed = isTaskCompleted(task.id);
    return (
      <motion.div
        key={task.id}
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
                {/* Mobile: buttons below text */}
                <div className="flex items-center gap-2 mt-3 sm:hidden">
                  {task.link && (
                    <a href={task.link} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost" className="gap-1 h-8 text-xs px-2">
                        <ExternalLink className="w-3 h-3" /> Visit
                      </Button>
                    </a>
                  )}
                  <Badge variant="outline" className="text-primary border-primary/30 text-xs">
                    +{task.points} pts
                  </Badge>
                  <Button
                    size="sm"
                    variant={completed ? 'outline' : 'default'}
                    disabled={completed || claiming === task.id}
                    onClick={() => handleClaimTask(task)}
                    className={`h-8 text-xs ${completed ? 'text-success border-success/30' : ''}`}
                  >
                    {completed ? 'Done ✓' : claiming === task.id ? '...' : 'Claim'}
                  </Button>
                </div>
              </div>
              {/* Desktop: buttons on right */}
              <div className="hidden sm:flex items-center gap-3 shrink-0">
                {task.link && (
                  <a href={task.link} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="ghost" className="gap-1">
                      <ExternalLink className="w-3 h-3" /> Visit
                    </Button>
                  </a>
                )}
                <Badge variant="outline" className="text-primary border-primary/30">
                  +{task.points} pts
                </Badge>
                <Button
                  size="sm"
                  variant={completed ? 'outline' : 'default'}
                  disabled={completed || claiming === task.id}
                  onClick={() => handleClaimTask(task)}
                  className={completed ? 'text-success border-success/30' : ''}
                >
                  {completed ? 'Done ✓' : claiming === task.id ? 'Claiming...' : 'Claim'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <WaveBackground />
      <Header />

      <main id="main-content" className="container mx-auto px-4 pt-24 pb-28 sm:pb-16 relative z-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Gift className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Airdrop Campaign</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent">
            PushDex Airdrop
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Complete quests to earn points. On-chain tasks = 2 pts, Social tasks = 1 pt.
          </p>
        </motion.div>

        {/* Stats Cards */}
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
              <div className="text-2xl sm:text-3xl font-bold">{myCompleted}/{tasks.length}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Done</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="max-w-4xl mx-auto">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-6 sm:mb-8">
            <TabsTrigger value="quests" className="gap-1.5 text-xs sm:text-sm">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Quests
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-1.5 text-xs sm:text-sm">
              <LinkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Social
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-1.5 text-xs sm:text-sm">
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Ranks
            </TabsTrigger>
          </TabsList>

          {/* Onchain Quests */}
          <TabsContent value="quests">
            <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" /> On-Chain Tasks
                <Badge variant="secondary" className="ml-2 text-xs">2 pts each</Badge>
              </h2>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
              ) : onchainTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No on-chain tasks available</div>
              ) : (
                <div className="grid gap-3 sm:gap-4">
                  {onchainTasks.map((task, i) => <TaskCard key={task.id} task={task} index={i} />)}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Social Tasks */}
          <TabsContent value="social">
            <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-primary" /> Social Tasks
                <Badge variant="secondary" className="ml-2 text-xs">1 pt each</Badge>
              </h2>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
              ) : socialTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No social tasks yet</div>
              ) : (
                <div className="grid gap-3 sm:gap-4">
                  {socialTasks.map((task, i) => <TaskCard key={task.id} task={task} index={i} />)}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Leaderboard */}
          <TabsContent value="leaderboard">
            <div className="space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" /> Leaderboard
              </h2>

              {/* Top 3 Podium */}
              {leaderboard.length >= 3 && (
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
                  {/* 2nd place */}
                  <Card className="glass-card text-center p-3 sm:p-5 border-gray-400/30 bg-gray-400/5 order-1">
                    <div className="mb-2">{getRankIcon(2)}</div>
                    <div className="font-mono text-xs sm:text-sm mb-1">{formatAddress(leaderboard[1].wallet_address)}</div>
                    <div className="text-xl sm:text-2xl font-bold">{leaderboard[1].total_points}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">{leaderboard[1].tasks_completed} tasks</div>
                  </Card>
                  {/* 1st place */}
                  <Card className="glass-card text-center p-3 sm:p-5 border-yellow-500/30 bg-yellow-500/5 order-0 sm:order-1 -mt-2 sm:-mt-4">
                    <div className="mb-2">{getRankIcon(1)}</div>
                    <div className="font-mono text-xs sm:text-sm mb-1">{formatAddress(leaderboard[0].wallet_address)}</div>
                    <div className="text-2xl sm:text-3xl font-bold text-yellow-500">{leaderboard[0].total_points}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">{leaderboard[0].tasks_completed} tasks</div>
                  </Card>
                  {/* 3rd place */}
                  <Card className="glass-card text-center p-3 sm:p-5 border-amber-600/30 bg-amber-600/5 order-2">
                    <div className="mb-2">{getRankIcon(3)}</div>
                    <div className="font-mono text-xs sm:text-sm mb-1">{formatAddress(leaderboard[2].wallet_address)}</div>
                    <div className="text-xl sm:text-2xl font-bold">{leaderboard[2].total_points}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">{leaderboard[2].tasks_completed} tasks</div>
                  </Card>
                </div>
              )}

              {/* Rest of leaderboard */}
              <div className="space-y-2">
                {leaderboard.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground">
                    No participants yet. Be the first!
                  </div>
                )}
                {leaderboard.slice(3).map((entry, i) => (
                  <motion.div
                    key={entry.wallet_address}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl ${
                      address && entry.wallet_address === address.toLowerCase()
                        ? 'bg-primary/10 border border-primary/20'
                        : 'bg-surface/40 hover:bg-surface/60'
                    } transition-colors`}
                  >
                    <div className="w-8 sm:w-10 text-center">
                      <span className="text-muted-foreground font-mono text-xs sm:text-sm">#{entry.rank}</span>
                    </div>
                    <div className="flex-1 font-mono text-xs sm:text-sm truncate">
                      {formatAddress(entry.wallet_address)}
                      {address && entry.wallet_address === address.toLowerCase() && (
                        <Badge className="ml-2 text-[10px]" variant="secondary">You</Badge>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-sm">{entry.total_points} pts</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">{entry.tasks_completed} tasks</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Airdrop;
