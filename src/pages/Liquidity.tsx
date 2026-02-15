import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TokenSelector } from '@/components/TokenSelector';
import { WrapUnwrap } from '@/components/WrapUnwrap';
import { SlippageSettings } from '@/components/SlippageSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallet } from '@/contexts/WalletContext';
import { TOKENS, TokenInfo, CONTRACTS } from '@/config/contracts';
import { ROUTER_ABI, ERC20_ABI } from '@/config/abis';
import {
  getPairAddress,
  getReserves,
  getTokenBalance,
  getTokenAllowance,
  parseAmount,
  formatAmount,
  getDeadline,
} from '@/lib/dex';
import { toast } from 'sonner';
import { 
  Plus, Minus, Loader2, AlertTriangle, Info, Sparkles, RefreshCw, 
  Link as LinkIcon, Droplets, Shield, TrendingUp, Wallet, ArrowDownUp,
  Percent, Clock, CheckCircle2, ChevronRight
} from 'lucide-react';
import { HeroSection } from '@/components/HeroSection';
import { motion } from 'framer-motion';

const Liquidity = () => {
  const { address, signer, isConnected, isCorrectNetwork, switchNetwork, balance } = useWallet();
  
  const [tokenA, setTokenA] = useState<TokenInfo>(TOKENS.PC);
  const [tokenB, setTokenB] = useState<TokenInfo>(TOKENS.PSDX);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [balanceA, setBalanceA] = useState('0');
  const [balanceB, setBalanceB] = useState('0');
  const [lpBalance, setLpBalance] = useState('0');
  const [removeAmount, setRemoveAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsApprovalA, setNeedsApprovalA] = useState(false);
  const [needsApprovalB, setNeedsApprovalB] = useState(false);
  const [needsLPApproval, setNeedsLPApproval] = useState(false);
  const [pairAddress, setPairAddress] = useState<string | null>(null);
  const [reserves, setReserves] = useState<{ reserve0: bigint; reserve1: bigint; token0: string; token1: string } | null>(null);
  const [isNewPool, setIsNewPool] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [deadline, setDeadline] = useState(20);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeInput, setActiveInput] = useState<'A' | 'B' | null>(null);

  // Fetch token balances
  const fetchBalances = useCallback(async () => {
    if (!address) return;
    
    try {
      if (tokenA.address === ethers.ZeroAddress) {
        setBalanceA(balance);
      } else {
        const balA = await getTokenBalance(tokenA.address, address);
        setBalanceA(formatAmount(balA, tokenA.decimals));
      }
      
      if (tokenB.address === ethers.ZeroAddress) {
        setBalanceB(balance);
      } else {
        const balB = await getTokenBalance(tokenB.address, address);
        setBalanceB(formatAmount(balB, tokenB.decimals));
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  }, [address, tokenA, tokenB, balance]);

  // Fetch pair info
  const fetchPairInfo = useCallback(async () => {
    const tokenAAddr = tokenA.address === ethers.ZeroAddress ? CONTRACTS.WETH : tokenA.address;
    const tokenBAddr = tokenB.address === ethers.ZeroAddress ? CONTRACTS.WETH : tokenB.address;
    
    const pair = await getPairAddress(tokenAAddr, tokenBAddr);
    setPairAddress(pair);
    setIsNewPool(!pair);
    
    if (pair && address) {
      const res = await getReserves(pair);
      setReserves(res);
      
      const lpBal = await getTokenBalance(pair, address);
      setLpBalance(formatAmount(lpBal));
    } else {
      setReserves(null);
      setLpBalance('0');
    }
  }, [tokenA, tokenB, address]);

  useEffect(() => {
    fetchPairInfo();
    fetchBalances();
  }, [fetchPairInfo, fetchBalances]);

  // Calculate corresponding amount based on reserves
  const calculateCorrespondingAmount = useCallback((
    inputAmount: string,
    inputToken: TokenInfo,
    outputToken: TokenInfo
  ): string => {
    if (!reserves || !inputAmount || parseFloat(inputAmount) === 0) return '';
    
    const inputAddr = inputToken.address === ethers.ZeroAddress ? CONTRACTS.WETH : inputToken.address;
    
    try {
      let reserveIn: bigint;
      let reserveOut: bigint;
      
      if (reserves.token0.toLowerCase() === inputAddr.toLowerCase()) {
        reserveIn = reserves.reserve0;
        reserveOut = reserves.reserve1;
      } else {
        reserveIn = reserves.reserve1;
        reserveOut = reserves.reserve0;
      }
      
      if (reserveIn === 0n || reserveOut === 0n) return '';
      
      const amountIn = parseAmount(inputAmount, inputToken.decimals);
      const amountOut = (amountIn * reserveOut) / reserveIn;
      
      return formatAmount(amountOut, outputToken.decimals);
    } catch (error) {
      console.error('Error calculating amount:', error);
      return '';
    }
  }, [reserves]);

  // Handle amount A change with auto-calculation
  const handleAmountAChange = useCallback((value: string) => {
    setAmountA(value);
    setActiveInput('A');
    
    if (!isNewPool && reserves && value && parseFloat(value) > 0) {
      setIsCalculating(true);
      const calculatedB = calculateCorrespondingAmount(value, tokenA, tokenB);
      setAmountB(calculatedB);
      setIsCalculating(false);
    }
  }, [isNewPool, reserves, calculateCorrespondingAmount, tokenA, tokenB]);

  // Handle amount B change with auto-calculation
  const handleAmountBChange = useCallback((value: string) => {
    setAmountB(value);
    setActiveInput('B');
    
    if (!isNewPool && reserves && value && parseFloat(value) > 0) {
      setIsCalculating(true);
      const calculatedA = calculateCorrespondingAmount(value, tokenB, tokenA);
      setAmountA(calculatedA);
      setIsCalculating(false);
    }
  }, [isNewPool, reserves, calculateCorrespondingAmount, tokenA, tokenB]);

  // Price rate display
  const priceRate = useMemo(() => {
    if (!reserves) return null;
    
    const tokenAAddr = tokenA.address === ethers.ZeroAddress ? CONTRACTS.WETH : tokenA.address;
    
    try {
      let reserveA: bigint;
      let reserveB: bigint;
      
      if (reserves.token0.toLowerCase() === tokenAAddr.toLowerCase()) {
        reserveA = reserves.reserve0;
        reserveB = reserves.reserve1;
      } else {
        reserveA = reserves.reserve1;
        reserveB = reserves.reserve0;
      }
      
      if (reserveA === 0n || reserveB === 0n) return null;
      
      const rate = Number(reserveB) / Number(reserveA);
      return rate;
    } catch {
      return null;
    }
  }, [reserves, tokenA]);

  // Check approvals
  useEffect(() => {
    const checkApprovals = async () => {
      if (!address || !amountA || !amountB) return;
      
      if (tokenA.address !== ethers.ZeroAddress) {
        const allowanceA = await getTokenAllowance(tokenA.address, address, CONTRACTS.ROUTER);
        setNeedsApprovalA(allowanceA < parseAmount(amountA, tokenA.decimals));
      } else {
        setNeedsApprovalA(false);
      }
      
      if (tokenB.address !== ethers.ZeroAddress) {
        const allowanceB = await getTokenAllowance(tokenB.address, address, CONTRACTS.ROUTER);
        setNeedsApprovalB(allowanceB < parseAmount(amountB, tokenB.decimals));
      } else {
        setNeedsApprovalB(false);
      }
    };
    
    checkApprovals();
  }, [address, amountA, amountB, tokenA, tokenB]);

  // Check LP approval
  useEffect(() => {
    const checkLPApproval = async () => {
      if (!address || !pairAddress || !removeAmount) return;
      
      const allowance = await getTokenAllowance(pairAddress, address, CONTRACTS.ROUTER);
      setNeedsLPApproval(allowance < parseAmount(removeAmount));
    };
    
    checkLPApproval();
  }, [address, pairAddress, removeAmount]);

  const handleApprove = async (token: TokenInfo) => {
    if (!signer) return;
    
    setIsLoading(true);
    try {
      const tokenContract = new ethers.Contract(token.address, ERC20_ABI, signer);
      const tx = await tokenContract.approve(CONTRACTS.ROUTER, ethers.MaxUint256);
      toast.loading(`Approving ${token.symbol}...`, { id: 'approve' });
      await tx.wait();
      toast.success(`${token.symbol} approved!`, { id: 'approve' });
      
      if (token.address === tokenA.address) setNeedsApprovalA(false);
      if (token.address === tokenB.address) setNeedsApprovalB(false);
    } catch (error: any) {
      toast.error(error.reason || 'Approval failed', { id: 'approve' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveLp = async () => {
    if (!signer || !pairAddress) return;
    
    setIsLoading(true);
    try {
      const lpContract = new ethers.Contract(pairAddress, ERC20_ABI, signer);
      const tx = await lpContract.approve(CONTRACTS.ROUTER, ethers.MaxUint256);
      toast.loading('Approving LP tokens...', { id: 'approve' });
      await tx.wait();
      toast.success('LP tokens approved!', { id: 'approve' });
      setNeedsLPApproval(false);
    } catch (error: any) {
      toast.error(error.reason || 'Approval failed', { id: 'approve' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLiquidity = async () => {
    if (!signer || !address) return;
    
    setIsLoading(true);
    try {
      const router = new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, signer);
      const txDeadline = getDeadline(deadline);
      
      const amountAWei = parseAmount(amountA, tokenA.decimals);
      const amountBWei = parseAmount(amountB, tokenB.decimals);
      const slippageBps = BigInt(Math.floor(slippage * 100));
      const amountAMin = amountAWei - (amountAWei * slippageBps / 10000n);
      const amountBMin = amountBWei - (amountBWei * slippageBps / 10000n);

      let tx;
      
      if (tokenA.address === ethers.ZeroAddress) {
        tx = await router.addLiquidityETH(
          tokenB.address,
          amountBWei,
          amountBMin,
          amountAMin,
          address,
          txDeadline,
          { value: amountAWei }
        );
      } else if (tokenB.address === ethers.ZeroAddress) {
        tx = await router.addLiquidityETH(
          tokenA.address,
          amountAWei,
          amountAMin,
          amountBMin,
          address,
          txDeadline,
          { value: amountBWei }
        );
      } else {
        tx = await router.addLiquidity(
          tokenA.address,
          tokenB.address,
          amountAWei,
          amountBWei,
          amountAMin,
          amountBMin,
          address,
          txDeadline
        );
      }
      
      toast.loading(isNewPool ? 'Creating pool...' : 'Adding liquidity...', { id: 'add' });
      await tx.wait();
      toast.success(isNewPool ? 'Pool created!' : 'Liquidity added!', { id: 'add' });
      
      setAmountA('');
      setAmountB('');
      fetchPairInfo();
      fetchBalances();
    } catch (error: any) {
      toast.error(error.reason || 'Failed to add liquidity', { id: 'add' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!signer || !address || !pairAddress) return;
    
    setIsLoading(true);
    try {
      const router = new ethers.Contract(CONTRACTS.ROUTER, ROUTER_ABI, signer);
      const txDeadline = getDeadline(deadline);
      const lpAmountWei = parseAmount(removeAmount);

      let tx;
      
      if (tokenA.address === ethers.ZeroAddress || tokenB.address === ethers.ZeroAddress) {
        const token = tokenA.address === ethers.ZeroAddress ? tokenB : tokenA;
        tx = await router.removeLiquidityETH(
          token.address,
          lpAmountWei,
          0,
          0,
          address,
          txDeadline
        );
      } else {
        tx = await router.removeLiquidity(
          tokenA.address,
          tokenB.address,
          lpAmountWei,
          0,
          0,
          address,
          txDeadline
        );
      }
      
      toast.loading('Removing liquidity...', { id: 'remove' });
      await tx.wait();
      toast.success('Liquidity removed!', { id: 'remove' });
      
      setRemoveAmount('');
      fetchPairInfo();
      fetchBalances();
    } catch (error: any) {
      toast.error(error.reason || 'Failed to remove liquidity', { id: 'remove' });
    } finally {
      setIsLoading(false);
    }
  };

  const setMaxA = () => {
    let maxAmount: string;
    if (tokenA.address === ethers.ZeroAddress) {
      maxAmount = Math.max(0, parseFloat(balance) - 0.01).toFixed(6);
    } else {
      maxAmount = balanceA;
    }
    handleAmountAChange(maxAmount);
  };

  const setMaxB = () => {
    let maxAmount: string;
    if (tokenB.address === ethers.ZeroAddress) {
      maxAmount = Math.max(0, parseFloat(balance) - 0.01).toFixed(6);
    } else {
      maxAmount = balanceB;
    }
    handleAmountBChange(maxAmount);
  };

  // Steps indicator for Add Liquidity
  const getStep = () => {
    if (!isConnected) return 0;
    if (!isCorrectNetwork) return 0;
    if (!amountA || !amountB) return 1;
    if (needsApprovalA || needsApprovalB) return 2;
    return 3;
  };
  const currentStep = getStep();

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <WaveBackground />
      <Header />
      
      <main id="main-content" className="relative z-10 pt-32 md:pt-24 pb-28 md:pb-20 px-4 flex-1">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <HeroSection
            title="Liquidity"
            description="Provide liquidity to earn 0.3% trading fees on every swap"
            showSpotlight={false}
            showStars={true}
          />

          {/* Stats Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8"
          >
            {[
              { icon: <Droplets className="w-4 h-4" />, label: 'Your LP Tokens', value: parseFloat(lpBalance).toFixed(4), accent: true },
              { icon: <Percent className="w-4 h-4" />, label: 'Fee Tier', value: '0.30%' },
              { icon: <Shield className="w-4 h-4" />, label: 'Slippage', value: `${slippage}%` },
              { icon: <Clock className="w-4 h-4" />, label: 'Deadline', value: `${deadline} min` },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-4 text-center group hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">{stat.icon}</span>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className={`text-lg font-bold ${stat.accent ? 'text-primary' : 'text-foreground'}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-12 gap-6">
            {/* Main Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-7"
            >
              <div className="glass-card overflow-hidden">
                {/* Card Header */}
                <div className="p-5 md:p-6 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Droplets className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-foreground">Manage Liquidity</h2>
                        <p className="text-xs text-muted-foreground">Add or remove liquidity positions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => { fetchPairInfo(); fetchBalances(); }}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <SlippageSettings
                        slippage={slippage}
                        deadline={deadline}
                        onSlippageChange={setSlippage}
                        onDeadlineChange={setDeadline}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 md:p-6">
                  <Tabs defaultValue="add" className="w-full">
                    <TabsList className="w-full mb-6 h-12 p-1 bg-surface rounded-xl">
                      <TabsTrigger value="add" className="flex-1 gap-2 rounded-lg h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                        <Plus className="w-4 h-4" />
                        Add Liquidity
                      </TabsTrigger>
                      <TabsTrigger value="remove" className="flex-1 gap-2 rounded-lg h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                        <Minus className="w-4 h-4" />
                        Remove
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="add" className="space-y-4 mt-0">
                      {/* New Pool Alert */}
                      {isNewPool && amountA && amountB && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-3 rounded-xl bg-primary/10 border border-primary/30 flex items-center gap-2 text-sm text-primary"
                        >
                          <Sparkles className="w-4 h-4 shrink-0" />
                          <span>You are creating a new liquidity pool! You set the initial price.</span>
                        </motion.div>
                      )}

                      {/* Token A Input */}
                      <div className="rounded-2xl bg-surface/80 border border-border/60 p-4 hover:border-primary/30 transition-colors duration-300 focus-within:border-primary/50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">You Deposit</span>
                          <div className="flex items-center gap-2 text-xs">
                            <Wallet className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {parseFloat(balanceA).toFixed(4)} {tokenA.symbol}
                            </span>
                            <button
                              onClick={setMaxA}
                              className="px-2 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 font-semibold transition-colors text-xs"
                            >
                              MAX
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 relative">
                            <Input
                              type="number"
                              placeholder="0.0"
                              value={amountA}
                              onChange={(e) => handleAmountAChange(e.target.value)}
                              className="border-0 bg-transparent text-2xl font-bold p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/30"
                            />
                            {isCalculating && activeInput === 'B' && (
                              <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                            )}
                          </div>
                          <TokenSelector selectedToken={tokenA} onSelect={setTokenA} excludeToken={tokenB} />
                        </div>
                      </div>

                      {/* Connector & Rate */}
                      <div className="flex items-center justify-center gap-3 py-1">
                        <div className="flex-1 h-px bg-border/50" />
                        <div className="p-2.5 rounded-xl bg-surface border border-border shadow-sm">
                          <Plus className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 h-px bg-border/50" />
                      </div>

                      {/* Token B Input */}
                      <div className="rounded-2xl bg-surface/80 border border-border/60 p-4 hover:border-primary/30 transition-colors duration-300 focus-within:border-primary/50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">You Deposit</span>
                          <div className="flex items-center gap-2 text-xs">
                            <Wallet className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {parseFloat(balanceB).toFixed(4)} {tokenB.symbol}
                            </span>
                            <button
                              onClick={setMaxB}
                              className="px-2 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 font-semibold transition-colors text-xs"
                            >
                              MAX
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 relative">
                            <Input
                              type="number"
                              placeholder="0.0"
                              value={amountB}
                              onChange={(e) => handleAmountBChange(e.target.value)}
                              className="border-0 bg-transparent text-2xl font-bold p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/30"
                            />
                            {isCalculating && activeInput === 'A' && (
                              <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                            )}
                          </div>
                          <TokenSelector selectedToken={tokenB} onSelect={setTokenB} excludeToken={tokenA} />
                        </div>
                      </div>

                      {/* Price Rate */}
                      {priceRate && !isNewPool && (
                        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface/50 border border-border/40 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Exchange Rate</span>
                          </div>
                          <span className="font-semibold text-foreground">
                            1 {tokenA.symbol} = {priceRate.toFixed(6)} {tokenB.symbol}
                          </span>
                        </div>
                      )}

                      {/* Pool Info Card */}
                      {reserves && (
                        <div className="rounded-xl bg-surface/50 border border-border/40 overflow-hidden">
                          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
                            <Info className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Position Summary</span>
                          </div>
                          <div className="grid grid-cols-2 gap-px bg-border/20">
                            <div className="bg-background/50 p-3">
                              <span className="text-xs text-muted-foreground">Your LP Tokens</span>
                              <div className="font-bold text-foreground">{parseFloat(lpBalance).toFixed(6)}</div>
                            </div>
                            <div className="bg-background/50 p-3">
                              <span className="text-xs text-muted-foreground">Pool Share</span>
                              <div className="font-bold text-primary">
                                {parseFloat(lpBalance) > 0 ? '~0.01%' : '0%'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Transaction Details */}
                      <div className="space-y-2 px-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Slippage Tolerance</span>
                          <span className="font-medium text-foreground">{slippage}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Transaction Deadline</span>
                          <span className="font-medium text-foreground">{deadline} minutes</span>
                        </div>
                      </div>

                      {/* Approval Buttons */}
                      {isConnected && isCorrectNetwork && (needsApprovalA || needsApprovalB) && (
                        <div className="space-y-2">
                          {needsApprovalA && tokenA.address !== ethers.ZeroAddress && (
                            <Button
                              className="w-full h-12 rounded-xl gap-2"
                              variant="outline"
                              onClick={() => handleApprove(tokenA)}
                              disabled={isLoading}
                            >
                              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              Approve {tokenA.symbol}
                            </Button>
                          )}
                          {needsApprovalB && tokenB.address !== ethers.ZeroAddress && (
                            <Button
                              className="w-full h-12 rounded-xl gap-2"
                              variant="outline"
                              onClick={() => handleApprove(tokenB)}
                              disabled={isLoading}
                            >
                              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              Approve {tokenB.symbol}
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Main CTA */}
                      <Button
                        className="w-full h-14 text-base font-bold rounded-xl bg-gradient-pink hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/40"
                        disabled={!isConnected || !isCorrectNetwork || !amountA || !amountB || needsApprovalA || needsApprovalB || isLoading}
                        onClick={isCorrectNetwork ? handleAddLiquidity : switchNetwork}
                      >
                        {!isConnected ? (
                          <span className="flex items-center gap-2"><Wallet className="w-5 h-5" /> Connect Wallet</span>
                        ) : !isCorrectNetwork ? (
                          'Switch to Push Chain'
                        ) : isLoading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {isNewPool ? 'Creating Pool...' : 'Adding Liquidity...'}
                          </span>
                        ) : isNewPool ? (
                          <span className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> Create Pool & Add Liquidity</span>
                        ) : (
                          <span className="flex items-center gap-2"><Plus className="w-5 h-5" /> Add Liquidity</span>
                        )}
                      </Button>
                    </TabsContent>

                    <TabsContent value="remove" className="space-y-4 mt-0">
                      {/* LP Position Card */}
                      <div className="rounded-2xl bg-surface/80 border border-border/60 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {tokenA.logo && <img src={tokenA.logo} alt={tokenA.symbol} className="w-7 h-7 rounded-full border-2 border-background" />}
                              {tokenB.logo && <img src={tokenB.logo} alt={tokenB.symbol} className="w-7 h-7 rounded-full border-2 border-background" />}
                            </div>
                            <span className="font-semibold text-foreground">{tokenA.symbol}/{tokenB.symbol}</span>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">LP Token</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-muted-foreground">Your Balance</span>
                          <span className="text-xl font-bold text-foreground">{parseFloat(lpBalance).toFixed(6)}</span>
                        </div>
                      </div>

                      {/* Amount Input */}
                      <div className="rounded-2xl bg-surface/80 border border-border/60 p-4 focus-within:border-primary/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount to Remove</span>
                          <button
                            onClick={() => setRemoveAmount(lpBalance)}
                            className="px-2 py-0.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 font-semibold transition-colors text-xs"
                          >
                            MAX
                          </button>
                        </div>
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={removeAmount}
                          onChange={(e) => setRemoveAmount(e.target.value)}
                          className="border-0 bg-transparent text-2xl font-bold p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/30"
                        />
                      </div>

                      {/* Percentage Quick Select */}
                      <div className="grid grid-cols-4 gap-2">
                        {[25, 50, 75, 100].map((pct) => (
                          <button
                            key={pct}
                            onClick={() => setRemoveAmount((parseFloat(lpBalance) * pct / 100).toString())}
                            className="py-2.5 rounded-xl bg-surface hover:bg-primary/10 border border-border hover:border-primary/30 text-sm font-semibold transition-all duration-200 text-foreground"
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>

                      {pairAddress === null && (
                        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-sm text-destructive">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>This pair does not exist yet</span>
                        </div>
                      )}

                      {needsLPApproval && (
                        <Button
                          className="w-full h-12 rounded-xl gap-2"
                          variant="outline"
                          onClick={handleApproveLp}
                          disabled={isLoading}
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          Approve LP Tokens
                        </Button>
                      )}

                      <Button
                        className="w-full h-14 text-base font-bold rounded-xl bg-gradient-pink hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/20"
                        disabled={!isConnected || !isCorrectNetwork || !removeAmount || needsLPApproval || !pairAddress || isLoading}
                        onClick={isCorrectNetwork ? handleRemoveLiquidity : switchNetwork}
                      >
                        {!isConnected ? (
                          <span className="flex items-center gap-2"><Wallet className="w-5 h-5" /> Connect Wallet</span>
                        ) : !isCorrectNetwork ? (
                          'Switch to Push Chain'
                        ) : isLoading ? (
                          <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Removing...</span>
                        ) : (
                          <span className="flex items-center gap-2"><Minus className="w-5 h-5" /> Remove Liquidity</span>
                        )}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </motion.div>

            {/* Sidebar */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-5 space-y-6"
            >
              {/* How It Works */}
              <div className="glass-card p-5 md:p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Info className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground">How It Works</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { step: '1', title: 'Select Tokens', desc: 'Choose a pair of tokens to provide liquidity for' },
                    { step: '2', title: 'Enter Amounts', desc: 'Amounts auto-calculate based on pool ratio' },
                    { step: '3', title: 'Approve & Confirm', desc: 'Approve tokens, then confirm the transaction' },
                    { step: '4', title: 'Earn Fees', desc: 'Earn 0.3% fee on every swap in your pool' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 group">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        currentStep >= parseInt(item.step)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-surface border border-border text-muted-foreground'
                      }`}>
                        {currentStep > parseInt(item.step) ? <CheckCircle2 className="w-4 h-4" /> : item.step}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wrap/Unwrap */}
              <WrapUnwrap />

              {/* Warning Card */}
              <div className="glass-card p-5 border-l-4 border-l-amber-500">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm mb-1">Impermanent Loss Risk</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Providing liquidity carries the risk of impermanent loss. This occurs when the price ratio of tokens changes after you deposit them. Consider using the IL calculator before adding large positions.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Liquidity;
