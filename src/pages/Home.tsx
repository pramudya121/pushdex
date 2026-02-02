import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { WaveBackground } from '@/components/WaveBackground';
import { TokenGlobe } from '@/components/TokenGlobe';
import { TokenMarquee } from '@/components/TokenMarquee';
import { WolfLogo } from '@/components/WolfLogo';
import { ShimmerButton, Spotlight } from '@/components/ui/magic-ui';
import { Particles } from '@/components/ui/magic-ui/particles';
import { FloatingParticles } from '@/components/ui/aceternity/floating-particles';
import { TypingAnimation } from '@/components/ui/magic-ui/typing-animation';
import { NumberTicker } from '@/components/ui/magic-ui/number-ticker';
import { HoverGlowCard, TextScramble } from '@/components/ui/pushdex';
import { Card3D } from '@/components/ui/aceternity/3d-card';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { 
  ArrowRight, 
  Zap, 
  Shield, 
  TrendingUp, 
  Coins, 
  Users, 
  BarChart3,
  Rocket,
  Globe,
  Lock
} from 'lucide-react';

const FeatureCard = memo(({ 
  icon: Icon, 
  title, 
  description, 
  delay 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
  >
    <HoverGlowCard 
      className="glass-card p-6 h-full"
      glowColor="hsl(330, 100%, 55%)"
      glowIntensity={0.12}
    >
      <div className="icon-container mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </HoverGlowCard>
  </motion.div>
));

FeatureCard.displayName = 'FeatureCard';

const StatItem = memo(({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) => (
  <div className="text-center">
    <div className="text-2xl md:text-3xl font-bold text-foreground flex items-center justify-center">
      <NumberTicker value={value} />
      <span>{suffix}</span>
    </div>
    <div className="text-xs text-muted-foreground mt-1">{label}</div>
  </div>
));

StatItem.displayName = 'StatItem';

const Home = () => {
  const prefersReducedMotion = useReducedMotion();

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Execute swaps in milliseconds with our optimized smart contracts on Push Chain.',
    },
    {
      icon: Shield,
      title: 'Secure & Audited',
      description: 'Battle-tested contracts with comprehensive security measures and RLS policies.',
    },
    {
      icon: TrendingUp,
      title: 'Best Rates',
      description: 'Smart routing algorithm finds the optimal path for your trades across all pools.',
    },
    {
      icon: Coins,
      title: 'Earn Rewards',
      description: 'Stake tokens and provide liquidity to earn competitive yields and rewards.',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <WaveBackground />
      
      {/* Interactive Particle Systems */}
      {!prefersReducedMotion && (
        <>
          <Particles 
            className="z-0" 
            quantity={80} 
            color="hsl(330, 100%, 55%)"
            staticity={25}
          />
          <FloatingParticles 
            className="z-0 opacity-30" 
            quantity={25}
            color="hsl(280, 80%, 60%)"
          />
        </>
      )}
      
      {/* Spotlight Effects */}
      <Spotlight className="-top-40 -left-10 md:-left-32 md:-top-20" />
      <Spotlight className="top-10 right-0 md:right-20" fill="hsl(280, 80%, 50%)" />
      <Spotlight className="bottom-20 left-1/3" fill="hsl(330, 100%, 45%)" />
      
      <Header />
      
      <main id="main-content" className="relative z-10 pt-24 pb-20 px-4" role="main">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto mb-20">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
            {/* Left - Content */}
            <motion.div 
              className="flex-1 text-center lg:text-left max-w-xl"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Logo */}
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                <Card3D intensity={10} className="w-fit">
                  <div className="p-3 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 glow-pink-subtle">
                    <WolfLogo size={48} />
                  </div>
                </Card3D>
                <div>
                  <h1 className="text-3xl font-display font-bold">
                    <span className="gradient-text">PUSH</span>
                    <span className="text-foreground">DEX</span>
                  </h1>
                </div>
              </div>
              
              {/* Tagline */}
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
                <span className="text-foreground">Trade Crypto</span>
                <br />
                <span className="gradient-text">Without Limits</span>
              </h2>
              
              <div className="h-8 mb-6">
                <TypingAnimation 
                  text="The most powerful DEX on Push Chain. Swap, earn, and build."
                  className="text-lg text-muted-foreground"
                  duration={40}
                />
              </div>
              
              {/* Network Badge */}
              <HoverGlowCard 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/80 border border-border/40 text-sm mb-8"
                glowColor="hsl(142, 76%, 46%)"
                glowIntensity={0.2}
              >
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-foreground font-medium">Push Testnet Donut</span>
                <span className="text-muted-foreground">• Live</span>
              </HoverGlowCard>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
                <Link to="/swap">
                  <ShimmerButton 
                    shimmerColor="hsl(330, 100%, 75%)"
                    className="px-8 py-4 text-lg group"
                  >
                    <Rocket className="w-5 h-5 transition-transform group-hover:rotate-12" />
                    <span>Launch App</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </ShimmerButton>
                </Link>
                <Link to="/docs">
                  <ShimmerButton 
                    background="hsl(var(--secondary))"
                    shimmerColor="hsl(280, 100%, 65%)"
                    className="px-6 py-4"
                  >
                    Learn More
                  </ShimmerButton>
                </Link>
              </div>
              
              {/* Stats */}
              <motion.div 
                className="flex items-center justify-center lg:justify-start gap-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <StatItem value={2.5} suffix="M+" label="Total Value Locked" />
                <div className="w-px h-12 bg-border/50" />
                <StatItem value={15} suffix="K+" label="Total Trades" />
                <div className="w-px h-12 bg-border/50" />
                <StatItem value={11} label="Listed Tokens" />
              </motion.div>
            </motion.div>
            
            {/* Right - 3D Globe */}
            <motion.div 
              className="flex-1 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <div className="relative">
                {/* Glow behind globe */}
                <div 
                  className="absolute inset-[-20%] rounded-full blur-3xl opacity-40"
                  style={{ background: 'radial-gradient(circle, hsl(330, 100%, 50%) 0%, hsl(280, 80%, 50%) 50%, transparent 70%)' }}
                />
                <TokenGlobe size={380} />
              </div>
            </motion.div>
          </div>
        </section>
        
        {/* Token Marquee */}
        <section className="mb-20">
          <TokenMarquee />
        </section>
        
        {/* Features Section */}
        <section className="max-w-6xl mx-auto mb-20">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              <span className="text-foreground">Why Choose </span>
              <span className="gradient-text">PUSHDEX</span>
              <span className="text-foreground">?</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built on Push Chain for lightning-fast transactions with the lowest fees
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={0.5 + index * 0.1}
              />
            ))}
          </div>
        </section>
        
        {/* Quick Links Section */}
        <section className="max-w-4xl mx-auto">
          <motion.div 
            className="glass-card p-8 text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h3 className="text-2xl font-bold text-foreground mb-6">
              Ready to Start Trading?
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/swap">
                <HoverGlowCard className="flex items-center gap-3 px-6 py-3 rounded-xl bg-surface border border-border/50 hover:border-primary/50 transition-colors">
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="font-medium">Swap Tokens</span>
                </HoverGlowCard>
              </Link>
              <Link to="/pools">
                <HoverGlowCard className="flex items-center gap-3 px-6 py-3 rounded-xl bg-surface border border-border/50 hover:border-primary/50 transition-colors">
                  <Coins className="w-5 h-5 text-primary" />
                  <span className="font-medium">Explore Pools</span>
                </HoverGlowCard>
              </Link>
              <Link to="/farming">
                <HoverGlowCard className="flex items-center gap-3 px-6 py-3 rounded-xl bg-surface border border-border/50 hover:border-primary/50 transition-colors">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="font-medium">Start Farming</span>
                </HoverGlowCard>
              </Link>
              <Link to="/staking">
                <HoverGlowCard className="flex items-center gap-3 px-6 py-3 rounded-xl bg-surface border border-border/50 hover:border-primary/50 transition-colors">
                  <Lock className="w-5 h-5 text-primary" />
                  <span className="font-medium">Stake & Earn</span>
                </HoverGlowCard>
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
};

export default memo(Home);
