import * as React from "react";
import { cn } from "@/lib/utils";

interface NumberTickerProps {
  value: number;
  direction?: "up" | "down";
  delay?: number;
  className?: string;
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
}

export const NumberTicker: React.FC<NumberTickerProps> = ({
  value,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  prefix = "",
  suffix = "",
}) => {
  const [displayValue, setDisplayValue] = React.useState(direction === "up" ? 0 : value);
  const [hasAnimated, setHasAnimated] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          
          const timeout = setTimeout(() => {
            const startValue = direction === "up" ? 0 : value;
            const endValue = direction === "up" ? value : 0;
            const duration = 2000;
            const startTime = performance.now();

            const animate = (currentTime: number) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              
              // Easing function (ease-out cubic)
              const easeOut = 1 - Math.pow(1 - progress, 3);
              
              const currentValue = startValue + (endValue - startValue) * easeOut;
              setDisplayValue(currentValue);

              if (progress < 1) {
                requestAnimationFrame(animate);
              }
            };

            requestAnimationFrame(animate);
          }, delay);

          return () => clearTimeout(timeout);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, direction, delay, hasAnimated]);

  const formattedValue = React.useMemo(() => {
    const num = displayValue.toFixed(decimalPlaces);
    // Add thousand separators
    const parts = num.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }, [displayValue, decimalPlaces]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
};
