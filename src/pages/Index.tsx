import React, { memo } from 'react';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { SwapCard } from '@/components/SwapCard';
import { RotatingTokenLogo } from '@/components/RotatingTokenLogo';
import { TokenMarquee } from '@/components/TokenMarquee';
import { ShimmerButton, Spotlight } from '@/components/ui/magic-ui';
import { TypingAnimation } from '@/components/ui/magic-ui/typing-animation';
import { Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <WaveBackground />
      
      {/* Spotlight Effect */}
      <Spotlight className="-top-40 -left-10 md:-left-32 md:-top-20" />
      <Spotlight className="top-10 right-0 md:right-20" fill="hsl(280, 80%, 50%)" />
      
      <Header />
      
      {/* Token Price Marquee */}
      <div className="relative z-10 pt-20">
        <TokenMarquee />
      </div>
      
      <main className="relative z-10 pt-8 md:pt-4 pb-20 px-4">
        <div className="max-w-md mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex justify-center mb-6">
              <RotatingTokenLogo logo="/tokens/psdx.png" size={100} />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 tracking-tight">
              <span className="gradient-text">PUSH</span>
              <span className="text-foreground">DEX</span>
            </h1>
            
            <div className="h-8 mb-4">
              <TypingAnimation 
                text="The Next-Generation DEX on Push Chain"
                className="text-base text-muted-foreground"
                duration={50}
              />
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/80 border border-border/40 text-sm mb-6">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-foreground font-medium">Push Testnet Donut</span>
              <span className="text-muted-foreground">• Live</span>
            </div>
            
            {/* CTA Buttons with Shimmer Effect */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Link to="/pools">
                <ShimmerButton 
                  shimmerColor="hsl(330, 100%, 75%)"
                  className="w-full sm:w-auto"
                >
                  <Zap className="w-4 h-4" />
                  Explore Pools
                  <ArrowRight className="w-4 h-4" />
                </ShimmerButton>
              </Link>
              <Link to="/docs">
                <ShimmerButton 
                  background="hsl(var(--secondary))"
                  shimmerColor="hsl(280, 100%, 65%)"
                  className="w-full sm:w-auto"
                >
                  Learn More
                </ShimmerButton>
              </Link>
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
