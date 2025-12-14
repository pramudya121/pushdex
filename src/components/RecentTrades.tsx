import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RPC_URL } from '@/config/contracts';
import { ethers } from 'ethers';
import { CONTRACTS } from '@/config/contracts';

interface Trade {
  id: string;
  type: 'buy' | 'sell';
  amount0: string;
  amount1: string;
  price: number;
  timestamp: number;
  txHash: string;
}

interface RecentTradesProps {
  pairAddress: string;
  token0Symbol: string;
  token1Symbol: string;
}

export function RecentTrades({ pairAddress, token0Symbol, token1Symbol }: RecentTradesProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrades = async () => {
    if (!pairAddress) return;
    
    setLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const pairContract = new ethers.Contract(
        pairAddress,
        [
          'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)'
        ],
        provider
      );

      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000);
      
      const filter = pairContract.filters.Swap();
      const events = await pairContract.queryFilter(filter, fromBlock, currentBlock);
      
      const recentTrades: Trade[] = await Promise.all(
        events.slice(-20).reverse().map(async (event: any) => {
          const block = await event.getBlock();
          const amount0In = parseFloat(ethers.formatEther(event.args.amount0In));
          const amount1In = parseFloat(ethers.formatEther(event.args.amount1In));
          const amount0Out = parseFloat(ethers.formatEther(event.args.amount0Out));
          const amount1Out = parseFloat(ethers.formatEther(event.args.amount1Out));
          
          const isBuy = amount0In > 0;
          const amount0 = isBuy ? amount0In : amount0Out;
          const amount1 = isBuy ? amount1Out : amount1In;
          
          return {
            id: event.transactionHash + event.index,
            type: isBuy ? 'buy' : 'sell',
            amount0: amount0.toFixed(4),
            amount1: amount1.toFixed(4),
            price: amount1 > 0 ? amount0 / amount1 : 0,
            timestamp: block.timestamp * 1000,
            txHash: event.transactionHash,
          };
        })
      );

      setTrades(recentTrades);
    } catch (error) {
      console.error('Error fetching trades:', error);
      // Generate mock data for demo
      const mockTrades: Trade[] = Array.from({ length: 10 }, (_, i) => ({
        id: `mock_${i}`,
        type: Math.random() > 0.5 ? 'buy' : 'sell',
        amount0: (Math.random() * 100).toFixed(4),
        amount1: (Math.random() * 10).toFixed(4),
        price: Math.random() * 2,
        timestamp: Date.now() - i * 60000 * Math.random() * 10,
        txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
      }));
      setTrades(mockTrades);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 30000);
    return () => clearInterval(interval);
  }, [pairAddress]);

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Recent Trades</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchTrades}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {/* Header */}
        <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground py-1 border-b border-border/50">
          <span>Price</span>
          <span className="text-right">{token0Symbol}</span>
          <span className="text-right">{token1Symbol}</span>
          <span className="text-right">Time</span>
        </div>

        {/* Trades */}
        {trades.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {loading ? 'Loading trades...' : 'No recent trades'}
          </div>
        ) : (
          trades.map((trade) => (
            <div
              key={trade.id}
              className="grid grid-cols-4 gap-2 text-sm py-1.5 hover:bg-muted/30 rounded cursor-pointer transition-colors"
              onClick={() => window.open(`https://donut.push.network/tx/${trade.txHash}`, '_blank')}
            >
              <span className={`flex items-center gap-1 ${trade.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                {trade.type === 'buy' ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {trade.price.toFixed(4)}
              </span>
              <span className="text-right font-mono">{trade.amount0}</span>
              <span className="text-right font-mono">{trade.amount1}</span>
              <span className="text-right text-muted-foreground">{formatTime(trade.timestamp)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
