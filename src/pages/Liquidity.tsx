import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { markActionVerified } from '@/lib/airdropTracker';
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
  CheckCircle2, Wallet, Droplets
} from 'lucide-react';
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
    try {
      const tokenAAddr = tokenA.address === ethers.ZeroAddress ? CONTRACTS.WETH : tokenA.address;
      const tokenBAddr = tokenB.address === ethers.ZeroAddress ? CONTRACTS.WETH : tokenB.address;
      const pair = await getPairAddress(tokenAAddr, tokenBAddr);
      setPairAddress(pair);
      setIsNewPool(!pair);
      if (pair && address) {
        const [res, lpBal] = await Promise.all([
          getReserves(pair),
          getTokenBalance(pair, address),
        ]);
        setReserves(res);
        setLpBalance(formatAmount(lpBal));
      } else {
        setReserves(null);
        setLpBalance('0');
      }
    } catch {
      setPairAddress(null);
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
      if (address) markActionVerified(address, 'add_liquidity');
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
      if (address) markActionVerified(address, 'remove_liquidity');
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

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <WaveBackground />
      <Header />

      <main id="main-content" className="relative z-10 pt-32 md:pt-28 pb-28 md:pb-20 px-4 flex-1 flex items-start justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-lg"
        >
          {/* Title */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <Droplets className="w-7 h-7 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Manage <span className="text-primary">Liquidity</span>
            </h1>
          </div>

          {/* Main Card */}
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden">
            <Tabs defaultValue="add" className="w-full">
              {/* Tab Navigation - only Add & Remove */}
              <div className="border-b border-border/40">
                <TabsList className="w-full h-auto p-0 bg-transparent rounded-none grid grid-cols-2">
                  {[
                    { value: 'add', icon: <Plus className="w-4 h-4" />, label: 'Add Liquidity' },
                    { value: 'remove', icon: <Minus className="w-4 h-4" />, label: 'Remove Liquidity' },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none py-3.5 gap-2 text-muted-foreground hover:text-foreground transition-all font-medium"
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

                  {/* Token A Input */}
                  <div className="rounded-xl bg-muted/40 border border-border/50 p-4 transition-all hover:border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Token A</span>
                      <button onClick={setMaxA} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                        Balance: <span className="font-semibold text-foreground">{parseFloat(balanceA).toFixed(4)}</span>
                        <span className="ml-1 text-primary font-bold">MAX</span>
                      </button>
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

                  {/* Plus divider */}
                  <div className="flex justify-center -my-1">
                    <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border/50 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-primary" />
                    </div>
                  </div>

                  {/* Token B Input */}
                  <div className="rounded-xl bg-muted/40 border border-border/50 p-4 transition-all hover:border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Token B</span>
                      <button onClick={setMaxB} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                        Balance: <span className="font-semibold text-foreground">{parseFloat(balanceB).toFixed(4)}</span>
                        <span className="ml-1 text-primary font-bold">MAX</span>
                      </button>
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

                  {/* Pool Info */}
                  <div className="rounded-xl bg-muted/20 border border-border/30 p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pool Information</h4>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        {pairAddress ? (
                          <span className="flex items-center gap-1.5 text-success text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active Pool
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium">New Pool</span>
                        )}
                      </div>
                      {reserveDisplay && (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {tokenA.logo && <img src={tokenA.logo} alt="" className="w-4 h-4 rounded-full" />}
                              <span className="text-muted-foreground">{tokenA.symbol}</span>
                            </div>
                            <span className="font-semibold text-foreground tabular-nums">{parseFloat(reserveDisplay.reserveA).toFixed(4)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {tokenB.logo && <img src={tokenB.logo} alt="" className="w-4 h-4 rounded-full" />}
                              <span className="text-muted-foreground">{tokenB.symbol}</span>
                            </div>
                            <span className="font-semibold text-foreground tabular-nums">{parseFloat(reserveDisplay.reserveB).toFixed(4)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Approvals */}
                  {isConnected && isCorrectNetwork && (needsApprovalA || needsApprovalB) && (
                    <div className="space-y-2">
                      {needsApprovalA && tokenA.address !== ethers.ZeroAddress && (
                        <Button className="w-full h-12 rounded-xl font-semibold" variant="outline" onClick={() => handleApprove(tokenA)} disabled={isLoading}>
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Approve {tokenA.symbol}
                        </Button>
                      )}
                      {needsApprovalB && tokenB.address !== ethers.ZeroAddress && (
                        <Button className="w-full h-12 rounded-xl font-semibold" variant="outline" onClick={() => handleApprove(tokenB)} disabled={isLoading}>
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
                  {/* LP Token Info */}
                  <div className="rounded-xl bg-muted/40 border border-border/50 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your LP Tokens</span>
                      <span className="text-lg font-bold text-foreground tabular-nums">{parseFloat(lpBalance).toFixed(6)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1.5">
                        {tokenA.logo && <img src={tokenA.logo} alt="" className="w-4 h-4 rounded-full border border-background" />}
                        {tokenB.logo && <img src={tokenB.logo} alt="" className="w-4 h-4 rounded-full border border-background" />}
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{tokenA.symbol}/{tokenB.symbol} LP</span>
                    </div>
                  </div>

                  {/* Token pair selector */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <span className="text-xs text-muted-foreground mb-1 block">Token A</span>
                      <TokenSelector selectedToken={tokenA} onSelect={setTokenA} excludeToken={tokenB} />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-muted-foreground mb-1 block">Token B</span>
                      <TokenSelector selectedToken={tokenB} onSelect={setTokenB} excludeToken={tokenA} />
                    </div>
                  </div>

                  {/* Remove Amount Input */}
                  <div className="rounded-xl bg-muted/40 border border-border/50 p-4 transition-all hover:border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount to Remove</span>
                      <button onClick={() => setRemoveAmount(lpBalance)} className="text-xs text-primary font-bold hover:text-primary/80 transition-colors">MAX</button>
                    </div>
                    <Input
                      type="number" placeholder="0.0" value={removeAmount}
                      onChange={(e) => setRemoveAmount(e.target.value)}
                      className="border-0 bg-transparent text-2xl font-bold p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/30"
                    />
                  </div>

                  {/* Percentage shortcuts */}
                  <div className="grid grid-cols-4 gap-2">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => setRemoveAmount((parseFloat(lpBalance) * pct / 100).toString())}
                        className="py-2.5 rounded-xl bg-muted/40 hover:bg-primary/10 border border-border/50 hover:border-primary/30 text-sm font-bold text-foreground transition-all active:scale-95"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>

                  {pairAddress === null && (
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-sm text-destructive">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Pair does not exist for this token pair
                    </div>
                  )}

                  {needsLPApproval && (
                    <Button className="w-full h-12 rounded-xl font-semibold" variant="outline" onClick={handleApproveLp} disabled={isLoading}>
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
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={() => { fetchPairInfo(); fetchBalances(); }}>
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
