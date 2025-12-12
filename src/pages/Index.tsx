import React from 'react';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { SwapCard } from '@/components/SwapCard';
import { WolfLogo } from '@/components/WolfLogo';

const Index = () => {
  return (
    <div className="min-h-screen relative">
      <WaveBackground />
      <Header />
      
      <main className="relative z-10 pt-32 md:pt-24 pb-20 px-4">
        <div className="max-w-lg mx-auto">
          {/* Hero */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 glow-pink-subtle">
                <WolfLogo size={64} />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="gradient-text">PUSH</span>DEX
            </h1>
            <p className="text-muted-foreground">
              Decentralized Exchange on Push Chain Testnet
            </p>
          </div>

          {/* Swap Card */}
          <SwapCard />

          {/* Network Info */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Push Testnet Donut
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
