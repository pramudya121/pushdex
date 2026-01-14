import * as React from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: React.ReactNode;
  vertical?: boolean;
  repeat?: number;
  duration?: string;
  gap?: string;
}

export const Marquee: React.FC<MarqueeProps> = ({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  duration = "40s",
  gap = "1rem",
}) => {
  return (
    <div
      className={cn(
        "group flex overflow-hidden [--gap:1rem]",
        vertical ? "flex-col" : "flex-row",
        className
      )}
      style={{
        ["--duration" as string]: duration,
        ["--gap" as string]: gap,
      }}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex shrink-0 justify-around",
            vertical ? "flex-col animate-marquee-vertical" : "flex-row animate-marquee",
            reverse && (vertical ? "animate-marquee-vertical-reverse" : "animate-marquee-reverse"),
            pauseOnHover && "group-hover:[animation-play-state:paused]"
          )}
          style={{
            gap: `var(--gap)`,
          }}
        >
          {children}
        </div>
      ))}
    </div>
  );
};

// Inject marquee animations
const marqueeStyles = `
@keyframes marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(calc(-100% - var(--gap)));
  }
}

@keyframes marquee-reverse {
  0% {
    transform: translateX(calc(-100% - var(--gap)));
  }
  100% {
    transform: translateX(0);
  }
}

@keyframes marquee-vertical {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(calc(-100% - var(--gap)));
  }
}

@keyframes marquee-vertical-reverse {
  0% {
    transform: translateY(calc(-100% - var(--gap)));
  }
  100% {
    transform: translateY(0);
  }
}

.animate-marquee {
  animation: marquee var(--duration) linear infinite;
}

.animate-marquee-reverse {
  animation: marquee-reverse var(--duration) linear infinite;
}

.animate-marquee-vertical {
  animation: marquee-vertical var(--duration) linear infinite;
}

.animate-marquee-vertical-reverse {
  animation: marquee-vertical-reverse var(--duration) linear infinite;
}
`;

if (typeof document !== 'undefined') {
  const styleId = 'marquee-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = marqueeStyles;
    document.head.appendChild(styleSheet);
  }
}
