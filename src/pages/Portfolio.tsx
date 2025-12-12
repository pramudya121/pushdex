import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { useWallet } from '@/contexts/WalletContext';
import { TOKEN_LIST, CONTRACTS, BLOCK_EXPLORER } from '@/config/contracts';
import { FACTORY_ABI } from '@/config/abis';
import { getReadProvider, getPairContract, getTokenByAddress, formatAmount, shortenAddress } from '@/lib/dex';
import { getMultipleBalances } from '@/lib/multicall';
import { Wallet, Loader2, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
}

interface LPPosition {
  pairAddress: string;
  token0Symbol: string;
  token1Symbol: string;
  balance: string;
  share: string;
}

const Portfolio = () => {
  const { address, isConnected, balance } = useWallet();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [lpPositions, setLpPositions] = useState<LPPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
        
        const balances: TokenBalance[] = TOKEN_LIST
          .filter(t => t.address !== ethers.ZeroAddress)
          .map(token => {
            const balanceRaw = balancesMap.get(token.address.toLowerCase()) || 0n;
            return {
              symbol: token.symbol,
              name: token.name,
              address: token.address,
              balance: formatAmount(balanceRaw, token.decimals),
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
                
                return {
                  pairAddress,
                  token0Symbol: token0Info?.symbol || 'Unknown',
                  token1Symbol: token1Info?.symbol || 'Unknown',
                  balance: formatAmount(userBalance),
                  share: (Number(share) / 100).toFixed(2),
                };
              } catch (error) {
                return null;
              }
            })()
          );
        }
        
        const positions = await Promise.all(lpPromises);
        setLpPositions(positions.filter((p): p is LPPosition => p !== null));
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
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
              <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-muted-foreground">
                Connect your wallet to view your portfolio
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
        <div className="max-w-4xl mx-auto">
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
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Wallet Info */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Connected Wallet</div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg">{shortenAddress(address!, 6)}</span>
                      <button onClick={copyAddress} className="text-muted-foreground hover:text-foreground">
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={`${BLOCK_EXPLORER}/address/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Native Balance</div>
                    <div className="text-2xl font-bold text-primary">
                      {parseFloat(balance).toFixed(4)} PC
                    </div>
                  </div>
                </div>
              </div>

              {/* Token Balances */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-bold mb-4">Token Balances</h2>
                {tokenBalances.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No token balances found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tokenBalances.map((token) => (
                      <div
                        key={token.address}
                        className="flex items-center justify-between p-4 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-pink flex items-center justify-center text-sm font-bold text-primary-foreground">
                            {token.symbol.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold">{token.symbol}</div>
                            <div className="text-sm text-muted-foreground">{token.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{parseFloat(token.balance).toFixed(6)}</div>
                          <a
                            href={`${BLOCK_EXPLORER}/address/${token.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            View token
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LP Positions */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-bold mb-4">Liquidity Positions</h2>
                {lpPositions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No liquidity positions found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lpPositions.map((position) => (
                      <div
                        key={position.pairAddress}
                        className="flex items-center justify-between p-4 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-pink flex items-center justify-center text-xs font-bold text-primary-foreground border-2 border-background">
                              {position.token0Symbol.charAt(0)}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-pink flex items-center justify-center text-xs font-bold text-primary-foreground border-2 border-background">
                              {position.token1Symbol.charAt(0)}
                            </div>
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
                          <a
                            href={`${BLOCK_EXPLORER}/address/${position.pairAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            View pair
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Portfolio;
