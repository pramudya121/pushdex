import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Hourglass, CheckCircle2 } from 'lucide-react';
import { RPC_URL } from '@/config/contracts';
import { ethers } from 'ethers';

interface FarmingCountdownProps {
  startBlock: bigint;
  className?: string;
}

interface CountdownData {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  blocksRemaining: number;
  hasStarted: boolean;
}

export const FarmingCountdown: React.FC<FarmingCountdownProps> = ({ startBlock, className }) => {
  const [countdown, setCountdown] = useState<CountdownData>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    blocksRemaining: 0,
    hasStarted: false,
  });
  const [currentBlock, setCurrentBlock] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBlockInfo = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const blockNumber = await provider.getBlockNumber();
        setCurrentBlock(blockNumber);

        const startBlockNum = Number(startBlock);
        const blocksRemaining = startBlockNum - blockNumber;
        
        if (blocksRemaining <= 0) {
          setCountdown({
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            blocksRemaining: 0,
            hasStarted: true,
          });
        } else {
          // Assuming ~3 seconds per block on Push testnet
          const secondsRemaining = blocksRemaining * 3;
          
          const days = Math.floor(secondsRemaining / 86400);
          const hours = Math.floor((secondsRemaining % 86400) / 3600);
          const minutes = Math.floor((secondsRemaining % 3600) / 60);
          const seconds = secondsRemaining % 60;

          setCountdown({
            days,
            hours,
            minutes,
            seconds,
            blocksRemaining,
            hasStarted: false,
          });
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching block info:', error);
        setIsLoading(false);
      }
    };

    fetchBlockInfo();
    
    // Update every 10 seconds
    const interval = setInterval(fetchBlockInfo, 10000);
    return () => clearInterval(interval);
  }, [startBlock]);

  // Countdown timer effect
  useEffect(() => {
    if (countdown.hasStarted || isLoading) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.hasStarted) return prev;
        
        let { days, hours, minutes, seconds, blocksRemaining } = prev;
        
        seconds -= 1;
        if (seconds < 0) {
          seconds = 59;
          minutes -= 1;
        }
        if (minutes < 0) {
          minutes = 59;
          hours -= 1;
        }
        if (hours < 0) {
          hours = 23;
          days -= 1;
        }
        if (days < 0) {
          return { ...prev, hasStarted: true };
        }

        // Approximate blocks remaining decrease
        const totalSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds;
        blocksRemaining = Math.max(0, Math.floor(totalSeconds / 3));

        return { days, hours, minutes, seconds, blocksRemaining, hasStarted: false };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown.hasStarted, isLoading]);

  if (isLoading) {
    return null;
  }

  if (countdown.hasStarted) {
    return (
      <Card className={`glass-card border-success/30 ${className}`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-success" />
            <span className="text-lg font-semibold text-success">Farming is Live!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`glass-card border-primary/30 overflow-hidden ${className}`}>
      <CardContent className="py-6">
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Hourglass className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-lg font-semibold text-foreground">Farming Starts In</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Block #{Number(startBlock).toLocaleString()} • Current: #{currentBlock.toLocaleString()}
          </p>
        </div>

        {/* Countdown Display */}
        <div className="grid grid-cols-4 gap-3">
          <TimeUnit value={countdown.days} label="Days" />
          <TimeUnit value={countdown.hours} label="Hours" />
          <TimeUnit value={countdown.minutes} label="Minutes" />
          <TimeUnit value={countdown.seconds} label="Seconds" />
        </div>

        {/* Blocks Remaining */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              ~{countdown.blocksRemaining.toLocaleString()} blocks remaining
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TimeUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="text-center">
    <div className="bg-muted/50 rounded-xl p-3 border border-border/50">
      <p className="text-3xl md:text-4xl font-bold gradient-text">
        {value.toString().padStart(2, '0')}
      </p>
    </div>
    <p className="text-xs text-muted-foreground mt-2">{label}</p>
  </div>
);
