import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Coins } from 'lucide-react';

interface FarmPoolChartProps {
  poolId: number;
  currentApr: number;
  totalStaked: string;
  className?: string;
}

// Generate mock historical data for APR
const generateAprHistory = (currentApr: number, poolId: number) => {
  const data = [];
  const now = new Date();
  const seed = poolId * 1000;
  
  for (let i = 14; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate pseudo-random variation based on pool ID and day
    const variation = Math.sin((seed + i) * 0.5) * 0.3 + Math.cos((seed + i) * 0.3) * 0.2;
    const apr = Math.max(0, currentApr * (0.8 + variation * 0.5));
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      apr: Math.round(apr * 100) / 100,
    });
  }
  
  return data;
};

// Generate mock historical data for total staked
const generateStakedHistory = (currentStaked: number, poolId: number) => {
  const data = [];
  const now = new Date();
  const seed = poolId * 500;
  
  for (let i = 14; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Simulate gradual growth with some variation
    const progress = (14 - i) / 14;
    const baseValue = currentStaked * (0.5 + progress * 0.5);
    const variation = Math.sin((seed + i) * 0.4) * 0.1;
    const staked = Math.max(0, baseValue * (1 + variation));
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      staked: Math.round(staked * 100) / 100,
    });
  }
  
  return data;
};

export const FarmPoolChart: React.FC<FarmPoolChartProps> = ({
  poolId,
  currentApr,
  totalStaked,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState('apr');
  
  const totalStakedNum = parseFloat(totalStaked);
  
  const aprData = useMemo(() => generateAprHistory(currentApr, poolId), [currentApr, poolId]);
  const stakedData = useMemo(() => generateStakedHistory(totalStakedNum, poolId), [totalStakedNum, poolId]);
  
  const aprMin = Math.min(...aprData.map(d => d.apr)) * 0.9;
  const aprMax = Math.max(...aprData.map(d => d.apr)) * 1.1;
  const stakedMin = Math.min(...stakedData.map(d => d.staked)) * 0.9;
  const stakedMax = Math.max(...stakedData.map(d => d.staked)) * 1.1;

  const CustomTooltip = ({ active, payload, label, type }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-card/95 backdrop-blur-sm p-3 rounded-lg border border-border/50 shadow-lg">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className={`font-semibold ${type === 'apr' ? 'text-primary' : 'text-accent'}`}>
            {type === 'apr' 
              ? `${value.toFixed(2)}% APR`
              : `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} LP`
            }
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-muted/30 h-8">
          <TabsTrigger 
            value="apr" 
            className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all"
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            APR History
          </TabsTrigger>
          <TabsTrigger 
            value="staked" 
            className="text-xs data-[state=active]:bg-accent/20 data-[state=active]:text-accent transition-all"
          >
            <Coins className="w-3 h-3 mr-1" />
            Total Staked
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apr" className="mt-2 animate-fade-in">
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aprData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id={`aprGradient-${poolId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[aprMin, aprMax]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${value.toFixed(0)}%`}
                  width={35}
                />
                <Tooltip content={(props) => <CustomTooltip {...props} type="apr" />} />
                <Area
                  type="monotone"
                  dataKey="apr"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill={`url(#aprGradient-${poolId})`}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
            <span>14 days ago</span>
            <span className="text-primary font-medium">Current: {currentApr.toFixed(2)}%</span>
          </div>
        </TabsContent>

        <TabsContent value="staked" className="mt-2 animate-fade-in">
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stakedData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id={`stakedGradient-${poolId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[stakedMin, stakedMax]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toFixed(0)}
                  width={35}
                />
                <Tooltip content={(props) => <CustomTooltip {...props} type="staked" />} />
                <Area
                  type="monotone"
                  dataKey="staked"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  fill={`url(#stakedGradient-${poolId})`}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
            <span>14 days ago</span>
            <span className="text-accent font-medium">
              Current: {totalStakedNum.toLocaleString(undefined, { maximumFractionDigits: 2 })} LP
            </span>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
