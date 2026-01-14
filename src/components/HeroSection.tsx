import React, { memo } from 'react';
import { Spotlight } from '@/components/ui/magic-ui/spotlight';
import { TextGenerateEffect } from '@/components/ui/aceternity/text-generate-effect';
import { GlowingStars } from '@/components/ui/aceternity/glowing-stars';
import { cn } from '@/lib/utils';

export interface HeroSectionProps {
  title: string;
  gradientTitle?: boolean;
  subtitle?: string;
  description?: string;
  animatedDescription?: boolean;
  showSpotlight?: boolean;
  showStars?: boolean;
  spotlightColor?: string;
  className?: string;
  children?: React.ReactNode;
  badge?: {
    text: string;
    variant?: 'default' | 'success' | 'warning';
    icon?: React.ReactNode;
  };
}

export const HeroSection: React.FC<HeroSectionProps> = memo(({
  title,
  gradientTitle = true,
  subtitle,
  description,
  animatedDescription = true,
  showSpotlight = true,
  showStars = false,
  spotlightColor = "hsl(280, 80%, 50%)",
  className,
  children,
  badge,
}) => {
  return (
    <div className={cn("relative text-center mb-10 animate-fade-in", className)}>
      {/* Spotlight Effects */}
      {showSpotlight && (
        <>
          <Spotlight className="-top-40 -left-10 md:-left-32 md:-top-20 opacity-50" />
          <Spotlight className="top-10 right-0 md:right-20 opacity-50" fill={spotlightColor} />
        </>
      )}
      
      {/* Glowing Stars Background */}
      {showStars && (
        <GlowingStars quantity={40} className="opacity-60" />
      )}
      
      {/* Badge */}
      {badge && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/80 border border-border/40 text-sm mb-6 backdrop-blur-sm">
          {badge.icon && badge.icon}
          {badge.variant === 'success' && (
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          )}
          <span className="text-foreground font-medium">{badge.text}</span>
        </div>
      )}
      
      {/* Title */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 tracking-tight">
        {gradientTitle ? (
          <span className="gradient-text">{title}</span>
        ) : (
          <>
            <span className="gradient-text">{title.split(' ')[0]}</span>
            <span className="text-foreground"> {title.split(' ').slice(1).join(' ')}</span>
          </>
        )}
      </h1>
      
      {/* Subtitle */}
      {subtitle && (
        <h2 className="text-xl md:text-2xl font-semibold text-foreground/80 mb-2">
          {subtitle}
        </h2>
      )}
      
      {/* Description */}
      {description && (
        animatedDescription ? (
          <div className="max-w-2xl mx-auto">
            <TextGenerateEffect 
              words={description}
              className="text-muted-foreground text-base md:text-lg"
              duration={0.5}
            />
          </div>
        ) : (
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            {description}
          </p>
        )
      )}
      
      {/* Custom Children Content */}
      {children && (
        <div className="mt-6">
          {children}
        </div>
      )}
    </div>
  );
});

HeroSection.displayName = 'HeroSection';

export default HeroSection;
