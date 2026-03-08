import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useWallet } from '@/contexts/WalletContext';
import { CONTRACTS, BLOCK_EXPLORER, RPC_URL } from '@/config/contracts';
import { TOKEN_FACTORY_ABI, ERC20_ABI } from '@/config/abis';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins, Copy, ExternalLink, Send, Search, Loader2, RefreshCw,
  Wallet, Hash, BarChart3, Eye, Shield, ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TokenDetail {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  balance: string;
  owner: string;
}

interface TokenExplorerProps {
  refreshTrigger?: number;
}

export const TokenExplorer: React.FC<TokenExplorerProps> = ({ refreshTrigger }) => {
  const { address, signer, isConnected, provider } = useWallet();
  const [tokens, setTokens] = useState<TokenDetail[]>([]);
  const [myCreatedTokens, setMyCreatedTokens] = useState<TokenDetail[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMine, setLoadingMine] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');

  // Transfer state
  const [transferToken, setTransferToken] = useState<TokenDetail | null>(null);
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  // Approve state
  const [approveToken, setApproveToken] = useState<TokenDetail | null>(null);
  const [approveSpender, setApproveSpender] = useState('');
  const [approveAmount, setApproveAmount] = useState('');
  const [approving, setApproving] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);

  const readProvider = React.useMemo(() => new ethers.JsonRpcProvider(RPC_URL), []);

  const loadTokens = useCallback(async () => {
    setLoading(true);
    try {
      const p = provider || readProvider;
      const factory = new ethers.Contract(CONTRACTS.TOKEN_FACTORY, TOKEN_FACTORY_ABI, p);

      const count = await factory.totalTokens();
      setTotalCount(Number(count));

      const allAddresses: string[] = await factory.getAllTokens();

      // Fetch details for each token
      const details: TokenDetail[] = await Promise.all(
        allAddresses.map(async (addr) => {
          try {
            const token = new ethers.Contract(addr, [
              ...ERC20_ABI,
              {
                inputs: [],
                name: 'owner',
                outputs: [{ name: '', type: 'address' }],
                stateMutability: 'view',
                type: 'function',
              },
            ], p);

            const [name, symbol, decimals, totalSupply, owner, balance] = await Promise.all([
              token.name().catch(() => 'Unknown'),
              token.symbol().catch(() => '???'),
              token.decimals().catch(() => 18),
              token.totalSupply().catch(() => 0n),
              token.owner().catch(() => ethers.ZeroAddress),
              address ? token.balanceOf(address).catch(() => 0n) : Promise.resolve(0n),
            ]);

            return {
              address: addr,
              name,
              symbol,
              decimals: Number(decimals),
              totalSupply: ethers.formatUnits(totalSupply, Number(decimals)),
              balance: ethers.formatUnits(balance, Number(decimals)),
              owner,
            };
          } catch {
            return {
              address: addr,
              name: 'Unknown',
              symbol: '???',
              decimals: 18,
              totalSupply: '0',
              balance: '0',
              owner: ethers.ZeroAddress,
            };
          }
        })
      );

      setTokens(details.reverse()); // newest first
    } catch (e) {
      console.error('Failed to load tokens:', e);
    } finally {
      setLoading(false);
    }
  }, [provider, readProvider, address]);

  // Load tokens created by connected wallet using getTokensByCreator()
  const loadMyCreatedTokens = useCallback(async () => {
    if (!address) { setMyCreatedTokens([]); return; }
    setLoadingMine(true);
    try {
      const p = provider || readProvider;
      const factory = new ethers.Contract(CONTRACTS.TOKEN_FACTORY, TOKEN_FACTORY_ABI, p);

      let creatorAddresses: string[] = [];
      try {
        creatorAddresses = await factory.getTokensByCreator(address);
      } catch {
        // Fallback: filter from all tokens by owner field
        creatorAddresses = tokens.filter(t => t.owner.toLowerCase() === address.toLowerCase()).map(t => t.address);
      }

      if (creatorAddresses.length === 0) {
        setMyCreatedTokens([]);
        setLoadingMine(false);
        return;
      }

      const details: TokenDetail[] = await Promise.all(
        creatorAddresses.map(async (addr) => {
          // Check if already loaded in all tokens
          const existing = tokens.find(t => t.address.toLowerCase() === addr.toLowerCase());
          if (existing) return existing;

          try {
            const token = new ethers.Contract(addr, [
              ...ERC20_ABI,
              { inputs: [], name: 'owner', outputs: [{ name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
            ], p);
            const [name, symbol, decimals, totalSupply, owner, balance] = await Promise.all([
              token.name().catch(() => 'Unknown'),
              token.symbol().catch(() => '???'),
              token.decimals().catch(() => 18),
              token.totalSupply().catch(() => 0n),
              token.owner().catch(() => ethers.ZeroAddress),
              token.balanceOf(address).catch(() => 0n),
            ]);
            return {
              address: addr, name, symbol,
              decimals: Number(decimals),
              totalSupply: ethers.formatUnits(totalSupply, Number(decimals)),
              balance: ethers.formatUnits(balance, Number(decimals)),
              owner,
            };
          } catch {
            return { address: addr, name: 'Unknown', symbol: '???', decimals: 18, totalSupply: '0', balance: '0', owner: ethers.ZeroAddress };
          }
        })
      );
      setMyCreatedTokens(details.reverse());
    } catch (e) {
      console.error('Failed to load creator tokens:', e);
    } finally {
      setLoadingMine(false);
    }
  }, [provider, readProvider, address, tokens]);

  useEffect(() => {
    loadTokens();
  }, [loadTokens, refreshTrigger]);

  useEffect(() => {
    if (address && tokens.length > 0) {
      loadMyCreatedTokens();
    }
  }, [address, tokens, loadMyCreatedTokens]);

  const handleTransfer = async () => {
    if (!signer || !transferToken || !transferTo || !transferAmount) return;
    setTransferring(true);
    try {
      const token = new ethers.Contract(transferToken.address, ERC20_ABI, signer);
      const amount = ethers.parseUnits(transferAmount, transferToken.decimals);
      toast.loading('Sending tokens...', { id: 'transfer' });
      const tx = await token.transfer(transferTo, amount, { gasLimit: 100000n });
      await tx.wait();
      toast.success(`${transferAmount} ${transferToken.symbol} sent!`, { id: 'transfer' });
      setTransferOpen(false);
      setTransferTo('');
      setTransferAmount('');
      loadTokens();
    } catch (e: any) {
      console.error('Transfer error:', e);
      toast.error(e.reason || e.message || 'Transfer failed', { id: 'transfer' });
    } finally {
      setTransferring(false);
    }
  };

  const handleApprove = async () => {
    if (!signer || !approveToken || !approveSpender || !approveAmount) return;
    setApproving(true);
    try {
      const token = new ethers.Contract(approveToken.address, ERC20_ABI, signer);
      const amount = approveAmount.toLowerCase() === 'unlimited' 
        ? ethers.MaxUint256 
        : ethers.parseUnits(approveAmount, approveToken.decimals);
      toast.loading('Approving...', { id: 'approve' });
      const tx = await token.approve(approveSpender, amount, { gasLimit: 100000n });
      await tx.wait();
      toast.success(`Approved ${approveAmount} ${approveToken.symbol}`, { id: 'approve' });
      setApproveOpen(false);
      setApproveSpender('');
      setApproveAmount('');
    } catch (e: any) {
      console.error('Approve error:', e);
      toast.error(e.reason || e.message || 'Approve failed', { id: 'approve' });
    } finally {
      setApproving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const filteredTokens = React.useMemo(() => {
    const source = activeTab === 'mine' ? myCreatedTokens : tokens;
    return source.filter((t) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.symbol.toLowerCase().includes(q) || t.address.toLowerCase().includes(q);
    });
  }, [tokens, myCreatedTokens, activeTab, searchQuery]);

  const myTokensCount = myCreatedTokens.length;
  const isListLoading = activeTab === 'mine' ? loadingMine : loading;

  return (
    <div className="space-y-6">
      {/* Global Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Hash className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{totalCount}</p>
            <p className="text-xs text-muted-foreground">Total Tokens</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Wallet className="w-5 h-5 text-accent mx-auto mb-1" />
            <p className="text-2xl font-bold">{myTokensCount}</p>
            <p className="text-xs text-muted-foreground">My Tokens</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{tokens.filter((t) => parseFloat(t.balance) > 0).length}</p>
            <p className="text-xs text-muted-foreground">Holding</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Shield className="w-5 h-5 text-emerald-500 dark:text-emerald-400 mx-auto mb-1" />
            <p className="text-2xl font-bold">ERC20</p>
            <p className="text-xs text-muted-foreground">Standard</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" />
              Token Explorer
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={loadTokens} disabled={loading} className="gap-1.5">
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('all')}
              className="gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" /> All ({totalCount})
            </Button>
            <Button
              variant={activeTab === 'mine' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('mine')}
              className="gap-1.5"
              disabled={!isConnected}
            >
              <Wallet className="w-3.5 h-3.5" /> My Tokens ({myTokensCount})
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, symbol, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Separator />

          {/* Token List */}
          {isListLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Loading tokens from blockchain...</p>
            </div>
          ) : filteredTokens.length === 0 ? (
            <div className="py-12 text-center">
              <Coins className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No tokens match your search' : activeTab === 'mine' ? 'You haven\'t created any tokens yet' : 'No tokens deployed yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredTokens.map((token, i) => (
                  <motion.div
                    key={token.address}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm text-primary">
                            {token.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">{token.name}</h4>
                            <p className="text-xs text-muted-foreground">{token.symbol}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {address && token.owner.toLowerCase() === address.toLowerCase() && (
                            <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">Creator</Badge>
                          )}
                          {parseFloat(token.balance) > 0 && (
                            <Badge variant="outline" className="text-[10px]">Holding</Badge>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-background/50">
                          <p className="text-muted-foreground">Total Supply</p>
                          <p className="font-medium">{parseFloat(token.totalSupply).toLocaleString()}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-background/50">
                          <p className="text-muted-foreground">Your Balance</p>
                          <p className="font-medium">{parseFloat(token.balance).toLocaleString()}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-background/50">
                          <p className="text-muted-foreground">Decimals</p>
                          <p className="font-medium">{token.decimals}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-background/50">
                          <p className="text-muted-foreground">Contract</p>
                          <p className="font-mono font-medium">{token.address.slice(0, 6)}...{token.address.slice(-4)}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs h-8"
                          onClick={() => copyToClipboard(token.address)}
                        >
                          <Copy className="w-3 h-3" /> Copy Address
                        </Button>
                        <a
                          href={`${BLOCK_EXPLORER}/address/${token.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                            <ExternalLink className="w-3 h-3" /> Explorer
                          </Button>
                        </a>
                        {isConnected && parseFloat(token.balance) > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs h-8 text-primary border-primary/30"
                            onClick={() => {
                              setTransferToken(token);
                              setTransferOpen(true);
                            }}
                          >
                            <Send className="w-3 h-3" /> Transfer
                          </Button>
                        )}
                        {isConnected && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs h-8"
                            onClick={() => {
                              setApproveToken(token);
                              setApproveOpen(true);
                            }}
                          >
                            <ArrowUpRight className="w-3 h-3" /> Approve
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Transfer {transferToken?.symbol}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-sm">
              <span className="text-muted-foreground">Available: </span>
              <span className="font-medium">{transferToken ? parseFloat(transferToken.balance).toLocaleString() : '0'} {transferToken?.symbol}</span>
            </div>
            <div className="space-y-2">
              <Label>Recipient Address</Label>
              <Input
                placeholder="0x..."
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Amount</Label>
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={() => transferToken && setTransferAmount(transferToken.balance)}
                >
                  Max
                </button>
              </div>
              <Input
                type="number"
                placeholder="0.0"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
            </div>
            <Button
              className="w-full gap-2"
              onClick={handleTransfer}
              disabled={transferring || !transferTo || !transferAmount || parseFloat(transferAmount) <= 0}
            >
              {transferring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {transferring ? 'Sending...' : 'Send Tokens'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-primary" />
              Approve {approveToken?.symbol}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-warning/10 border border-warning/30 text-xs text-muted-foreground">
              Approving allows a smart contract (spender) to transfer tokens on your behalf. Use this for DEX trading, adding liquidity, etc.
            </div>
            <div className="space-y-2">
              <Label>Spender Address</Label>
              <Input
                placeholder="0x... (contract address)"
                value={approveSpender}
                onChange={(e) => setApproveSpender(e.target.value)}
              />
              <div className="flex gap-2 flex-wrap">
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={() => setApproveSpender(CONTRACTS.ROUTER)}
                >
                  PUSHDEX Router
                </button>
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={() => setApproveSpender(CONTRACTS.FARMING)}
                >
                  Farming Contract
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Amount</Label>
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={() => setApproveAmount('unlimited')}
                >
                  Unlimited
                </button>
              </div>
              <Input
                placeholder="Amount or 'unlimited'"
                value={approveAmount}
                onChange={(e) => setApproveAmount(e.target.value)}
              />
            </div>
            <Button
              className="w-full gap-2"
              onClick={handleApprove}
              disabled={approving || !approveSpender || !approveAmount}
            >
              {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
              {approving ? 'Approving...' : 'Approve'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
