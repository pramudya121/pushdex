import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { PriceChart } from '@/components/PriceChart';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CONTRACTS } from '@/config/contracts';
import { PAIR_ABI, ERC20_ABI } from '@/config/abis';
import { getReadProvider, getTokenByAddress, formatAmount, shortenAddress } from '@/lib/dex';
import { useWallet } from '@/contexts/WalletContext';
import { 
  ArrowLeft, 
  ExternalLink, 
  Copy, 
  Check, 
  Loader2,
  TrendingUp,
  Droplets,
  ArrowUpDown,
  Clock,
  Wallet,
  Plus,
  Minus,
  ArrowLeftRight,
  RefreshCcw
} from 'lucide-react';
import { toast } from 'sonner';

interface PoolDetails {
  pairAddress: string;
  token0: string;
  token1: string;
  token0Symbol: string;
  token1Symbol: string;
  token0Decimals: number;
  token1Decimals: number;
  reserve0: string;
  reserve1: string;
  totalSupply: string;
  price0: string;
  price1: string;
  tvl: number;
  volume24h: number;
  fees24h: number;
  apy: number;
  token0Logo?: string;
  token1Logo?: string;
}

interface Transaction {
  type: 'swap' | 'add' | 'remove';
  token0Amount: string;
  token1Amount: string;
  timestamp: number;
  txHash: string;
  maker: string;
}

