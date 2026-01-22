import * as React from "react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";

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

  return (
    <nav
      className={cn(
        "flex items-center gap-1 px-2 py-2 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/20",
        className,
        mobileClassName
      )}
    >
      {items.map((item, idx) => {
        const isActive = item.href === location.pathname;
        
        return (
          <Link
            key={idx}
            to={item.href || "/"}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[52px]",
              isActive
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
            )}
          >
            <div className={cn(
              "w-5 h-5 transition-transform duration-200",
              isActive && "scale-110"
            )}>
              {item.icon}
            </div>
            <span className={cn(
              "text-[10px] font-medium leading-none",
              isActive && "text-primary"
            )}>
              {item.title}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
