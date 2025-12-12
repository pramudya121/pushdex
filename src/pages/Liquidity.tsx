import React, { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { TokenSelector } from '@/components/TokenSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallet } from '@/contexts/WalletContext';
import { TOKENS, TokenInfo, CONTRACTS } from '@/config/contracts';
import { ROUTER_ABI, ERC20_ABI, PAIR_ABI } from '@/config/abis';
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
import { Plus, Minus, Loader2, AlertTriangle } from 'lucide-react';

const Liquidity = () => {
  const { address, signer, isConnected, isCorrectNetwork, switchNetwork } = useWallet();
  
  const [tokenA, setTokenA] = useState<TokenInfo>(TOKENS.PC);
  const [tokenB, setTokenB] = useState<TokenInfo>(TOKENS.PSDX);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [lpBalance, setLpBalance] = useState('0');
  const [removeAmount, setRemoveAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsApprovalA, setNeedsApprovalA] = useState(false);
  const [needsApprovalB, setNeedsApprovalB] = useState(false);
  const [needsLPApproval, setNeedsLPApproval] = useState(false);
  const [pairAddress, setPairAddress] = useState<string | null>(null);
  const [reserves, setReserves] = useState<{ reserve0: bigint; reserve1: bigint } | null>(null);

  // Fetch pair info
  const fetchPairInfo = useCallback(async () => {
    const tokenAAddr = tokenA.address === ethers.ZeroAddress ? CONTRACTS.WETH : tokenA.address;
    const tokenBAddr = tokenB.address === ethers.ZeroAddress ? CONTRACTS.WETH : tokenB.address;
    
    const pair = await getPairAddress(tokenAAddr, tokenBAddr);
    setPairAddress(pair);
    
    if (pair && address) {
      const res = await getReserves(pair);
      setReserves(res);
      
      const lpBal = await getTokenBalance(pair, address);
      setLpBalance(formatAmount(lpBal));
    }
  }, [tokenA, tokenB, address]);

  useEffect(() => {
    fetchPairInfo();
  }, [fetchPairInfo]);

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
      const deadline = getDeadline(20);
      
      const amountAWei = parseAmount(amountA, tokenA.decimals);
      const amountBWei = parseAmount(amountB, tokenB.decimals);
      const amountAMin = amountAWei * 95n / 100n;
      const amountBMin = amountBWei * 95n / 100n;

      let tx;
      
      if (tokenA.address === ethers.ZeroAddress) {
        tx = await router.addLiquidityETH(
          tokenB.address,
          amountBWei,
          amountBMin,
          amountAMin,
          address,
          deadline,
          { value: amountAWei }
        );
      } else if (tokenB.address === ethers.ZeroAddress) {
        tx = await router.addLiquidityETH(
          tokenA.address,
          amountAWei,
          amountAMin,
          amountBMin,
          address,
          deadline,
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
          deadline
        );
      }
      
      toast.loading('Adding liquidity...', { id: 'add' });
      await tx.wait();
      toast.success('Liquidity added!', { id: 'add' });
      
      setAmountA('');
      setAmountB('');
      fetchPairInfo();
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
      const deadline = getDeadline(20);
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
          deadline
        );
      } else {
        tx = await router.removeLiquidity(
          tokenA.address,
          tokenB.address,
          lpAmountWei,
          0,
          0,
          address,
          deadline
        );
      }
      
      toast.loading('Removing liquidity...', { id: 'remove' });
      await tx.wait();
      toast.success('Liquidity removed!', { id: 'remove' });
      
      setRemoveAmount('');
      fetchPairInfo();
    } catch (error: any) {
      toast.error(error.reason || 'Failed to remove liquidity', { id: 'remove' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <WaveBackground />
      <Header />
      
      <main className="relative z-10 pt-32 md:pt-24 pb-20 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">
              <span className="gradient-text">Liquidity</span>
            </h1>
            <p className="text-muted-foreground">
              Add or remove liquidity to earn fees
            </p>
          </div>

          <div className="glass-card p-6 animate-scale-in">
            <Tabs defaultValue="add">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="add" className="flex-1 gap-2">
                  <Plus className="w-4 h-4" />
                  Add
                </TabsTrigger>
                <TabsTrigger value="remove" className="flex-1 gap-2">
                  <Minus className="w-4 h-4" />
                  Remove
                </TabsTrigger>
              </TabsList>

              <TabsContent value="add" className="space-y-4">
                {/* Token A */}
                <div className="token-input">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Token A</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={amountA}
                      onChange={(e) => setAmountA(e.target.value)}
                      className="border-0 bg-transparent text-xl font-semibold p-0 h-auto focus-visible:ring-0"
                    />
                    <TokenSelector
                      selectedToken={tokenA}
                      onSelect={setTokenA}
                      excludeToken={tokenB}
                    />
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="p-2 rounded-xl bg-surface border border-border">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Token B */}
                <div className="token-input">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Token B</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={amountB}
                      onChange={(e) => setAmountB(e.target.value)}
                      className="border-0 bg-transparent text-xl font-semibold p-0 h-auto focus-visible:ring-0"
                    />
                    <TokenSelector
                      selectedToken={tokenB}
                      onSelect={setTokenB}
                      excludeToken={tokenA}
                    />
                  </div>
                </div>

                {/* Approvals */}
                {isConnected && isCorrectNetwork && (
                  <div className="space-y-2">
                    {needsApprovalA && tokenA.address !== ethers.ZeroAddress && (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleApprove(tokenA)}
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Approve {tokenA.symbol}
                      </Button>
                    )}
                    {needsApprovalB && tokenB.address !== ethers.ZeroAddress && (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleApprove(tokenB)}
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Approve {tokenB.symbol}
                      </Button>
                    )}
                  </div>
                )}

                <Button
                  className="w-full h-14 text-lg font-semibold bg-gradient-pink hover:opacity-90"
                  disabled={!isConnected || !isCorrectNetwork || !amountA || !amountB || needsApprovalA || needsApprovalB || isLoading}
                  onClick={isCorrectNetwork ? handleAddLiquidity : switchNetwork}
                >
                  {!isConnected ? 'Connect Wallet' : !isCorrectNetwork ? 'Switch Network' : isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </span>
                  ) : 'Add Liquidity'}
                </Button>
              </TabsContent>

              <TabsContent value="remove" className="space-y-4">
                {/* LP Balance */}
                <div className="p-4 rounded-xl bg-surface border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Your LP Balance</span>
                    <span className="font-semibold">{parseFloat(lpBalance).toFixed(6)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {tokenA.symbol}/{tokenB.symbol} LP
                  </div>
                </div>

                {/* Remove Amount */}
                <div className="token-input">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Amount to remove</span>
                    <button
                      onClick={() => setRemoveAmount(lpBalance)}
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      MAX
                    </button>
                  </div>
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={removeAmount}
                    onChange={(e) => setRemoveAmount(e.target.value)}
                    className="border-0 bg-transparent text-xl font-semibold p-0 h-auto focus-visible:ring-0"
                  />
                </div>

                {pairAddress === null && (
                  <div className="p-3 rounded-xl bg-warning/10 border border-warning/30 flex items-center gap-2 text-sm text-warning">
                    <AlertTriangle className="w-4 h-4" />
                    Pair does not exist
                  </div>
                )}

                {needsLPApproval && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleApproveLp}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Approve LP Tokens
                  </Button>
                )}

                <Button
                  className="w-full h-14 text-lg font-semibold bg-gradient-pink hover:opacity-90"
                  disabled={!isConnected || !isCorrectNetwork || !removeAmount || needsLPApproval || !pairAddress || isLoading}
                  onClick={isCorrectNetwork ? handleRemoveLiquidity : switchNetwork}
                >
                  {!isConnected ? 'Connect Wallet' : !isCorrectNetwork ? 'Switch Network' : isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Removing...
                    </span>
                  ) : 'Remove Liquidity'}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Liquidity;
