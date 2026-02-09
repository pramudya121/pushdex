import * as React from "react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

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
  mobileClassName,
}) => {
  const location = useLocation();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const activeRef = React.useRef<HTMLAnchorElement>(null);

  // Auto-scroll to active item on mount/route change
  React.useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const active = activeRef.current;
      const scrollLeft = active.offsetLeft - container.offsetWidth / 2 + active.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [location.pathname]);

  return (
    <nav
      ref={scrollRef}
      className={cn(
        "flex items-center gap-0.5 px-1.5 py-1.5 rounded-2xl",
        "bg-card/95 backdrop-blur-xl border border-border/50",
        "shadow-xl shadow-black/25",
        "overflow-x-auto scrollbar-hide snap-x snap-mandatory",
        "-webkit-overflow-scrolling-touch",
        className,
        mobileClassName
      )}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {items.map((item, idx) => {
        const isActive = item.href === location.pathname;
        
        return (
          <Link
            key={idx}
            ref={isActive ? activeRef : undefined}
            to={item.href || "/"}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all duration-200",
              "snap-center flex-shrink-0",
              "min-w-[48px] px-2.5 py-1.5",
              "active:scale-90 touch-manipulation",
              isActive
                ? "bg-primary/15 text-primary shadow-sm shadow-primary/10"
                : "text-muted-foreground hover:text-foreground active:bg-surface/60"
            )}
          >
            <motion.div 
              className="w-5 h-5"
              animate={isActive ? { scale: 1.15, y: -1 } : { scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              {item.icon}
            </motion.div>
            <span className={cn(
              "text-[9px] font-medium leading-none whitespace-nowrap",
              isActive && "text-primary font-semibold"
            )}>
              {item.title}
            </span>
            {isActive && (
              <motion.div
                layoutId="dock-indicator"
                className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
};
