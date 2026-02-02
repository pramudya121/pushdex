import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  intensity?: number;
}

export const Card3D: React.FC<Card3DProps> = ({
  children,
  className,
  containerClassName,
  intensity = 10,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(
    mouseYSpring,
    [-0.5, 0.5],
    [`${intensity}deg`, `-${intensity}deg`]
  );
  const rotateY = useTransform(
    mouseXSpring,
    [-0.5, 0.5],
    [`-${intensity}deg`, `${intensity}deg`]
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div
      ref={ref}
      className={cn("relative perspective-1000", containerClassName)}
      style={{ perspective: "1000px" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={cn(
          "relative w-full h-full transition-shadow duration-500 ease-out",
          className
        )}
      >
        {/* Glow effect */}
        <motion.div
          className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
          style={{
            background: "linear-gradient(135deg, hsl(330, 100%, 55%, 0.3), hsl(280, 80%, 60%, 0.3))",
          }}
        />
        {/* Card content with depth effect */}
        <div
          style={{ transform: "translateZ(50px)" }}
          className="relative h-full w-full"
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
};

// CardItem for nested 3D depth
interface CardItem3DProps {
  children: React.ReactNode;
  className?: string;
  translateZ?: number;
  rotateZ?: number;
}

export const CardItem3D: React.FC<CardItem3DProps> = ({
  children,
  className,
  translateZ = 0,
  rotateZ = 0,
}) => {
  return (
    <div
      className={cn("relative", className)}
      style={{
        transform: `translateZ(${translateZ}px) rotateZ(${rotateZ}deg)`,
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </div>
  );
};
