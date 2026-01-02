import React, { memo } from 'react';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { SwapCard } from '@/components/SwapCard';
import { WolfLogo } from '@/components/WolfLogo';

const Index = () => {
  return (
    <div className="min-h-screen relative">
      <WaveBackground />
      <Header />
      
      <main className="relative z-10 pt-28 md:pt-24 pb-20 px-4">
        <div className="max-w-md mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                <div className="relative p-5 rounded-3xl bg-card/80 backdrop-blur-xl border border-border/40 glow-pink-subtle">
                  <WolfLogo size={72} />
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 tracking-tight">
              <span className="gradient-text">PUSH</span>
              <span className="text-foreground">DEX</span>
            </h1>
            
            <p className="text-base text-muted-foreground max-w-sm mx-auto mb-4">
              The Next-Generation DEX on Push Chain
            </p>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/80 border border-border/40 text-sm">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-foreground font-medium">Push Testnet Donut</span>
              <span className="text-muted-foreground">• Live</span>
            </div>
          </div>

          {/* Swap Card */}
          <SwapCard />
        </div>
      </main>
    </div>
  );
};

export default memo(Index);
