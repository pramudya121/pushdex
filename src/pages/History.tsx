import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { WaveBackground } from '@/components/WaveBackground';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallet } from '@/contexts/WalletContext';
import { getFactoryContract, getReadProvider, getPairContract, getTokenByAddress } from '@/lib/dex';
import { ethers } from 'ethers';
import { 
  History, 
  ArrowRightLeft, 
  Plus, 
  Minus, 
  ExternalLink, 
  RefreshCw,
  Clock,
  Filter,
  Wallet,
  Droplets
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'swap' | 'add' | 'remove';
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: string;
  amountOut?: string;
  token0?: string;
  token1?: string;
  amount0?: string;
  amount1?: string;
  lpAmount?: string;
  timestamp: number;
  txHash: string;
  blockNumber: number;
}

export default function HistoryPage() {
  const { address, isConnected } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const fetchTransactionHistory = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const provider = getReadProvider();
      const factory = getFactoryContract(provider);
      
      // Get all pairs
      const pairCount = await factory.allPairsLength();
      const pairs: string[] = [];
      
      for (let i = 0; i < Math.min(Number(pairCount), 20); i++) {
        const pairAddress = await factory.allPairs(i);
        pairs.push(pairAddress);
      }

      const txList: Transaction[] = [];
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10000 blocks

      // Fetch events from each pair
      for (const pairAddress of pairs) {
        const pair = getPairContract(pairAddress, provider);
        
        try {
          // Get token info
          const [token0Address, token1Address] = await Promise.all([
            pair.token0(),
            pair.token1()
          ]);

          // Swap events
          const swapFilter = pair.filters.Swap(null, null, null, null, null, address);
          const swapEvents = await pair.queryFilter(swapFilter, fromBlock, currentBlock);
          
          for (const event of swapEvents) {
            const args = (event as any).args;
            const block = await event.getBlock();
            
            let tokenIn = token0Address;
            let tokenOut = token1Address;
            let amountIn = args.amount0In > 0n ? args.amount0In : args.amount1In;
            let amountOut = args.amount0Out > 0n ? args.amount0Out : args.amount1Out;
            
            if (args.amount1In > 0n) {
              tokenIn = token1Address;
              tokenOut = token0Address;
            }

            const tokenInInfo = getTokenByAddress(tokenIn);
            const tokenOutInfo = getTokenByAddress(tokenOut);

            txList.push({
              id: event.transactionHash + '-swap',
              type: 'swap',
              tokenIn: tokenInInfo?.symbol || 'Unknown',
              tokenOut: tokenOutInfo?.symbol || 'Unknown',
              amountIn: ethers.formatUnits(amountIn, tokenInInfo?.decimals || 18),
              amountOut: ethers.formatUnits(amountOut, tokenOutInfo?.decimals || 18),
              timestamp: block.timestamp,
              txHash: event.transactionHash,
              blockNumber: event.blockNumber
            });
          }

          // Mint events (Add Liquidity)
          const mintFilter = pair.filters.Mint(address);
          const mintEvents = await pair.queryFilter(mintFilter, fromBlock, currentBlock);
          
          for (const event of mintEvents) {
            const args = (event as any).args;
            const block = await event.getBlock();
            
            const token0Info = getTokenByAddress(token0Address);
            const token1Info = getTokenByAddress(token1Address);

            txList.push({
              id: event.transactionHash + '-mint',
              type: 'add',
              token0: token0Info?.symbol || 'Unknown',
              token1: token1Info?.symbol || 'Unknown',
              amount0: ethers.formatUnits(args.amount0, token0Info?.decimals || 18),
              amount1: ethers.formatUnits(args.amount1, token1Info?.decimals || 18),
              timestamp: block.timestamp,
              txHash: event.transactionHash,
              blockNumber: event.blockNumber
            });
          }

          // Burn events (Remove Liquidity)
          const burnFilter = pair.filters.Burn(address, null, null, address);
          const burnEvents = await pair.queryFilter(burnFilter, fromBlock, currentBlock);
          
          for (const event of burnEvents) {
            const args = (event as any).args;
            const block = await event.getBlock();
            
            const token0Info = getTokenByAddress(token0Address);
            const token1Info = getTokenByAddress(token1Address);

            txList.push({
              id: event.transactionHash + '-burn',
              type: 'remove',
              token0: token0Info?.symbol || 'Unknown',
              token1: token1Info?.symbol || 'Unknown',
              amount0: ethers.formatUnits(args.amount0, token0Info?.decimals || 18),
              amount1: ethers.formatUnits(args.amount1, token1Info?.decimals || 18),
              timestamp: block.timestamp,
              txHash: event.transactionHash,
              blockNumber: event.blockNumber
            });
          }
        } catch (err) {
          console.error('Error fetching events for pair:', pairAddress, err);
        }
      }

      // Sort by timestamp descending
      txList.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(txList);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchTransactionHistory();
    }
  }, [isConnected, address, fetchTransactionHistory]);

  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === 'all') return true;
    if (activeTab === 'swaps') return tx.type === 'swap';
    if (activeTab === 'liquidity') return tx.type === 'add' || tx.type === 'remove';
    return true;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    if (num < 0.0001) return '< 0.0001';
    return num.toFixed(4);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'swap': return <ArrowRightLeft className="w-4 h-4" />;
      case 'add': return <Plus className="w-4 h-4" />;
      case 'remove': return <Minus className="w-4 h-4" />;
      default: return <History className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'swap':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Swap</Badge>;
      case 'add':
        return <Badge className="bg-success/20 text-green-400 border-success/30">Add Liquidity</Badge>;
      case 'remove':
        return <Badge className="bg-warning/20 text-yellow-400 border-warning/30">Remove Liquidity</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <WaveBackground />
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <History className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Transaction History</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Your <span className="gradient-text">Transactions</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            View your swap, add liquidity, and remove liquidity history
          </p>
        </div>

        {!isConnected ? (
          <Card className="glass-card max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Connect Wallet</h3>
              <p className="text-muted-foreground text-sm">
                Connect your wallet to view your transaction history
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Recent Transactions
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchTransactionHistory}
                  disabled={loading}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="all" className="gap-2">
                    <Filter className="w-4 h-4" />
                    All ({transactions.length})
                  </TabsTrigger>
                  <TabsTrigger value="swaps" className="gap-2">
                    <ArrowRightLeft className="w-4 h-4" />
                    Swaps ({transactions.filter(t => t.type === 'swap').length})
                  </TabsTrigger>
                  <TabsTrigger value="liquidity" className="gap-2">
                    <Droplets className="w-4 h-4" />
                    Liquidity ({transactions.filter(t => t.type !== 'swap').length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Transactions</h3>
                      <p className="text-muted-foreground text-sm">
                        {activeTab === 'all' 
                          ? "You haven't made any transactions yet"
                          : `No ${activeTab} transactions found`}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="p-4 rounded-xl bg-surface border border-border/50 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                {getTypeIcon(tx.type)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  {getTypeBadge(tx.type)}
                                </div>
                                {tx.type === 'swap' ? (
                                  <p className="text-sm text-foreground">
                                    {formatAmount(tx.amountIn!)} {tx.tokenIn} → {formatAmount(tx.amountOut!)} {tx.tokenOut}
                                  </p>
                                ) : (
                                  <p className="text-sm text-foreground">
                                    {formatAmount(tx.amount0!)} {tx.token0} + {formatAmount(tx.amount1!)} {tx.token1}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground mb-1">
                                {formatDate(tx.timestamp)}
                              </p>
                              <a
                                href={`https://donut.push.network/tx/${tx.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                View <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
