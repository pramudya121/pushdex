import React from 'react';

export const WolfLogo: React.FC<{ className?: string; size?: number }> = ({ 
  className = '', 
  size = 40 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Wolf head - geometric bold style */}
      <defs>
        <linearGradient id="wolfGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(330, 100%, 60%)" />
          <stop offset="100%" stopColor="hsl(330, 100%, 45%)" />
        </linearGradient>
        <linearGradient id="wolfGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(330, 100%, 40%)" />
          <stop offset="100%" stopColor="hsl(330, 100%, 30%)" />
        </linearGradient>
      </defs>
      
      {/* Left ear */}
      <polygon
        points="15,45 30,10 35,45"
        fill="url(#wolfGradient)"
      />
      
      {/* Right ear */}
      <polygon
        points="85,45 70,10 65,45"
        fill="url(#wolfGradient)"
      />
      
      {/* Main head shape */}
      <polygon
        points="50,95 15,45 25,30 50,55 75,30 85,45"
        fill="url(#wolfGradient)"
      />
      
      {/* Inner face */}
      <polygon
        points="50,85 25,50 35,40 50,55 65,40 75,50"
        fill="url(#wolfGradientDark)"
      />
      
      {/* Left eye */}
      <polygon
        points="35,50 40,42 45,50 40,55"
        fill="white"
      />
      
      {/* Right eye */}
      <polygon
        points="65,50 60,42 55,50 60,55"
        fill="white"
      />
      
      {/* Nose */}
      <polygon
        points="50,70 45,62 55,62"
        fill="white"
      />
      
      {/* Snout line */}
      <line
        x1="50"
        y1="70"
        x2="50"
        y2="82"
        stroke="white"
        strokeWidth="2"
      />
    </svg>
  );
};

export const WolfLogoText: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <WolfLogo size={36} />
      <span className="text-xl font-bold tracking-tight">
        <span className="text-primary">PUSH</span>
        <span className="text-foreground">DEX</span>
      </span>
    </div>
  );
};
