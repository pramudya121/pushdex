import * as React from "react";
import { cn } from "@/lib/utils";

interface MovingBorderProps {
  children: React.ReactNode;
  duration?: number;
  className?: string;
  containerClassName?: string;
  borderClassName?: string;
  as?: React.ElementType;
}

export const MovingBorder: React.FC<MovingBorderProps> = ({
  children,
  duration = 2000,
  className,
  containerClassName,
  borderClassName,
  as: Component = "div",
}) => {
  return (
    <Component
      className={cn(
        "relative bg-transparent p-[1px] overflow-hidden",
        containerClassName
      )}
      style={{
        borderRadius: "inherit",
      }}
    >
      {/* Moving gradient border */}
      <div
        className={cn(
          "absolute inset-0",
          borderClassName
        )}
        style={{
          background: "conic-gradient(from var(--angle, 0deg), transparent 0%, hsl(330, 100%, 55%) 10%, hsl(280, 80%, 60%) 20%, transparent 30%)",
          animation: `moving-border ${duration}ms linear infinite`,
        }}
      />
      
      {/* Inner content */}
      <div
        className={cn(
          "relative bg-background rounded-[inherit] z-10",
          className
        )}
      >
        {children}
      </div>
    </Component>
  );
};

// Button variant
interface MovingBorderButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  borderRadius?: string;
  duration?: number;
  borderClassName?: string;
}

export const MovingBorderButton = React.forwardRef<HTMLButtonElement, MovingBorderButtonProps>(
  ({ children, className, borderClassName, duration = 2000, borderRadius = "1.5rem", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex h-12 overflow-hidden p-[1px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
          className
        )}
        style={{ borderRadius }}
        {...props}
      >
        {/* Moving gradient */}
        <span
          className={cn("absolute inset-0", borderClassName)}
          style={{
            background: "conic-gradient(from var(--angle, 0deg), transparent 0%, hsl(330, 100%, 55%) 10%, hsl(280, 80%, 60%) 20%, transparent 30%)",
            animation: `moving-border ${duration}ms linear infinite`,
          }}
        />
        
        {/* Button content */}
        <span
          className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-[inherit] bg-background px-6 py-2 text-sm font-medium text-foreground backdrop-blur-3xl gap-2 hover:bg-surface transition-colors"
          style={{ borderRadius: `calc(${borderRadius} - 1px)` }}
        >
          {children}
        </span>
      </button>
    );
  }
);

MovingBorderButton.displayName = "MovingBorderButton";

// Add moving border animation
const movingBorderStyles = `
@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@keyframes moving-border {
  from {
    --angle: 0deg;
  }
  to {
    --angle: 360deg;
  }
}
`;

if (typeof document !== 'undefined') {
  const styleId = 'moving-border-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = movingBorderStyles;
    document.head.appendChild(styleSheet);
  }
}
