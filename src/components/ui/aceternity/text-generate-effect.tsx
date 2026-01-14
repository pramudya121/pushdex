import * as React from "react";
import { cn } from "@/lib/utils";

interface TextGenerateEffectProps {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
}

export const TextGenerateEffect: React.FC<TextGenerateEffectProps> = ({
  words,
  className,
  filter = true,
  duration = 0.5,
}) => {
  const [complete, setComplete] = React.useState(false);
  const wordsArray = words.split(" ");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setComplete(true);
    }, wordsArray.length * duration * 1000);

    return () => clearTimeout(timer);
  }, [wordsArray.length, duration]);

  return (
    <div className={cn("font-normal", className)}>
      <div className="leading-snug tracking-wide">
        {wordsArray.map((word, idx) => (
          <React.Fragment key={idx}>
            <span
              className="inline-block opacity-0 animate-text-generate"
              style={{
                animationDelay: `${idx * duration * 0.1}s`,
                animationFillMode: "forwards",
              }}
            >
              {word}
            </span>
            {idx < wordsArray.length - 1 && <span>&nbsp;</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Add text generate animation
const textGenerateStyles = `
@keyframes text-generate {
  0% {
    opacity: 0;
    filter: blur(10px);
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    filter: blur(0px);
    transform: translateY(0);
  }
}

.animate-text-generate {
  animation: text-generate 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
`;

if (typeof document !== 'undefined') {
  const styleId = 'text-generate-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = textGenerateStyles;
    document.head.appendChild(styleSheet);
  }
}
