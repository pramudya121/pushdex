import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface PortfolioValueChartProps {
  className?: string;
}

// Generate mock historical data
const generateHistoricalData = () => {
  const data = [];
  const now = new Date();
  let value = 1000 + Math.random() * 500;
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Add some variation
    value = value * (0.95 + Math.random() * 0.12);
    value = Math.max(value, 500);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(value * 100) / 100,
    });
  }
  
  return data;
};

export const PortfolioValueChart: React.FC<PortfolioValueChartProps> = ({ className }) => {
  const data = React.useMemo(() => generateHistoricalData(), []);
  
  const minValue = Math.min(...data.map(d => d.value)) * 0.9;
  const maxValue = Math.max(...data.map(d => d.value)) * 1.1;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-border/50">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-semibold text-primary">
            ${payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={[minValue, maxValue]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#portfolioGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
