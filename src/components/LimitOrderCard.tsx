import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLimitOrders, LimitOrder } from '@/hooks/useLimitOrders';
import { TOKEN_LIST, TokenInfo } from '@/config/contracts';
import { TokenSelector } from '@/components/TokenSelector';
import { 
  Target, 
  Clock, 
  XCircle, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LimitOrderCardProps {
  currentPrice?: number;
  tokenIn?: TokenInfo;
  tokenOut?: TokenInfo;
  className?: string;
}

export const LimitOrderCard: React.FC<LimitOrderCardProps> = ({
  currentPrice = 0,
  tokenIn: initialTokenIn,
  tokenOut: initialTokenOut,
  className,
}) => {
  const { orders, stats, createOrder, cancelOrder, clearOldOrders } = useLimitOrders();
  
  const [tokenIn, setTokenIn] = useState<TokenInfo>(initialTokenIn || TOKEN_LIST[0]);
  const [tokenOut, setTokenOut] = useState<TokenInfo>(initialTokenOut || TOKEN_LIST[1]);
  const [amount, setAmount] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [expiry, setExpiry] = useState('24');
  const [activeTab, setActiveTab] = useState('create');

  const handleCreateOrder = () => {
    if (!amount || !targetPrice) return;
    
    createOrder(
      tokenIn,
      tokenOut,
      amount,
      parseFloat(targetPrice),
      currentPrice,
      parseInt(expiry)
    );
    
    setAmount('');
    setTargetPrice('');
  };

  const getStatusBadge = (status: LimitOrder['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-primary/20 text-primary border-primary/30 gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case 'filled':
        return <Badge className="bg-success/20 text-green-500 border-success/30 gap-1"><CheckCircle className="w-3 h-3" /> Filled</Badge>;
      case 'cancelled':
        return <Badge className="bg-muted text-muted-foreground gap-1"><XCircle className="w-3 h-3" /> Cancelled</Badge>;
      case 'expired':
        return <Badge className="bg-warning/20 text-yellow-500 border-warning/30 gap-1"><AlertCircle className="w-3 h-3" /> Expired</Badge>;
    }
  };

  const formatTimeRemaining = (expiresAt: number) => {
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <Card className={cn("glass-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-primary" />
            Limit Orders
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            {stats.pending} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="create" className="flex-1 gap-1">
              <Plus className="w-4 h-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex-1 gap-1">
              <Clock className="w-4 h-4" />
              Orders ({stats.total})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            {/* Token Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Sell</label>
                <TokenSelector
                  selectedToken={tokenIn}
                  onSelect={setTokenIn}
                  excludeToken={tokenOut}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Buy</label>
                <TokenSelector
                  selectedToken={tokenOut}
                  onSelect={setTokenOut}
                  excludeToken={tokenIn}
                />
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Amount to Sell</label>
              <Input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg"
              />
            </div>

            {/* Target Price */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-muted-foreground">Target Price</label>
                {currentPrice > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Current: {currentPrice.toFixed(6)}
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="pr-20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {tokenOut.symbol}/{tokenIn.symbol}
                </span>
              </div>
              
              {/* Quick price buttons */}
              <div className="flex gap-2 mt-2">
                {[-5, -2, +2, +5].map(pct => (
                  <Button
                    key={pct}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      const newPrice = currentPrice * (1 + pct / 100);
                      setTargetPrice(newPrice.toFixed(6));
                    }}
                    disabled={currentPrice === 0}
                  >
                    {pct > 0 ? '+' : ''}{pct}%
                  </Button>
                ))}
              </div>
            </div>

            {/* Expiry */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Expires In</label>
              <div className="flex gap-2">
                {['1', '6', '24', '72'].map(hours => (
                  <Button
                    key={hours}
                    variant={expiry === hours ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setExpiry(hours)}
                  >
                    {hours}h
                  </Button>
                ))}
              </div>
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleCreateOrder}
              disabled={!amount || !targetPrice}
            >
              <Target className="w-4 h-4" />
              Create Limit Order
            </Button>
          </TabsContent>

          <TabsContent value="orders" className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No limit orders yet</p>
              </div>
            ) : (
              <>
                {stats.cancelled + stats.expired > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground gap-2"
                    onClick={clearOldOrders}
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Old Orders
                  </Button>
                )}
                
                {orders.map(order => (
                  <div
                    key={order.id}
                    className="p-3 rounded-xl bg-surface border border-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {order.amountIn} {order.tokenIn.symbol}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">{order.tokenOut.symbol}</span>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>@ {order.targetPrice.toFixed(6)}</span>
                        {order.currentPrice > order.targetPrice ? (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        ) : (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                      
                      {order.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs">
                            {formatTimeRemaining(order.expiresAt)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => cancelOrder(order.id)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
