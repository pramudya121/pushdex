import * as React from "react";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "glow";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, variant = "primary", size = "md", loading, icon, children, disabled, ...props }, ref) => {
    const variants = {
      primary: "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-[0_0_40px_hsl(330,100%,55%,0.4)]",
      secondary: "bg-surface border border-border text-foreground hover:bg-surface-hover hover:border-primary/30",
      ghost: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-surface",
      glow: "bg-primary text-primary-foreground relative overflow-hidden",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-6 text-sm",
      lg: "h-14 px-8 text-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-300",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          "active:scale-95",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {/* Glow effect for glow variant */}
        {variant === "glow" && (
          <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-[-2px] rounded-xl bg-gradient-to-r from-primary via-accent to-primary animate-gradient-flow blur-md" />
          </div>
        )}

        {/* Loading spinner */}
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* Icon */}
        {!loading && icon && <span className="flex-shrink-0">{icon}</span>}

        {/* Content */}
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

// Icon button variant
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", size = "md", children, ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-surface border border-border text-foreground hover:bg-surface-hover",
      ghost: "text-muted-foreground hover:text-foreground hover:bg-surface",
    };

    const sizes = {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-12 w-12",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50",
          "active:scale-95",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
