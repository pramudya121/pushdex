import * as React from "react";
import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  className,
  size = 200,
  duration = 15,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = "hsl(330, 100%, 55%)",
  colorTo = "hsl(280, 80%, 60%)",
  delay = 0,
}) => {
  return (
    <div
      style={{
        ["--size" as string]: size,
        ["--duration" as string]: duration,
        ["--anchor" as string]: anchor,
        ["--border-width" as string]: borderWidth,
        ["--color-from" as string]: colorFrom,
        ["--color-to" as string]: colorTo,
        ["--delay" as string]: `-${delay}s`,
      }}
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
        // Mask styles
        "![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        // Pseudo element with the beam effect
        "after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:animate-border-beam after:[animation-delay:var(--delay)] after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] after:[offset-anchor:calc(var(--anchor)*1%)_50%] after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]",
        className
      )}
    />
  );
};

// Add border beam animation
const borderBeamStyles = `
@keyframes border-beam {
  0% {
    offset-distance: 0%;
  }
  100% {
    offset-distance: 100%;
  }
}

.animate-border-beam {
  animation: border-beam calc(var(--duration)*1s) infinite linear;
}
`;

if (typeof document !== 'undefined') {
  const styleId = 'border-beam-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = borderBeamStyles;
    document.head.appendChild(styleSheet);
  }
}
