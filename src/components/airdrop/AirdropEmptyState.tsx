import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, Rocket, Gift, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  isConnected: boolean;
  onConnect?: () => void;
}

export const AirdropEmptyState: React.FC<Props> = ({ isConnected, onConnect }) => {
  if (isConnected) return null;

  const features = [
    { icon: Zap, text: 'Complete on-chain quests' },
    { icon: Gift, text: 'Earn airdrop points' },
    { icon: Rocket, text: 'Climb the leaderboard' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200 }}
    >
      <Card className="glass-card max-w-lg mx-auto text-center overflow-hidden relative">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

        <CardContent className="p-8 sm:p-12 space-y-5 relative z-10">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center mx-auto"
          >
            <Wallet className="w-9 h-9 text-primary" />
          </motion.div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Connect your wallet to start completing quests and earning airdrop points.
            </p>
          </div>

          <div className="grid gap-2.5 max-w-xs mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={f.text}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 text-left text-sm text-muted-foreground p-2.5 rounded-lg bg-surface/50 border border-border/20"
              >
                <f.icon className="w-4 h-4 text-primary shrink-0" />
                <span>{f.text}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
