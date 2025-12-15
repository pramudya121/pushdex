import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface PortfolioChartProps {
  data: ChartData[];
  title?: string;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(142 76% 36%)',
  'hsl(38 92% 50%)',
  'hsl(280 87% 65%)',
  'hsl(200 90% 50%)',
  'hsl(340 82% 52%)',
];

export const PortfolioChart: React.FC<PortfolioChartProps> = ({ data, title }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No data to display
      </div>
    );
  }

  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card p-3 border border-border/50">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            ${data.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLegend = () => {
    const total = dataWithColors.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        {dataWithColors.slice(0, 5).map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-muted-foreground">
              {item.name} ({((item.value / total) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
        {dataWithColors.length > 5 && (
          <span className="text-sm text-muted-foreground">
            +{dataWithColors.length - 5} more
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={dataWithColors}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            stroke="hsl(var(--background))"
            strokeWidth={2}
          >
            {dataWithColors.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {renderCustomLegend()}
    </div>
  );
};
