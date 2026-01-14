import * as React from "react";
import { cn } from "@/lib/utils";

interface TokenBadgeProps {
  symbol: string;
  name?: string;
  icon?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showName?: boolean;
}

export const TokenBadge: React.FC<TokenBadgeProps> = ({
  symbol,
  name,
  icon,
  size = "md",
  className,
  showName = false,
}) => {
  const sizes = {
    sm: { container: "h-6 gap-1.5 px-2 text-xs", icon: "w-4 h-4" },
    md: { container: "h-8 gap-2 px-3 text-sm", icon: "w-5 h-5" },
    lg: { container: "h-10 gap-2.5 px-4 text-base", icon: "w-6 h-6" },
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-surface border border-border/50 font-medium text-foreground",
        sizes[size].container,
        className
      )}
    >
      {icon && (
        <img
          src={icon}
          alt={symbol}
          className={cn("rounded-full object-cover", sizes[size].icon)}
          onError={(e) => {
            e.currentTarget.src = "/tokens/pc.png";
          }}
        />
      )}
      <span>{symbol}</span>
      {showName && name && (
        <span className="text-muted-foreground">({name})</span>
      )}
    </div>
  );
};

// Token pair badge for LP tokens
interface TokenPairBadgeProps {
  token0: { symbol: string; icon?: string };
  token1: { symbol: string; icon?: string };
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const TokenPairBadge: React.FC<TokenPairBadgeProps> = ({
  token0,
  token1,
  size = "md",
  className,
}) => {
  const sizes = {
    sm: { container: "h-6 gap-1 px-2 text-xs", icon: "w-4 h-4", overlap: "-ml-1.5" },
    md: { container: "h-8 gap-2 px-3 text-sm", icon: "w-5 h-5", overlap: "-ml-2" },
    lg: { container: "h-10 gap-2.5 px-4 text-base", icon: "w-6 h-6", overlap: "-ml-2.5" },
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-surface border border-border/50 font-medium text-foreground",
        sizes[size].container,
        className
      )}
    >
      <div className="flex items-center">
        {token0.icon && (
          <img
            src={token0.icon}
            alt={token0.symbol}
            className={cn("rounded-full object-cover ring-2 ring-surface", sizes[size].icon)}
            onError={(e) => {
              e.currentTarget.src = "/tokens/pc.png";
            }}
          />
        )}
        {token1.icon && (
          <img
            src={token1.icon}
            alt={token1.symbol}
            className={cn(
              "rounded-full object-cover ring-2 ring-surface",
              sizes[size].icon,
              sizes[size].overlap
            )}
            onError={(e) => {
              e.currentTarget.src = "/tokens/pc.png";
            }}
          />
        )}
      </div>
      <span>
        {token0.symbol}/{token1.symbol}
      </span>
    </div>
  );
};

// APR badge
interface APRBadgeProps {
  apr: number | string;
  boosted?: boolean;
  className?: string;
}

export const APRBadge: React.FC<APRBadgeProps> = ({ apr, boosted = false, className }) => {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-semibold",
        boosted
          ? "bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/30"
          : "bg-success/10 text-success border border-success/20",
        className
      )}
    >
      {boosted && (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )}
      <span>{typeof apr === "number" ? apr.toFixed(2) : apr}% APR</span>
    </div>
  );
};
