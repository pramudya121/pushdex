import React, { memo, Suspense, lazy } from 'react';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { SwapCard } from '@/components/SwapCard';
import { WolfLogo } from '@/components/WolfLogo';
import { TokenMarquee } from '@/components/TokenMarquee';
import { TokenGlobe } from '@/components/TokenGlobe';
import { ShimmerButton, Spotlight } from '@/components/ui/magic-ui';
import { TypingAnimation } from '@/components/ui/magic-ui/typing-animation';
import { Particles } from '@/components/ui/magic-ui/particles';
import { FloatingParticles } from '@/components/ui/aceternity/floating-particles';
import { Card3D } from '@/components/ui/aceternity/3d-card';
import { HoverGlowCard, TextScramble } from '@/components/ui/pushdex';
import { Zap, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { motion } from 'framer-motion';

const Index = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <WaveBackground />
      
      {/* Interactive Particle System */}
      {!prefersReducedMotion && (
        <>
          <Particles 
            className="z-0" 
            quantity={60} 
            color="hsl(330, 100%, 55%)"
            staticity={30}
          />
          <FloatingParticles 
            className="z-0 opacity-40" 
            quantity={20}
            color="hsl(280, 80%, 60%)"
          />
        </>
      )}
      
      {/* Spotlight Effect */}
      <Spotlight className="-top-40 -left-10 md:-left-32 md:-top-20" />
      <Spotlight className="top-10 right-0 md:right-20" fill="hsl(280, 80%, 50%)" />
      
      <Header />
      
      {/* Token Price Marquee */}
      <div className="relative z-10 pt-20">
        <TokenMarquee />
      </div>
      
      <main id="main-content" className="relative z-10 pt-8 md:pt-4 pb-20 px-4" role="main">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section with Globe */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 mb-12">
            {/* Left side - 3D Token Globe */}
            <motion.div 
              className="hidden lg:block"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <TokenGlobe size={320} />
            </motion.div>

            {/* Center - Hero Content */}
            <div className="text-center animate-fade-in max-w-md">
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
              
              <HoverGlowCard 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/80 border border-border/40 text-sm mb-6"
                glowColor="hsl(142, 76%, 46%)"
                glowIntensity={0.2}
              >
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" aria-hidden="true" />
                <span className="text-foreground font-medium">Push Testnet Donut</span>
                <span className="text-muted-foreground">• Live</span>
              </HoverGlowCard>
              
              {/* CTA Buttons with Shimmer Effect */}
              <nav className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8" aria-label="Quick actions">
                <Link to="/pools" aria-label="Explore liquidity pools">
                  <ShimmerButton 
                    shimmerColor="hsl(330, 100%, 75%)"
                    className="w-full sm:w-auto group"
                  >
                    <Zap className="w-4 h-4 transition-transform group-hover:rotate-12" aria-hidden="true" />
                    <span>Explore Pools</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </ShimmerButton>
                </Link>
                <Link to="/docs" aria-label="Read documentation">
                  <ShimmerButton 
                    background="hsl(var(--secondary))"
                    shimmerColor="hsl(280, 100%, 65%)"
                    className="w-full sm:w-auto group"
                  >
                    <Sparkles className="w-4 h-4 transition-transform group-hover:scale-110" aria-hidden="true" />
                    <span>Learn More</span>
                  </ShimmerButton>
                </Link>
              </nav>

              {/* Stats Preview */}
              <motion.div 
                className="flex items-center justify-center gap-6 text-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">
                    <TextScramble text="$2.5M+" scrambleSpeed={40} />
                  </div>
                  <div className="text-muted-foreground text-xs">Total Value Locked</div>
                </div>
                <div className="w-px h-8 bg-border/50" />
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">
                    <TextScramble text="15K+" scrambleSpeed={40} />
                  </div>
                  <div className="text-muted-foreground text-xs">Total Trades</div>
                </div>
                <div className="w-px h-8 bg-border/50" />
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">
                    <TextScramble text="11" scrambleSpeed={40} />
                  </div>
                  <div className="text-muted-foreground text-xs">Listed Tokens</div>
                </div>
              </motion.div>
            </div>

            {/* Right side - Swap Card */}
            <motion.div 
              className="w-full max-w-md"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <section aria-labelledby="swap-section-title">
                <h2 id="swap-section-title" className="sr-only">Token Swap</h2>
                <SwapCard />
              </section>
            </motion.div>
          </div>

          {/* Mobile Globe - shown below on small screens */}
          <div className="lg:hidden flex justify-center mb-8">
            <TokenGlobe size={240} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default memo(Index);
