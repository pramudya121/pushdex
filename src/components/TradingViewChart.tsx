import React, { useState, memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
  ComposedChart,
  Bar
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Maximize2,
  Settings,
  Plus,
  Minus,
  Activity
} from 'lucide-react';

interface ChartDataPoint {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20?: number;
  sma50?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
}

// Generate mock candlestick data
const generateMockData = (timeframe: string, days: number): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  let basePrice = 2300;
  const now = Date.now();
  const interval = timeframe === '1H' ? 3600000 : timeframe === '4H' ? 14400000 : 86400000;
  
  for (let i = days * 24; i >= 0; i--) {
    const timestamp = now - i * interval;
    const volatility = 0.02 + Math.random() * 0.03;
    const trend = Math.sin(i / 20) * 0.5;
    
    const open = basePrice;
    const change = (Math.random() - 0.5 + trend * 0.1) * volatility * basePrice;
    const close = open + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.random() * 1000000 + 500000;
    
    basePrice = close;
    
    // Calculate indicators
    const sma20 = basePrice * (0.98 + Math.random() * 0.04);
    const sma50 = basePrice * (0.96 + Math.random() * 0.08);
    const rsi = 30 + Math.random() * 40;
    const macd = (Math.random() - 0.5) * 10;
    const macdSignal = macd * 0.8;
    const macdHistogram = macd - macdSignal;
    
    data.push({
      time: new Date(timestamp).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: timeframe !== '1D' ? '2-digit' : undefined
      }),
      timestamp,
      open,
      high,
      low,
      close,
      volume,
      sma20,
      sma50,
      rsi,
      macd,
      macdSignal,
      macdHistogram,
    });
  }
  
  return data;
};

interface TradingViewChartProps {
  tokenSymbol?: string;
  className?: string;
}

