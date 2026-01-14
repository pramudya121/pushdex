import * as React from "react";
import { cn } from "@/lib/utils";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  children: React.ReactNode;
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = "hsl(330, 100%, 65%)",
      shimmerSize = "0.1em",
      shimmerDuration = "2s",
      borderRadius = "0.875rem",
      background = "hsl(var(--primary))",
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "group relative inline-flex h-11 cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-6 py-2 font-medium text-primary-foreground transition-all duration-300",
          "hover:scale-105 active:scale-95",
          "disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        style={{
          borderRadius,
          background,
        }}
        {...props}
      >
        {/* Shimmer effect */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius }}
        >
          <div
            className="absolute inset-0 animate-shimmer"
            style={{
              background: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)`,
              backgroundSize: "200% 100%",
              animation: `shimmer ${shimmerDuration} linear infinite`,
            }}
          />
        </div>
        
        {/* Glow effect on hover */}
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            borderRadius,
            boxShadow: `0 0 40px ${shimmerColor}`,
          }}
        />
        
        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </button>
    );
  }
);

ShimmerButton.displayName = "ShimmerButton";
