import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';

interface PriceDataPoint {
  time: string;
  price: number;
}

interface PriceChartProps {
  token0Symbol: string;
  token1Symbol: string;
  reserve0: string;
  reserve1: string;
}

// Generate simulated historical price data based on current reserves
const generatePriceData = (currentPrice: number, timeframe: string): PriceDataPoint[] => {
  const points: PriceDataPoint[] = [];
  let numPoints = 24;
  let interval = 'h';
  
  switch (timeframe) {
    case '1H':
      numPoints = 12;
      interval = 'm';
      break;
    case '24H':
      numPoints = 24;
      interval = 'h';
      break;
    case '7D':
      numPoints = 7;
      interval = 'd';
      break;
    case '30D':
      numPoints = 30;
      interval = 'd';
      break;
  }
  
  // Generate data points with realistic price variation
  const volatility = 0.05; // 5% max variation
  let price = currentPrice * (1 - volatility * Math.random());
  
  for (let i = numPoints; i >= 0; i--) {
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    price = Math.max(price + change, currentPrice * 0.8);
    
    // Trend towards current price as we get closer to now
    if (i < numPoints / 3) {
      price = price + (currentPrice - price) * 0.3;
    }
    
    points.push({
      time: `${i}${interval}`,
      price: parseFloat(price.toFixed(6)),
    });
  }
  
  // Ensure last point is current price
  points[points.length - 1].price = currentPrice;
  
  return points;
};

export const PriceChart: React.FC<PriceChartProps> = ({
  token0Symbol,
  token1Symbol,
  reserve0,
  reserve1,
}) => {
  const [timeframe, setTimeframe] = useState('24H');
  const [inverted, setInverted] = useState(false);
  
  const r0 = parseFloat(reserve0) || 1;
  const r1 = parseFloat(reserve1) || 1;
  
  const price = inverted ? r0 / r1 : r1 / r0;
  const displayToken0 = inverted ? token1Symbol : token0Symbol;
  const displayToken1 = inverted ? token0Symbol : token1Symbol;
  
  const data = generatePriceData(price, timeframe);
  
  const priceChange = ((data[data.length - 1].price - data[0].price) / data[0].price) * 100;
  const isPositive = priceChange >= 0;

  const timeframes = ['1H', '24H', '7D', '30D'];

  return (
    <div className="glass-card p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <button
            onClick={() => setInverted(!inverted)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <h3 className="text-lg font-semibold">
              {displayToken0}/{displayToken1}
            </h3>
            <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" />
            </svg>
          </button>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold">{price.toFixed(6)}</span>
            <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
              isPositive 
                ? 'bg-success/20 text-[hsl(var(--success))]' 
                : 'bg-destructive/20 text-destructive'
            }`}>
              {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
        
        {/* Timeframe selector */}
        <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
          {timeframes.map((tf) => (
            <Button
              key={tf}
              size="sm"
              variant={timeframe === tf ? 'default' : 'ghost'}
              className={`h-7 px-3 text-xs ${
                timeframe === tf 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Chart */}
      <div className="h-48 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${token0Symbol}-${token1Symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? 'hsl(142, 76%, 46%)' : 'hsl(0, 84%, 60%)'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={isPositive ? 'hsl(142, 76%, 46%)' : 'hsl(0, 84%, 60%)'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: 'hsl(240, 5%, 65%)', fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={['dataMin', 'dataMax']}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(240, 5%, 65%)', fontSize: 11 }}
              tickFormatter={(value) => value.toFixed(4)}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(240, 10%, 8%)',
                border: '1px solid hsl(240, 10%, 18%)',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
              labelStyle={{ color: 'hsl(240, 5%, 65%)' }}
              itemStyle={{ color: 'hsl(0, 0%, 98%)' }}
              formatter={(value: number) => [value.toFixed(6), 'Price']}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? 'hsl(142, 76%, 46%)' : 'hsl(0, 84%, 60%)'}
              strokeWidth={2}
              fill={`url(#gradient-${token0Symbol}-${token1Symbol})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
