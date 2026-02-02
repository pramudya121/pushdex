import { useState, useEffect } from 'react';

/**
 * Hook to detect user's reduced motion preference
 * Respects the prefers-reduced-motion media query for accessibility
 */
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Fallback for older browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return prefersReducedMotion;
};

/**
 * Hook for conditional animation based on user preference
 */
export const useAccessibleAnimation = <T extends Record<string, unknown>>(
  animation: T,
  fallback?: Partial<T>
): T | Partial<T> => {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return fallback || {};
  }
  
  return animation;
};