export const TradingViewChart = memo(({ tokenSymbol = 'ETH', className = '' }: TradingViewChartProps) => {
  const [timeframe, setTimeframe] = useState<'1H' | '4H' | '1D' | '1W'>('1D');
  const [showIndicators, setShowIndicators] = useState({
    sma20: true,
    sma50: true,
    rsi: false,
    macd: false,
    volume: true,
  });
  const [chartType, setChartType] = useState<'line' | 'area' | 'candle'>('area');
  
  const data = useMemo(() => {
    const days = timeframe === '1H' ? 2 : timeframe === '4H' ? 7 : timeframe === '1D' ? 30 : 90;
    return generateMockData(timeframe, days);
  }, [timeframe]);
  
  const latestPrice = data[data.length - 1]?.close || 0;
  const previousPrice = data[data.length - 2]?.close || latestPrice;
  const priceChange = latestPrice - previousPrice;
  const priceChangePercent = (priceChange / previousPrice) * 100;
  const isPositive = priceChange >= 0;
  
  const high24h = Math.max(...data.slice(-24).map(d => d.high));
  const low24h = Math.min(...data.slice(-24).map(d => d.low));

  const toggleIndicator = (key: keyof typeof showIndicators) => {
    setShowIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
        <div className="text-sm text-muted-foreground mb-2">{label}</div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Open:</span>
            <span className="font-mono">${d.open?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">High:</span>
            <span className="font-mono text-success">${d.high?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Low:</span>
            <span className="font-mono text-destructive">${d.low?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Close:</span>
            <span className="font-mono">${d.close?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4 pt-1 border-t border-border">
            <span className="text-muted-foreground">Volume:</span>
            <span className="font-mono">${(d.volume / 1000000).toFixed(2)}M</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={`glass-card overflow-hidden ${className}`}>
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Price Info */}
          <div className="flex items-center gap-4">
            <div className="icon-container">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{tokenSymbol}/USD</CardTitle>
                <Badge variant="outline" className="text-xs">Live</Badge>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-bold">${latestPrice.toFixed(2)}</span>
                <Badge className={isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}>
                  {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as typeof timeframe)}>
              <TabsList className="bg-surface h-8">
                <TabsTrigger value="1H" className="text-xs h-6 px-2">1H</TabsTrigger>
                <TabsTrigger value="4H" className="text-xs h-6 px-2">4H</TabsTrigger>
                <TabsTrigger value="1D" className="text-xs h-6 px-2">1D</TabsTrigger>
                <TabsTrigger value="1W" className="text-xs h-6 px-2">1W</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex gap-1">
              <Button
                variant={chartType === 'line' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setChartType('line')}
              >
                <Activity className="w-4 h-4" />
              </Button>
              <Button
                variant={chartType === 'area' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setChartType('area')}
              >
                <TrendingUp className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Indicators Toggle */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs text-muted-foreground">Indicators:</span>
          {Object.entries(showIndicators).map(([key, value]) => (
            <Button
              key={key}
              variant={value ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => toggleIndicator(key as keyof typeof showIndicators)}
            >
              {key.toUpperCase()}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Main Chart */}
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(330, 100%, 55%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(330, 100%, 55%)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(280, 80%, 60%)" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="hsl(280, 80%, 60%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 15%)" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(240, 5%, 60%)" 
                fontSize={11}
                tickLine={false}
              />
              <YAxis 
                yAxisId="price"
                stroke="hsl(240, 5%, 60%)" 
                fontSize={11}
                tickLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(v) => `$${v.toFixed(0)}`}
              />
              <YAxis 
                yAxisId="volume"
                orientation="right"
                stroke="hsl(240, 5%, 60%)" 
                fontSize={11}
                tickLine={false}
                hide
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Volume Bars */}
              {showIndicators.volume && (
                <Bar 
                  dataKey="volume" 
                  yAxisId="volume"
                  fill="url(#colorVolume)" 
                  opacity={0.5}
                />
              )}
              
              {/* Price Area/Line */}
              {chartType === 'area' ? (
                <Area
                  type="monotone"
                  dataKey="close"
                  yAxisId="price"
                  stroke="hsl(330, 100%, 55%)"
                  strokeWidth={2}
                  fill="url(#colorPrice)"
                />
              ) : (
                <Line
                  type="monotone"
                  dataKey="close"
                  yAxisId="price"
                  stroke="hsl(330, 100%, 55%)"
                  strokeWidth={2}
                  dot={false}
                />
              )}
              
              {/* SMA Indicators */}
              {showIndicators.sma20 && (
                <Line
                  type="monotone"
                  dataKey="sma20"
                  yAxisId="price"
                  stroke="hsl(210, 100%, 55%)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                />
              )}
              {showIndicators.sma50 && (
                <Line
                  type="monotone"
                  dataKey="sma50"
                  yAxisId="price"
                  stroke="hsl(45, 100%, 50%)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* RSI Chart */}
        {showIndicators.rsi && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 100 }}
            className="mt-4 border-t border-border/40 pt-4"
          >
            <div className="text-xs text-muted-foreground mb-2">RSI (14)</div>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRSI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(280, 80%, 60%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(280, 80%, 60%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <ReferenceLine y={70} stroke="hsl(0, 84%, 60%)" strokeDasharray="3 3" />
                <ReferenceLine y={30} stroke="hsl(142, 76%, 46%)" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="rsi"
                  stroke="hsl(280, 80%, 60%)"
                  fill="url(#colorRSI)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}
        
        {/* MACD Chart */}
        {showIndicators.macd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 100 }}
            className="mt-4 border-t border-border/40 pt-4"
          >
            <div className="text-xs text-muted-foreground mb-2">MACD (12, 26, 9)</div>
            <ResponsiveContainer width="100%" height={80}>
              <ComposedChart data={data}>
                <Bar 
                  dataKey="macdHistogram" 
                  fill="hsl(330, 100%, 55%)"
                />
                <Line
                  type="monotone"
                  dataKey="macd"
                  stroke="hsl(210, 100%, 55%)"
                  strokeWidth={1}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="macdSignal"
                  stroke="hsl(45, 100%, 50%)"
                  strokeWidth={1}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        )}
        
        {/* Price Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/40">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">24h High</div>
            <div className="font-semibold text-success">${high24h.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">24h Low</div>
            <div className="font-semibold text-destructive">${low24h.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">24h Volume</div>
            <div className="font-semibold">$12.5M</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Market Cap</div>
            <div className="font-semibold">$285.2B</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

TradingViewChart.displayName = 'TradingViewChart';
