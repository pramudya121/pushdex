import React, { memo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WaveBackground } from '@/components/WaveBackground';
import { HeroSection } from '@/components/HeroSection';
import { TradingLeaderboard } from '@/components/TradingLeaderboard';
import { ImpermanentLossCalculator } from '@/components/ImpermanentLossCalculator';
import { ZapInOut } from '@/components/ZapInOut';
import { WhaleTracker } from '@/components/WhaleTracker';
import { TokenSecurityScanner } from '@/components/TokenSecurityScanner';
import { DCAAutomation } from '@/components/DCAAutomation';
import { TradingViewChart } from '@/components/TradingViewChart';
import { WrapUnwrap } from '@/components/WrapUnwrap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Calculator, 
  Zap, 
  Fish, 
  Shield, 
  CalendarClock,
  BarChart3,
  Wrench,
  ArrowDownUp
} from 'lucide-react';

const Tools = () => {
  return (
    <div className="min-h-screen relative">
      <WaveBackground />
      <Header />
      
      <main id="main-content" className="relative z-10 pt-20 pb-20 px-4">
        <HeroSection 
          title="Trading Tools"
          subtitle="Advanced tools to supercharge your trading experience"
        />
        
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="charts" className="space-y-6">
            <TabsList className="flex flex-wrap justify-center gap-2 bg-transparent h-auto p-2">
              <TabsTrigger 
                value="charts" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <BarChart3 className="w-4 h-4" />
                Charts
              </TabsTrigger>
              <TabsTrigger 
                value="leaderboard" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Trophy className="w-4 h-4" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger 
                value="calculator" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Calculator className="w-4 h-4" />
                IL Calculator
              </TabsTrigger>
              <TabsTrigger 
                value="zap" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Zap className="w-4 h-4" />
                Zap
              </TabsTrigger>
              <TabsTrigger 
                value="whale" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Fish className="w-4 h-4" />
                Whale Tracker
              </TabsTrigger>
              <TabsTrigger 
                value="scanner" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Shield className="w-4 h-4" />
                Token Scanner
              </TabsTrigger>
              <TabsTrigger 
                value="dca" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <CalendarClock className="w-4 h-4" />
                DCA
              </TabsTrigger>
              <TabsTrigger 
                value="wrap" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <ArrowDownUp className="w-4 h-4" />
                Wrap/Unwrap
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="charts" className="mt-6">
              <TradingViewChart tokenSymbol="ETH" />
            </TabsContent>
            
            <TabsContent value="leaderboard" className="mt-6">
              <TradingLeaderboard />
            </TabsContent>
            
            <TabsContent value="calculator" className="mt-6">
              <div className="max-w-2xl mx-auto">
                <ImpermanentLossCalculator />
              </div>
            </TabsContent>
            
            <TabsContent value="zap" className="mt-6">
              <div className="max-w-xl mx-auto">
                <ZapInOut />
              </div>
            </TabsContent>
            
            <TabsContent value="whale" className="mt-6">
              <div className="max-w-2xl mx-auto">
                <WhaleTracker />
              </div>
            </TabsContent>
            
            <TabsContent value="scanner" className="mt-6">
              <div className="max-w-2xl mx-auto">
                <TokenSecurityScanner />
              </div>
            </TabsContent>
            
            <TabsContent value="dca" className="mt-6">
              <div className="max-w-2xl mx-auto">
                <DCAAutomation />
              </div>
            </TabsContent>
            
            <TabsContent value="wrap" className="mt-6">
              <div className="max-w-xl mx-auto">
                <WrapUnwrap />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default memo(Tools);
