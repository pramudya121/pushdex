import * as React from "react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  className,
  children,
  showRadialGradient = true,
}) => {
  return (
    <div
      className={cn(
        "relative flex flex-col h-full w-full items-center justify-center overflow-hidden",
        className
      )}
    >
      <div 
        className="absolute inset-0 overflow-hidden" 
        aria-hidden="true"
      >
        <div
          className={cn(
            `
            [--aurora:repeating-linear-gradient(100deg,var(--pink)_10%,var(--purple)_15%,var(--pink-light)_20%,var(--purple-glow)_25%,var(--pink-glow)_30%)]
            [background-image:var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[10px] invert-0
            after:content-[""] after:absolute after:inset-0 
            after:[background-image:var(--aurora)]
            after:[background-size:200%,_100%]
            after:animate-aurora after:[background-attachment:fixed] 
            after:mix-blend-soft-light
            pointer-events-none
            absolute -inset-[10px] opacity-30 will-change-transform`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]`
          )}
        />
      </div>
      {children}
    </div>
  );
};

// Add aurora animation styles
const auroraStyles = `
@keyframes aurora {
  from {
    background-position: 50% 50%, 50% 50%;
  }
  to {
    background-position: 350% 50%, 350% 50%;
  }
}

.animate-aurora {
  animation: aurora 60s linear infinite;
}
`;

if (typeof document !== 'undefined') {
  const styleId = 'aurora-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = auroraStyles;
    document.head.appendChild(styleSheet);
  }
}
