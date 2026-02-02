import React, { useRef, useState, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface HoverGlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  glowIntensity?: number;
  borderRadius?: string;
}

export const HoverGlowCard = memo(({
  children,
  className,
  glowColor = 'hsl(330, 100%, 55%)',
  glowIntensity = 0.15,
  borderRadius = '1rem',
}: HoverGlowCardProps) => {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (prefersReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [prefersReducedMotion]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  return (
    <motion.div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={{ borderRadius }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={prefersReducedMotion ? {} : { y: -4 }}
      transition={{ duration: 0.3 }}
    >
      {/* Glow effect that follows mouse */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute pointer-events-none"
          style={{
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${glowColor.replace(')', `, ${glowIntensity})`)}, transparent 70%)`,
            left: mousePosition.x - 150,
            top: mousePosition.y - 150,
          }}
          animate={{
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1 : 0.8,
          }}
          transition={{ duration: 0.2 }}
        />
      )}
      
      {/* Border glow on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ borderRadius }}
        animate={{
          boxShadow: isHovered 
            ? `0 0 30px ${glowColor.replace(')', ', 0.3)')}, inset 0 0 20px ${glowColor.replace(')', ', 0.05)')}`
            : '0 0 0px transparent',
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
});

HoverGlowCard.displayName = 'HoverGlowCard';
