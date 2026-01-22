import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWallet } from '@/contexts/WalletContext';
import { getFactoryContract, getReadProvider, getPairContract, getTokenByAddress } from '@/lib/dex';
import { BLOCK_EXPLORER } from '@/config/contracts';
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
  Droplets
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  timestamp: number;
  txHash: string;
}

interface TransactionHistoryProps {
  className?: string;
  maxItems?: number;
  compact?: boolean;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  className,
  maxItems = 10,
  compact = false,
}) => {
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
      
      const pairCount = await factory.allPairsLength();
      const pairs: string[] = [];
      
      for (let i = 0; i < Math.min(Number(pairCount), 20); i++) {
        const pairAddress = await factory.allPairs(i);
        pairs.push(pairAddress);
      }

      const txList: Transaction[] = [];
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000);

      for (const pairAddress of pairs) {
        const pair = getPairContract(pairAddress, provider);
        
        try {
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
            });
          }

          // Mint events
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
            });
          }

          // Burn events
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
            });
          }
        } catch (err) {
          console.error('Error fetching events for pair:', pairAddress, err);
        }
      }

      txList.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(txList.slice(0, maxItems));
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    } finally {
      setLoading(false);
    }
  }, [address, maxItems]);

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
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        return <Badge className="bg-success/20 text-green-500 border-success/30">Add</Badge>;
      case 'remove':
        return <Badge className="bg-warning/20 text-yellow-500 border-warning/30">Remove</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <Card className={cn("glass-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="w-5 h-5 text-primary" />
            Transaction History
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchTransactionHistory}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            {!compact && 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!compact && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1 gap-1 text-xs">
                <Filter className="w-3 h-3" />
                All
              </TabsTrigger>
              <TabsTrigger value="swaps" className="flex-1 gap-1 text-xs">
                <ArrowRightLeft className="w-3 h-3" />
                Swaps
              </TabsTrigger>
              <TabsTrigger value="liquidity" className="flex-1 gap-1 text-xs">
                <Droplets className="w-3 h-3" />
                Liquidity
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3 rounded-xl bg-surface border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {getTypeIcon(tx.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        {getTypeBadge(tx.type)}
                      </div>
                      <p className="text-sm text-foreground">
                        {tx.type === 'swap' ? (
                          <>
                            {formatAmount(tx.amountIn!)} {tx.tokenIn} → {formatAmount(tx.amountOut!)} {tx.tokenOut}
                          </>
                        ) : (
                          <>
                            {formatAmount(tx.amount0!)} {tx.token0} + {formatAmount(tx.amount1!)} {tx.token1}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground mb-1">
                      {formatDate(tx.timestamp)}
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
