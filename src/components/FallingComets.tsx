import React, { memo, useMemo } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface CometProps {
  delay: number;
  duration: number;
  startX: number;
  startY: number;
  size: number;
  tailLength: number;
}

const Comet = memo(({ delay, duration, startX, startY, size, tailLength }: CometProps) => (
  <div
    className="absolute pointer-events-none"
    style={{
      left: `${startX}%`,
      top: `${startY}%`,
      animation: `comet-fall ${duration}s linear ${delay}s infinite`,
    }}
  >
    {/* Comet head */}
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'radial-gradient(circle, hsl(330, 100%, 75%) 0%, hsl(330, 100%, 55%) 50%, transparent 70%)',
        boxShadow: `0 0 ${size * 2}px hsl(330, 100%, 55%), 0 0 ${size * 4}px hsl(330, 100%, 45%)`,
      }}
    />
    {/* Comet tail */}
    <div
      className="absolute top-1/2 -translate-y-1/2"
      style={{
        right: size,
        width: tailLength,
        height: size * 0.4,
        background: `linear-gradient(90deg, transparent 0%, hsl(330, 100%, 55%, 0.6) 30%, hsl(280, 80%, 60%, 0.4) 70%, transparent 100%)`,
        borderRadius: '50%',
        filter: `blur(${size * 0.3}px)`,
        transform: 'rotate(45deg)',
        transformOrigin: 'right center',
      }}
    />
  </div>
));

Comet.displayName = 'Comet';

interface FallingCometsProps {
  quantity?: number;
  className?: string;
}

export const FallingComets = memo(({ quantity = 6, className = '' }: FallingCometsProps) => {
  const prefersReducedMotion = useReducedMotion();

  // Generate comet configurations with stable values
  const comets = useMemo(() => {
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };

    return Array.from({ length: quantity }, (_, i) => ({
      id: i,
      delay: seededRandom(i) * 15,
      duration: 3 + seededRandom(i + 10) * 4,
      startX: seededRandom(i + 20) * 100,
      startY: -10 - seededRandom(i + 30) * 20,
      size: 3 + seededRandom(i + 40) * 4,
      tailLength: 40 + seededRandom(i + 50) * 60,
    }));
  }, [quantity]);

  if (prefersReducedMotion) return null;

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
      <style>{`
        @keyframes comet-fall {
          0% {
            transform: translate(0, 0) rotate(45deg);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translate(120vw, 120vh) rotate(45deg);
            opacity: 0;
          }
        }
      `}</style>
      {comets.map((comet) => (
        <Comet
          key={comet.id}
          delay={comet.delay}
          duration={comet.duration}
          startX={comet.startX}
          startY={comet.startY}
          size={comet.size}
          tailLength={comet.tailLength}
        />
      ))}
    </div>
  );
});

FallingComets.displayName = 'FallingComets';