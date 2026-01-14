import * as React from "react";
import { cn } from "@/lib/utils";

interface GradientCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "premium" | "glow" | "glass";
  hover?: boolean;
}

export const GradientCard: React.FC<GradientCardProps> = ({
  children,
  className,
  variant = "default",
  hover = true,
}) => {
  const variants = {
    default: "bg-card border-border/50",
    premium: "bg-gradient-to-br from-card via-card to-surface border-border/30",
    glow: "bg-card border-primary/20",
    glass: "bg-card/80 backdrop-blur-xl border-border/40",
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border overflow-hidden transition-all duration-300",
        variants[variant],
        hover && "hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_hsl(330,100%,55%,0.25)]",
        className
      )}
    >
      {/* Top gradient line for premium variant */}
      {variant === "premium" && (
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      )}
      
      {/* Glow effect for glow variant */}
      {variant === "glow" && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      )}
      
      {children}
    </div>
  );
};

// Stat card specifically for PushDex
interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  changeType = "neutral",
  icon,
  className,
}) => {
  const changeColors = {
    positive: "text-success",
    negative: "text-destructive",
    neutral: "text-muted-foreground",
  };

  return (
    <GradientCard variant="glass" className={cn("p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
          {change && (
            <p className={cn("text-sm", changeColors[changeType])}>
              {changeType === "positive" && "+"}
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
    </GradientCard>
  );
};
