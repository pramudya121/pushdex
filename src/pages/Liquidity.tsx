import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TokenSelector } from '@/components/TokenSelector';
import { SlippageSettings } from '@/components/SlippageSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallet } from '@/contexts/WalletContext';
import { TOKENS, TokenInfo, CONTRACTS } from '@/config/contracts';
import { ROUTER_ABI, ERC20_ABI } from '@/config/abis';
import { useWETH } from '@/hooks/useWETH';
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
  Plus, Minus, Loader2, AlertTriangle, Sparkles, RefreshCw,
  ArrowDownUp, CheckCircle2, Wallet, RotateCcw
} from 'lucide-react';
import { motion } from 'framer-motion';

const Liquidity = () => {
  const { address, signer, isConnected, isCorrectNetwork, switchNetwork, balance } = useWallet();
  const {
    wpcBalance,
    pcBalance,
    isWrapping,
    isUnwrapping,
    wrap,
    unwrap,
  } = useWETH();

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

  // Wrap/Unwrap state
  const [wrapAmount, setWrapAmount] = useState('');
  const [unwrapAmount, setUnwrapAmount] = useState('');

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

  const calculateCorrespondingAmount = useCallback((
    inputAmount: string, inputToken: TokenInfo, outputToken: TokenInfo
  ): string => {
    if (!reserves || !inputAmount || parseFloat(inputAmount) === 0) return '';
    const inputAddr = inputToken.address === ethers.ZeroAddress ? CONTRACTS.WETH : inputToken.address;
    try {
      let reserveIn: bigint, reserveOut: bigint;
      if (reserves.token0.toLowerCase() === inputAddr.toLowerCase()) {
        reserveIn = reserves.reserve0; reserveOut = reserves.reserve1;
      } else {
        reserveIn = reserves.reserve1; reserveOut = reserves.reserve0;
      }
      if (reserveIn === 0n || reserveOut === 0n) return '';
      const amountIn = parseAmount(inputAmount, inputToken.decimals);
      const amountOut = (amountIn * reserveOut) / reserveIn;
      return formatAmount(amountOut, outputToken.decimals);
    } catch { return ''; }
  }, [reserves]);

  const handleAmountAChange = useCallback((value: string) => {
    setAmountA(value);
    setActiveInput('A');
    if (!isNewPool && reserves && value && parseFloat(value) > 0) {
      setIsCalculating(true);
      setAmountB(calculateCorrespondingAmount(value, tokenA, tokenB));
      setIsCalculating(false);
    }
  }, [isNewPool, reserves, calculateCorrespondingAmount, tokenA, tokenB]);

  const handleAmountBChange = useCallback((value: string) => {
    setAmountB(value);
    setActiveInput('B');
    if (!isNewPool && reserves && value && parseFloat(value) > 0) {
      setIsCalculating(true);
      setAmountA(calculateCorrespondingAmount(value, tokenB, tokenA));
      setIsCalculating(false);
    }
  }, [isNewPool, reserves, calculateCorrespondingAmount, tokenA, tokenB]);

  // Reserves display
  const reserveDisplay = useMemo(() => {
    if (!reserves) return null;
    const tokenAAddr = tokenA.address === ethers.ZeroAddress ? CONTRACTS.WETH : tokenA.address;
    let resA: bigint, resB: bigint;
    if (reserves.token0.toLowerCase() === tokenAAddr.toLowerCase()) {
      resA = reserves.reserve0; resB = reserves.reserve1;
    } else {
      resA = reserves.reserve1; resB = reserves.reserve0;
    }
    return {
      reserveA: formatAmount(resA, tokenA.decimals),
      reserveB: formatAmount(resB, tokenB.decimals),
    };
  }, [reserves, tokenA, tokenB]);

  useEffect(() => {
    const checkApprovals = async () => {
      if (!address || !amountA || !amountB) return;
      if (tokenA.address !== ethers.ZeroAddress) {
        const allowanceA = await getTokenAllowance(tokenA.address, address, CONTRACTS.ROUTER);
        setNeedsApprovalA(allowanceA < parseAmount(amountA, tokenA.decimals));
      } else { setNeedsApprovalA(false); }
      if (tokenB.address !== ethers.ZeroAddress) {
        const allowanceB = await getTokenAllowance(tokenB.address, address, CONTRACTS.ROUTER);
        setNeedsApprovalB(allowanceB < parseAmount(amountB, tokenB.decimals));
      } else { setNeedsApprovalB(false); }
    };
    checkApprovals();
  }, [address, amountA, amountB, tokenA, tokenB]);

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
    } finally { setIsLoading(false); }
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
    } finally { setIsLoading(false); }
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
        tx = await router.addLiquidityETH(tokenB.address, amountBWei, amountBMin, amountAMin, address, txDeadline, { value: amountAWei });
      } else if (tokenB.address === ethers.ZeroAddress) {
        tx = await router.addLiquidityETH(tokenA.address, amountAWei, amountAMin, amountBMin, address, txDeadline, { value: amountBWei });
      } else {
        tx = await router.addLiquidity(tokenA.address, tokenB.address, amountAWei, amountBWei, amountAMin, amountBMin, address, txDeadline);
      }
      toast.loading(isNewPool ? 'Creating pool...' : 'Adding liquidity...', { id: 'add' });
      await tx.wait();
      toast.success(isNewPool ? 'Pool created!' : 'Liquidity added!', { id: 'add' });
      setAmountA(''); setAmountB('');
      fetchPairInfo(); fetchBalances();
    } catch (error: any) {
      toast.error(error.reason || 'Failed to add liquidity', { id: 'add' });
    } finally { setIsLoading(false); }
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
        tx = await router.removeLiquidityETH(token.address, lpAmountWei, 0, 0, address, txDeadline);
      } else {
        tx = await router.removeLiquidity(tokenA.address, tokenB.address, lpAmountWei, 0, 0, address, txDeadline);
      }
      toast.loading('Removing liquidity...', { id: 'remove' });
      await tx.wait();
      toast.success('Liquidity removed!', { id: 'remove' });
      setRemoveAmount('');
      fetchPairInfo(); fetchBalances();
    } catch (error: any) {
      toast.error(error.reason || 'Failed to remove liquidity', { id: 'remove' });
    } finally { setIsLoading(false); }
  };

  const setMaxA = () => {
    const maxAmount = tokenA.address === ethers.ZeroAddress
      ? Math.max(0, parseFloat(balance) - 0.01).toFixed(6)
      : balanceA;
    handleAmountAChange(maxAmount);
  };

  const setMaxB = () => {
    const maxAmount = tokenB.address === ethers.ZeroAddress
      ? Math.max(0, parseFloat(balance) - 0.01).toFixed(6)
      : balanceB;
    handleAmountBChange(maxAmount);
  };

  const handleWrap = async () => {
    if (!wrapAmount || parseFloat(wrapAmount) === 0) return;
    const success = await wrap(wrapAmount);
    if (success) setWrapAmount('');
  };

  const handleUnwrap = async () => {
    if (!unwrapAmount || parseFloat(unwrapAmount) === 0) return;
    const success = await unwrap(unwrapAmount);
    if (success) setUnwrapAmount('');
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <WaveBackground />
      <Header />

      <main id="main-content" className="relative z-10 pt-32 md:pt-28 pb-28 md:pb-20 px-4 flex-1 flex items-start justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-primary text-center mb-6">
            Manage Liquidity
          </h1>

          {/* Main Card */}
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden">
            <Tabs defaultValue="add" className="w-full">
              {/* Tab Navigation */}
              <div className="border-b border-border/40">
                <TabsList className="w-full h-auto p-0 bg-transparent rounded-none grid grid-cols-4">
                  {[
                    { value: 'add', icon: <Plus className="w-4 h-4" />, label: 'Add' },
                    { value: 'remove', icon: <Minus className="w-4 h-4" />, label: 'Remove' },
                    { value: 'wrap', icon: <ArrowDownUp className="w-4 h-4" />, label: 'Wrap' },
                    { value: 'unwrap', icon: <RotateCcw className="w-4 h-4" />, label: 'Unwrap' },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none py-3 gap-1.5 text-muted-foreground hover:text-foreground transition-all"
                    >
                      {tab.icon}
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="p-5 md:p-6">
                {/* ========== ADD TAB ========== */}
                <TabsContent value="add" className="space-y-4 mt-0">
                  {isNewPool && amountA && amountB && (
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 flex items-center gap-2 text-sm text-primary">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>You are creating a new liquidity pool!</span>
                    </div>
                  )}

                  {/* Token A */}
                  <div className="rounded-xl bg-muted/50 border border-border/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Token A</span>
                      <span className="text-sm text-muted-foreground">Balance: {parseFloat(balanceA).toFixed(4)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 relative">
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={amountA}
                          onChange={(e) => handleAmountAChange(e.target.value)}
                          className="border-0 bg-transparent text-2xl font-semibold p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/40"
                        />
                        {isCalculating && activeInput === 'B' && (
                          <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                        )}
                      </div>
                      <TokenSelector selectedToken={tokenA} onSelect={setTokenA} excludeToken={tokenB} />
                    </div>
                  </div>

                  {/* Plus divider */}
                  <div className="flex justify-center">
                    <span className="text-primary text-lg font-bold">+</span>
                  </div>

                  {/* Token B */}
                  <div className="rounded-xl bg-muted/50 border border-border/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Token B</span>
                      <span className="text-sm text-muted-foreground">Balance: {parseFloat(balanceB).toFixed(4)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 relative">
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={amountB}
                          onChange={(e) => handleAmountBChange(e.target.value)}
                          className="border-0 bg-transparent text-2xl font-semibold p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/40"
                        />
                        {isCalculating && activeInput === 'A' && (
                          <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                        )}
                      </div>
                      <TokenSelector selectedToken={tokenB} onSelect={setTokenB} excludeToken={tokenA} />
                    </div>
                  </div>

                  {/* Pool Info / Reserves */}
                  <div className="rounded-xl bg-muted/30 border border-border/40 p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pool exists</span>
                      {pairAddress ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <span className="text-xs text-muted-foreground">New Pool</span>
                      )}
                    </div>
                    {reserveDisplay && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {tokenA.logo && <img src={tokenA.logo} alt="" className="w-4 h-4 rounded-full" />}
                            <span className="text-muted-foreground">{tokenA.symbol} Reserve</span>
                          </div>
                          <span className="font-semibold text-foreground">{parseFloat(reserveDisplay.reserveA).toFixed(4)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {tokenB.logo && <img src={tokenB.logo} alt="" className="w-4 h-4 rounded-full" />}
                            <span className="text-muted-foreground">{tokenB.symbol} Reserve</span>
                          </div>
                          <span className="font-semibold text-foreground">{parseFloat(reserveDisplay.reserveB).toFixed(4)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Approvals */}
                  {isConnected && isCorrectNetwork && (needsApprovalA || needsApprovalB) && (
                    <div className="space-y-2">
                      {needsApprovalA && tokenA.address !== ethers.ZeroAddress && (
                        <Button className="w-full h-12 rounded-xl" variant="outline" onClick={() => handleApprove(tokenA)} disabled={isLoading}>
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Approve {tokenA.symbol}
                        </Button>
                      )}
                      {needsApprovalB && tokenB.address !== ethers.ZeroAddress && (
                        <Button className="w-full h-12 rounded-xl" variant="outline" onClick={() => handleApprove(tokenB)} disabled={isLoading}>
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Approve {tokenB.symbol}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <Button
                    className="w-full h-14 text-base font-bold rounded-xl bg-gradient-pink hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    disabled={!isConnected || !isCorrectNetwork || !amountA || !amountB || needsApprovalA || needsApprovalB || isLoading}
                    onClick={isCorrectNetwork ? handleAddLiquidity : switchNetwork}
                  >
                    {!isConnected ? 'Connect Wallet' : !isCorrectNetwork ? 'Switch Network' : isLoading ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />{isNewPool ? 'Creating Pool...' : 'Adding...'}</span>
                    ) : isNewPool ? 'Create Pool & Add Liquidity' : 'Add Liquidity'}
                  </Button>
                </TabsContent>

                {/* ========== REMOVE TAB ========== */}
                <TabsContent value="remove" className="space-y-4 mt-0">
                  <div className="rounded-xl bg-muted/50 border border-border/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Your LP Balance</span>
                      <span className="text-sm font-semibold text-foreground">{parseFloat(lpBalance).toFixed(6)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{tokenA.symbol}/{tokenB.symbol} LP</span>
                  </div>

                  <div className="rounded-xl bg-muted/50 border border-border/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Amount to remove</span>
                      <button onClick={() => setRemoveAmount(lpBalance)} className="text-xs text-primary font-semibold hover:text-primary/80">MAX</button>
                    </div>
                    <Input
                      type="number" placeholder="0.0" value={removeAmount}
                      onChange={(e) => setRemoveAmount(e.target.value)}
                      className="border-0 bg-transparent text-2xl font-semibold p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/40"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => setRemoveAmount((parseFloat(lpBalance) * pct / 100).toString())}
                        className="py-2.5 rounded-xl bg-muted/50 hover:bg-primary/10 border border-border/50 hover:border-primary/30 text-sm font-semibold text-foreground transition-all"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>

                  {pairAddress === null && (
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-sm text-destructive">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Pair does not exist
                    </div>
                  )}

                  {needsLPApproval && (
                    <Button className="w-full h-12 rounded-xl" variant="outline" onClick={handleApproveLp} disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Approve LP Tokens
                    </Button>
                  )}

                  <Button
                    className="w-full h-14 text-base font-bold rounded-xl bg-gradient-pink hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    disabled={!isConnected || !isCorrectNetwork || !removeAmount || needsLPApproval || !pairAddress || isLoading}
                    onClick={isCorrectNetwork ? handleRemoveLiquidity : switchNetwork}
                  >
                    {!isConnected ? 'Connect Wallet' : !isCorrectNetwork ? 'Switch Network' : isLoading ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Removing...</span>
                    ) : 'Remove Liquidity'}
                  </Button>
                </TabsContent>

                {/* ========== WRAP TAB ========== */}
                <TabsContent value="wrap" className="space-y-4 mt-0">
                  <div className="rounded-xl bg-muted/50 border border-border/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">PC Balance</span>
                      <span className="text-sm font-semibold text-foreground">{parseFloat(pcBalance).toFixed(6)} PC</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number" placeholder="0.0" value={wrapAmount}
                        onChange={(e) => setWrapAmount(e.target.value)}
                        className="border-0 bg-transparent text-2xl font-semibold p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/40"
                      />
                      <button onClick={() => setWrapAmount(pcBalance)} className="text-sm text-primary font-semibold hover:text-primary/80">MAX</button>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowDownUp className="w-5 h-5 text-muted-foreground" />
                  </div>

                  <div className="rounded-xl bg-muted/50 border border-border/50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">You will receive</span>
                      <span className="text-sm font-semibold text-foreground">{wrapAmount || '0'} WPC</span>
                    </div>
                  </div>

                  <Button
                    className="w-full h-14 text-base font-bold rounded-xl bg-gradient-pink hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    disabled={!isConnected || !isCorrectNetwork || !wrapAmount || parseFloat(wrapAmount) === 0 || isWrapping}
                    onClick={handleWrap}
                  >
                    {isWrapping ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Wrapping...</span>
                    ) : 'Wrap PC → WPC'}
                  </Button>
                </TabsContent>

                {/* ========== UNWRAP TAB ========== */}
                <TabsContent value="unwrap" className="space-y-4 mt-0">
                  <div className="rounded-xl bg-muted/50 border border-border/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">WPC Balance</span>
                      <span className="text-sm font-semibold text-foreground">{parseFloat(wpcBalance).toFixed(6)} WPC</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number" placeholder="0.0" value={unwrapAmount}
                        onChange={(e) => setUnwrapAmount(e.target.value)}
                        className="border-0 bg-transparent text-2xl font-semibold p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/40"
                      />
                      <button onClick={() => setUnwrapAmount(wpcBalance)} className="text-sm text-primary font-semibold hover:text-primary/80">MAX</button>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowDownUp className="w-5 h-5 text-muted-foreground" />
                  </div>

                  <div className="rounded-xl bg-muted/50 border border-border/50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">You will receive</span>
                      <span className="text-sm font-semibold text-foreground">{unwrapAmount || '0'} PC</span>
                    </div>
                  </div>

                  <Button
                    className="w-full h-14 text-base font-bold rounded-xl bg-gradient-pink hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                    disabled={!isConnected || !isCorrectNetwork || !unwrapAmount || parseFloat(unwrapAmount) === 0 || isUnwrapping}
                    onClick={handleUnwrap}
                  >
                    {isUnwrapping ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Unwrapping...</span>
                    ) : 'Unwrap WPC → PC'}
                  </Button>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Settings row below card */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <SlippageSettings
              slippage={slippage}
              deadline={deadline}
              onSlippageChange={setSlippage}
              onDeadlineChange={setDeadline}
            />
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => { fetchPairInfo(); fetchBalances(); }}>
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Liquidity;
