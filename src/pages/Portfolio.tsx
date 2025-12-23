import React, { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { WrapUnwrap } from '@/components/WrapUnwrap';
import { PortfolioChart } from '@/components/PortfolioChart';
import { PortfolioValueChart } from '@/components/PortfolioValueChart';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { TOKEN_LIST, CONTRACTS, BLOCK_EXPLORER, RPC_URL } from '@/config/contracts';
import { FACTORY_ABI, PAIR_ABI, STAKING_ABI, FARMING_ABI, ERC20_ABI } from '@/config/abis';
import { getReadProvider, getPairContract, getTokenByAddress, formatAmount, shortenAddress } from '@/lib/dex';
import { getMultipleBalances, getMultiplePairReserves } from '@/lib/multicall';
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
  Droplets,
  BarChart3,
  Coins,
  Sprout,
  Lock
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
  token0Amount: string;
  token1Amount: string;
}

interface StakingPosition {
  poolId: number;
  tokenSymbol: string;
  tokenLogo: string;
  stakedAmount: string;
  pendingReward: string;
  apr: number;
  lockPeriodDays: number;
  canUnstake: boolean;
  usdValue: number;
}

interface FarmingPosition {
  pid: number;
  lpSymbol: string;
  token0Logo: string;
  token1Logo: string;
  stakedAmount: string;
  pendingReward: string;
  rewardSymbol: string;
  apr: number;
  usdValue: number;
}

