import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Rocket } from 'lucide-react';

interface Props {
  isConnected: boolean;
  onConnect?: () => void;
}

export const AirdropEmptyState: React.FC<Props> = ({ isConnected, onConnect }) => {
  if (isConnected) return null;

  return (
    <Card className="glass-card max-w-lg mx-auto text-center">
      <CardContent className="p-8 sm:p-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Wallet className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold">Connect Your Wallet</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Connect your wallet to start completing quests, earning points, and climbing the leaderboard.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Rocket className="w-3.5 h-3.5" />
          <span>Earn rewards by completing on-chain and social tasks</span>
        </div>
      </CardContent>
    </Card>
  );
};
