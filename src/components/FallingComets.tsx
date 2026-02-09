import React, { memo, useMemo } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ShootingStarProps {
  delay: number;
  duration: number;
  startX: number;
  startY: number;
  size: number;
  tailLength: number;
  angle: number;
  color: string;
}

const ShootingStar = memo(({ delay, duration, startX, startY, size, tailLength, angle, color }: ShootingStarProps) => {
  const id = useMemo(() => `star-${Math.random().toString(36).slice(2, 8)}`, []);
  
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${startX}%`,
        top: `${startY}%`,
        animation: `shooting-star-fly ${duration}s ease-in ${delay}s infinite`,
        transform: `rotate(${angle}deg)`,
      }}
    >
      <svg
        width={tailLength + size * 3}
        height={size * 6}
        viewBox={`0 0 ${tailLength + size * 3} ${size * 6}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Tail gradient */}
          <linearGradient id={`tail-${id}`} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="20%" stopColor={color} stopOpacity="0.05" />
            <stop offset="60%" stopColor={color} stopOpacity="0.3" />
            <stop offset="85%" stopColor={color} stopOpacity="0.7" />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </linearGradient>
          {/* Head glow */}
          <radialGradient id={`glow-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="30%" stopColor={color} stopOpacity="0.9" />
            <stop offset="70%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
          {/* Sparkle filter */}
          <filter id={`sparkle-${id}`}>
            <feGaussianBlur in="SourceGraphic" stdDeviation={size * 0.3} />
          </filter>
        </defs>
        
        {/* Main tail - thin streak */}
        <line
          x1={0}
          y1={size * 3}
          x2={tailLength}
          y2={size * 3}
          stroke={`url(#tail-${id})`}
          strokeWidth={size * 0.5}
          strokeLinecap="round"
        />
        
        {/* Secondary tail - wider glow */}
        <line
          x1={tailLength * 0.3}
          y1={size * 3}
          x2={tailLength}
          y2={size * 3}
          stroke={`url(#tail-${id})`}
          strokeWidth={size * 1.5}
          strokeLinecap="round"
          opacity="0.3"
          filter={`url(#sparkle-${id})`}
        />
        
        {/* Star head - bright point */}
        <circle
          cx={tailLength + size}
          cy={size * 3}
          r={size * 0.8}
          fill={`url(#glow-${id})`}
        />
        
        {/* Inner bright core */}
        <circle
          cx={tailLength + size}
          cy={size * 3}
          r={size * 0.3}
          fill="white"
          opacity="0.95"
        />
        
        {/* Outer glow halo */}
        <circle
          cx={tailLength + size}
          cy={size * 3}
          r={size * 2.5}
          fill={`url(#glow-${id})`}
          opacity="0.25"
          filter={`url(#sparkle-${id})`}
        />
        
        {/* Cross-sparkle effect at head */}
        <line
          x1={tailLength + size - size * 1.2}
          y1={size * 3}
          x2={tailLength + size + size * 1.2}
          y2={size * 3}
          stroke="white"
          strokeWidth={size * 0.15}
          opacity="0.6"
        />
        <line
          x1={tailLength + size}
          y1={size * 3 - size * 1.2}
          x2={tailLength + size}
          y2={size * 3 + size * 1.2}
          stroke="white"
          strokeWidth={size * 0.15}
          opacity="0.6"
        />
      </svg>
    </div>
  );
});

ShootingStar.displayName = 'ShootingStar';

// Mini sparkle particles that trail behind
const TrailSparkle = memo(({ delay, x, y, angle }: { delay: number; x: number; y: number; angle: number }) => (
  <div
    className="absolute pointer-events-none"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      animation: `sparkle-trail ${2 + Math.random() * 2}s ease-out ${delay + 0.5 + Math.random() * 1.5}s infinite`,
      transform: `rotate(${angle}deg)`,
    }}
  >
    <div
      className="w-1 h-1 rounded-full bg-white"
      style={{
        boxShadow: '0 0 4px 1px hsl(330, 100%, 70%), 0 0 8px 2px hsl(330, 100%, 55%)',
      }}
    />
  </div>
));

TrailSparkle.displayName = 'TrailSparkle';

interface FallingCometsProps {
  quantity?: number;
  className?: string;
}

const STAR_COLORS = [
  'hsl(330, 100%, 70%)',   // Pink
  'hsl(280, 80%, 70%)',    // Purple  
  'hsl(200, 90%, 75%)',    // Cyan-blue
  'hsl(45, 100%, 80%)',    // Gold
  'hsl(330, 100%, 60%)',   // Hot pink
];

export const FallingComets = memo(({ quantity = 6, className = '' }: FallingCometsProps) => {
  const prefersReducedMotion = useReducedMotion();

  const stars = useMemo(() => {
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };

    return Array.from({ length: quantity }, (_, i) => ({
      id: i,
      delay: seededRandom(i) * 12 + i * 2,
      duration: 1.5 + seededRandom(i + 10) * 2,
      startX: seededRandom(i + 20) * 80 + 10,
      startY: -5 - seededRandom(i + 30) * 15,
      size: 2.5 + seededRandom(i + 40) * 3,
      tailLength: 60 + seededRandom(i + 50) * 80,
      angle: 25 + seededRandom(i + 60) * 30, // 25-55 degrees
      color: STAR_COLORS[i % STAR_COLORS.length],
    }));
  }, [quantity]);

  const sparkles = useMemo(() => {
    return stars.flatMap((star, i) =>
      Array.from({ length: 3 }, (_, j) => ({
        id: `${i}-${j}`,
        delay: star.delay,
        x: star.startX + j * 3,
        y: star.startY + j * 2,
        angle: star.angle,
      }))
    );
  }, [stars]);

  if (prefersReducedMotion) return null;

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
      <style>{`
        @keyframes shooting-star-fly {
          0% {
            transform: rotate(var(--angle, 35deg)) translate(0, 0);
            opacity: 0;
          }
          3% {
            opacity: 0.4;
          }
          8% {
            opacity: 1;
          }
          70% {
            opacity: 0.8;
          }
          100% {
            transform: rotate(var(--angle, 35deg)) translate(min(100vw, 1200px), min(80vh, 900px));
            opacity: 0;
          }
        }
        
        @keyframes sparkle-trail {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          20% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0) translate(30px, 20px);
          }
        }
      `}</style>
      
      {stars.map((star) => (
        <ShootingStar
          key={star.id}
          delay={star.delay}
          duration={star.duration}
          startX={star.startX}
          startY={star.startY}
          size={star.size}
          tailLength={star.tailLength}
          angle={star.angle}
          color={star.color}
        />
      ))}
      
      {sparkles.map((sparkle) => (
        <TrailSparkle
          key={sparkle.id}
          delay={sparkle.delay}
          x={sparkle.x}
          y={sparkle.y}
          angle={sparkle.angle}
        />
      ))}
    </div>
  );
});

FallingComets.displayName = 'FallingComets';
