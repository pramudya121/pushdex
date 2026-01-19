import React, { memo } from 'react';
import { cn } from '@/lib/utils';

interface ShimmerSkeletonProps {
  className?: string;
  variant?: 'card' | 'stat' | 'chart' | 'row' | 'avatar' | 'text';
}

interface ShimmerBaseProps {
  className?: string;
  style?: React.CSSProperties;
}

const ShimmerBase = memo(({ className, style }: ShimmerBaseProps) => (
  <div 
    className={cn(
      "relative overflow-hidden bg-muted/30 rounded-lg",
      "before:absolute before:inset-0",
      "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
      "before:animate-shimmer before:-translate-x-full",
      className
    )}
    style={style}
  />
));

ShimmerBase.displayName = 'ShimmerBase';

export const ShimmerSkeleton: React.FC<ShimmerSkeletonProps> = memo(({ 
  className,
  variant = 'card' 
}) => {
  switch (variant) {
    case 'stat':
      return (
        <div className={cn("p-4 rounded-xl bg-card/60 border border-border/30 space-y-3", className)}>
          <ShimmerBase className="h-4 w-20" />
          <ShimmerBase className="h-8 w-28" />
          <ShimmerBase className="h-3 w-16" />
        </div>
      );
    
    case 'chart':
      return (
        <div className={cn("p-4 rounded-xl bg-card/60 border border-border/30 space-y-4", className)}>
          <div className="flex justify-between items-center">
            <ShimmerBase className="h-5 w-32" />
            <ShimmerBase className="h-8 w-24" />
          </div>
          <div className="flex items-end gap-2 h-32">
            {[40, 60, 45, 80, 55, 70, 50, 65, 75, 60, 85, 70].map((height, i) => (
              <ShimmerBase 
                key={i} 
                className="flex-1 rounded-t-sm"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      );
    
    case 'row':
      return (
        <div className={cn("flex items-center gap-4 p-4 rounded-xl bg-card/60 border border-border/30", className)}>
          <ShimmerBase className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <ShimmerBase className="h-4 w-3/4" />
            <ShimmerBase className="h-3 w-1/2" />
          </div>
          <ShimmerBase className="h-8 w-20" />
        </div>
      );
    
    case 'avatar':
      return <ShimmerBase className={cn("w-10 h-10 rounded-full", className)} />;
    
    case 'text':
      return (
        <div className={cn("space-y-2", className)}>
          <ShimmerBase className="h-4 w-full" />
          <ShimmerBase className="h-4 w-4/5" />
          <ShimmerBase className="h-4 w-3/5" />
        </div>
      );
    
    case 'card':
    default:
      return (
        <div className={cn("p-6 rounded-xl bg-card/60 border border-border/30 space-y-4", className)}>
          <div className="flex items-center gap-3">
            <ShimmerBase className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <ShimmerBase className="h-5 w-32" />
              <ShimmerBase className="h-3 w-20" />
            </div>
          </div>
          <ShimmerBase className="h-20 w-full rounded-lg" />
          <div className="flex gap-3">
            <ShimmerBase className="h-10 flex-1" />
            <ShimmerBase className="h-10 flex-1" />
          </div>
        </div>
      );
  }
});

ShimmerSkeleton.displayName = 'ShimmerSkeleton';

// Multiple skeleton loader for lists
export const ShimmerSkeletonList: React.FC<{
  count?: number;
  variant?: ShimmerSkeletonProps['variant'];
  className?: string;
}> = memo(({ count = 3, variant = 'card', className }) => (
  <div className={cn("space-y-4", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <ShimmerSkeleton key={i} variant={variant} />
    ))}
  </div>
));

ShimmerSkeletonList.displayName = 'ShimmerSkeletonList';

// Add shimmer animation
const shimmerStyles = `
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
`;

if (typeof document !== 'undefined') {
  const styleId = 'shimmer-skeleton-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = shimmerStyles;
    document.head.appendChild(styleSheet);
  }
}
