import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WaveBackground } from '@/components/WaveBackground';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Star,
  Zap,
  Gift,
  CheckCircle,
  ExternalLink,
  Crown,
  Medal,
  Flame,
  Target,
  Link as LinkIcon,
  ArrowRightLeft,
  Droplets,
  Leaf,
  Coins,
  Award
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
    case 1: return <Crown className="w-5 h-5 text-yellow-400" />;
    case 2: return <Medal className="w-5 h-5 text-gray-300" />;
    case 3: return <Medal className="w-5 h-5 text-amber-600" />;
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
      // Fetch tasks
      const { data: tasksData } = await supabase
        .from('airdrop_tasks')
        .select('*')
        .eq('active', true)
        .order('type', { ascending: true })
        .order('points', { ascending: false });

      // Fetch completions
      const { data: completionsData } = await supabase
        .from('airdrop_completions')
        .select('*');

      setTasks((tasksData as AirdropTask[]) || []);
      setCompletions((completionsData as Completion[]) || []);

      // Build leaderboard
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
      console.error('Error fetching airdrop data:', err);
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
    } catch (err: any) {
      console.error('Error claiming task:', err);
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

  return (
    <div className="min-h-screen bg-background">
      <WaveBackground />
      <Header />

      <main id="main-content" className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Gift className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Airdrop Campaign</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent">
            PushDex Airdrop
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Complete quests to earn points and climb the leaderboard. On-chain tasks earn 2 points, social tasks earn 1 point.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10">
          <Card className="glass-card text-center">
            <CardContent className="pt-6">
              <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <div className="text-3xl font-bold">{myPoints}</div>
              <div className="text-sm text-muted-foreground">Your Points</div>
            </CardContent>
          </Card>
          <Card className="glass-card text-center">
            <CardContent className="pt-6">
              <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold">{myRank}</div>
              <div className="text-sm text-muted-foreground">Your Rank</div>
            </CardContent>
          </Card>
          <Card className="glass-card text-center">
            <CardContent className="pt-6">
              <Target className="w-6 h-6 text-success mx-auto mb-2" />
              <div className="text-3xl font-bold">{myCompleted}/{tasks.length}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="max-w-4xl mx-auto">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-8">
            <TabsTrigger value="quests" className="gap-2"><Zap className="w-4 h-4" /> Quests</TabsTrigger>
            <TabsTrigger value="social" className="gap-2"><LinkIcon className="w-4 h-4" /> Social</TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2"><Trophy className="w-4 h-4" /> Leaderboard</TabsTrigger>
          </TabsList>

          {/* Onchain Quests */}
          <TabsContent value="quests">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" /> On-Chain Tasks
                <Badge variant="secondary" className="ml-2">2 pts each</Badge>
              </h2>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
              ) : onchainTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No on-chain tasks available</div>
              ) : (
                <div className="grid gap-4">
                  {onchainTasks.map((task, i) => {
                    const completed = isTaskCompleted(task.id);
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className={`glass-card transition-all ${completed ? 'border-success/30 bg-success/5' : 'hover:border-primary/30'}`}>
                          <CardContent className="p-5 flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${completed ? 'bg-success/20 text-success' : 'bg-primary/10 text-primary'}`}>
                              {completed ? <CheckCircle className="w-5 h-5" /> : getActionIcon(task.action)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold">{task.title}</div>
                              <div className="text-sm text-muted-foreground">{task.description}</div>
                            </div>
                            <div className="flex items-center gap-3">
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
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Social Tasks */}
          <TabsContent value="social">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-primary" /> Social Tasks
                <Badge variant="secondary" className="ml-2">1 pt each</Badge>
              </h2>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
              ) : socialTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No social tasks yet. Check back soon!</div>
              ) : (
                <div className="grid gap-4">
                  {socialTasks.map((task, i) => {
                    const completed = isTaskCompleted(task.id);
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className={`glass-card transition-all ${completed ? 'border-success/30 bg-success/5' : 'hover:border-primary/30'}`}>
                          <CardContent className="p-5 flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${completed ? 'bg-success/20 text-success' : 'bg-primary/10 text-primary'}`}>
                              {completed ? <CheckCircle className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold">{task.title}</div>
                              <div className="text-sm text-muted-foreground">{task.description}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              {task.link && (
                                <a href={task.link} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" variant="ghost" className="gap-1">
                                    <ExternalLink className="w-3 h-3" /> Visit
                                  </Button>
                                </a>
                              )}
                              <Badge variant="outline" className="text-primary border-primary/30">
                                +{task.points} pt
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
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Leaderboard */}
          <TabsContent value="leaderboard">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" /> Leaderboard
              </h2>

              {/* Top 3 */}
              {leaderboard.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {leaderboard.slice(0, 3).map((entry, i) => (
                    <Card key={entry.wallet_address} className={`glass-card text-center p-5 ${
                      i === 0 ? 'border-yellow-500/30 bg-yellow-500/5' :
                      i === 1 ? 'border-gray-400/30 bg-gray-400/5' :
                      'border-amber-600/30 bg-amber-600/5'
                    }`}>
                      <div className="mb-2">{getRankIcon(entry.rank)}</div>
                      <div className="font-mono text-sm mb-1">{formatAddress(entry.wallet_address)}</div>
                      <div className="text-2xl font-bold">{entry.total_points}</div>
                      <div className="text-xs text-muted-foreground">{entry.tasks_completed} tasks</div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Rest */}
              <div className="space-y-2">
                {leaderboard.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground">
                    No participants yet. Be the first to earn points!
                  </div>
                )}
                {leaderboard.slice(3).map((entry, i) => (
                  <motion.div
                    key={entry.wallet_address}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-4 p-4 rounded-xl ${
                      address && entry.wallet_address === address.toLowerCase()
                        ? 'bg-primary/10 border border-primary/20'
                        : 'bg-surface/40 hover:bg-surface/60'
                    } transition-colors`}
                  >
                    <div className="w-10 text-center">
                      <span className="text-muted-foreground font-mono text-sm">#{entry.rank}</span>
                    </div>
                    <div className="flex-1 font-mono text-sm">
                      {formatAddress(entry.wallet_address)}
                      {address && entry.wallet_address === address.toLowerCase() && (
                        <Badge className="ml-2 text-xs" variant="secondary">You</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{entry.total_points} pts</div>
                      <div className="text-xs text-muted-foreground">{entry.tasks_completed} tasks</div>
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
