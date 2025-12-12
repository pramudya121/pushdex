import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { WrapUnwrap } from '@/components/WrapUnwrap';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { TOKEN_LIST, CONTRACTS, BLOCK_EXPLORER } from '@/config/contracts';
import { FACTORY_ABI } from '@/config/abis';
import { getReadProvider, getPairContract, getTokenByAddress, formatAmount, shortenAddress } from '@/lib/dex';
import { getMultipleBalances } from '@/lib/multicall';
import { 
  Wallet, 
  Loader2, 
  ExternalLink, 
  Copy, 
  TrendingUp, 
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
  Droplets
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  logo: string;
  usdValue: number;
  change24h: number;
}

interface LPPosition {
  pairAddress: string;
  token0Symbol: string;
  token1Symbol: string;
  token0Logo: string;
  token1Logo: string;
  balance: string;
  share: string;
  usdValue: number;
}

const Portfolio = () => {
  const { address, isConnected, balance } = useWallet();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [lpPositions, setLpPositions] = useState<LPPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);

  const fetchPortfolio = async () => {
    if (!address) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // Use multicall to fetch all token balances at once
      const tokenAddresses = TOKEN_LIST
        .filter(t => t.address !== ethers.ZeroAddress)
        .map(t => t.address);
      
      const balancesMap = await getMultipleBalances(tokenAddresses, address);
      
      let total = 0;
      const balances: TokenBalance[] = TOKEN_LIST
        .filter(t => t.address !== ethers.ZeroAddress)
        .map(token => {
          const balanceRaw = balancesMap.get(token.address.toLowerCase()) || 0n;
          const balanceFormatted = formatAmount(balanceRaw, token.decimals);
          const usdValue = parseFloat(balanceFormatted) * (Math.random() * 10 + 1); // Mock USD value
          const change24h = (Math.random() - 0.4) * 15;
          total += usdValue;
          return {
            symbol: token.symbol,
            name: token.name,
            address: token.address,
            balance: balanceFormatted,
            logo: token.logo,
            usdValue,
            change24h,
          };
        })
        .filter(b => parseFloat(b.balance) > 0);
      
      setTokenBalances(balances);
      
      // Fetch LP positions
      const provider = getReadProvider();
      const factory = new ethers.Contract(CONTRACTS.FACTORY, FACTORY_ABI, provider);
      const pairsLength = await factory.allPairsLength();
      
      const lpPromises = [];
      for (let i = 0; i < Number(pairsLength); i++) {
        lpPromises.push(
          (async () => {
            try {
              const pairAddress = await factory.allPairs(i);
              const pair = getPairContract(pairAddress, provider);
              
              const [userBalance, totalSupply, token0, token1] = await Promise.all([
                pair.balanceOf(address),
                pair.totalSupply(),
                pair.token0(),
                pair.token1(),
              ]);
              
              if (userBalance === 0n) return null;
              
              const token0Info = getTokenByAddress(token0);
              const token1Info = getTokenByAddress(token1);
              const share = totalSupply > 0n ? (userBalance * 10000n / totalSupply) : 0n;
              const usdValue = parseFloat(formatAmount(userBalance)) * (Math.random() * 20 + 5);
              total += usdValue;
              
              return {
                pairAddress,
                token0Symbol: token0Info?.symbol || 'Unknown',
                token1Symbol: token1Info?.symbol || 'Unknown',
                token0Logo: token0Info?.logo || '',
                token1Logo: token1Info?.logo || '',
                balance: formatAmount(userBalance),
                share: (Number(share) / 100).toFixed(2),
                usdValue,
              };
            } catch (error) {
              return null;
            }
          })()
        );
      }
      
      const positions = await Promise.all(lpPromises);
      setLpPositions(positions.filter((p): p is LPPosition => p !== null));
      setTotalValue(total + parseFloat(balance) * 1.5); // Add native balance
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [address]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied!');
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen relative">
        <WaveBackground />
        <Header />
        
        <main className="relative z-10 pt-32 md:pt-24 pb-20 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="glass-card p-12 text-center animate-scale-in">
              <div className="p-4 rounded-2xl bg-primary/10 w-fit mx-auto mb-6">
                <Wallet className="w-16 h-16 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Connect Your Wallet</h3>
              <p className="text-muted-foreground mb-6">
                Connect your wallet to view your portfolio, token balances, and LP positions
              </p>
            </div>
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
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">
              <span className="gradient-text">Portfolio</span>
            </h1>
            <p className="text-muted-foreground">
              Your tokens and liquidity positions
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading portfolio...</p>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6 animate-fade-in">
                {/* Portfolio Overview */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Total Portfolio Value</div>
                      <div className="text-4xl font-bold gradient-text">
                        ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchPortfolio}
                      className="gap-2"
                    >
                      <RefreshCcw className="w-4 h-4" />
                      Refresh
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{shortenAddress(address!, 6)}</span>
                      <button onClick={copyAddress} className="text-muted-foreground hover:text-foreground transition-colors">
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={`${BLOCK_EXPLORER}/address/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <img src="/tokens/pc.png" alt="PC" className="w-6 h-6 rounded-full" />
                      <span className="font-bold">{parseFloat(balance).toFixed(4)} PC</span>
                    </div>
                  </div>
                </div>

                {/* Token Balances */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <PieChart className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">Token Balances</h2>
                  </div>
                  {tokenBalances.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No token balances found</p>
                      <Link to="/" className="text-primary hover:underline text-sm mt-2 inline-block">
                        Start trading →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tokenBalances.map((token) => (
                        <div
                          key={token.address}
                          className="flex items-center justify-between p-4 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-all hover:border-primary/30"
                        >
                          <div className="flex items-center gap-3">
                            <img src={token.logo} alt={token.symbol} className="w-10 h-10 rounded-full" />
                            <div>
                              <div className="font-semibold">{token.symbol}</div>
                              <div className="text-sm text-muted-foreground">{token.name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{parseFloat(token.balance).toFixed(4)}</div>
                            <div className="flex items-center justify-end gap-2 text-sm">
                              <span className="text-muted-foreground">${token.usdValue.toFixed(2)}</span>
                              <span className={`flex items-center gap-0.5 ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {token.change24h >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {Math.abs(token.change24h).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* LP Positions */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-bold">Liquidity Positions</h2>
                    </div>
                    <Link to="/liquidity">
                      <Button variant="outline" size="sm" className="gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Add Liquidity
                      </Button>
                    </Link>
                  </div>
                  {lpPositions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Droplets className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No liquidity positions found</p>
                      <Link to="/liquidity" className="text-primary hover:underline text-sm mt-2 inline-block">
                        Add liquidity to earn fees →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lpPositions.map((position) => (
                        <div
                          key={position.pairAddress}
                          className="p-4 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-all hover:border-primary/30"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="flex -space-x-2">
                                <img src={position.token0Logo} alt={position.token0Symbol} className="w-8 h-8 rounded-full border-2 border-background" />
                                <img src={position.token1Logo} alt={position.token1Symbol} className="w-8 h-8 rounded-full border-2 border-background" />
                              </div>
                              <div>
                                <div className="font-semibold">
                                  {position.token0Symbol}/{position.token1Symbol}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Pool share: {position.share}%
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{parseFloat(position.balance).toFixed(6)} LP</div>
                              <div className="text-sm text-muted-foreground">~${position.usdValue.toFixed(2)}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Link to="/liquidity" className="flex-1">
                              <Button variant="outline" size="sm" className="w-full">
                                Manage
                              </Button>
                            </Link>
                            <a
                              href={`${BLOCK_EXPLORER}/address/${position.pairAddress}`}
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
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <WrapUnwrap />
                
                {/* Quick Actions */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link to="/" className="block">
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <ArrowUpRight className="w-4 h-4" />
                        Swap Tokens
                      </Button>
                    </Link>
                    <Link to="/liquidity" className="block">
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <Droplets className="w-4 h-4" />
                        Add Liquidity
                      </Button>
                    </Link>
                    <Link to="/pools" className="block">
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <PieChart className="w-4 h-4" />
                        View Pools
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Portfolio;
