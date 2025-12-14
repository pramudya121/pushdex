import React, { useState } from 'react';
import { Bell, X, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { usePriceAlerts, PriceAlert } from '@/hooks/usePriceAlerts';

interface PriceAlertModalProps {
  token0Symbol: string;
  token1Symbol: string;
  pairAddress: string;
  currentPrice: number;
}

export function PriceAlertModal({
  token0Symbol,
  token1Symbol,
  pairAddress,
  currentPrice,
}: PriceAlertModalProps) {
  const [open, setOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const { alerts, addAlert, removeAlert, clearAllAlerts } = usePriceAlerts();

  const pairAlerts = alerts.filter(
    a => a.pairAddress.toLowerCase() === pairAddress.toLowerCase()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;

    addAlert({
      token0Symbol,
      token1Symbol,
      pairAddress,
      targetPrice: price,
      condition,
      currentPrice,
    });

    setTargetPrice('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Alert</span>
          {pairAlerts.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5">
              {pairAlerts.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Price Alerts - {token0Symbol}/{token1Symbol}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Price */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Current Price</p>
            <p className="text-lg font-bold">{currentPrice.toFixed(6)}</p>
          </div>

          {/* Create Alert Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={condition === 'above' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCondition('above')}
                className="flex-1 gap-1"
              >
                <TrendingUp className="h-4 w-4" />
                Above
              </Button>
              <Button
                type="button"
                variant={condition === 'below' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCondition('below')}
                className="flex-1 gap-1"
              >
                <TrendingDown className="h-4 w-4" />
                Below
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                type="number"
                step="any"
                placeholder="Target price..."
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!targetPrice}>
                Create
              </Button>
            </div>
          </form>

          {/* Active Alerts */}
          {pairAlerts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Active Alerts</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllAlerts}
                  className="text-destructive hover:text-destructive text-xs"
                >
                  Clear All
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pairAlerts.map((alert) => (
                  <AlertItem key={alert.id} alert={alert} onRemove={removeAlert} />
                ))}
              </div>
            </div>
          )}

          {/* All Alerts Count */}
          {alerts.length > pairAlerts.length && (
            <p className="text-xs text-muted-foreground text-center">
              You have {alerts.length - pairAlerts.length} more alerts on other pairs
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AlertItem({ alert, onRemove }: { alert: PriceAlert; onRemove: (id: string) => void }) {
  const isAbove = alert.condition === 'above';
  const progress = isAbove
    ? Math.min((alert.currentPrice / alert.targetPrice) * 100, 100)
    : Math.min((alert.targetPrice / alert.currentPrice) * 100, 100);

  return (
    <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-3">
      <div className={`p-1.5 rounded-full ${isAbove ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
        {isAbove ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {alert.condition === 'above' ? 'Above' : 'Below'} {alert.targetPrice.toFixed(6)}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${isAbove ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{progress.toFixed(0)}%</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(alert.id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
