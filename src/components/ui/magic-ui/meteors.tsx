import * as React from "react";
import { cn } from "@/lib/utils";

interface MeteorsProps {
  number?: number;
  className?: string;
}

export const Meteors: React.FC<MeteorsProps> = ({ number = 20, className }) => {
  const meteors = React.useMemo(() => {
    return Array.from({ length: number }, (_, idx) => ({
      id: idx,
      size: Math.floor(Math.random() * 20) + 10,
      duration: Math.floor(Math.random() * 10) + 5,
      delay: Math.random() * 10,
      position: Math.floor(Math.random() * 100),
    }));
  }, [number]);

  return (
    <>
      {meteors.map((meteor) => (
        <span
          key={meteor.id}
          className={cn(
            "pointer-events-none absolute left-1/2 top-1/2 h-0.5 w-0.5 rotate-[215deg] animate-meteor rounded-[9999px] bg-gradient-to-r from-primary via-pink-glow to-transparent shadow-[0_0_0_1px_#ffffff10]",
            className
          )}
          style={{
            top: 0,
            left: `${meteor.position}%`,
            animationDelay: `${meteor.delay}s`,
            animationDuration: `${meteor.duration}s`,
          }}
        >
          {/* Meteor tail */}
          <div 
            className="pointer-events-none absolute top-1/2 -z-10 h-[1px] -translate-y-1/2 bg-gradient-to-r from-primary/80 to-transparent"
            style={{ width: `${meteor.size * 5}px` }}
          />
        </span>
      ))}
    </>
  );
};

// Add meteor animation
const meteorStyles = `
@keyframes meteor {
  0% {
    transform: rotate(215deg) translateX(0);
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: rotate(215deg) translateX(-500px);
    opacity: 0;
  }
}

.animate-meteor {
  animation: meteor linear infinite;
}
`;

if (typeof document !== 'undefined') {
  const styleId = 'meteor-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = meteorStyles;
    document.head.appendChild(styleSheet);
  }
}
