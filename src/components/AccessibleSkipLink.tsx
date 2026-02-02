import React from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  href = "#main-content",
  children = "Skip to main content",
  className,
}) => {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only",
        "fixed top-4 left-4 z-[9999]",
        "px-4 py-2 rounded-lg",
        "bg-primary text-primary-foreground",
        "font-medium text-sm",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "transition-transform duration-200",
        "transform -translate-y-full focus:translate-y-0",
        className
      )}
    >
      {children}
    </a>
  );
};

// Screen reader announcer for dynamic content
export const SROnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
);

// Live region for screen reader announcements
interface LiveRegionProps {
  message: string;
  mode?: "polite" | "assertive";
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  mode = "polite",
}) => {
  return (
    <div
      role="status"
      aria-live={mode}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};

// Focus trap hook for modals
export const useFocusTrap = (isActive: boolean) => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isActive || !ref.current) return;

    const element = ref.current;
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    element.addEventListener("keydown", handleKeyDown);
    firstFocusable?.focus();

    return () => {
      element.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActive]);

  return ref;
};
