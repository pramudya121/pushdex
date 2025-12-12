import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWETH } from '@/hooks/useWETH';
import { Loader2, ArrowDownUp, Wallet } from 'lucide-react';

export const WrapUnwrap: React.FC = () => {
  const {
    wpcBalance,
    pcBalance,
    isWrapping,
    isUnwrapping,
    wrap,
    unwrap,
    isConnected,
    isCorrectNetwork,
  } = useWETH();

  const [wrapAmount, setWrapAmount] = useState('');
  const [unwrapAmount, setUnwrapAmount] = useState('');

  const handleWrap = async () => {
    if (!wrapAmount || parseFloat(wrapAmount) === 0) return;
    const success = await wrap(wrapAmount);
    if (success) {
      setWrapAmount('');
    }
  };

  const handleUnwrap = async () => {
    if (!unwrapAmount || parseFloat(unwrapAmount) === 0) return;
    const success = await unwrap(unwrapAmount);
    if (success) {
      setUnwrapAmount('');
    }
  };

  if (!isConnected) {
    return (
      <div className="glass-card p-6 text-center">
        <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Connect wallet to wrap/unwrap</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <ArrowDownUp className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Wrap / Unwrap</h3>
      </div>

      <Tabs defaultValue="wrap">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="wrap" className="flex-1">Wrap PC</TabsTrigger>
          <TabsTrigger value="unwrap" className="flex-1">Unwrap WPC</TabsTrigger>
        </TabsList>

        <TabsContent value="wrap" className="space-y-4">
          <div className="p-4 rounded-xl bg-surface border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">PC Balance</span>
              <span className="font-medium">{parseFloat(pcBalance).toFixed(6)} PC</span>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                placeholder="0.0"
                value={wrapAmount}
                onChange={(e) => setWrapAmount(e.target.value)}
                className="border-0 bg-transparent text-xl font-semibold p-0 h-auto focus-visible:ring-0"
              />
              <button
                onClick={() => setWrapAmount(pcBalance)}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                MAX
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="p-2 rounded-xl bg-surface border border-border">
              <ArrowDownUp className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">You will receive</span>
              <span className="font-medium">{wrapAmount || '0'} WPC</span>
            </div>
          </div>

          <Button
            className="w-full h-12 font-semibold bg-gradient-pink hover:opacity-90"
            disabled={!isCorrectNetwork || !wrapAmount || parseFloat(wrapAmount) === 0 || isWrapping}
            onClick={handleWrap}
          >
            {isWrapping ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Wrapping...
              </span>
            ) : (
              'Wrap PC to WPC'
            )}
          </Button>
        </TabsContent>

        <TabsContent value="unwrap" className="space-y-4">
          <div className="p-4 rounded-xl bg-surface border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">WPC Balance</span>
              <span className="font-medium">{parseFloat(wpcBalance).toFixed(6)} WPC</span>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                placeholder="0.0"
                value={unwrapAmount}
                onChange={(e) => setUnwrapAmount(e.target.value)}
                className="border-0 bg-transparent text-xl font-semibold p-0 h-auto focus-visible:ring-0"
              />
              <button
                onClick={() => setUnwrapAmount(wpcBalance)}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                MAX
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="p-2 rounded-xl bg-surface border border-border">
              <ArrowDownUp className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">You will receive</span>
              <span className="font-medium">{unwrapAmount || '0'} PC</span>
            </div>
          </div>

          <Button
            className="w-full h-12 font-semibold bg-gradient-pink hover:opacity-90"
            disabled={!isCorrectNetwork || !unwrapAmount || parseFloat(unwrapAmount) === 0 || isUnwrapping}
            onClick={handleUnwrap}
          >
            {isUnwrapping ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Unwrapping...
              </span>
            ) : (
              'Unwrap WPC to PC'
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};
