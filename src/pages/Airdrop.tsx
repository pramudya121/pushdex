import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WaveBackground } from '@/components/WaveBackground';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Gift, Zap, Link as LinkIcon, Trophy, Twitter, CheckCircle, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { AirdropTaskCard } from '@/components/airdrop/AirdropTaskCard';
import { AirdropStatsBar } from '@/components/airdrop/AirdropStatsBar';
import { AirdropProgressCountdown } from '@/components/airdrop/AirdropProgressCountdown';
import { AirdropReferral } from '@/components/airdrop/AirdropReferral';
import { AirdropLeaderboard } from '@/components/airdrop/AirdropLeaderboard';
import { AirdropEmptyState } from '@/components/airdrop/AirdropEmptyState';
import { isTwitterConnected, setTwitterConnected } from '@/lib/airdropTracker';
import { isAdminWallet } from '@/config/admin';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

const Airdrop: React.FC = () => {
  const { address, isConnected } = useWallet();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<AirdropTask[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [tab, setTab] = useState('quests');
  const [twitterConnected, setTwitterState] = useState(false);
  const [, forceUpdate] = useState(0);
  const [showTwitterConfirm, setShowTwitterConfirm] = useState(false);

  // Check twitter connection status
  useEffect(() => {
    if (address) {
      setTwitterState(isTwitterConnected(address));
    }
  }, [address]);

  // Listen for verified action events to re-render
  useEffect(() => {
    const handleVerified = () => forceUpdate(n => n + 1);
    const handleTwitter = () => {
      if (address) setTwitterState(isTwitterConnected(address));
    };
    window.addEventListener('airdrop-action-verified', handleVerified);
    window.addEventListener('airdrop-twitter-connected', handleTwitter);
    return () => {
      window.removeEventListener('airdrop-action-verified', handleVerified);
      window.removeEventListener('airdrop-twitter-connected', handleTwitter);
    };
  }, [address]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: tasksData }, { data: completionsData }] = await Promise.all([
        supabase.from('airdrop_tasks').select('*').eq('active', true).order('type').order('points', { ascending: false }),
        supabase.from('airdrop_completions').select('*'),
      ]);

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
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime subscription for live leaderboard
  useEffect(() => {
    const channel = supabase
      .channel('airdrop-completions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'airdrop_completions' }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

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
        if (error.code === '23505') toast.info('Task already completed!');
        else throw error;
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

  const handleConnectTwitter = () => {
    if (!address) {
      toast.error('Connect your wallet first');
      return;
    }
    // Open Twitter follow page
    window.open('https://x.com/pushdex', '_blank', 'noopener,noreferrer');
    // Show confirmation dialog
    setShowTwitterConfirm(true);
  };

  const confirmTwitterConnection = () => {
    if (!address) return;
    setTwitterConnected(address);
    setTwitterState(true);
    setShowTwitterConfirm(false);
    toast.success('X/Twitter connected! You can now claim social tasks 🐦');
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

      <main id="main-content" className="container mx-auto px-4 pt-24 pb-28 sm:pb-16 relative z-10">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Gift className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Airdrop Campaign</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent">
            PushDex Airdrop
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mb-4">
            Complete quests to earn points. On-chain tasks = 2 pts, Social tasks = 1 pt.
          </p>
          {/* Admin Panel Link */}
          <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="gap-1.5 text-xs">
            <Settings className="w-3.5 h-3.5" /> Admin Panel
          </Button>
        </motion.div>

        {/* Empty state if not connected */}
        {!isConnected && <AirdropEmptyState isConnected={isConnected} />}

        {isConnected && (
          <>
            <AirdropStatsBar myPoints={myPoints} myRank={myRank} myCompleted={myCompleted} totalTasks={tasks.length} />
            <AirdropProgressCountdown completed={myCompleted} total={tasks.length} />

            {/* Connect X/Twitter Banner */}
            {!twitterConnected && (
              <Card className="glass-card max-w-2xl mx-auto mb-8 sm:mb-10 border-blue-500/20 bg-blue-500/5">
                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <Twitter className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-sm sm:text-base">Connect X/Twitter</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Follow @pushdex on X to unlock social tasks and earn bonus points</p>
                  </div>
                  <Button onClick={handleConnectTwitter} className="gap-2 bg-blue-500 hover:bg-blue-600 text-white">
                    <Twitter className="w-4 h-4" /> Connect X
                  </Button>
                </CardContent>
              </Card>
            )}
            {twitterConnected && (
              <div className="max-w-2xl mx-auto mb-4 flex items-center gap-2 text-sm text-green-400">
                <CheckCircle className="w-4 h-4" /> X/Twitter connected — social tasks unlocked!
              </div>
            )}

            <AirdropReferral walletAddress={address} isConnected={isConnected} />
          </>
        )}

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
                  {onchainTasks.map((task, i) => (
                    <AirdropTaskCard
                      key={task.id}
                      task={task}
                      index={i}
                      completed={isTaskCompleted(task.id)}
                      claiming={claiming === task.id}
                      walletAddress={address}
                      twitterConnected={twitterConnected}
                      onClaim={handleClaimTask}
                      onConnectTwitter={handleConnectTwitter}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

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
                  {socialTasks.map((task, i) => (
                    <AirdropTaskCard
                      key={task.id}
                      task={task}
                      index={i}
                      completed={isTaskCompleted(task.id)}
                      claiming={claiming === task.id}
                      walletAddress={address}
                      twitterConnected={twitterConnected}
                      onClaim={handleClaimTask}
                      onConnectTwitter={handleConnectTwitter}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            <AirdropLeaderboard leaderboard={leaderboard} loading={loading} address={address} />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Airdrop;
