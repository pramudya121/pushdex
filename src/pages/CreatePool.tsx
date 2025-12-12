import React, { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { TokenSelector } from '@/components/TokenSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWallet } from '@/contexts/WalletContext';
import { TOKENS, TokenInfo, CONTRACTS } from '@/config/contracts';
import { ROUTER_ABI, ERC20_ABI } from '@/config/abis';
import {
  getPairAddress,
  getTokenBalance,
  getTokenAllowance,
  parseAmount,
  formatAmount,
  getDeadline,
} from '@/lib/dex';
import { toast } from 'sonner';
import { Plus, Loader2, AlertTriangle, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const CreatePool = () => {
  const navigate = useNavigate();
  const { address, signer, isConnected, isCorrectNetwork, switchNetwork, balance } = useWallet();
  
  const [tokenA, setTokenA] = useState<TokenInfo>(TOKENS.PSDX);
  const [tokenB, setTokenB] = useState<TokenInfo>(TOKENS.ETH);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [balanceA, setBalanceA] = useState('0');
  const [balanceB, setBalanceB] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [needsApprovalA, setNeedsApprovalA] = useState(false);
  const [needsApprovalB, setNeedsApprovalB] = useState(false);
  const [pairExists, setPairExists] = useState(false);
  const [checkingPair, setCheckingPair] = useState(false);

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

  // Check if pair exists
  const checkPairExists = useCallback(async () => {
    setCheckingPair(true);
    const tokenAAddr = tokenA.address === ethers.ZeroAddress ? CONTRACTS.WETH : tokenA.address;
    const tokenBAddr = tokenB.address === ethers.ZeroAddress ? CONTRACTS.WETH : tokenB.address;
    
    const pair = await getPairAddress(tokenAAddr, tokenBAddr);
    setPairExists(!!pair);
    setCheckingPair(false);
  }, [tokenA, tokenB]);

  useEffect(() => {
    checkPairExists();
    fetchBalances();
  }, [checkPairExists, fetchBalances]);

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

  const handleCreatePool = async () => {
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
      
      toast.loading('Creating pool...', { id: 'create' });
      await tx.wait();
      toast.success('Pool created successfully!', { id: 'create' });
      
      navigate('/pools');
    } catch (error: any) {
      toast.error(error.reason || 'Failed to create pool', { id: 'create' });
    } finally {
      setIsLoading(false);
    }
  };

  const setMaxA = () => {
    if (tokenA.address === ethers.ZeroAddress) {
      const maxAmount = Math.max(0, parseFloat(balance) - 0.01).toFixed(6);
      setAmountA(maxAmount);
    } else {
      setAmountA(balanceA);
    }
  };

  const setMaxB = () => {
    if (tokenB.address === ethers.ZeroAddress) {
      const maxAmount = Math.max(0, parseFloat(balance) - 0.01).toFixed(6);
      setAmountB(maxAmount);
    } else {
      setAmountB(balanceB);
    }
  };

  const canCreate = isConnected && isCorrectNetwork && amountA && amountB && !needsApprovalA && !needsApprovalB && !pairExists && !isLoading;

  return (
    <div className="min-h-screen relative">
      <WaveBackground />
      <Header />
      
      <main className="relative z-10 pt-32 md:pt-24 pb-20 px-4">
        <div className="max-w-lg mx-auto">
          {/* Back Link */}
          <Link to="/pools" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Pools
          </Link>

          <div className="glass-card p-6 animate-scale-in">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">New Pool</span>
              </div>
              <h1 className="text-2xl font-bold mb-2">Create Liquidity Pool</h1>
              <p className="text-muted-foreground text-sm">
                Select two tokens and provide initial liquidity
              </p>
            </div>

            {/* Pair Exists Warning */}
            {pairExists && (
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-3 mb-6">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-warning">Pool Already Exists</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    A liquidity pool for this token pair already exists. You can add liquidity to the existing pool instead.
                  </p>
                  <Link to="/liquidity">
                    <Button variant="outline" size="sm" className="mt-3">
                      Go to Liquidity
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Token A */}
            <div className="token-input mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">First Token</span>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    Balance: {parseFloat(balanceA).toFixed(4)}
                  </span>
                  <button
                    onClick={setMaxA}
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    MAX
                  </button>
                </div>
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

            <div className="flex justify-center mb-4">
              <div className="p-2 rounded-xl bg-surface border border-border">
                <Plus className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* Token B */}
            <div className="token-input mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Second Token</span>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    Balance: {parseFloat(balanceB).toFixed(4)}
                  </span>
                  <button
                    onClick={setMaxB}
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    MAX
                  </button>
                </div>
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

            {/* Initial Price */}
            {amountA && amountB && !pairExists && (
              <div className="p-4 rounded-xl bg-surface border border-border mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Initial Pool Price</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-lg bg-background">
                    <div className="text-muted-foreground mb-1">1 {tokenA.symbol} =</div>
                    <div className="font-semibold">
                      {(parseFloat(amountB) / parseFloat(amountA)).toFixed(6)} {tokenB.symbol}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-background">
                    <div className="text-muted-foreground mb-1">1 {tokenB.symbol} =</div>
                    <div className="font-semibold">
                      {(parseFloat(amountA) / parseFloat(amountB)).toFixed(6)} {tokenA.symbol}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Approvals */}
            {isConnected && isCorrectNetwork && !pairExists && (
              <div className="space-y-2 mb-4">
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

            {/* Create Button */}
            <Button
              className="w-full h-14 text-lg font-semibold bg-gradient-pink hover:opacity-90"
              disabled={!canCreate}
              onClick={isCorrectNetwork ? handleCreatePool : switchNetwork}
            >
              {!isConnected ? 'Connect Wallet' : !isCorrectNetwork ? 'Switch Network' : checkingPair ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking...
                </span>
              ) : pairExists ? 'Pool Already Exists' : isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Pool...
                </span>
              ) : !amountA || !amountB ? 'Enter Amounts' : needsApprovalA || needsApprovalB ? 'Approve Tokens First' : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Create Pool
                </span>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreatePool;