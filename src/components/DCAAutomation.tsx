import React, { useState, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TokenSelector } from '@/components/TokenSelector';
import { HoverGlowCard } from '@/components/ui/pushdex/hover-glow-card';
import { useToast } from '@/hooks/use-toast';
import { TOKEN_LIST, TokenInfo } from '@/config/contracts';
import { 
  CalendarClock, 
  TrendingUp, 
  Play, 
  Pause,
  Settings,
  History,
  DollarSign,
  Clock,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
  Plus
} from 'lucide-react';

interface DCAOrder {
  id: string;
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  amountPerOrder: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  totalOrders: number;
  completedOrders: number;
  status: 'active' | 'paused' | 'completed';
  nextExecution: Date;
  totalInvested: number;
  totalReceived: number;
  averagePrice: number;
}

const MOCK_DCA_ORDERS: DCAOrder[] = [
  {
    id: '1',
    tokenIn: TOKEN_LIST[0],
    tokenOut: TOKEN_LIST[1],
    amountPerOrder: '100',
    frequency: 'daily',
    totalOrders: 30,
    completedOrders: 12,
    status: 'active',
    nextExecution: new Date(Date.now() + 1000 * 60 * 60 * 8),
    totalInvested: 1200,
    totalReceived: 0.52,
    averagePrice: 2307.69,
  },
  {
    id: '2',
    tokenIn: TOKEN_LIST[0],
    tokenOut: TOKEN_LIST[2],
    amountPerOrder: '50',
    frequency: 'weekly',
    totalOrders: 12,
    completedOrders: 5,
    status: 'paused',
    nextExecution: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    totalInvested: 250,
    totalReceived: 0.85,
    averagePrice: 294.12,
  },
];

const formatFrequency = (freq: DCAOrder['frequency']) => {
  switch (freq) {
    case 'hourly': return 'Every Hour';
    case 'daily': return 'Daily';
    case 'weekly': return 'Weekly';
    case 'monthly': return 'Monthly';
  }
};

