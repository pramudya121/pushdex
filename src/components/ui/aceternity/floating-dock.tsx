import * as React from "react";
import { cn } from "@/lib/utils";

interface FloatingDockProps {
  items: {
    title: string;
    icon: React.ReactNode;
    href?: string;
    onClick?: () => void;
  }[];
  className?: string;
  desktopClassName?: string;
  mobileClassName?: string;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({
  items,
  className,
  desktopClassName,
  mobileClassName,
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={cn(className, desktopClassName)} />
      <FloatingDockMobile items={items} className={cn(className, mobileClassName)} />
    </>
  );
};

const FloatingDockDesktop: React.FC<{
  items: FloatingDockProps["items"];
  className?: string;
}> = ({ items, className }) => {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  return (
    <div
      className={cn(
        "hidden md:flex mx-auto h-16 gap-4 items-end rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 px-4 pb-3",
        className
      )}
    >
      {items.map((item, idx) => (
        <DockIcon
          key={idx}
          item={item}
          isHovered={hoveredIndex === idx}
          onHover={() => setHoveredIndex(idx)}
          onLeave={() => setHoveredIndex(null)}
        />
      ))}
    </div>
  );
};

const FloatingDockMobile: React.FC<{
  items: FloatingDockProps["items"];
  className?: string;
}> = ({ items, className }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("relative block md:hidden", className)}>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg"
      >
        <svg
          className={cn("w-5 h-5 transition-transform duration-300", open && "rotate-45")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Mobile Menu */}
      <div
        className={cn(
          "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex flex-col gap-2 transition-all duration-300",
          open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        {items.map((item, idx) => (
          <button
            key={idx}
            onClick={item.onClick}
            className="h-10 w-10 rounded-full bg-card border border-border/50 flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

const DockIcon: React.FC<{
  item: FloatingDockProps["items"][0];
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}> = ({ item, isHovered, onHover, onLeave }) => {
  const Wrapper = item.href ? "a" : "button";

  return (
    <Wrapper
      href={item.href}
      onClick={item.onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="relative flex items-center justify-center group"
    >
      {/* Tooltip */}
      <div
        className={cn(
          "absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-card border border-border text-sm whitespace-nowrap transition-all duration-200",
          isHovered ? "opacity-100 -translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        )}
      >
        {item.title}
      </div>

      {/* Icon */}
      <div
        className={cn(
          "flex items-center justify-center rounded-full transition-all duration-300",
          isHovered
            ? "w-12 h-12 bg-primary text-primary-foreground shadow-lg shadow-primary/30"
            : "w-10 h-10 bg-surface hover:bg-surface-hover text-muted-foreground"
        )}
      >
        <div className={cn("transition-transform", isHovered && "scale-110")}>
          {item.icon}
        </div>
      </div>
    </Wrapper>
  );
};
