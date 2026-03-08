import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WaveBackground } from '@/components/WaveBackground';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useWallet } from '@/contexts/WalletContext';
import { getFactoryContract, getReadProvider, getPairContract, getTokenByAddress } from '@/lib/dex';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
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
import { BLOCK_EXPLORER } from '@/config/contracts';

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

// Loading skeleton for transaction rows
const TxSkeleton = memo(() => (
  <div className="p-4 rounded-xl bg-surface/40 border border-border/30 space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-3 w-28 ml-auto" />
        <Skeleton className="h-3 w-14 ml-auto" />
      </div>
    </div>
  </div>
));
TxSkeleton.displayName = 'TxSkeleton';

// Transaction row component
const TxRow = memo(({ tx, index }: { tx: Transaction; index: number }) => {
  const icon = tx.type === 'swap' 
    ? <ArrowRightLeft className="w-4 h-4" /> 
    : tx.type === 'add' 
      ? <Plus className="w-4 h-4" /> 
      : <Minus className="w-4 h-4" />;

  const badge = tx.type === 'swap'
    ? <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Swap</Badge>
    : tx.type === 'add'
      ? <Badge className="bg-success/20 text-success border-success/30 text-xs">Add Liquidity</Badge>
      : <Badge className="bg-warning/20 text-warning border-warning/30 text-xs">Remove Liquidity</Badge>;

  const fmtAmt = (amount: string) => {
    const num = parseFloat(amount);
    if (num < 0.0001) return '< 0.0001';
    return num.toFixed(4);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="p-4 rounded-xl bg-surface/40 border border-border/30 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">{badge}</div>
            {tx.type === 'swap' ? (
              <p className="text-sm text-foreground truncate">
                {fmtAmt(tx.amountIn!)} {tx.tokenIn} → {fmtAmt(tx.amountOut!)} {tx.tokenOut}
              </p>
            ) : (
              <p className="text-sm text-foreground truncate">
                {fmtAmt(tx.amount0!)} {tx.token0} + {fmtAmt(tx.amount1!)} {tx.token1}
              </p>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] text-muted-foreground mb-1">
            {new Date(tx.timestamp * 1000).toLocaleString()}
          </p>
          <a
            href={`${BLOCK_EXPLORER}/tx/${tx.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </motion.div>
  );
});
TxRow.displayName = 'TxRow';

function HistoryPage() {
  const { address, isConnected } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState<string | null>(null);

  const fetchTransactionHistory = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    try {
      const provider = getReadProvider();
      const factory = getFactoryContract(provider);
      
      const pairCount = await factory.allPairsLength();
      const pairPromises: Promise<string>[] = [];
      
      for (let i = 0; i < Math.min(Number(pairCount), 20); i++) {
        pairPromises.push(factory.allPairs(i));
      }
      const pairs = await Promise.all(pairPromises);

      const txList: Transaction[] = [];
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000);
      
      // Cache blocks to avoid duplicate fetches
      const blockCache = new Map<number, number>();
      const getBlockTimestamp = async (event: any): Promise<number> => {
        if (blockCache.has(event.blockNumber)) return blockCache.get(event.blockNumber)!;
        const block = await event.getBlock();
        blockCache.set(event.blockNumber, block.timestamp);
        return block.timestamp;
      };

      // Process pairs in parallel (batches of 5)
      const BATCH_SIZE = 5;
      for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
        const batch = pairs.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (pairAddress) => {
          const pair = getPairContract(pairAddress, provider);
          try {
            const [token0Address, token1Address] = await Promise.all([
              pair.token0(),
              pair.token1()
            ]);

            const [swapEvents, mintEvents, burnEvents] = await Promise.all([
              pair.queryFilter(pair.filters.Swap(null, null, null, null, null, address), fromBlock, currentBlock),
              pair.queryFilter(pair.filters.Mint(address), fromBlock, currentBlock),
              pair.queryFilter(pair.filters.Burn(address, null, null, address), fromBlock, currentBlock),
            ]);
            
            // Process all events
            for (const event of swapEvents) {
              const args = (event as any).args;
              const timestamp = await getBlockTimestamp(event);
              
              let tokenIn = token0Address, tokenOut = token1Address;
              let amountIn = args.amount0In > 0n ? args.amount0In : args.amount1In;
              let amountOut = args.amount0Out > 0n ? args.amount0Out : args.amount1Out;
              
              if (args.amount1In > 0n) { tokenIn = token1Address; tokenOut = token0Address; }

              const tokenInInfo = getTokenByAddress(tokenIn);
              const tokenOutInfo = getTokenByAddress(tokenOut);

              txList.push({
                id: event.transactionHash + '-swap',
                type: 'swap',
                tokenIn: tokenInInfo?.symbol || 'Unknown',
                tokenOut: tokenOutInfo?.symbol || 'Unknown',
                amountIn: ethers.formatUnits(amountIn, tokenInInfo?.decimals || 18),
                amountOut: ethers.formatUnits(amountOut, tokenOutInfo?.decimals || 18),
                timestamp, txHash: event.transactionHash, blockNumber: event.blockNumber
              });
            }

            for (const event of mintEvents) {
              const args = (event as any).args;
              const timestamp = await getBlockTimestamp(event);
              const token0Info = getTokenByAddress(token0Address);
              const token1Info = getTokenByAddress(token1Address);

              txList.push({
                id: event.transactionHash + '-mint',
                type: 'add',
                token0: token0Info?.symbol || 'Unknown',
                token1: token1Info?.symbol || 'Unknown',
                amount0: ethers.formatUnits(args.amount0, token0Info?.decimals || 18),
                amount1: ethers.formatUnits(args.amount1, token1Info?.decimals || 18),
                timestamp, txHash: event.transactionHash, blockNumber: event.blockNumber
              });
            }

            for (const event of burnEvents) {
              const args = (event as any).args;
              const timestamp = await getBlockTimestamp(event);
              const token0Info = getTokenByAddress(token0Address);
              const token1Info = getTokenByAddress(token1Address);

              txList.push({
                id: event.transactionHash + '-burn',
                type: 'remove',
                token0: token0Info?.symbol || 'Unknown',
                token1: token1Info?.symbol || 'Unknown',
                amount0: ethers.formatUnits(args.amount0, token0Info?.decimals || 18),
                amount1: ethers.formatUnits(args.amount1, token1Info?.decimals || 18),
                timestamp, txHash: event.transactionHash, blockNumber: event.blockNumber
              });
            }
          } catch {
            // Skip failed pairs silently
          }
        }));
      }

      txList.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(txList);
    } catch {
      setError('Failed to load transaction history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchTransactionHistory();
    }
  }, [isConnected, address, fetchTransactionHistory]);

  const filteredTransactions = useMemo(() => 
    transactions.filter(tx => {
      if (activeTab === 'all') return true;
      if (activeTab === 'swaps') return tx.type === 'swap';
      if (activeTab === 'liquidity') return tx.type === 'add' || tx.type === 'remove';
      return true;
    }), [transactions, activeTab]
  );

  const counts = useMemo(() => ({
    all: transactions.length,
    swaps: transactions.filter(t => t.type === 'swap').length,
    liquidity: transactions.filter(t => t.type !== 'swap').length,
  }), [transactions]);

  return (
    <div className="min-h-screen bg-background">
      <WaveBackground />
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-28 sm:pb-16 relative z-10">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <History className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Transaction History</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Your <span className="gradient-text">Transactions</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            View your swap, add liquidity, and remove liquidity history
          </p>
        </motion.div>

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
          <Card className="glass-card max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
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
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  {error}
                </div>
              )}
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6 w-full sm:w-auto">
                  <TabsTrigger value="all" className="gap-1.5 text-xs sm:text-sm">
                    <Filter className="w-3.5 h-3.5" />
                    All ({counts.all})
                  </TabsTrigger>
                  <TabsTrigger value="swaps" className="gap-1.5 text-xs sm:text-sm">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Swaps ({counts.swaps})
                  </TabsTrigger>
                  <TabsTrigger value="liquidity" className="gap-1.5 text-xs sm:text-sm">
                    <Droplets className="w-3.5 h-3.5" />
                    Liquidity ({counts.liquidity})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                  {loading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => <TxSkeleton key={i} />)}
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                      <History className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Transactions</h3>
                      <p className="text-muted-foreground text-sm">
                        {activeTab === 'all' 
                          ? "You haven't made any transactions yet"
                          : `No ${activeTab} transactions found`}
                      </p>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      {filteredTransactions.map((tx, i) => (
                        <TxRow key={tx.id} tx={tx} index={i} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default memo(HistoryPage);
