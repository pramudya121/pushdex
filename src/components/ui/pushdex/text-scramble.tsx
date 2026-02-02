import React, { useState, useEffect, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface TextScrambleProps {
  text: string;
  className?: string;
  scrambleSpeed?: number;
  revealSpeed?: number;
  trigger?: 'mount' | 'hover';
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

export const TextScramble = memo(({
  text,
  className,
  scrambleSpeed = 30,
  revealSpeed = 50,
  trigger = 'mount',
}: TextScrambleProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [displayText, setDisplayText] = useState(trigger === 'mount' ? '' : text);
  const [isScrambling, setIsScrambling] = useState(false);

  const scramble = useCallback(() => {
    if (prefersReducedMotion) {
      setDisplayText(text);
      return;
    }

    setIsScrambling(true);
    let iteration = 0;
    const totalIterations = text.length;

    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) return text[index];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );

      iteration += 1 / 3;

      if (iteration >= totalIterations) {
        clearInterval(interval);
        setDisplayText(text);
        setIsScrambling(false);
      }
    }, scrambleSpeed);

    return () => clearInterval(interval);
  }, [text, scrambleSpeed, prefersReducedMotion]);

  useEffect(() => {
    if (trigger === 'mount') {
      const timeout = setTimeout(scramble, 100);
      return () => clearTimeout(timeout);
    }
  }, [trigger, scramble]);

  const handleMouseEnter = () => {
    if (trigger === 'hover' && !isScrambling) {
      scramble();
    }
  };

  return (
    <span
      className={cn('inline-block font-mono', className)}
      onMouseEnter={handleMouseEnter}
    >
      {displayText || text}
    </span>
  );
});

TextScramble.displayName = 'TextScramble';