const formatTimeUntil = (date: Date) => {
  const diff = date.getTime() - Date.now();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const DCAOrderCard = memo(({ order, onToggle, onDelete }: { 
  order: DCAOrder; 
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) => (
  <HoverGlowCard className="p-4 rounded-xl bg-surface/60 border border-border/40">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center -space-x-2">
          <img src={order.tokenIn.logo} alt={order.tokenIn.symbol} className="w-8 h-8 rounded-full border-2 border-background" />
          <img src={order.tokenOut.logo} alt={order.tokenOut.symbol} className="w-8 h-8 rounded-full border-2 border-background" />
        </div>
        <div>
          <div className="font-semibold flex items-center gap-2">
            {order.tokenIn.symbol}
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            {order.tokenOut.symbol}
          </div>
          <div className="text-sm text-muted-foreground">
            ${order.amountPerOrder} • {formatFrequency(order.frequency)}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline" 
          className={
            order.status === 'active' 
              ? 'bg-success/10 text-success border-success/30' 
              : order.status === 'paused'
                ? 'bg-warning/10 text-warning border-warning/30'
                : 'bg-muted text-muted-foreground'
          }
        >
          {order.status}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggle(order.id)}
          className="h-8 w-8"
        >
          {order.status === 'active' ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(order.id)}
          className="h-8 w-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
    
    {/* Progress */}
    <div className="mt-4">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-muted-foreground">Progress</span>
        <span>{order.completedOrders}/{order.totalOrders} orders</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(order.completedOrders / order.totalOrders) * 100}%` }}
          className="h-full bg-gradient-to-r from-primary to-accent"
        />
      </div>
    </div>
    
    {/* Stats */}
    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
      <div>
        <div className="text-muted-foreground">Invested</div>
        <div className="font-semibold">${order.totalInvested.toLocaleString()}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Received</div>
        <div className="font-semibold">{order.totalReceived} {order.tokenOut.symbol}</div>
      </div>
      <div>
        <div className="text-muted-foreground">Avg. Price</div>
        <div className="font-semibold">${order.averagePrice.toFixed(2)}</div>
      </div>
    </div>
    
    {/* Next Execution */}
    {order.status === 'active' && (
      <div className="mt-4 p-3 rounded-lg bg-surface/40 border border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          Next execution
        </div>
        <div className="text-sm font-medium">{formatTimeUntil(order.nextExecution)}</div>
      </div>
    )}
  </HoverGlowCard>
));

DCAOrderCard.displayName = 'DCAOrderCard';

export const DCAAutomation = memo(() => {
  const [orders, setOrders] = useState<DCAOrder[]>(MOCK_DCA_ORDERS);
  const [isCreating, setIsCreating] = useState(false);
  const [tokenIn, setTokenIn] = useState<TokenInfo>(TOKEN_LIST[0]);
  const [tokenOut, setTokenOut] = useState<TokenInfo>(TOKEN_LIST[1]);
  const [amount, setAmount] = useState('100');
  const [frequency, setFrequency] = useState<DCAOrder['frequency']>('daily');
  const [totalOrders, setTotalOrders] = useState(30);
  const { toast } = useToast();
  
  const handleToggle = useCallback((id: string) => {
    setOrders(prev => prev.map(order => 
      order.id === id 
        ? { ...order, status: order.status === 'active' ? 'paused' : 'active' } 
        : order
    ));
  }, []);
  
  const handleDelete = useCallback((id: string) => {
    setOrders(prev => prev.filter(order => order.id !== id));
    toast({
      title: "DCA Order Deleted",
      description: "The DCA order has been removed",
    });
  }, [toast]);
  
  const handleCreate = useCallback(() => {
    const newOrder: DCAOrder = {
      id: Date.now().toString(),
      tokenIn,
      tokenOut,
      amountPerOrder: amount,
      frequency,
      totalOrders,
      completedOrders: 0,
      status: 'active',
      nextExecution: new Date(Date.now() + 1000 * 60 * 60),
      totalInvested: 0,
      totalReceived: 0,
      averagePrice: 0,
    };
    
    setOrders(prev => [newOrder, ...prev]);
    setIsCreating(false);
    
    toast({
      title: "DCA Order Created!",
      description: `Will buy ${tokenOut.symbol} with $${amount} ${formatFrequency(frequency).toLowerCase()}`,
    });
  }, [tokenIn, tokenOut, amount, frequency, totalOrders, toast]);

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="icon-container bg-gradient-to-br from-purple-500/20 to-pink-500/10">
              <CalendarClock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-xl">DCA Automation</CardTitle>
              <p className="text-sm text-muted-foreground">Dollar Cost Average your investments</p>
            </div>
          </div>
          
          <Button
            onClick={() => setIsCreating(!isCreating)}
            size="sm"
            className="gap-2 bg-gradient-to-r from-primary to-accent"
          >
            <Plus className="w-4 h-4" />
            New DCA
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* Create New DCA Form */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <HoverGlowCard className="p-4 rounded-xl bg-surface/60 border border-primary/30 space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Create DCA Order
                </h4>
                
                {/* Token Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Token</Label>
                    <TokenSelector
                      selectedToken={tokenIn}
                      onSelect={setTokenIn}
                      label=""
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>To Token</Label>
                    <TokenSelector
                      selectedToken={tokenOut}
                      onSelect={setTokenOut}
                      label=""
                    />
                  </div>
                </div>
                
                {/* Amount */}
                <div className="space-y-2">
                  <Label>Amount per Order (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-9 bg-surface border-border/60"
                      type="number"
                    />
                  </div>
                </div>
                
                {/* Frequency */}
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={frequency} onValueChange={(v) => setFrequency(v as DCAOrder['frequency'])}>
                    <SelectTrigger className="bg-surface border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Every Hour</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Total Orders */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Number of Orders</Label>
                    <span className="text-sm text-muted-foreground">{totalOrders} orders</span>
                  </div>
                  <Slider
                    value={[totalOrders]}
                    onValueChange={([v]) => setTotalOrders(v)}
                    min={1}
                    max={100}
                    step={1}
                  />
                  <div className="text-xs text-muted-foreground">
                    Total investment: ${(parseFloat(amount) * totalOrders).toLocaleString()}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreating(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    className="flex-1 bg-gradient-to-r from-primary to-accent"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Create Order
                  </Button>
                </div>
              </HoverGlowCard>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Active Orders */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <History className="w-4 h-4" />
              Your DCA Orders
            </h4>
            <Badge variant="outline">{orders.length} active</Badge>
          </div>
          
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No DCA orders yet</p>
              <p className="text-sm">Create one to start dollar cost averaging</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <DCAOrderCard 
                  key={order.id} 
                  order={order} 
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="p-4 rounded-xl bg-info/5 border border-info/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-info mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="mb-1 text-foreground font-medium">What is DCA?</p>
              Dollar Cost Averaging (DCA) is an investment strategy where you invest a fixed amount regularly, 
              regardless of the price. This helps reduce the impact of volatility and removes emotion from trading.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

DCAAutomation.displayName = 'DCAAutomation';