const Portfolio = () => {
  const { address, isConnected, balance } = useWallet();
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [lpPositions, setLpPositions] = useState<LPPosition[]>([]);
  const [stakingPositions, setStakingPositions] = useState<StakingPosition[]>([]);
  const [farmingPositions, setFarmingPositions] = useState<FarmingPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [nativeBalance, setNativeBalance] = useState(0);

  const getTokenInfo = (tokenAddress: string) => {
    const token = TOKEN_LIST.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());
    return {
      symbol: token?.symbol || 'Unknown',
      logo: token?.logo || '/tokens/pc.png',
    };
  };

  const fetchPortfolio = async () => {
    if (!address) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const provider = getReadProvider();
      
      // Use multicall to fetch all token balances at once
      const tokenAddresses = TOKEN_LIST
        .filter(t => t.address !== ethers.ZeroAddress)
        .map(t => t.address);
      
      const balancesMap = await getMultipleBalances(tokenAddresses, address);
      
      // Get native balance
      const nativeBal = await provider.getBalance(address);
      const nativeValue = parseFloat(ethers.formatEther(nativeBal));
      setNativeBalance(nativeValue);
      
      let total = nativeValue * 1.5; // Mock USD price for native token
      
      const balances: TokenBalance[] = TOKEN_LIST
        .filter(t => t.address !== ethers.ZeroAddress)
        .map(token => {
          const balanceRaw = balancesMap.get(token.address.toLowerCase()) || 0n;
          const balanceFormatted = formatAmount(balanceRaw, token.decimals);
          const balanceNum = parseFloat(balanceFormatted);
          const mockPrices: Record<string, number> = {
            'WPC': 1.5,
            'ETH': 2300,
            'BNB': 580,
            'PSDX': 0.85,
          };
          const price = mockPrices[token.symbol] || 1;
          const usdValue = balanceNum * price;
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
        .filter(b => parseFloat(b.balance) > 0.0001);
      
      setTokenBalances(balances);
      
      // Fetch LP positions, staking, and farming in parallel
      const [lpData, stakingData, farmingData] = await Promise.all([
        fetchLPPositions(provider, address, total),
        fetchStakingPositions(provider, address),
        fetchFarmingPositions(provider, address),
      ]);
      
      setLpPositions(lpData.positions);
      setStakingPositions(stakingData.positions);
      setFarmingPositions(farmingData.positions);
      
      total += lpData.totalValue + stakingData.totalValue + farmingData.totalValue;
      setTotalValue(total);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast.error('Failed to fetch portfolio data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLPPositions = async (provider: ethers.JsonRpcProvider, userAddress: string, currentTotal: number) => {
    let totalValue = 0;
    try {
      const factory = new ethers.Contract(CONTRACTS.FACTORY, FACTORY_ABI, provider);
      const pairsLength = await factory.allPairsLength();
      
      const pairAddressPromises = [];
      for (let i = 0; i < Number(pairsLength); i++) {
        pairAddressPromises.push(factory.allPairs(i));
      }
      const pairAddresses = await Promise.all(pairAddressPromises);
      const reservesMap = await getMultiplePairReserves(pairAddresses);
      
      const lpPromises = pairAddresses.map(async (pairAddress) => {
        try {
          const pair = getPairContract(pairAddress, provider);
          
          const [userBalance, totalSupply, token0, token1] = await Promise.all([
            pair.balanceOf(userAddress),
            pair.totalSupply(),
            pair.token0(),
            pair.token1(),
          ]);
          
          if (userBalance === 0n) return null;
          
          const reserves = reservesMap.get(pairAddress.toLowerCase());
          const token0Info = getTokenByAddress(token0);
          const token1Info = getTokenByAddress(token1);
          
          const share = totalSupply > 0n ? (userBalance * 10000n / totalSupply) : 0n;
          const sharePercent = Number(share) / 100;
          
          const reserve0 = reserves?.reserve0 || 0n;
          const reserve1 = reserves?.reserve1 || 0n;
          const userReserve0 = (reserve0 * userBalance) / (totalSupply || 1n);
          const userReserve1 = (reserve1 * userBalance) / (totalSupply || 1n);
          
          const token0Amount = formatAmount(userReserve0, token0Info?.decimals || 18);
          const token1Amount = formatAmount(userReserve1, token1Info?.decimals || 18);
          
          const mockPrices: Record<string, number> = {
            'WPC': 1.5, 'ETH': 2300, 'BNB': 580, 'PSDX': 0.85,
          };
          const price0 = mockPrices[token0Info?.symbol || ''] || 1;
          const price1 = mockPrices[token1Info?.symbol || ''] || 1;
          const usdValue = parseFloat(token0Amount) * price0 + parseFloat(token1Amount) * price1;
          totalValue += usdValue;
          
          return {
            pairAddress,
            token0Symbol: token0Info?.symbol || 'Unknown',
            token1Symbol: token1Info?.symbol || 'Unknown',
            token0Logo: token0Info?.logo || '',
            token1Logo: token1Info?.logo || '',
            balance: formatAmount(userBalance),
            share: sharePercent.toFixed(2),
            usdValue,
            token0Amount,
            token1Amount,
          };
        } catch {
          return null;
        }
      });
      
      const positions = await Promise.all(lpPromises);
      return { positions: positions.filter((p): p is LPPosition => p !== null), totalValue };
    } catch {
      return { positions: [], totalValue: 0 };
    }
  };

  const fetchStakingPositions = async (provider: ethers.JsonRpcProvider, userAddress: string) => {
    const positions: StakingPosition[] = [];
    let totalValue = 0;
    
    try {
      const stakingContract = new ethers.Contract(CONTRACTS.STAKING, STAKING_ABI, provider);
      
      // Find pools with user stakes
      for (let i = 0; i < 20; i++) {
        try {
          const poolData = await stakingContract.pools(i);
          const userStakeData = await stakingContract.userStakes(i, userAddress);
          const userStaked = userStakeData[0];
          
          if (userStaked > BigInt(0)) {
            const tokenAddress = poolData[0];
            const apr = Number(poolData[1]);
            const lockPeriod = Number(poolData[2]);
            const tokenInfo = getTokenInfo(tokenAddress);
            
            let pendingReward = BigInt(0);
            try {
              pendingReward = await stakingContract.pendingReward(i, userAddress);
            } catch {}
            
            const currentTime = BigInt(Math.floor(Date.now() / 1000));
            const unlockTime = userStakeData[1] + BigInt(lockPeriod);
            const canUnstake = lockPeriod === 0 || currentTime >= unlockTime;
            
            const stakedFormatted = ethers.formatEther(userStaked);
            const mockPrices: Record<string, number> = {
              'PC': 1.5, 'WPC': 1.5, 'ETH': 2300, 'BNB': 580, 'PSDX': 0.85,
            };
            const price = mockPrices[tokenInfo.symbol] || 1;
            const usdValue = parseFloat(stakedFormatted) * price;
            totalValue += usdValue;
            
            positions.push({
              poolId: i,
              tokenSymbol: tokenInfo.symbol,
              tokenLogo: tokenInfo.logo,
              stakedAmount: stakedFormatted,
              pendingReward: ethers.formatEther(pendingReward),
              apr,
              lockPeriodDays: Math.floor(lockPeriod / 86400),
              canUnstake,
              usdValue,
            });
          }
        } catch {
          break; // No more pools
        }
      }
    } catch {
      // Staking contract not available
    }
    
    return { positions, totalValue };
  };

  const fetchFarmingPositions = async (provider: ethers.JsonRpcProvider, userAddress: string) => {
    const positions: FarmingPosition[] = [];
    let totalValue = 0;
    
    try {
      const farmingContract = new ethers.Contract(CONTRACTS.FARMING, FARMING_ABI, provider);
      
      const [poolLength, rewardToken] = await Promise.all([
        farmingContract.poolLength(),
        farmingContract.rewardToken(),
      ]);
      
      const rewardInfo = getTokenInfo(rewardToken);
      
      for (let i = 0; i < Number(poolLength); i++) {
        try {
          const userInfo = await farmingContract.userInfo(i, userAddress);
          const userStaked = userInfo[0];
          
          if (userStaked > BigInt(0)) {
            const poolInfo = await farmingContract.poolInfo(i);
            const lpToken = poolInfo[0];
            
            const lpContract = new ethers.Contract(lpToken, PAIR_ABI, provider);
            const [token0, token1] = await Promise.all([
              lpContract.token0(),
              lpContract.token1(),
            ]);
            
            const token0Info = getTokenInfo(token0);
            const token1Info = getTokenInfo(token1);
            
            let pendingReward = BigInt(0);
            try {
              pendingReward = await farmingContract.pendingReward(i, userAddress);
            } catch {}
            
            const stakedFormatted = ethers.formatEther(userStaked);
            // Estimate LP value (simplified)
            const usdValue = parseFloat(stakedFormatted) * 10; // Rough estimate
            totalValue += usdValue;
            
            positions.push({
              pid: i,
              lpSymbol: `${token0Info.symbol}-${token1Info.symbol} LP`,
              token0Logo: token0Info.logo,
              token1Logo: token1Info.logo,
              stakedAmount: stakedFormatted,
              pendingReward: ethers.formatEther(pendingReward),
              rewardSymbol: rewardInfo.symbol,
              apr: 0, // Would need more calculation
              usdValue,
            });
          }
        } catch {
          // Skip this pool
        }
      }
    } catch {
      // Farming contract not available
    }
    
    return { positions, totalValue };
  };

  useEffect(() => {
    fetchPortfolio();
  }, [address]);

  // Prepare chart data
  const tokenChartData = useMemo(() => {
    const data = tokenBalances
      .filter(t => t.usdValue > 0)
      .map(t => ({
        name: t.symbol,
        value: t.usdValue,
        color: '',
      }));
    
    // Add native token
    if (nativeBalance > 0) {
      data.unshift({
        name: 'PC',
        value: nativeBalance * 1.5,
        color: '',
      });
    }
    
    return data.sort((a, b) => b.value - a.value);
  }, [tokenBalances, nativeBalance]);

  const lpChartData = useMemo(() => {
    return lpPositions
      .filter(lp => lp.usdValue > 0)
      .map(lp => ({
        name: `${lp.token0Symbol}/${lp.token1Symbol}`,
        value: lp.usdValue,
        color: '',
      }))
      .sort((a, b) => b.value - a.value);
  }, [lpPositions]);

  const tokenValue = useMemo(() => {
    return tokenBalances.reduce((sum, t) => sum + t.usdValue, 0) + (nativeBalance * 1.5);
  }, [tokenBalances, nativeBalance]);

  const lpValue = useMemo(() => {
    return lpPositions.reduce((sum, lp) => sum + lp.usdValue, 0);
  }, [lpPositions]);

  const stakingValue = useMemo(() => {
    return stakingPositions.reduce((sum, s) => sum + s.usdValue, 0);
  }, [stakingPositions]);

  const farmingValue = useMemo(() => {
    return farmingPositions.reduce((sum, f) => sum + f.usdValue, 0);
  }, [farmingPositions]);

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
        <div className="max-w-7xl mx-auto">
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
            <div className="space-y-6">
              {/* Portfolio Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-fade-in">
                <div className="glass-card p-6 col-span-2 md:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Total Portfolio Value</div>
                      <div className="text-3xl md:text-4xl font-bold gradient-text">
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
                      <span className="font-bold">{nativeBalance.toFixed(4)} PC</span>
                    </div>
                  </div>
                </div>
                
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Tokens</span>
                  </div>
                  <div className="text-xl font-bold">
                    ${tokenValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tokenBalances.length + (nativeBalance > 0 ? 1 : 0)} tokens
                  </div>
                </div>
                
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-warning" />
                    <span className="text-xs text-muted-foreground">Staking</span>
                  </div>
                  <div className="text-xl font-bold">
                    ${stakingValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stakingPositions.length} pools
                  </div>
                </div>
                
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sprout className="w-4 h-4 text-success" />
                    <span className="text-xs text-muted-foreground">Farming</span>
                  </div>
                  <div className="text-xl font-bold">
                    ${farmingValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {farmingPositions.length} farms
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid md:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Portfolio History (30d)</h3>
                  </div>
                  <PortfolioValueChart />
                </div>
                
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <PieChart className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Token Allocation</h3>
                  </div>
                  <PortfolioChart data={tokenChartData} />
                </div>
                
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <PieChart className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold">LP Allocation</h3>
                  </div>
                  <PortfolioChart data={lpChartData} />
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column - Token Balances & LP Positions */}
                <div className="lg:col-span-2 space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  {/* Token Balances */}
                  <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Coins className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-bold">Token Balances</h2>
                    </div>
                    {tokenBalances.length === 0 && nativeBalance <= 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No token balances found</p>
                        <Link to="/" className="text-primary hover:underline text-sm mt-2 inline-block">
                          Start trading →
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Native Token */}
                        {nativeBalance > 0 && (
                          <div className="flex items-center justify-between p-4 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-all hover:border-primary/30">
                            <div className="flex items-center gap-3">
                              <img src="/tokens/pc.png" alt="PC" className="w-10 h-10 rounded-full" />
                              <div>
                                <div className="font-semibold">PC</div>
                                <div className="text-sm text-muted-foreground">Push Coin (Native)</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{nativeBalance.toFixed(4)}</div>
                              <div className="text-sm text-muted-foreground">
                                ${(nativeBalance * 1.5).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        )}
                        
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
                                <div className="font-semibold">${position.usdValue.toFixed(2)}</div>
                                <div className="text-sm text-muted-foreground">{parseFloat(position.balance).toFixed(6)} LP</div>
                              </div>
                            </div>
                            
                            {/* Pooled Assets */}
                            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-background/50 mb-3">
                              <div className="flex items-center gap-2">
                                <img src={position.token0Logo} alt={position.token0Symbol} className="w-5 h-5 rounded-full" />
                                <span className="text-sm">{parseFloat(position.token0Amount).toFixed(4)} {position.token0Symbol}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <img src={position.token1Logo} alt={position.token1Symbol} className="w-5 h-5 rounded-full" />
                                <span className="text-sm">{parseFloat(position.token1Amount).toFixed(4)} {position.token1Symbol}</span>
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

                  {/* Staking Positions */}
                  {stakingPositions.length > 0 && (
                    <div className="glass-card p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <Lock className="w-5 h-5 text-warning" />
                          <h2 className="text-xl font-bold">Staking Positions</h2>
                        </div>
                        <Link to="/staking">
                          <Button variant="outline" size="sm">Manage</Button>
                        </Link>
                      </div>
                      <div className="space-y-3">
                        {stakingPositions.map((pos) => (
                          <div key={pos.poolId} className="p-4 rounded-xl bg-surface border border-border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <img src={pos.tokenLogo} alt={pos.tokenSymbol} className="w-10 h-10 rounded-full" />
                                <div>
                                  <div className="font-semibold">{pos.tokenSymbol}</div>
                                  <div className="text-sm text-muted-foreground">{pos.apr}% APR</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">{parseFloat(pos.stakedAmount).toFixed(4)}</div>
                                <div className="text-sm text-primary">+{parseFloat(pos.pendingReward).toFixed(4)} earned</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Farming Positions */}
                  {farmingPositions.length > 0 && (
                    <div className="glass-card p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <Sprout className="w-5 h-5 text-success" />
                          <h2 className="text-xl font-bold">Farming Positions</h2>
                        </div>
                        <Link to="/farming">
                          <Button variant="outline" size="sm">Manage</Button>
                        </Link>
                      </div>
                      <div className="space-y-3">
                        {farmingPositions.map((pos) => (
                          <div key={pos.pid} className="p-4 rounded-xl bg-surface border border-border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex -space-x-2">
                                  <img src={pos.token0Logo} className="w-8 h-8 rounded-full border-2 border-background" />
                                  <img src={pos.token1Logo} className="w-8 h-8 rounded-full border-2 border-background" />
                                </div>
                                <div>
                                  <div className="font-semibold">{pos.lpSymbol}</div>
                                  <div className="text-sm text-muted-foreground">{parseFloat(pos.stakedAmount).toFixed(4)} LP</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-primary">+{parseFloat(pos.pendingReward).toFixed(4)}</div>
                                <div className="text-sm text-muted-foreground">{pos.rewardSymbol} earned</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Portfolio;
