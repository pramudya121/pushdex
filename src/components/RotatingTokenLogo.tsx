import React, { memo } from 'react';
import { cn } from '@/lib/utils';

interface RotatingTokenLogoProps {
  logo?: string;
  size?: number;
  className?: string;
}

export const RotatingTokenLogo: React.FC<RotatingTokenLogoProps> = memo(({
  logo = '/tokens/psdx.png',
  size = 120,
  className,
}) => {
  return (
    <div 
      className={cn(
        "relative perspective-1000",
        className
      )}
      style={{ 
        width: size, 
        height: size,
        perspective: '1000px',
      }}
    >
      {/* Glow effect */}
      <div 
        className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-accent to-primary opacity-40 blur-xl animate-pulse"
        style={{ transform: 'scale(1.2)' }}
      />
      
      {/* Rotating container */}
      <div 
        className="relative w-full h-full animate-rotate-3d"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Front face */}
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-br from-card via-surface to-card border border-border/40 shadow-2xl flex items-center justify-center overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
          }}
        >
          <img 
            src={logo} 
            alt="Token"
            className="w-3/4 h-3/4 object-contain"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>
        
        {/* Back face */}
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 border border-primary/40 shadow-2xl flex items-center justify-center"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="text-primary font-bold text-2xl">PUSH</div>
        </div>
      </div>
      
      {/* Orbit ring */}
      <div 
        className="absolute inset-[-10%] rounded-full border border-primary/20 animate-spin-slow"
        style={{
          animationDuration: '8s',
        }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50" />
      </div>
    </div>
  );
});

RotatingTokenLogo.displayName = 'RotatingTokenLogo';

// Add 3D rotation animation styles
const rotatingStyles = `
@keyframes rotate-3d {
  0% {
    transform: rotateY(0deg) rotateX(10deg);
  }
  50% {
    transform: rotateY(180deg) rotateX(-10deg);
  }
  100% {
    transform: rotateY(360deg) rotateX(10deg);
  }
}

.animate-rotate-3d {
  animation: rotate-3d 6s ease-in-out infinite;
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 8s linear infinite;
}

.perspective-1000 {
  perspective: 1000px;
}
`;

if (typeof document !== 'undefined') {
  const styleId = 'rotating-token-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = rotatingStyles;
    document.head.appendChild(styleSheet);
  }
}
