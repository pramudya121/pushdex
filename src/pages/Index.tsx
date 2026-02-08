import React, { memo } from 'react';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SwapCard } from '@/components/SwapCard';
import { WolfLogo } from '@/components/WolfLogo';
import { TokenMarquee } from '@/components/TokenMarquee';
import { FallingComets } from '@/components/FallingComets';
import { ShimmerButton, Spotlight } from '@/components/ui/magic-ui';
import { TypingAnimation } from '@/components/ui/magic-ui/typing-animation';
import { Particles } from '@/components/ui/magic-ui/particles';
import { Card3D } from '@/components/ui/aceternity/3d-card';
import { Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const Index = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <WaveBackground />
      
      {/* Falling Comets Animation */}
      <FallingComets quantity={8} />
      
      {/* Interactive Particle System - reduced quantity for performance */}
      {!prefersReducedMotion && (
        <Particles 
          className="z-0" 
          quantity={40} 
          color="hsl(330, 100%, 55%)"
          staticity={40}
        />
      )}
      
      {/* Spotlight Effect */}
      <Spotlight className="-top-40 -left-10 md:-left-32 md:-top-20" />
      
      <Header />
      
      {/* Token Price Marquee */}
      <div className="relative z-10 pt-20">
        <TokenMarquee />
      </div>
      
      <main id="main-content" className="relative z-10 pt-8 md:pt-4 pb-20 px-4" role="main">
        <div className="max-w-md mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8 animate-fade-in">
            {/* 3D Rotating Logo Container */}
            <Card3D 
              className="mx-auto w-fit" 
              containerClassName="mx-auto"
              intensity={15}
            >
              <div className="relative group">
                {/* Glow effect */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" 
                  style={{ transform: 'scale(1.3)' }}
                  aria-hidden="true"
                />
                
                {/* Rotating container */}
                <div className="relative p-5 rounded-3xl bg-card/80 backdrop-blur-xl border border-border/40 glow-pink-subtle animate-float">
                  <WolfLogo size={72} />
                </div>
                
                {/* Orbit ring */}
                {!prefersReducedMotion && (
                  <div 
                    className="absolute inset-[-15%] rounded-full border border-primary/20 animate-spin" 
                    style={{ animationDuration: '8s' }}
                    aria-hidden="true"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50" />
                  </div>
                )}
              </div>
            </Card3D>
            
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 tracking-tight mt-6">
              <span className="gradient-text">PUSH</span>
              <span className="text-foreground">DEX</span>
            </h1>
            
            <div className="h-8 mb-4" aria-live="polite">
              <TypingAnimation 
                text="The Next-Generation DEX on Push Chain"
                className="text-base text-muted-foreground"
                duration={50}
              />
            </div>
            
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/80 border border-border/40 text-sm mb-6"
              role="status"
              aria-label="Network status: Push Testnet Donut is live"
            >
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" aria-hidden="true" />
              <span className="text-foreground font-medium">Push Testnet Donut</span>
              <span className="text-muted-foreground">• Live</span>
            </div>
            
            {/* CTA Buttons with Shimmer Effect */}
            <nav className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8" aria-label="Quick actions">
              <Link to="/pools" aria-label="Explore liquidity pools">
                <ShimmerButton 
                  shimmerColor="hsl(330, 100%, 75%)"
                  className="w-full sm:w-auto"
                >
                  <Zap className="w-4 h-4" aria-hidden="true" />
                  Explore Pools
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </ShimmerButton>
              </Link>
              <Link to="/docs" aria-label="Read documentation">
                <ShimmerButton 
                  background="hsl(var(--secondary))"
                  shimmerColor="hsl(280, 100%, 65%)"
                  className="w-full sm:w-auto"
                >
                  Learn More
                </ShimmerButton>
              </Link>
            </nav>
          </div>

          {/* Swap Card */}
          <section aria-labelledby="swap-section-title">
            <h2 id="swap-section-title" className="sr-only">Token Swap</h2>
            <SwapCard />
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default memo(Index);
