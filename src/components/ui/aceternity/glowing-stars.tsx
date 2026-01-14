import * as React from "react";
import { cn } from "@/lib/utils";

interface GlowingStarsProps {
  className?: string;
  quantity?: number;
}

export const GlowingStars: React.FC<GlowingStarsProps> = ({
  className,
  quantity = 50,
}) => {
  const stars = React.useMemo(() => {
    return Array.from({ length: quantity }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 3,
    }));
  }, [quantity]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full animate-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            background: `radial-gradient(circle, hsl(330, 100%, 75%) 0%, hsl(330, 100%, 55%) 50%, transparent 100%)`,
            boxShadow: `0 0 ${star.size * 3}px hsl(330, 100%, 55%, 0.6)`,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

interface GlowingStarsBackgroundCardProps {
  children: React.ReactNode;
  className?: string;
}

export const GlowingStarsBackgroundCard: React.FC<GlowingStarsBackgroundCardProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn("relative bg-card rounded-2xl border border-border/50 overflow-hidden", className)}>
      <GlowingStars quantity={30} />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

// Add twinkle animation
const twinkleStyles = `
@keyframes twinkle {
  0%, 100% {
    opacity: 0.2;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.animate-twinkle {
  animation: twinkle ease-in-out infinite;
}
`;

if (typeof document !== 'undefined') {
  const styleId = 'twinkle-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = twinkleStyles;
    document.head.appendChild(styleSheet);
  }
}
