import React, { memo } from 'react';
import { WaveBackground } from '@/components/WaveBackground';
import { Header } from '@/components/Header';
import { SwapCard } from '@/components/SwapCard';
import { WolfLogo } from '@/components/WolfLogo';
import { Zap, Shield, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const FeatureCard = memo(({ icon: Icon, title, description, delay }: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  delay: string;
}) => (
  <div 
    className="glass-card-hover p-5 text-center group animate-fade-in" 
    style={{ animationDelay: delay }}
  >
    <div className="icon-container mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <h3 className="font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
));

FeatureCard.displayName = 'FeatureCard';

const Index = () => {
  return (
    <div className="min-h-screen relative">
      <WaveBackground />
      <Header />
      
      <main className="relative z-10 pt-28 md:pt-24 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-10 animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                <div className="relative p-5 rounded-3xl bg-card/80 backdrop-blur-xl border border-border/40 glow-pink-subtle">
                  <WolfLogo size={72} />
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-4 tracking-tight">
              <span className="gradient-text">PUSH</span>
              <span className="text-foreground">DEX</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-6">
              The Next-Generation DEX on Push Chain
            </p>
            
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface/80 border border-border/40 text-sm animate-pulse-glow">
              <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
              <span className="text-foreground font-medium">Push Testnet Donut</span>
              <span className="text-muted-foreground">• Live</span>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-5 gap-6 items-start">
            {/* Swap Card - Main */}
            <div className="lg:col-span-3 order-1 lg:order-1">
              <SwapCard />
            </div>

            {/* Features - Side */}
            <div className="lg:col-span-2 order-2 lg:order-2 space-y-4">
              <FeatureCard 
                icon={Zap} 
                title="Lightning Fast" 
                description="Instant swaps with minimal gas fees"
                delay="0.1s"
              />
              <FeatureCard 
                icon={Shield} 
                title="Secure & Audited" 
                description="Smart contracts verified on-chain"
                delay="0.2s"
              />
              <FeatureCard 
                icon={TrendingUp} 
                title="Earn Yields" 
                description="Provide liquidity and earn rewards"
                delay="0.3s"
              />
              
              {/* Quick Links */}
              <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <h4 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Link to="/pools" className="flex items-center justify-between p-3 rounded-xl bg-surface/60 hover:bg-surface transition-all group">
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Explore Pools</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                  <Link to="/farming" className="flex items-center justify-between p-3 rounded-xl bg-surface/60 hover:bg-surface transition-all group">
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Start Farming</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                  <Link to="/staking" className="flex items-center justify-between p-3 rounded-xl bg-surface/60 hover:bg-surface transition-all group">
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Stake Tokens</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default memo(Index);

