import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'fade' | 'slide' | 'scale' | 'slideUp';
}

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.02 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },
};

// Reduced motion variants (simple fade only)
const reducedVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  scale: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
};

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
  variant = 'slideUp',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const currentVariants = prefersReducedMotion ? reducedVariants : variants;
  const variantConfig = currentVariants[variant];
  
  return (
    <motion.div
      initial={variantConfig.initial}
      animate={variantConfig.animate}
      exit={variantConfig.exit}
      transition={{
        duration: prefersReducedMotion ? 0.15 : 0.35,
        ease: [0.22, 1, 0.36, 1], // Custom easing for smooth feel
      }}
      className={cn("w-full", className)}
    >
      {children}
    </motion.div>
  );
};

// Staggered children animation wrapper
export interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className,
  staggerDelay = 0.1,
  initialDelay = 0,
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className={className}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: prefersReducedMotion ? 0 : staggerDelay,
            delayChildren: prefersReducedMotion ? 0 : initialDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

// Staggered child item
export interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { 
          opacity: 0, 
          y: prefersReducedMotion ? 0 : 20 
        },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: prefersReducedMotion ? 0.15 : 0.4,
            ease: [0.22, 1, 0.36, 1],
          }
        },
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
