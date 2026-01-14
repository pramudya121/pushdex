import * as React from "react";
import { cn } from "@/lib/utils";

interface BackgroundGradientProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  animate?: boolean;
}

export const BackgroundGradient: React.FC<BackgroundGradientProps> = ({
  children,
  className,
  containerClassName,
  animate = true,
}) => {
  const variants = {
    initial: {
      backgroundPosition: "0 50%",
    },
    animate: {
      backgroundPosition: ["0, 50%", "100% 50%", "0 50%"],
    },
  };

  return (
    <div className={cn("relative p-[4px] group", containerClassName)}>
      <div
        className={cn(
          "absolute inset-0 rounded-3xl z-[1] opacity-60 group-hover:opacity-100 blur-xl transition duration-500",
          animate && "animate-gradient-xy"
        )}
        style={{
          background:
            "linear-gradient(var(--gradient-angle, 0deg), hsl(330, 100%, 55%), hsl(280, 80%, 60%), hsl(330, 100%, 65%), hsl(280, 80%, 70%))",
          backgroundSize: "400% 400%",
        }}
      />
      <div
        className={cn(
          "absolute inset-0 rounded-3xl z-[1]",
          animate && "animate-gradient-xy"
        )}
        style={{
          background:
            "linear-gradient(var(--gradient-angle, 0deg), hsl(330, 100%, 55%), hsl(280, 80%, 60%), hsl(330, 100%, 65%), hsl(280, 80%, 70%))",
          backgroundSize: "400% 400%",
        }}
      />
      <div className={cn("relative z-10 bg-background rounded-[22px]", className)}>
        {children}
      </div>
    </div>
  );
};

// Add gradient animation
const gradientStyles = `
@keyframes gradient-xy {
  0%, 100% {
    background-position: 0% 50%;
    --gradient-angle: 0deg;
  }
  25% {
    --gradient-angle: 90deg;
  }
  50% {
    background-position: 100% 50%;
    --gradient-angle: 180deg;
  }
  75% {
    --gradient-angle: 270deg;
  }
}

.animate-gradient-xy {
  animation: gradient-xy 15s ease infinite;
}
`;

if (typeof document !== 'undefined') {
  const styleId = 'gradient-xy-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = gradientStyles;
    document.head.appendChild(styleSheet);
  }
}
