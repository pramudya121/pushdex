import React from 'react';

export const WaveBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-dark" />
      
      {/* Animated wave layers */}
      <svg
        className="absolute bottom-0 left-0 w-[200%] h-[60%] opacity-20"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="wave1Gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(330, 100%, 50%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(330, 100%, 30%)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path
          className="animate-wave"
          fill="url(#wave1Gradient)"
          d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,181.3C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>
      
      <svg
        className="absolute bottom-0 left-0 w-[200%] h-[50%] opacity-15"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ animationDelay: '-5s' }}
      >
        <defs>
          <linearGradient id="wave2Gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(330, 100%, 60%)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(330, 100%, 40%)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path
          className="animate-wave"
          style={{ animationDelay: '-5s' }}
          fill="url(#wave2Gradient)"
          d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,106.7C672,117,768,171,864,181.3C960,192,1056,160,1152,138.7C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>

      <svg
        className="absolute bottom-0 left-0 w-[200%] h-[40%] opacity-10"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ animationDelay: '-10s' }}
      >
        <defs>
          <linearGradient id="wave3Gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(330, 100%, 70%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(330, 100%, 50%)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path
          className="animate-wave"
          style={{ animationDelay: '-10s' }}
          fill="url(#wave3Gradient)"
          d="M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,197.3C672,213,768,235,864,234.7C960,235,1056,213,1152,197.3C1248,181,1344,171,1392,165.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>

      {/* Glow orbs */}
      <div 
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, hsl(330, 100%, 50%) 0%, transparent 70%)' }}
      />
      <div 
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15"
        style={{ background: 'radial-gradient(circle, hsl(330, 100%, 60%) 0%, transparent 70%)' }}
      />
      <div 
        className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full blur-3xl opacity-10"
        style={{ background: 'radial-gradient(circle, hsl(330, 100%, 70%) 0%, transparent 70%)' }}
      />
    </div>
  );
};
