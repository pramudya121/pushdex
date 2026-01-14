import * as React from "react";
import { cn } from "@/lib/utils";

interface HoverEffectProps {
  items: {
    title: string;
    description: string;
    link?: string;
    icon?: React.ReactNode;
  }[];
  className?: string;
}

export const HoverEffect: React.FC<HoverEffectProps> = ({ items, className }) => {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {items.map((item, idx) => (
        <div
          key={idx}
          className="relative group block p-2 h-full w-full"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Hover background */}
          <div
            className={cn(
              "absolute inset-0 h-full w-full bg-primary/10 rounded-3xl transition-all duration-300",
              hoveredIndex === idx ? "opacity-100 scale-100" : "opacity-0 scale-95"
            )}
          />
          
          {/* Card */}
          <Card>
            <div className="flex items-start gap-4">
              {item.icon && (
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  {item.icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "relative z-20 h-full w-full p-6 overflow-hidden bg-card border border-border/50 rounded-2xl group-hover:border-primary/30 transition-all duration-300",
        className
      )}
    >
      <div className="relative z-50">{children}</div>
      
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};

const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <h4 className={cn("text-foreground font-semibold tracking-wide", className)}>
      {children}
    </h4>
  );
};

const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <p className={cn("mt-2 text-muted-foreground text-sm leading-relaxed", className)}>
      {children}
    </p>
  );
};

export { Card, CardTitle, CardDescription };
