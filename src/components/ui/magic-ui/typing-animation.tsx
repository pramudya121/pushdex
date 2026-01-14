import * as React from "react";
import { cn } from "@/lib/utils";

interface TypingAnimationProps {
  text: string;
  duration?: number;
  className?: string;
  cursorClassName?: string;
  showCursor?: boolean;
}

export const TypingAnimation: React.FC<TypingAnimationProps> = ({
  text,
  duration = 100,
  className,
  cursorClassName,
  showCursor = true,
}) => {
  const [displayedText, setDisplayedText] = React.useState("");
  const [isComplete, setIsComplete] = React.useState(false);
  const [cursorVisible, setCursorVisible] = React.useState(true);

  React.useEffect(() => {
    setDisplayedText("");
    setIsComplete(false);
    
    let i = 0;
    const typingEffect = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingEffect);
        setIsComplete(true);
      }
    }, duration);

    return () => clearInterval(typingEffect);
  }, [text, duration]);

  // Cursor blink effect
  React.useEffect(() => {
    if (!showCursor) return;
    
    const cursorBlink = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530);

    return () => clearInterval(cursorBlink);
  }, [showCursor]);

  return (
    <span className={cn("inline-flex items-center", className)}>
      <span>{displayedText}</span>
      {showCursor && (
        <span
          className={cn(
            "ml-1 inline-block h-[1.1em] w-[2px] bg-primary transition-opacity",
            cursorVisible ? "opacity-100" : "opacity-0",
            isComplete && "animate-pulse",
            cursorClassName
          )}
        />
      )}
    </span>
  );
};
