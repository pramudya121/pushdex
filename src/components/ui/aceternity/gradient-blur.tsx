import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientBlurProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  color?: "pink" | "purple" | "mixed";
  animated?: boolean;
}

const sizeClasses = {
  sm: "w-[200px] h-[200px]",
  md: "w-[400px] h-[400px]",
  lg: "w-[600px] h-[600px]",
  xl: "w-[800px] h-[800px]",
};

const colorClasses = {
  pink: "from-pink/30 to-pink-glow/10",
  purple: "from-purple/30 to-purple-glow/10",
  mixed: "from-pink/25 via-purple/20 to-accent/15",
};

export const GradientBlur: React.FC<GradientBlurProps> = ({
  className,
  size = "md",
  color = "mixed",
  animated = true,
}) => {
  return (
    <motion.div
      className={cn(
        "absolute rounded-full blur-[120px] pointer-events-none",
        "bg-gradient-radial",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      animate={
        animated
          ? {
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }
          : undefined
      }
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      aria-hidden="true"
    />
  );
};

// Composable gradient background with multiple orbs
interface GradientBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  className,
  children,
}) => {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <GradientBlur
        size="xl"
        color="pink"
        className="top-[-20%] left-[-10%]"
      />
      <GradientBlur
        size="lg"
        color="purple"
        className="bottom-[-10%] right-[-5%]"
      />
      <GradientBlur
        size="md"
        color="mixed"
        className="top-[40%] right-[20%]"
      />
      {children}
    </div>
  );
};
