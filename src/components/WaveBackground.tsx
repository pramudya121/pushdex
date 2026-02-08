import React, { memo } from 'react';
import { FallingComets } from './FallingComets';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export const WaveBackground: React.FC<{ className?: string; showComets?: boolean }> = memo(({ className = '', showComets = true }) => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-dark" />
      
      {/* Mesh gradient overlay - optimized with will-change */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          willChange: 'opacity',
          background: `
            radial-gradient(ellipse 100% 80% at 10% 20%, hsl(330, 100%, 55%, 0.18), transparent 50%),
            radial-gradient(ellipse 80% 60% at 90% 30%, hsl(280, 80%, 60%, 0.12), transparent 50%),
            radial-gradient(ellipse 120% 80% at 50% 120%, hsl(330, 100%, 50%, 0.15), transparent 50%)
          `
        }}
      />
      
      {/* Falling Comets - global animation */}
      {showComets && <FallingComets quantity={6} />}
      
      {/* Animated wave layers - optimized with transform3d for GPU acceleration */}
      {!prefersReducedMotion && (
        <>
          <svg
            className="absolute bottom-0 left-0 w-[200%] h-[60%] opacity-25"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ willChange: 'transform' }}
          >
            <defs>
              <linearGradient id="wave1Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(330, 100%, 55%)" stopOpacity="0.4" />
                <stop offset="50%" stopColor="hsl(280, 80%, 60%)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="hsl(330, 100%, 45%)" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path
              className="animate-wave"
              fill="url(#wave1Gradient)"
              d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,181.3C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
          
          <svg
            className="absolute bottom-0 left-0 w-[200%] h-[50%] opacity-18"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ willChange: 'transform' }}
          >
            <defs>
              <linearGradient id="wave2Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(280, 80%, 60%)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="hsl(330, 100%, 55%)" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path
              className="animate-wave"
              style={{ animationDelay: '-7s' }}
              fill="url(#wave2Gradient)"
              d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,106.7C672,117,768,171,864,181.3C960,192,1056,160,1152,138.7C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>

          <svg
            className="absolute bottom-0 left-0 w-[200%] h-[40%] opacity-12"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            style={{ willChange: 'transform' }}
          >
            <defs>
              <linearGradient id="wave3Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(330, 100%, 65%)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="hsl(280, 80%, 55%)" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path
              className="animate-wave"
              style={{ animationDelay: '-14s' }}
              fill="url(#wave3Gradient)"
              d="M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,197.3C672,213,768,235,864,234.7C960,235,1056,213,1152,197.3C1248,181,1344,171,1392,165.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
        </>
      )}

      {/* Glow orbs with purple accent - reduced for performance */}
      <div 
        className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20"
        style={{ 
          background: 'radial-gradient(circle, hsl(330, 100%, 55%) 0%, transparent 70%)',
          willChange: 'opacity'
        }}
      />
      <div 
        className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full blur-[90px] opacity-15"
        style={{ 
          background: 'radial-gradient(circle, hsl(280, 80%, 60%) 0%, transparent 70%)',
          willChange: 'opacity'
        }}
      />
    </div>
  );
});

WaveBackground.displayName = 'WaveBackground';