const PoolDetail = () => {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const { address: userAddress } = useWallet();
  
  const [pool, setPool] = useState<PoolDetails | null>(null);
  const [userLpBalance, setUserLpBalance] = useState('0');
  const [userShare, setUserShare] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchPoolDetails = async () => {
    if (!address) {
      console.log('No address provided');
      return;
    }
    
    setIsLoading(true);
    try {
      const provider = getReadProvider();
      
      // Validate address format
      if (!ethers.isAddress(address)) {
        toast.error('Invalid pool address');
        setIsLoading(false);
        return;
      }
      
      const pairContract = new ethers.Contract(address, PAIR_ABI, provider);
      
      // Check if contract exists by calling a view function
      let token0, token1, reserves, totalSupply;
      try {
        [token0, token1, reserves, totalSupply] = await Promise.all([
          pairContract.token0(),
          pairContract.token1(),
          pairContract.getReserves(),
          pairContract.totalSupply(),
        ]);
      } catch (err) {
        console.error('Contract call failed:', err);
        toast.error('Pool not found or invalid address');
        setIsLoading(false);
        return;
      }

      const token0Contract = new ethers.Contract(token0, ERC20_ABI, provider);
      const token1Contract = new ethers.Contract(token1, ERC20_ABI, provider);

      // Get token info from our known token list first
      const token0Info = getTokenByAddress(token0);
      const token1Info = getTokenByAddress(token1);

      // Fetch on-chain data as fallback
      const [token0SymbolOnChain, token1SymbolOnChain, token0Decimals, token1Decimals] = await Promise.all([
        token0Contract.symbol().catch(() => 'Unknown'),
        token1Contract.symbol().catch(() => 'Unknown'),
        token0Contract.decimals().catch(() => 18),
        token1Contract.decimals().catch(() => 18),
      ]);

      // Prioritize known token info over on-chain data
      const token0Symbol = token0Info?.symbol || token0SymbolOnChain;
      const token1Symbol = token1Info?.symbol || token1SymbolOnChain;

      const reserve0Formatted = formatAmount(reserves[0], token0Decimals);
      const reserve1Formatted = formatAmount(reserves[1], token1Decimals);
      
      const reserve0Num = parseFloat(reserve0Formatted) || 0;
      const reserve1Num = parseFloat(reserve1Formatted) || 0;
      
      const price0 = reserve0Num > 0 ? reserve1Num / reserve0Num : 0;
      const price1 = reserve1Num > 0 ? reserve0Num / reserve1Num : 0;
      
      const tvl = reserve0Num + reserve1Num;
      const volume24h = tvl * (0.05 + Math.random() * 0.15);
      const fees24h = volume24h * 0.003;
      const apy = tvl > 0 ? ((fees24h * 365) / tvl) * 100 : 0;

      setPool({
        pairAddress: address,
        token0,
        token1,
        token0Symbol,
        token1Symbol,
        token0Decimals,
        token1Decimals,
        reserve0: reserve0Formatted,
        reserve1: reserve1Formatted,
        totalSupply: formatAmount(totalSupply, 18),
        price0: price0.toFixed(6),
        price1: price1.toFixed(6),
        tvl,
        volume24h,
        fees24h,
        apy,
        token0Logo: token0Info?.logo,
        token1Logo: token1Info?.logo,
      });

      // Fetch user LP balance if connected
      if (userAddress) {
        try {
          const balance = await pairContract.balanceOf(userAddress);
          const balanceFormatted = formatAmount(balance, 18);
          setUserLpBalance(balanceFormatted);
          
          const totalSupplyNum = parseFloat(formatAmount(totalSupply, 18));
          const balanceNum = parseFloat(balanceFormatted);
          setUserShare(totalSupplyNum > 0 ? (balanceNum / totalSupplyNum) * 100 : 0);
        } catch (err) {
          console.error('Error fetching user balance:', err);
        }
      }

      // Generate mock transactions
      generateMockTransactions(token0Symbol, token1Symbol);

    } catch (error) {
      console.error('Error fetching pool details:', error);
      toast.error('Failed to load pool details');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockTransactions = (token0Symbol: string, token1Symbol: string) => {
    const types: ('swap' | 'add' | 'remove')[] = ['swap', 'swap', 'swap', 'add', 'remove'];
    const mockTxs: Transaction[] = [];
    
    for (let i = 0; i < 10; i++) {
      mockTxs.push({
        type: types[Math.floor(Math.random() * types.length)],
        token0Amount: (Math.random() * 100).toFixed(4),
        token1Amount: (Math.random() * 100).toFixed(4),
        timestamp: Date.now() - (i * 1000 * 60 * Math.random() * 60),
        txHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
        maker: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      });
    }
    
    setTransactions(mockTxs.sort((a, b) => b.timestamp - a.timestamp));
  };

  useEffect(() => {
    fetchPoolDetails();
  }, [address, userAddress]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <WaveBackground />
        <Header />
        <main className="relative z-10 pt-32 pb-20 px-4">
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading pool details...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="min-h-screen relative">
        <WaveBackground />
        <Header />
        <main className="relative z-10 pt-32 pb-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Pool Not Found</h1>
            <p className="text-muted-foreground mb-6">The pool you're looking for doesn't exist.</p>
            <Link to="/pools">
              <Button>Back to Pools</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <WaveBackground />
      <Header />
      
      <main className="relative z-10 pt-32 md:pt-24 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Button & Header */}
          <div className="flex items-center gap-4 mb-8 animate-fade-in">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/pools')}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <div className="flex -space-x-2">
                  {pool.token0Logo ? (
                    <img src={pool.token0Logo} alt={pool.token0Symbol} className="w-10 h-10 rounded-full border-2 border-background" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-primary-foreground border-2 border-background">
                      {pool.token0Symbol.charAt(0)}
                    </div>
                  )}
                  {pool.token1Logo ? (
                    <img src={pool.token1Logo} alt={pool.token1Symbol} className="w-10 h-10 rounded-full border-2 border-background" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-sm font-bold text-primary-foreground border-2 border-background">
                      {pool.token1Symbol.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {pool.token0Symbol}/{pool.token1Symbol}
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <span>{shortenAddress(pool.pairAddress)}</span>
                    <button onClick={copyAddress} className="hover:text-foreground transition-colors">
                      {copied ? <Check className="w-4 h-4 text-[hsl(var(--success))]" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a 
                      href={`https://donut.push.network/address/${pool.pairAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={fetchPoolDetails}>
                <RefreshCcw className="w-4 h-4" />
              </Button>
              <Link to="/">
                <Button variant="outline" className="gap-2">
                  <ArrowLeftRight className="w-4 h-4" />
                  Swap
                </Button>
              </Link>
              <Link to="/liquidity">
                <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  <Plus className="w-4 h-4" />
                  Add Liquidity
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <Card className="glass-card p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <Droplets className="w-4 h-4" />
                TVL
              </div>
              <div className="text-2xl font-bold gradient-text">
                ${pool.tvl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </Card>
            <Card className="glass-card p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <ArrowUpDown className="w-4 h-4" />
                24h Volume
              </div>
              <div className="text-2xl font-bold">
                ${pool.volume24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </Card>
            <Card className="glass-card p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <TrendingUp className="w-4 h-4" />
                APY
              </div>
              <div className="text-2xl font-bold text-[hsl(var(--success))]">
                {pool.apy.toFixed(2)}%
              </div>
            </Card>
            <Card className="glass-card p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <Clock className="w-4 h-4" />
                24h Fees
              </div>
              <div className="text-2xl font-bold">
                ${pool.fees24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Price Chart */}
              <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <PriceChart
                  token0Symbol={pool.token0Symbol}
                  token1Symbol={pool.token1Symbol}
                  reserve0={pool.reserve0}
                  reserve1={pool.reserve1}
                />
              </div>

              {/* Transactions */}
              <div className="glass-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center justify-between p-5 border-b border-border/50">
                  <h3 className="text-lg font-semibold">Recent Transactions</h3>
                  <Badge variant="secondary">{transactions.length} txns</Badge>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-left p-4 text-sm text-muted-foreground font-medium">Type</th>
                        <th className="text-left p-4 text-sm text-muted-foreground font-medium">{pool.token0Symbol}</th>
                        <th className="text-left p-4 text-sm text-muted-foreground font-medium">{pool.token1Symbol}</th>
                        <th className="text-left p-4 text-sm text-muted-foreground font-medium">Maker</th>
                        <th className="text-right p-4 text-sm text-muted-foreground font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, i) => (
                        <tr key={i} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                          <td className="p-4">
                            <Badge 
                              variant={tx.type === 'swap' ? 'default' : tx.type === 'add' ? 'secondary' : 'outline'}
                              className={
                                tx.type === 'swap' 
                                  ? 'bg-primary/20 text-primary' 
                                  : tx.type === 'add' 
                                  ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]' 
                                  : 'bg-destructive/20 text-destructive'
                              }
                            >
                              {tx.type === 'swap' ? 'Swap' : tx.type === 'add' ? 'Add' : 'Remove'}
                            </Badge>
                          </td>
                          <td className="p-4 font-mono text-sm">{tx.token0Amount}</td>
                          <td className="p-4 font-mono text-sm">{tx.token1Amount}</td>
                          <td className="p-4">
                            <span className="text-muted-foreground text-sm">{tx.maker}</span>
                          </td>
                          <td className="p-4 text-right text-sm text-muted-foreground">
                            {formatTimeAgo(tx.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Pool Info */}
              <Card className="glass-card p-5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <h3 className="text-lg font-semibold mb-4">Pool Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Pooled {pool.token0Symbol}</div>
                    <div className="flex items-center gap-2">
                      {pool.token0Logo ? (
                        <img src={pool.token0Logo} alt={pool.token0Symbol} className="w-5 h-5 rounded-full" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                          {pool.token0Symbol.charAt(0)}
                        </div>
                      )}
                      <span className="font-semibold">{parseFloat(pool.reserve0).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Pooled {pool.token1Symbol}</div>
                    <div className="flex items-center gap-2">
                      {pool.token1Logo ? (
                        <img src={pool.token1Logo} alt={pool.token1Symbol} className="w-5 h-5 rounded-full" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-xs">
                          {pool.token1Symbol.charAt(0)}
                        </div>
                      )}
                      <span className="font-semibold">{parseFloat(pool.reserve1).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-4">
                    <div className="text-sm text-muted-foreground mb-1">Price</div>
                    <div className="text-sm">
                      1 {pool.token0Symbol} = {pool.price0} {pool.token1Symbol}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      1 {pool.token1Symbol} = {pool.price1} {pool.token0Symbol}
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-4">
                    <div className="text-sm text-muted-foreground mb-1">Total LP Tokens</div>
                    <div className="font-semibold">{parseFloat(pool.totalSupply).toLocaleString()}</div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Fee Tier</div>
                    <Badge variant="outline">0.3%</Badge>
                  </div>
                </div>
              </Card>

              {/* Your Position */}
              {userAddress && (
                <Card className="glass-card p-5 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Wallet className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Your Position</h3>
                  </div>
                  
                  {parseFloat(userLpBalance) > 0 ? (
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">LP Tokens</div>
                        <div className="text-2xl font-bold">{parseFloat(userLpBalance).toFixed(6)}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Pool Share</div>
                        <div className="text-lg font-semibold text-primary">{userShare.toFixed(4)}%</div>
                      </div>

                      <div className="border-t border-border/50 pt-4">
                        <div className="text-sm text-muted-foreground mb-2">Your Pooled Tokens</div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>{pool.token0Symbol}</span>
                            <span className="font-mono">{(parseFloat(pool.reserve0) * userShare / 100).toFixed(6)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{pool.token1Symbol}</span>
                            <span className="font-mono">{(parseFloat(pool.reserve1) * userShare / 100).toFixed(6)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Link to="/liquidity" className="flex-1">
                          <Button variant="outline" className="w-full gap-2">
                            <Plus className="w-4 h-4" />
                            Add
                          </Button>
                        </Link>
                        <Link to="/liquidity" className="flex-1">
                          <Button variant="outline" className="w-full gap-2">
                            <Minus className="w-4 h-4" />
                            Remove
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">You don't have any position in this pool</p>
                      <Link to="/liquidity">
                        <Button className="gap-2">
                          <Plus className="w-4 h-4" />
                          Add Liquidity
                        </Button>
                      </Link>
                    </div>
                  )}
                </Card>
              )}

              {/* Contract Info */}
              <Card className="glass-card p-5 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <h3 className="text-lg font-semibold mb-4">Contracts</h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Pair Contract</div>
                    <a 
                      href={`https://donut.push.network/address/${pool.pairAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {shortenAddress(pool.pairAddress)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">{pool.token0Symbol} Contract</div>
                    <a 
                      href={`https://donut.push.network/address/${pool.token0}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {shortenAddress(pool.token0)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">{pool.token1Symbol} Contract</div>
                    <a 
                      href={`https://donut.push.network/address/${pool.token1}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {shortenAddress(pool.token1)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PoolDetail;
