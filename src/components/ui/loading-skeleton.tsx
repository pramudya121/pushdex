import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'card' | 'row' | 'stat' | 'chart' | 'table' | 'form';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  variant = 'card',
  count = 1,
}) => {
  const items = Array.from({ length: count }, (_, i) => i);

  switch (variant) {
    case 'stat':
      return (
        <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
          {items.map((i) => (
            <div 
              key={i} 
              className="glass-card p-6 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );

    case 'chart':
      return (
        <div className={cn("glass-card p-6 animate-pulse", className)}>
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      );

    case 'table':
      return (
        <div className={cn("glass-card p-6 animate-pulse", className)}>
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
          <div className="space-y-3">
            {items.map((i) => (
              <div 
                key={i} 
                className="flex items-center gap-4 p-4 rounded-xl bg-surface/50"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'form':
      return (
        <div className={cn("glass-card p-6 space-y-6 animate-pulse", className)}>
          <Skeleton className="h-6 w-40" />
          <div className="space-y-4">
            {items.map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      );

    case 'row':
      return (
        <div className={cn("space-y-3", className)}>
          {items.map((i) => (
            <div 
              key={i} 
              className="flex items-center gap-4 p-4 rounded-xl bg-surface/50 animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      );

    case 'card':
    default:
      return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
          {items.map((i) => (
            <div 
              key={i} 
              className="glass-card p-6 space-y-4 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      );
  }
};

// Animated number component
export const AnimatedNumber: React.FC<{
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}> = ({ value, decimals = 2, prefix = '', suffix = '', className }) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const duration = 500;
    const startTime = Date.now();
    const startValue = displayValue;
    const endValue = value;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const current = startValue + (endValue - startValue) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
};

// Pulse dot for live indicators
export const PulseDot: React.FC<{
  color?: 'success' | 'warning' | 'error' | 'primary';
  className?: string;
}> = ({ color = 'success', className }) => {
  const colorClasses = {
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-destructive',
    primary: 'bg-primary',
  };

  return (
    <span className={cn("relative flex h-2 w-2", className)}>
      <span className={cn(
        "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
        colorClasses[color]
      )} />
      <span className={cn(
        "relative inline-flex rounded-full h-2 w-2",
        colorClasses[color]
      )} />
    </span>
  );
};

// Empty state component
export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon, title, description, action, className }) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 text-center animate-fade-in",
      className
    )}>
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 text-muted-foreground/50">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
      )}
      {action}
    </div>
  );
};
