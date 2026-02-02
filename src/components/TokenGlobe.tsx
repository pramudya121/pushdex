import React, { useRef, useMemo, memo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { TOKEN_LIST } from '@/config/contracts';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface OrbitingTokenProps {
  token: typeof TOKEN_LIST[0];
  index: number;
  total: number;
  orbitRadius: number;
  duration: number;
  delay: number;
}

const OrbitingToken = memo(({ token, index, total, orbitRadius, duration, delay }: OrbitingTokenProps) => {
  const angle = (index / total) * 360;
  
  return (
    <motion.div
      className="absolute"
      style={{
        width: 32,
        height: 32,
        left: '50%',
        top: '50%',
        marginLeft: -16,
        marginTop: -16,
      }}
      animate={{
        rotate: [angle, angle + 360],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
        delay,
      }}
    >
      <motion.div
        style={{
          transform: `translateX(${orbitRadius}px)`,
        }}
        whileHover={{ scale: 1.3, zIndex: 10 }}
        className="relative group"
      >
        <img
          src={token.logo}
          alt={token.symbol}
          className="w-8 h-8 rounded-full shadow-lg border-2 border-border/50 bg-card transition-all duration-300 group-hover:border-primary group-hover:shadow-primary/30"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
        {/* Tooltip */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
          <div className="bg-card/95 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-md border border-border/50 whitespace-nowrap shadow-lg">
            {token.symbol}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

OrbitingToken.displayName = 'OrbitingToken';

interface TokenGlobeProps {
  className?: string;
  size?: number;
}

export const TokenGlobe = memo(({ className = '', size = 280 }: TokenGlobeProps) => {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mouse tracking for 3D effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(mouseY, [-200, 200], [15, -15]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-15, 15]), { stiffness: 150, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (prefersReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const tokens = useMemo(() => TOKEN_LIST.slice(0, 8), []);
  const innerOrbit = useMemo(() => size * 0.32, [size]);
  const outerOrbit = useMemo(() => size * 0.45, [size]);

  if (prefersReducedMotion) {
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        {/* Static globe for reduced motion */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 border border-border/30" />
        <div className="absolute inset-[15%] rounded-full bg-gradient-to-br from-card via-surface to-card border border-border/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-4 gap-2 p-4">
            {tokens.slice(0, 4).map((token) => (
              <img
                key={token.symbol}
                src={token.logo}
                alt={token.symbol}
                className="w-8 h-8 rounded-full border border-border/50"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ 
        width: size, 
        height: size,
        perspective: 1000,
        rotateX,
        rotateY,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Outer glow */}
      <div 
        className="absolute inset-[-20%] rounded-full blur-3xl opacity-30 animate-pulse"
        style={{ background: 'radial-gradient(circle, hsl(330, 100%, 55%) 0%, transparent 70%)' }}
      />
      
      {/* Globe surface */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 30% 20%, hsl(330, 100%, 65%, 0.25), transparent 50%),
            radial-gradient(ellipse 60% 40% at 70% 80%, hsl(280, 80%, 60%, 0.15), transparent 50%),
            linear-gradient(180deg, hsl(240, 10%, 8%), hsl(240, 10%, 5%))
          `,
          boxShadow: 'inset 0 0 60px hsl(330, 100%, 55%, 0.15), 0 0 40px hsl(330, 100%, 55%, 0.1)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      />

      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(330, 100%, 55%)" />
            <stop offset="100%" stopColor="hsl(280, 80%, 60%)" />
          </linearGradient>
        </defs>
        {/* Latitude lines */}
        {[25, 50, 75].map((y) => (
          <ellipse
            key={`lat-${y}`}
            cx="50"
            cy={y}
            rx={40 - Math.abs(50 - y) * 0.6}
            ry="5"
            fill="none"
            stroke="url(#gridGradient)"
            strokeWidth="0.3"
          />
        ))}
        {/* Longitude lines */}
        {[0, 45, 90, 135].map((angle) => (
          <ellipse
            key={`lon-${angle}`}
            cx="50"
            cy="50"
            rx="8"
            ry="40"
            fill="none"
            stroke="url(#gridGradient)"
            strokeWidth="0.3"
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
      </svg>

      {/* Inner core glow */}
      <div className="absolute inset-[35%] rounded-full bg-gradient-to-br from-primary/30 via-accent/20 to-transparent blur-md" />

      {/* Orbit rings */}
      <div 
        className="absolute rounded-full border border-primary/20"
        style={{
          left: '50%',
          top: '50%',
          width: innerOrbit * 2,
          height: innerOrbit * 2,
          marginLeft: -innerOrbit,
          marginTop: -innerOrbit,
        }}
      />
      <div 
        className="absolute rounded-full border border-accent/15"
        style={{
          left: '50%',
          top: '50%',
          width: outerOrbit * 2,
          height: outerOrbit * 2,
          marginLeft: -outerOrbit,
          marginTop: -outerOrbit,
        }}
      />

      {/* Inner orbit tokens */}
      {tokens.slice(0, 4).map((token, index) => (
        <OrbitingToken
          key={token.symbol}
          token={token}
          index={index}
          total={4}
          orbitRadius={innerOrbit}
          duration={20}
          delay={index * 0.5}
        />
      ))}

      {/* Outer orbit tokens */}
      {tokens.slice(4, 8).map((token, index) => (
        <OrbitingToken
          key={token.symbol}
          token={token}
          index={index}
          total={4}
          orbitRadius={outerOrbit}
          duration={30}
          delay={index * 0.7}
        />
      ))}

      {/* Center highlight */}
      <div className="absolute inset-[42%] rounded-full bg-gradient-to-br from-primary/40 to-accent/20 blur-sm" />
    </motion.div>
  );
});

TokenGlobe.displayName = 'TokenGlobe';
