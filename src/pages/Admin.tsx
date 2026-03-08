import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { WaveBackground } from '@/components/WaveBackground';
import { useWallet } from '@/contexts/WalletContext';
import { isAdminWallet } from '@/config/admin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  Plus, 
  Settings, 
  Loader2, 
  AlertCircle,
  Wallet,
  Coins,
  Leaf,
  ExternalLink,
  CheckCircle,
  XCircle,
  RefreshCw,
  DollarSign,
  ArrowUpFromLine,
  Sparkles,
  TrendingUp,
  Gift,
  Trash2,
  Download
} from 'lucide-react';
import { ethers } from 'ethers';
import { CONTRACTS, TOKEN_LIST, BLOCK_EXPLORER, RPC_URL } from '@/config/contracts';
import { STAKING_ABI, FARMING_ABI, ERC20_ABI } from '@/config/abis';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';

interface StakingPoolData {
  id: number;
  token: string;
  tokenSymbol: string;
  apr: number;
  lockPeriod: number;
  minStake: bigint;
  totalStaked: bigint;
  active: boolean;
}

interface FarmingPoolData {
  id: number;
  lpToken: string;
  lpSymbol: string;
  allocPoint: bigint;
  totalStaked: bigint;
}

interface FarmingContractInfo {
  rewardToken: string;
  rewardTokenSymbol: string;
  rewardTokenLogo: string;
  rewardPerBlock: bigint;
  startBlock: bigint;
  totalAllocPoint: bigint;
  contractRewardBalance: bigint;
  userRewardBalance: bigint;
}

const getProvider = () => new ethers.JsonRpcProvider(RPC_URL);

// Social action options for the admin form
const SOCIAL_ACTIONS = [
  { value: 'follow_twitter', label: 'Follow on X/Twitter' },
  { value: 'retweet', label: 'Retweet a Post' },
  { value: 'like_tweet', label: 'Like a Tweet' },
  { value: 'join_telegram', label: 'Join Telegram' },
  { value: 'join_discord', label: 'Join Discord' },
  { value: 'social', label: 'Other Social' },
];

