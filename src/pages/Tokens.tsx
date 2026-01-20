import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { ethers } from 'ethers';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWallet } from '@/contexts/WalletContext';
import { TOKEN_LIST, BLOCK_EXPLORER } from '@/config/contracts';
import { getMultipleBalances } from '@/lib/multicall';
import { formatAmount, getReadProvider } from '@/lib/dex';
import { BackgroundGradient } from '@/components/ui/aceternity/background-gradient';
import { GlowingStarsBackgroundCard } from '@/components/ui/aceternity/glowing-stars';
import { BorderBeam } from '@/components/ui/magic-ui/border-beam';
import { NumberTicker } from '@/components/ui/magic-ui/number-ticker';
import { Spotlight } from '@/components/ui/magic-ui/spotlight';
import { 
  Search, 
  RefreshCcw, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Coins,
  Copy,
  CheckCircle2,
  Wallet,
  ArrowUpDown,
  Star,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

// Token prices based on realistic market values
const TOKEN_PRICES: Record<string, { price: number; change24h: number }> = {
  'PC': { price: 1.52, change24h: 8.2 },
  'WPC': { price: 1.52, change24h: 8.2 },
  'ETH': { price: 2347.89, change24h: 2.4 },
  'BNB': { price: 584.32, change24h: 5.2 },
  'PSDX': { price: 0.8542, change24h: 12.5 },
  'LINK': { price: 14.23, change24h: -1.8 },
  'HYPE': { price: 27.45, change24h: 18.7 },
  'ZEC': { price: 42.18, change24h: -3.2 },
  'SUI': { price: 3.87, change24h: 6.5 },
  'UNI': { price: 8.92, change24h: -0.8 },
  'OKB': { price: 48.76, change24h: 1.4 },
};

interface TokenData {
  symbol: string;
  name: string;
  address: string;
  logo: string;
  decimals: number;
  balance: string;
  balanceNum: number;
  price: number;
  change24h: number;
  usdValue: number;
  isNative?: boolean;
}

type SortField = 'value' | 'balance' | 'price' | 'change';

// Skeleton for token cards
const TokenCardSkeleton = memo(() => (
  <div className="glass-card p-5 space-y-4">
    <div className="flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-2 text-right">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-3">
      <Skeleton className="h-16 rounded-lg" />
      <Skeleton className="h-16 rounded-lg" />
      <Skeleton className="h-16 rounded-lg" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-9 flex-1 rounded-lg" />
      <Skeleton className="h-9 flex-1 rounded-lg" />
    </div>
  </div>
));

const TokenCard = memo(({ token, index }: { token: TokenData; index: number }) => {
  const [copied, setCopied] = useState(false);
  const isPositive = token.change24h >= 0;

  const copyAddress = useCallback(() => {
    if (token.isNative) return;
    navigator.clipboard.writeText(token.address);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  }, [token.address, token.isNative]);

  return (
    <div 
      className="animate-fade-in"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <BackgroundGradient
        className="rounded-2xl"
        containerClassName="w-full"
      >
        <div className="bg-card rounded-2xl p-5 relative overflow-hidden group">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <img 
                src={token.logo} 
                alt={token.symbol}
                className="w-12 h-12 rounded-full border-2 border-border/40 shadow-lg transition-transform group-hover:scale-110"
                onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
              />
              {token.balanceNum > 0 && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-success-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{token.symbol}</h3>
                {token.isNative && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 border-primary/50 text-primary">
                    Native
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{token.name}</p>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg">
                ${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: token.price < 1 ? 4 : 2 })}
              </div>
              <div className={`flex items-center justify-end gap-1 text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{isPositive ? '+' : ''}{token.change24h.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-secondary/30 rounded-xl p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Balance</div>
              <div className="font-semibold text-sm truncate">
                {parseFloat(token.balance) > 0 
                  ? parseFloat(token.balance).toLocaleString(undefined, { maximumFractionDigits: 4 })
                  : '0.00'
                }
              </div>
            </div>
            <div className="bg-secondary/30 rounded-xl p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Value</div>
              <div className="font-semibold text-sm gradient-text">
                ${token.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-secondary/30 rounded-xl p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">24h</div>
              <div className={`font-semibold text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? '+' : ''}{token.change24h.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Address & Actions */}
          <div className="flex gap-2">
            {!token.isNative && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyAddress}
                className="flex-1 gap-1.5 text-xs"
              >
                {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy Address'}
              </Button>
            )}
            <a
              href={token.isNative ? BLOCK_EXPLORER : `${BLOCK_EXPLORER}/address/${token.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                <ExternalLink className="w-3 h-3" />
                Explorer
              </Button>
            </a>
            <Link to="/" className="flex-1">
              <Button size="sm" className="w-full gap-1.5 text-xs bg-gradient-to-r from-primary to-accent">
                <Zap className="w-3 h-3" />
                Swap
              </Button>
            </Link>
          </div>

          {/* Border Beam effect for tokens with balance */}
          {token.balanceNum > 0 && (
            <BorderBeam size={200} duration={12} borderWidth={1.5} />
          )}
        </div>
      </BackgroundGradient>
    </div>
  );
});

TokenCard.displayName = 'TokenCard';

const Tokens = () => {
  const { address, isConnected, balance } = useWallet();
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('value');
  const [sortDesc, setSortDesc] = useState(true);

  const fetchTokens = useCallback(async () => {
    setIsLoading(true);
    try {
      const provider = getReadProvider();
      
      // Get balances for connected wallet
      let balancesMap = new Map<string, bigint>();
      let nativeBalance = 0n;
      
      if (address) {
        const tokenAddresses = TOKEN_LIST
          .filter(t => t.address !== ethers.ZeroAddress)
          .map(t => t.address);
        
        balancesMap = await getMultipleBalances(tokenAddresses, address);
        nativeBalance = await provider.getBalance(address);
      }

      const tokenData: TokenData[] = TOKEN_LIST.map(token => {
        const priceData = TOKEN_PRICES[token.symbol] || { price: 1, change24h: 0 };
        const isNative = token.address === ethers.ZeroAddress;
        
        let balanceRaw = isNative ? nativeBalance : (balancesMap.get(token.address.toLowerCase()) || 0n);
        const balanceFormatted = formatAmount(balanceRaw, token.decimals);
        const balanceNum = parseFloat(balanceFormatted);
        const usdValue = balanceNum * priceData.price;

        return {
          symbol: token.symbol,
          name: token.name,
          address: token.address,
          logo: token.logo,
          decimals: token.decimals,
          balance: balanceFormatted,
          balanceNum,
          price: priceData.price,
          change24h: priceData.change24h,
          usdValue,
          isNative,
        };
      });

      setTokens(tokenData);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      toast.error('Failed to fetch token data');
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Filter and sort
  const filteredTokens = useMemo(() => {
    return tokens
      .filter(token => 
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const multiplier = sortDesc ? -1 : 1;
        switch (sortField) {
          case 'value': return (a.usdValue - b.usdValue) * multiplier;
          case 'balance': return (a.balanceNum - b.balanceNum) * multiplier;
          case 'price': return (a.price - b.price) * multiplier;
          case 'change': return (a.change24h - b.change24h) * multiplier;
          default: return 0;
        }
      });
  }, [tokens, searchTerm, sortField, sortDesc]);

  // Stats
  const { totalValue, tokensWithBalance, avgChange } = useMemo(() => ({
    totalValue: tokens.reduce((sum, t) => sum + t.usdValue, 0),
    tokensWithBalance: tokens.filter(t => t.balanceNum > 0).length,
    avgChange: tokens.length > 0 
      ? tokens.reduce((sum, t) => sum + t.change24h, 0) / tokens.length 
      : 0,
  }), [tokens]);

  const toggleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDesc(prev => !prev);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  }, [sortField]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <WaveBackground />
      
      {/* Spotlight Effects */}
      <Spotlight className="-top-40 left-0 md:left-60" fill="hsl(330, 100%, 50%)" />
      <Spotlight className="top-10 right-0 md:right-60" fill="hsl(280, 80%, 50%)" />
      
      <Header />
      
      <main className="relative z-10 pt-32 md:pt-24 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <HeroSection
            title="Token Directory"
            description="Explore all supported tokens on PUSHDEX with real-time prices and your portfolio balances"
            showSpotlight={false}
            showStars={true}
            spotlightColor="hsl(330, 100%, 60%)"
            badge={{
              text: "Live Prices",
              icon: <TrendingUp className="w-4 h-4 text-success" />,
            }}
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 animate-fade-in">
            <GlowingStarsBackgroundCard className="h-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <Coins className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  <NumberTicker value={TOKEN_LIST.length} className="text-foreground" />
                </div>
                <div className="text-sm text-muted-foreground">Total Tokens</div>
              </div>
            </GlowingStarsBackgroundCard>

            <GlowingStarsBackgroundCard className="h-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-success/10">
                    <Wallet className="w-5 h-5 text-success" />
                  </div>
                </div>
                <div className="text-2xl font-bold gradient-text">
                  ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-muted-foreground">Your Total Value</div>
              </div>
            </GlowingStarsBackgroundCard>

            <GlowingStarsBackgroundCard className="h-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-accent/10">
                    <Star className="w-5 h-5 text-accent" />
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  <NumberTicker value={tokensWithBalance} className="text-foreground" />
                </div>
                <div className="text-sm text-muted-foreground">Tokens Held</div>
              </div>
            </GlowingStarsBackgroundCard>

            <GlowingStarsBackgroundCard className="h-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2.5 rounded-xl ${avgChange >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                    {avgChange >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-success" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                </div>
                <div className={`text-2xl font-bold ${avgChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
                </div>
                <div className="text-sm text-muted-foreground">Avg. 24h Change</div>
              </div>
            </GlowingStarsBackgroundCard>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Sort Buttons */}
              <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1 border border-border/50">
                {[
                  { key: 'value' as SortField, label: 'Value' },
                  { key: 'price' as SortField, label: 'Price' },
                  { key: 'change' as SortField, label: '24h' },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => toggleSort(option.key)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                      sortField === option.key 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {option.label}
                    {sortField === option.key && (
                      <ArrowUpDown className={`w-3 h-3 transition-transform ${sortDesc ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchTokens}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Token Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <TokenCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredTokens.length === 0 ? (
            <div className="glass-card p-16 text-center animate-scale-in">
              <Coins className="w-20 h-20 text-muted-foreground mx-auto mb-6 opacity-50" />
              <h3 className="text-2xl font-semibold mb-3">No Tokens Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTokens.map((token, index) => (
                <TokenCard key={token.symbol} token={token} index={index} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Tokens;