// Airdrop Analytics Component
const AirdropAnalytics: React.FC = () => {
  const [stats, setStats] = useState<{
    totalParticipants: number;
    totalPoints: number;
    totalCompletions: number;
    totalTasks: number;
    activeTasks: number;
    topPerformers: { wallet: string; points: number; tasks: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const [{ data: completions }, { data: tasks }, { data: referrals }] = await Promise.all([
        supabase.from('airdrop_completions').select('*'),
        supabase.from('airdrop_tasks').select('*'),
        supabase.from('airdrop_referrals').select('*'),
      ]);

      if (completions && tasks) {
        const taskMap = new Map((tasks as any[]).map(t => [t.id, t]));
        const walletStats = new Map<string, { points: number; tasks: number }>();

        for (const c of completions) {
          const task = taskMap.get(c.task_id);
          if (task) {
            const existing = walletStats.get(c.wallet_address) || { points: 0, tasks: 0 };
            existing.points += task.points;
            existing.tasks += 1;
            walletStats.set(c.wallet_address, existing);
          }
        }

        const topPerformers = Array.from(walletStats.entries())
          .map(([wallet, s]) => ({ wallet, ...s }))
          .sort((a, b) => b.points - a.points)
          .slice(0, 10);

        const totalPoints = topPerformers.reduce((sum, p) => sum + p.points, 0);

        setStats({
          totalParticipants: walletStats.size,
          totalPoints,
          totalCompletions: completions.length,
          totalTasks: tasks.length,
          activeTasks: (tasks as any[]).filter(t => t.active).length,
          topPerformers,
        });
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>;
  if (!stats) return null;

  const formatAddr = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

  const exportLeaderboardCSV = () => {
    const rows = [['Rank', 'Wallet', 'Points', 'Tasks Completed']];
    stats.topPerformers.forEach((p, i) => rows.push([`${i + 1}`, p.wallet, `${p.points}`, `${p.tasks}`]));
    downloadCSV(rows, 'airdrop-leaderboard.csv');
  };

  const exportCompletionsCSV = async () => {
    const { data } = await supabase.from('airdrop_completions').select('*').order('completed_at', { ascending: false });
    if (!data || data.length === 0) { toast.info('No completions to export'); return; }
    const rows = [['Wallet', 'Task ID', 'TX Hash', 'Completed At']];
    data.forEach(c => rows.push([c.wallet_address, c.task_id, c.tx_hash || '', c.completed_at]));
    downloadCSV(rows, 'airdrop-completions.csv');
  };

  const downloadCSV = (rows: string[][], filename: string) => {
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filename}`);
  };

  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" onClick={exportLeaderboardCSV} className="gap-1.5">
          <Download className="w-3.5 h-3.5" /> Export Leaderboard
        </Button>
        <Button variant="outline" size="sm" onClick={exportCompletionsCSV} className="gap-1.5">
          <Download className="w-3.5 h-3.5" /> Export Completions
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Participants', value: stats.totalParticipants, icon: <Wallet className="w-5 h-5" /> },
          { label: 'Total Points', value: stats.totalPoints, icon: <Sparkles className="w-5 h-5" /> },
          { label: 'Completions', value: stats.totalCompletions, icon: <CheckCircle className="w-5 h-5" /> },
          { label: 'Active Tasks', value: `${stats.activeTasks}/${stats.totalTasks}`, icon: <TrendingUp className="w-5 h-5" /> },
        ].map(s => (
          <Card key={s.label} className="glass-card">
            <CardContent className="p-4 text-center">
              <div className="text-primary mb-2 flex justify-center">{s.icon}</div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Performers */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Top 10 Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topPerformers.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No participants yet</div>
          ) : (
            <div className="space-y-2">
              {stats.topPerformers.map((p, i) => (
                <div key={p.wallet} className="flex items-center gap-3 p-3 rounded-lg bg-surface/40">
                  <span className="text-sm font-mono text-muted-foreground w-6">#{i + 1}</span>
                  <span className="font-mono text-sm flex-1 truncate">{formatAddr(p.wallet)}</span>
                  <Badge variant="outline" className="text-primary border-primary/30">{p.points} pts</Badge>
                  <span className="text-xs text-muted-foreground">{p.tasks} tasks</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Airdrop Admin Component
const AirdropAdmin: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'onchain' | 'social'>('social');
  const [newAction, setNewAction] = useState('follow_twitter');
  const [newPoints, setNewPoints] = useState('1');
  const [newLink, setNewLink] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [adminTab, setAdminTab] = useState('manage');

  const fetchTasks = async () => {
    setLoading(true);
    const { data } = await supabase.from('airdrop_tasks').select('*').order('created_at', { ascending: false });
    setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleAddTask = async () => {
    if (!newTitle.trim()) { toast.error('Title is required'); return; }
    setIsAdding(true);
    try {
      const { error } = await supabase.from('airdrop_tasks').insert({
        title: newTitle,
        description: newDesc,
        type: newType,
        action: newAction,
        points: parseInt(newPoints) || (newType === 'onchain' ? 2 : 1),
        link: newLink || null,
        active: true,
      });
      if (error) throw error;
      toast.success('Task added!');
      setNewTitle(''); setNewDesc(''); setNewLink('');
      fetchTasks();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add task');
    } finally { setIsAdding(false); }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    await supabase.from('airdrop_tasks').update({ active: !active }).eq('id', id);
    fetchTasks();
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Delete this task? This will also remove all completions.')) return;
    await supabase.from('airdrop_tasks').delete().eq('id', id);
    toast.success('Task deleted');
    fetchTasks();
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs: Manage vs Analytics */}
      <Tabs value={adminTab} onValueChange={setAdminTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-xs mb-4">
          <TabsTrigger value="manage" className="text-xs sm:text-sm gap-1"><Gift className="w-3.5 h-3.5" /> Manage</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm gap-1"><TrendingUp className="w-3.5 h-3.5" /> Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AirdropAnalytics />
        </TabsContent>

        <TabsContent value="manage">
          {/* Add Task Form */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Airdrop Task
              </CardTitle>
              <CardDescription>Create on-chain (2 pts) or social (1 pt) tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Task Type</Label>
                  <Select value={newType} onValueChange={(v) => {
                    setNewType(v as 'onchain' | 'social');
                    if (v === 'social') { setNewAction('follow_twitter'); setNewPoints('1'); }
                    else { setNewAction('swap'); setNewPoints('2'); }
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onchain">On-Chain (2 pts)</SelectItem>
                      <SelectItem value="social">Social (1 pt)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Action</Label>
                  {newType === 'onchain' ? (
                    <Select value={newAction} onValueChange={setNewAction}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="swap">Swap</SelectItem>
                        <SelectItem value="add_liquidity">Add Liquidity</SelectItem>
                        <SelectItem value="remove_liquidity">Remove Liquidity</SelectItem>
                        <SelectItem value="farming">Farming</SelectItem>
                        <SelectItem value="staking">Staking</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select value={newAction} onValueChange={setNewAction}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SOCIAL_ACTIONS.map(a => (
                          <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder={newType === 'social' ? 'e.g. Follow @PushDex on X' : 'e.g. Perform a Swap'} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Describe the task..." rows={2} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Points</Label>
                  <Input type="number" value={newPoints} onChange={e => setNewPoints(e.target.value)} min="1" />
                </div>
                <div className="space-y-2">
                  <Label>Link {newType === 'onchain' ? '(optional)' : '(e.g. tweet/invite URL)'}</Label>
                  <Input value={newLink} onChange={e => setNewLink(e.target.value)} placeholder={newType === 'social' ? 'https://x.com/pushdex/status/...' : 'https://...'} />
                </div>
              </div>
              <Button onClick={handleAddTask} disabled={isAdding} className="w-full">
                {isAdding ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Adding...</> : <><Plus className="w-4 h-4 mr-2" /> Add Task</>}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Tasks */}
          <Card className="glass-card mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                All Tasks ({tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No tasks yet</div>
              ) : (
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div key={task.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${task.active ? 'bg-surface/40 border-border' : 'bg-muted/20 border-border/30 opacity-60'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{task.title}</span>
                          <Badge variant="outline" className={task.type === 'onchain' ? 'text-primary border-primary/30' : 'text-accent border-accent/30'}>
                            {task.type} · {task.action} · {task.points}pt
                          </Badge>
                          {!task.active && <Badge variant="secondary">Disabled</Badge>}
                        </div>
                        {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                        {task.link && <p className="text-xs text-muted-foreground mt-0.5 truncate">🔗 {task.link}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={task.active} onCheckedChange={() => handleToggleActive(task.id, task.active)} />
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Admin: React.FC = () => {
  const { signer, address, isConnected } = useWallet();
  
  // State for staking admin
  const [stakingOwner, setStakingOwner] = useState<string>('');
  const [isStakingOwner, setIsStakingOwner] = useState(false);
  const [stakingPools, setStakingPools] = useState<StakingPoolData[]>([]);
  const [isLoadingStaking, setIsLoadingStaking] = useState(true);
  
  // State for farming admin
  const [farmingPools, setFarmingPools] = useState<FarmingPoolData[]>([]);
  const [isLoadingFarming, setIsLoadingFarming] = useState(true);
  const [farmingInfo, setFarmingInfo] = useState<FarmingContractInfo | null>(null);
  
  // Add Pool Form State
  const [selectedToken, setSelectedToken] = useState('');
  const [apr, setApr] = useState('');
  const [lockPeriodDays, setLockPeriodDays] = useState('');
  const [minStake, setMinStake] = useState('');
  const [isAddingPool, setIsAddingPool] = useState(false);
  
  // Add Farm Form State
  const [lpTokenAddress, setLpTokenAddress] = useState('');
  const [allocPoint, setAllocPoint] = useState('');
  const [isAddingFarm, setIsAddingFarm] = useState(false);

  // Funding Form State
  const [fundAmount, setFundAmount] = useState('');
  const [isFunding, setIsFunding] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

// Set Reward Per Block State
  const [newRewardPerBlock, setNewRewardPerBlock] = useState('');
  const [isSettingReward, setIsSettingReward] = useState(false);
  const [farmingOwner, setFarmingOwner] = useState<string>('');
  const [isFarmingOwner, setIsFarmingOwner] = useState(false);
  const [rewardFunctionName, setRewardFunctionName] = useState<string | null>(null);
  const [isCheckingRewardFunction, setIsCheckingRewardFunction] = useState(true);

  // Withdraw Rewards State (Owner only)
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Mass Update Pools State
  const [isMassUpdating, setIsMassUpdating] = useState(false);

  // Current Block State
  const [currentBlock, setCurrentBlock] = useState<number>(0);

  // Check ownership and fetch pools
  useEffect(() => {
    const fetchData = async () => {
      const provider = getProvider();
      
      // Fetch staking data
      try {
        setIsLoadingStaking(true);
        const stakingContract = new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, provider);
        const owner = await stakingContract.owner();
        setStakingOwner(owner);
        setIsStakingOwner(address?.toLowerCase() === owner.toLowerCase());
        
        // Fetch staking pools
        const pools: StakingPoolData[] = [];
        let poolIndex = 0;
        let hasMore = true;
        
        while (hasMore && poolIndex < 50) {
          try {
            const poolData = await stakingContract.pools(poolIndex);
            const tokenAddress = poolData[0];
            
            let tokenSymbol = 'Unknown';
            const token = TOKEN_LIST.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());
            if (token) {
              tokenSymbol = token.symbol;
            } else {
              try {
                const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
                tokenSymbol = await tokenContract.symbol();
              } catch {}
            }
            
            pools.push({
              id: poolIndex,
              token: tokenAddress,
              tokenSymbol,
              apr: Number(poolData[1]),
              lockPeriod: Number(poolData[2]),
              minStake: poolData[3],
              totalStaked: poolData[4],
              active: poolData[5],
            });
            poolIndex++;
          } catch {
            hasMore = false;
          }
        }
        setStakingPools(pools);
      } catch (error) {
        console.error('Error fetching staking data:', error);
      } finally {
        setIsLoadingStaking(false);
      }
      
      // Fetch farming data
      try {
        setIsLoadingFarming(true);
        const farmingContract = new ethers.Contract(CONTRACTS.FARMING, FARMING_ABI, provider);
        
        // Get farming contract info
        const [poolLength, rewardToken, rewardPerBlock, totalAllocPoint, startBlock, blockNumber] = await Promise.all([
          farmingContract.poolLength().catch(() => BigInt(0)),
          farmingContract.rewardToken().catch(() => ''),
          farmingContract.rewardPerBlock().catch(() => BigInt(0)),
          farmingContract.totalAllocPoint().catch(() => BigInt(0)),
          farmingContract.startBlock().catch(() => BigInt(0)),
          provider.getBlockNumber().catch(() => 0),
        ]);

        setCurrentBlock(blockNumber);

        // Try multiple ways to get owner (different contracts use different function names)
        let farmOwner = '';
        const ownerFunctions = ['owner', 'admin', 'governance', 'dev'];
        
        for (const funcName of ownerFunctions) {
          if (farmOwner) break;
          try {
            // Create a minimal ABI for just the owner function
            const minAbi = [{
              inputs: [],
              name: funcName,
              outputs: [{ internalType: "address", name: "", type: "address" }],
              stateMutability: "view",
              type: "function",
            }];
            const tempContract = new ethers.Contract(CONTRACTS.FARMING, minAbi, provider);
            farmOwner = await tempContract[funcName]();
            console.log(`Found owner via ${funcName}():`, farmOwner);
          } catch (e) {
            console.log(`No ${funcName}() function or error:`, e);
          }
        }

        // Set farming owner state 
        setFarmingOwner(farmOwner);
        
        // Check if connected user is owner (case-insensitive comparison)
        if (address && farmOwner && farmOwner !== ethers.ZeroAddress) {
          const isOwner = address.toLowerCase() === farmOwner.toLowerCase();
          console.log('Connected address:', address);
          console.log('Farming contract owner:', farmOwner);
          console.log('Is farming owner:', isOwner);
          setIsFarmingOwner(isOwner);
        } else {
          console.log('No owner found or address not connected');
          // If no owner function exists, allow admin access for the connected user
          // This is a fallback for contracts without owner() function
          if (!farmOwner && address) {
            console.log('No owner function found - enabling admin mode for connected wallet');
            setIsFarmingOwner(true);
          } else {
            setIsFarmingOwner(false);
          }
        }

        // Check which reward function is available on the contract
        setIsCheckingRewardFunction(true);
        const rewardFunctions = [
          'updateRewardPerBlock',
          'setRewardPerBlock', 
          'updateEmissionRate',
          'setEmissionRate',
          'updateReward',
          'setReward',
        ];
        
        let foundFunction: string | null = null;
        for (const funcName of rewardFunctions) {
          try {
            const checkAbi = [{
              inputs: [{ type: 'uint256', name: '_value' }],
              name: funcName,
              outputs: [],
              stateMutability: 'nonpayable',
              type: 'function',
            }];
            const checkContract = new ethers.Contract(CONTRACTS.FARMING, checkAbi, provider);
            // Try to encode the function call to check if it exists
            await checkContract[funcName].staticCall(ethers.parseEther('1')).catch((e: any) => {
              // If error is NOT "missing revert data", the function exists
              if (!e.message?.includes('missing revert data')) {
                throw e; // Re-throw to be caught and mark as found
              }
              throw new Error('Function not found');
            });
            foundFunction = funcName;
            console.log(`Found reward function: ${funcName}`);
            break;
          } catch (e: any) {
            if (!e.message?.includes('Function not found') && !e.message?.includes('missing revert data')) {
              // Function exists but reverted for other reasons (like not owner)
              foundFunction = funcName;
              console.log(`Found reward function (reverted): ${funcName}`);
              break;
            }
          }
        }
        setRewardFunctionName(foundFunction);
        setIsCheckingRewardFunction(false);
        console.log('Available reward function:', foundFunction);

        // Check if we have a valid reward token
        if (!rewardToken || rewardToken === '' || rewardToken === ethers.ZeroAddress) {
          console.log('No valid reward token found');
          // Still set basic farming info even without reward token
          setFarmingInfo({
            rewardToken: rewardToken || ethers.ZeroAddress,
            rewardTokenSymbol: 'UNKNOWN',
            rewardTokenLogo: '/tokens/pc.png',
            rewardPerBlock,
            startBlock,
            totalAllocPoint,
            contractRewardBalance: BigInt(0),
            userRewardBalance: BigInt(0),
          });
        } else {
          // Get reward token details with error handling
          const rewardTokenContract = new ethers.Contract(rewardToken, ERC20_ABI, provider);
          
          let contractRewardBalance = BigInt(0);
          let rewardTokenSymbol = 'UNKNOWN';
          let userRewardBalance = BigInt(0);

          try {
            contractRewardBalance = await rewardTokenContract.balanceOf(CONTRACTS.FARMING);
          } catch (e) {
            console.log('Error fetching contract reward balance:', e);
          }

          try {
            rewardTokenSymbol = await rewardTokenContract.symbol();
          } catch (e) {
            console.log('Error fetching reward token symbol:', e);
            // Try to get from token list
            const tokenFromList = TOKEN_LIST.find(t => t.address.toLowerCase() === rewardToken.toLowerCase());
            rewardTokenSymbol = tokenFromList?.symbol || 'UNKNOWN';
          }

          // Get user's reward token balance if connected
          if (address) {
            try {
              userRewardBalance = await rewardTokenContract.balanceOf(address);
            } catch (e) {
              console.log('Error fetching user reward balance:', e);
            }
          }

          const tokenFromList = TOKEN_LIST.find(t => t.address.toLowerCase() === rewardToken.toLowerCase());
          
          setFarmingInfo({
            rewardToken,
            rewardTokenSymbol,
            rewardTokenLogo: tokenFromList?.logo || '/tokens/pc.png',
            rewardPerBlock,
            startBlock,
            totalAllocPoint,
            contractRewardBalance,
            userRewardBalance,
          });
        }
        
        const farms: FarmingPoolData[] = [];
        for (let i = 0; i < Number(poolLength); i++) {
          try {
            const poolInfo = await farmingContract.poolInfo(i);
            const lpAddress = poolInfo[0];
            
            // Get LP token info using PAIR_ABI for token0/token1
            const PAIR_ABI_MINI = [
              'function token0() view returns (address)',
              'function token1() view returns (address)',
              'function balanceOf(address) view returns (uint256)',
            ];
            const lpContract = new ethers.Contract(lpAddress, PAIR_ABI_MINI, provider);
            
            const [token0, token1] = await Promise.all([
              lpContract.token0(),
              lpContract.token1(),
            ]);
            
            // Get token symbols from TOKEN_LIST first, then from contract
            const getSymbolFromList = (addr: string) => {
              const token = TOKEN_LIST.find(t => t.address.toLowerCase() === addr.toLowerCase());
              return token?.symbol || null;
            };
            
            let token0Symbol = getSymbolFromList(token0);
            let token1Symbol = getSymbolFromList(token1);
            
            if (!token0Symbol || !token1Symbol) {
              const [t0Symbol, t1Symbol] = await Promise.all([
                token0Symbol ? Promise.resolve(token0Symbol) : new ethers.Contract(token0, ERC20_ABI, provider).symbol().catch(() => 'Unknown'),
                token1Symbol ? Promise.resolve(token1Symbol) : new ethers.Contract(token1, ERC20_ABI, provider).symbol().catch(() => 'Unknown'),
              ]);
              token0Symbol = t0Symbol;
              token1Symbol = t1Symbol;
            }
            
            const totalStaked = await lpContract.balanceOf(CONTRACTS.FARMING);
            
            farms.push({
              id: i,
              lpToken: lpAddress,
              lpSymbol: `${token0Symbol}-${token1Symbol}`,
              allocPoint: poolInfo[1],
              totalStaked,
            });
          } catch (e) {
            console.log('Error fetching farm pool', i, e);
          }
        }
        setFarmingPools(farms);
      } catch (error) {
        console.error('Error fetching farming data:', error);
      } finally {
        setIsLoadingFarming(false);
      }
    };
    
    fetchData();
  }, [address]);

  const handleAddStakingPool = async () => {
    if (!signer || !isStakingOwner) {
      toast.error('You must be the contract owner');
      return;
    }
    
    if (!selectedToken || !apr || !minStake) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      setIsAddingPool(true);
      const contract = new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, signer);
      
      const lockPeriodSeconds = parseInt(lockPeriodDays || '0') * 86400; // Convert days to seconds
      const minStakeWei = ethers.parseEther(minStake);
      
      toast.info('Adding staking pool...');
      const tx = await contract.addPool(
        selectedToken,
        parseInt(apr),
        lockPeriodSeconds,
        minStakeWei
      );
      await tx.wait();
      
      toast.success('Staking pool added successfully!');
      
      // Reset form
      setSelectedToken('');
      setApr('');
      setLockPeriodDays('');
      setMinStake('');
      
      // Refresh pools
      window.location.reload();
    } catch (error: any) {
      console.error('Error adding pool:', error);
      toast.error(error.reason || error.message || 'Failed to add pool');
    } finally {
      setIsAddingPool(false);
    }
  };

  const handleSetPoolStatus = async (poolId: number, status: boolean) => {
    if (!signer || !isStakingOwner) {
      toast.error('You must be the contract owner');
      return;
    }
    
    try {
      const contract = new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, signer);
      
      toast.info(`${status ? 'Activating' : 'Deactivating'} pool...`);
      const tx = await contract.setPoolStatus(poolId, status);
      await tx.wait();
      
      toast.success(`Pool ${status ? 'activated' : 'deactivated'} successfully!`);
      
      // Update local state
      setStakingPools(prev => prev.map(p => 
        p.id === poolId ? { ...p, active: status } : p
      ));
    } catch (error: any) {
      console.error('Error setting pool status:', error);
      toast.error(error.reason || error.message || 'Failed to update pool status');
    }
  };

  const handleAddFarmingPool = async () => {
    if (!signer) {
      toast.error('Please connect your wallet');
      return;
    }
    
    if (!lpTokenAddress || !allocPoint) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      setIsAddingFarm(true);
      const contract = new ethers.Contract(CONTRACTS.FARMING, FARMING_ABI, signer);
      
      toast.info('Adding farming pool...');
      const tx = await contract.add(parseInt(allocPoint), lpTokenAddress);
      await tx.wait();
      
      toast.success('Farming pool added successfully!');
      
      // Reset form
      setLpTokenAddress('');
      setAllocPoint('');
      
      // Refresh
      window.location.reload();
    } catch (error: any) {
      console.error('Error adding farm:', error);
      toast.error(error.reason || error.message || 'Failed to add farm');
    } finally {
      setIsAddingFarm(false);
    }
  };

  const handleFundFarming = async () => {
    if (!signer || !address || !farmingInfo) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setIsFunding(true);
      const rewardTokenContract = new ethers.Contract(farmingInfo.rewardToken, ERC20_ABI, signer);
      const amountWei = ethers.parseEther(fundAmount);

      // Check user's balance
      if (farmingInfo.userRewardBalance < amountWei) {
        toast.error(`Insufficient balance. You have ${ethers.formatEther(farmingInfo.userRewardBalance)} ${farmingInfo.rewardTokenSymbol}`);
        return;
      }

      // Check allowance
      const allowance = await rewardTokenContract.allowance(address, CONTRACTS.FARMING);
      
      if (allowance < amountWei) {
        setIsApproving(true);
        toast.info(`Approving ${farmingInfo.rewardTokenSymbol}...`);
        const approveTx = await rewardTokenContract.approve(CONTRACTS.FARMING, ethers.MaxUint256);
        await approveTx.wait();
        toast.success('Approval successful!');
        setIsApproving(false);
      }

      // Transfer tokens to farming contract
      toast.info(`Transferring ${fundAmount} ${farmingInfo.rewardTokenSymbol} to farming contract...`);
      const transferTx = await rewardTokenContract.transfer(CONTRACTS.FARMING, amountWei);
      await transferTx.wait();

      toast.success(`Successfully funded farming contract with ${fundAmount} ${farmingInfo.rewardTokenSymbol}!`);
      setFundAmount('');
      
      // Refresh
      window.location.reload();
    } catch (error: any) {
      console.error('Error funding farming:', error);
      toast.error(error.reason || error.message || 'Failed to fund farming contract');
    } finally {
      setIsFunding(false);
      setIsApproving(false);
    }
  };

  const handleSetRewardPerBlock = async () => {
    if (!signer) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!newRewardPerBlock || parseFloat(newRewardPerBlock) < 0) {
      toast.error('Please enter a valid reward per block');
      return;
    }

    if (!rewardFunctionName) {
      toast.error('This farming contract does not support changing reward per block. The contract needs to be upgraded.');
      return;
    }

    try {
      setIsSettingReward(true);
      const rewardWei = ethers.parseEther(newRewardPerBlock);
      
      console.log('Setting reward per block to:', newRewardPerBlock, 'wei:', rewardWei.toString());
      console.log('Using function:', rewardFunctionName);
      toast.info(`Updating reward per block using ${rewardFunctionName}...`);
      
      const minAbi = [{
        inputs: [{ type: 'uint256', name: '_value' }],
        name: rewardFunctionName,
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      }];
      
      const farmingContract = new ethers.Contract(CONTRACTS.FARMING, minAbi, signer);
      const tx = await farmingContract[rewardFunctionName](rewardWei);
      
      toast.info('Transaction submitted, waiting for confirmation...');
      console.log('Transaction hash:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      toast.success(`Reward per block set to ${newRewardPerBlock} ${farmingInfo?.rewardTokenSymbol}!`);
      setNewRewardPerBlock('');
      
      // Refresh the page to see updated values
      window.location.reload();
    } catch (error: any) {
      console.error('Error setting reward per block:', error);
      
      // Parse the error message for better user feedback
      let errorMessage = 'Failed to set reward per block';
      
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction was rejected by user';
      } else if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message?.includes('Ownable')) {
        errorMessage = 'Only contract owner can set reward per block';
      } else if (error.message?.includes('execution reverted')) {
        errorMessage = 'Transaction reverted - you may not have permission';
      } else if (error.message?.includes('missing revert data')) {
        errorMessage = 'Function not found on contract - the contract may need to be upgraded';
      } else if (error.message) {
        errorMessage = error.message.slice(0, 100);
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSettingReward(false);
    }
  };

  const handleWithdrawRewards = async () => {
    if (!signer || !isFarmingOwner || !farmingInfo) {
      toast.error('You must be the farming contract owner');
      return;
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amountWei = ethers.parseEther(withdrawAmount);
    if (amountWei > farmingInfo.contractRewardBalance) {
      toast.error('Amount exceeds contract balance');
      return;
    }

    try {
      setIsWithdrawing(true);
      const rewardTokenContract = new ethers.Contract(farmingInfo.rewardToken, ERC20_ABI, signer);
      
      // Note: This assumes the farming contract has a withdraw function for the owner
      // If not available, we'll show an error
      toast.info(`Withdrawing ${withdrawAmount} ${farmingInfo.rewardTokenSymbol}...`);
      
      // Try to call withdrawReward or similar function
      const farmingContract = new ethers.Contract(CONTRACTS.FARMING, FARMING_ABI, signer);
      
      // Check if contract has withdrawReward function
      try {
        const tx = await farmingContract.withdrawReward(amountWei);
        await tx.wait();
        toast.success(`Successfully withdrew ${withdrawAmount} ${farmingInfo.rewardTokenSymbol}!`);
        setWithdrawAmount('');
        window.location.reload();
      } catch {
        // If withdrawReward doesn't exist, show info message
        toast.error('Withdraw function not available on this contract. Contact the developer.');
      }
    } catch (error: any) {
      console.error('Error withdrawing rewards:', error);
      toast.error(error.reason || error.message || 'Failed to withdraw rewards');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleMassUpdatePools = async () => {
    if (!signer) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsMassUpdating(true);
      const farmingContract = new ethers.Contract(CONTRACTS.FARMING, FARMING_ABI, signer);
      
      toast.info('Updating all farming pools...');
      const tx = await farmingContract.massUpdatePools();
      await tx.wait();
      
      toast.success('All pools updated successfully!');
    } catch (error: any) {
      console.error('Error mass updating pools:', error);
      toast.error(error.reason || error.message || 'Failed to update pools');
    } finally {
      setIsMassUpdating(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background wave-bg">
        <WaveBackground />
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
          <Card className="glass-card max-w-md mx-auto animate-fade-in">
            <CardContent className="py-12">
              <div className="text-center">
                <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                <p className="text-muted-foreground">
                  Connect your wallet to access admin functions
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!isAdminWallet(address)) {
    return (
      <div className="min-h-screen bg-background wave-bg">
        <WaveBackground />
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
          <Card className="glass-card max-w-md mx-auto animate-fade-in">
            <CardContent className="py-12">
              <div className="text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-destructive" />
                <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
                <p className="text-muted-foreground">
                  Your wallet is not authorized to access the admin panel.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const contractBalanceFormatted = farmingInfo ? parseFloat(ethers.formatEther(farmingInfo.contractRewardBalance)).toFixed(4) : '0';
  const userBalanceFormatted = farmingInfo ? parseFloat(ethers.formatEther(farmingInfo.userRewardBalance)).toFixed(4) : '0';
  const hasLowBalance = farmingInfo ? farmingInfo.contractRewardBalance < ethers.parseEther('100') : true;

  return (
    <div className="min-h-screen bg-background wave-bg">
      <WaveBackground />
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-warning/10 border border-warning/20">
            <Shield className="w-5 h-5 text-warning" />
            <span className="text-warning font-medium">Admin Panel</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Contract Management</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Manage staking and farming pools. Only contract owners can add new pools.
          </p>
        </div>

        {/* Ownership Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 animate-stagger">
          <Card className="glass-card hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Staking Contract</p>
                    <p className="font-medium text-foreground truncate max-w-[200px]">
                      {CONTRACTS.STAKING.slice(0, 10)}...{CONTRACTS.STAKING.slice(-8)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isStakingOwner ? (
                    <Badge className="bg-success/20 text-success border-success/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Owner
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <XCircle className="w-3 h-3 mr-1" />
                      Not Owner
                    </Badge>
                  )}
                  <a
                    href={`${BLOCK_EXPLORER}/address/${CONTRACTS.STAKING}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover:border-accent/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Farming Contract</p>
                    <p className="font-medium text-foreground truncate max-w-[200px]">
                      {CONTRACTS.FARMING.slice(0, 10)}...{CONTRACTS.FARMING.slice(-8)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isFarmingOwner ? (
                    <Badge className="bg-success/20 text-success border-success/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Owner
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <XCircle className="w-3 h-3 mr-1" />
                      Viewer
                    </Badge>
                  )}
                  <a
                    href={`${BLOCK_EXPLORER}/address/${CONTRACTS.FARMING}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="staking" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4">
            <TabsTrigger value="staking" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Coins className="w-4 h-4 mr-2" />
              Staking
            </TabsTrigger>
            <TabsTrigger value="farming" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Leaf className="w-4 h-4 mr-2" />
              Farming
            </TabsTrigger>
            <TabsTrigger value="funding" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <DollarSign className="w-4 h-4 mr-2" />
              Funding
            </TabsTrigger>
            <TabsTrigger value="airdrop" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Gift className="w-4 h-4 mr-2" />
              Airdrop
            </TabsTrigger>
          </TabsList>

          {/* Staking Tab */}
          <TabsContent value="staking" className="space-y-6 animate-fade-in">
            {/* Add Pool Form */}
            {isStakingOwner && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add Staking Pool
                  </CardTitle>
                  <CardDescription>
                    Create a new single-token staking pool
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Token</Label>
                      <Select value={selectedToken} onValueChange={setSelectedToken}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select token" />
                        </SelectTrigger>
                        <SelectContent>
                          {TOKEN_LIST.map((token) => (
                            <SelectItem key={token.address || 'native'} value={token.address || 'native'}>
                              <div className="flex items-center gap-2">
                                <img src={token.logo} alt={token.symbol} className="w-5 h-5 rounded-full" />
                                {token.symbol}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>APR (%)</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 50"
                        value={apr}
                        onChange={(e) => setApr(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Lock Period (Days)</Label>
                      <Input
                        type="number"
                        placeholder="0 for no lock"
                        value={lockPeriodDays}
                        onChange={(e) => setLockPeriodDays(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Minimum Stake</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 100"
                        value={minStake}
                        onChange={(e) => setMinStake(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleAddStakingPool}
                    disabled={isAddingPool}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {isAddingPool ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding Pool...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Staking Pool
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {!isStakingOwner && (
              <Alert className="border-warning/30 bg-warning/5">
                <AlertCircle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-foreground">
                  You are not the owner of the staking contract. Only the owner ({stakingOwner.slice(0, 10)}...{stakingOwner.slice(-8)}) can add new pools.
                </AlertDescription>
              </Alert>
            )}

            {/* Existing Pools */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Existing Staking Pools ({stakingPools.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStaking ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-4">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                    ))}
                  </div>
                ) : stakingPools.length > 0 ? (
                  <div className="space-y-4">
                    {stakingPools.map((pool, index) => (
                      <div 
                        key={pool.id} 
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/30 hover:border-primary/30 transition-all duration-300"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="font-bold text-primary">{pool.id}</span>
                          </div>
                          <div>
                            <p className="font-semibold">{pool.tokenSymbol}</p>
                            <p className="text-sm text-muted-foreground">
                              APR: {pool.apr}% | Lock: {pool.lockPeriod / 86400}d | Min: {ethers.formatEther(pool.minStake)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total Staked</p>
                            <p className="font-semibold">{parseFloat(ethers.formatEther(pool.totalStaked)).toFixed(2)}</p>
                          </div>
                          {isStakingOwner && (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={pool.active}
                                onCheckedChange={(checked) => handleSetPoolStatus(pool.id, checked)}
                              />
                              <span className={`text-sm ${pool.active ? 'text-success' : 'text-muted-foreground'}`}>
                                {pool.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          )}
                          {!isStakingOwner && (
                            <Badge variant={pool.active ? 'default' : 'secondary'}>
                              {pool.active ? 'Active' : 'Inactive'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Coins className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No staking pools found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Farming Tab */}
          <TabsContent value="farming" className="space-y-6 animate-fade-in">
            {/* Add Farm Form */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Farming Pool
                </CardTitle>
                <CardDescription>
                  Add a new LP token farming pool (requires owner permissions)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>LP Token Address</Label>
                    <Input
                      placeholder="0x..."
                      value={lpTokenAddress}
                      onChange={(e) => setLpTokenAddress(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Allocation Points</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 100"
                      value={allocPoint}
                      onChange={(e) => setAllocPoint(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleAddFarmingPool}
                  disabled={isAddingFarm}
                  className="w-full bg-accent hover:bg-accent/90"
                >
                  {isAddingFarm ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding Farm...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Farming Pool
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Farms */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Existing Farming Pools ({farmingPools.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingFarming ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-4">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : farmingPools.length > 0 ? (
                  <div className="space-y-4">
                    {farmingPools.map((farm, index) => (
                      <div 
                        key={farm.id} 
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/30 hover:border-accent/30 transition-all duration-300"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                            <span className="font-bold text-accent">{farm.id}</span>
                          </div>
                          <div>
                            <p className="font-semibold">{farm.lpSymbol} LP</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {farm.lpToken.slice(0, 10)}...{farm.lpToken.slice(-8)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Alloc Points</p>
                            <p className="font-semibold">{farm.allocPoint.toString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total Staked</p>
                            <p className="font-semibold">{parseFloat(ethers.formatEther(farm.totalStaked)).toFixed(4)}</p>
                          </div>
                          <a
                            href={`${BLOCK_EXPLORER}/address/${farm.lpToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Leaf className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No farming pools found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Funding Tab */}
          <TabsContent value="funding" className="space-y-6 animate-fade-in">
            {/* Contract Balance Overview */}
            <Card className={`glass-card ${hasLowBalance ? 'border-destructive/50' : 'border-success/30'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-warning" />
                  Farming Contract Reward Balance
                </CardTitle>
                <CardDescription>
                  Fund the farming contract with reward tokens to enable staking/harvesting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingFarming ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : farmingInfo ? (
                  <>
                    {/* Balance Display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-muted/30 rounded-xl p-6 border border-border/30">
                        <div className="flex items-center gap-3 mb-4">
                          <img 
                            src={farmingInfo.rewardTokenLogo}
                            alt={farmingInfo.rewardTokenSymbol}
                            className="w-10 h-10 rounded-full"
                            onError={(e) => { e.currentTarget.src = '/tokens/pc.png'; }}
                          />
                          <div>
                            <p className="text-sm text-muted-foreground">Contract Balance</p>
                            <p className={`text-2xl font-bold ${hasLowBalance ? 'text-destructive' : 'text-success'}`}>
                              {contractBalanceFormatted} {farmingInfo.rewardTokenSymbol}
                            </p>
                          </div>
                        </div>
                        {hasLowBalance && (
                          <div className="flex items-center gap-2 text-destructive text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <span>Low balance! Users cannot stake/harvest.</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-muted/30 rounded-xl p-6 border border-border/30">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Your Balance</p>
                            <p className="text-2xl font-bold text-foreground">
                              {userBalanceFormatted} {farmingInfo.rewardTokenSymbol}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contract Info */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-muted/20 rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Reward Per Block</p>
                        <p className="font-semibold text-foreground">
                          {parseFloat(ethers.formatEther(farmingInfo.rewardPerBlock)).toFixed(6)}
                        </p>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Start Block</p>
                        <p className="font-semibold text-foreground">
                          {farmingInfo.startBlock.toString()}
                        </p>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Current Block</p>
                        <p className="font-semibold text-foreground">
                          {currentBlock.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Total Alloc Points</p>
                        <p className="font-semibold text-foreground">
                          {farmingInfo.totalAllocPoint.toString()}
                        </p>
                      </div>
                      <div className="bg-muted/20 rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Active Pools</p>
                        <p className="font-semibold text-foreground">
                          {farmingPools.length}
                        </p>
                      </div>
                    </div>

                    {/* Mass Update Pools Button */}
                    <div className="flex items-center justify-between border-t border-border/30 pt-6">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <RefreshCw className="w-4 h-4" />
                          Pool Management
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Update all pools to sync reward calculations
                        </p>
                      </div>
                      <Button
                        onClick={handleMassUpdatePools}
                        disabled={isMassUpdating}
                        variant="outline"
                        className="min-w-[160px]"
                      >
                        {isMassUpdating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Mass Update Pools
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Set Reward Per Block Section */}
                    <div className="border-t border-border/30 pt-6 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="font-semibold flex items-center gap-2 text-warning">
                          <TrendingUp className="w-4 h-4" />
                          Set Reward Per Block
                        </h4>
                        <div className="flex items-center gap-3">
                          {farmingOwner ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Owner:</span>
                              <a
                                href={`${BLOCK_EXPLORER}/address/${farmingOwner}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-mono text-primary hover:underline"
                              >
                                {farmingOwner.slice(0, 6)}...{farmingOwner.slice(-4)}
                              </a>
                              {isFarmingOwner && (
                                <Badge variant="default" className="bg-success text-success-foreground text-xs">
                                  You
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No owner function found</span>
                          )}
                          
                          {/* Admin Override Toggle */}
                          <div className="flex items-center gap-2 border-l border-border/30 pl-3">
                            <Switch
                              id="admin-override"
                              checked={isFarmingOwner}
                              onCheckedChange={setIsFarmingOwner}
                            />
                            <Label htmlFor="admin-override" className="text-xs text-muted-foreground cursor-pointer">
                              Admin Mode
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Debug Info */}
                      <div className="bg-muted/20 rounded-lg p-3 text-xs">
                        <p className="text-muted-foreground">
                          <span className="font-semibold">Your Address:</span> {address || 'Not connected'}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-semibold">Contract Owner:</span> {farmingOwner || 'Unable to fetch'}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-semibold">Admin Access:</span>{' '}
                          <span className={isFarmingOwner ? 'text-success' : 'text-destructive'}>
                            {isFarmingOwner ? 'Enabled' : 'Disabled'}
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-semibold">Set Reward Function:</span>{' '}
                          {isCheckingRewardFunction ? (
                            <span className="text-muted-foreground">Checking...</span>
                          ) : rewardFunctionName ? (
                            <span className="text-success">{rewardFunctionName}() ✓</span>
                          ) : (
                            <span className="text-destructive">Not available ✗</span>
                          )}
                        </p>
                      </div>

                      {!isCheckingRewardFunction && !rewardFunctionName && (
                        <Alert className="border-warning/50 bg-warning/10">
                          <AlertCircle className="h-4 w-4 text-warning" />
                          <AlertDescription className="text-warning">
                            <strong>Contract Limitation:</strong> The deployed farming contract does not have a function to update reward per block. 
                            You need to deploy a new farming contract with <code className="bg-muted px-1 rounded">updateRewardPerBlock(uint256)</code> or similar function.
                          </AlertDescription>
                        </Alert>
                      )}

                      {farmingInfo.rewardPerBlock === BigInt(0) && rewardFunctionName && (
                        <Alert className="border-destructive/50 bg-destructive/10">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <AlertDescription className="text-destructive">
                            <strong>Critical:</strong> Reward per block is 0! Users cannot earn rewards. 
                            Set a value below to enable farming rewards.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex gap-4">
                        <div className="flex-1">
                          <Input
                            type="number"
                            placeholder="e.g. 0.1 (tokens per block)"
                            value={newRewardPerBlock}
                            onChange={(e) => setNewRewardPerBlock(e.target.value)}
                            step="0.000001"
                            disabled={!isFarmingOwner || !rewardFunctionName || isCheckingRewardFunction}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Current: {parseFloat(ethers.formatEther(farmingInfo.rewardPerBlock)).toFixed(6)} {farmingInfo.rewardTokenSymbol}/block
                          </p>
                        </div>
                        <Button
                          onClick={handleSetRewardPerBlock}
                          disabled={isSettingReward || !newRewardPerBlock || !isFarmingOwner || !rewardFunctionName || isCheckingRewardFunction}
                          className="bg-warning hover:bg-warning/90 text-warning-foreground min-w-[180px]"
                        >
                          {isSettingReward ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Setting...
                            </>
                          ) : isCheckingRewardFunction ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Checking...
                            </>
                          ) : !rewardFunctionName ? (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Not Supported
                            </>
                          ) : (
                            <>
                              <Settings className="w-4 h-4 mr-2" />
                              Set Reward Rate
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This controls how many reward tokens are distributed per block across all pools.
                      </p>
                    </div>

                    {/* Fund Form */}
                    <div className="border-t border-border/30 pt-6 space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <ArrowUpFromLine className="w-4 h-4" />
                        Fund Farming Contract
                      </h4>
                      <div className="flex gap-4">
                        <div className="flex-1 relative">
                          <Input
                            type="number"
                            placeholder={`Amount of ${farmingInfo.rewardTokenSymbol}`}
                            value={fundAmount}
                            onChange={(e) => setFundAmount(e.target.value)}
                            className="pr-20"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80"
                            onClick={() => setFundAmount(ethers.formatEther(farmingInfo.userRewardBalance))}
                          >
                            MAX
                          </Button>
                        </div>
                        <Button
                          onClick={handleFundFarming}
                          disabled={isFunding || !fundAmount || parseFloat(fundAmount) <= 0}
                          className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 min-w-[150px]"
                        >
                          {isFunding ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {isApproving ? 'Approving...' : 'Funding...'}
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4 mr-2" />
                              Fund Contract
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Tokens will be transferred directly to the farming contract to pay user rewards.
                      </p>
                    </div>

                    {/* Withdraw Rewards Section (Owner Only) */}
                    {isFarmingOwner && (
                      <div className="border-t border-border/30 pt-6 space-y-4">
                        <h4 className="font-semibold flex items-center gap-2 text-destructive">
                          <ArrowUpFromLine className="w-4 h-4 rotate-180" />
                          Withdraw Rewards (Owner Only)
                        </h4>
                        <Alert className="border-warning/30 bg-warning/5">
                          <AlertCircle className="h-4 w-4 text-warning" />
                          <AlertDescription className="text-foreground text-sm">
                            Warning: Withdrawing reward tokens may affect users' ability to harvest their rewards. 
                            Only use this if absolutely necessary.
                          </AlertDescription>
                        </Alert>
                        <div className="flex gap-4">
                          <div className="flex-1 relative">
                            <Input
                              type="number"
                              placeholder={`Amount of ${farmingInfo.rewardTokenSymbol}`}
                              value={withdrawAmount}
                              onChange={(e) => setWithdrawAmount(e.target.value)}
                              className="pr-20"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 text-destructive hover:text-destructive/80"
                              onClick={() => setWithdrawAmount(ethers.formatEther(farmingInfo.contractRewardBalance))}
                            >
                              MAX
                            </Button>
                          </div>
                          <Button
                            onClick={handleWithdrawRewards}
                            disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                            variant="destructive"
                            className="min-w-[150px]"
                          >
                            {isWithdrawing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Withdrawing...
                              </>
                            ) : (
                              <>
                                <ArrowUpFromLine className="w-4 h-4 mr-2 rotate-180" />
                                Withdraw
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Contract Balance: {contractBalanceFormatted} {farmingInfo.rewardTokenSymbol}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Failed to load farming info</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {farmingInfo && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass-card hover:border-primary/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Est. Daily Rewards</p>
                        <p className="text-xl font-bold text-foreground">
                          {(parseFloat(ethers.formatEther(farmingInfo.rewardPerBlock)) * 28800).toFixed(2)} {farmingInfo.rewardTokenSymbol}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card hover:border-accent/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Days of Rewards Left</p>
                        <p className={`text-xl font-bold ${hasLowBalance ? 'text-destructive' : 'text-foreground'}`}>
                          {farmingInfo.rewardPerBlock > 0 
                            ? Math.floor(Number(farmingInfo.contractRewardBalance) / (Number(farmingInfo.rewardPerBlock) * 28800)).toLocaleString()
                            : '∞'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card hover:border-success/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                        <Leaf className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total LP Staked</p>
                        <p className="text-xl font-bold text-foreground">
                          {farmingPools.reduce((acc, pool) => acc + parseFloat(ethers.formatEther(pool.totalStaked)), 0).toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card hover:border-warning/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                        <Coins className="w-6 h-6 text-warning" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Est. Weekly Rewards</p>
                        <p className="text-xl font-bold text-foreground">
                          {(parseFloat(ethers.formatEther(farmingInfo.rewardPerBlock)) * 28800 * 7).toFixed(2)} {farmingInfo.rewardTokenSymbol}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Airdrop Tab */}
          <TabsContent value="airdrop" className="space-y-6 animate-fade-in">
            <AirdropAdmin />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
