import React from 'react';

export default function ModernHeroElements() {
  return (
    <>
      {/* Floating gradient orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-xl animate-float-1 -z-10" />
      <div className="absolute top-40 right-16 w-24 h-24 bg-gradient-to-br from-secondary/15 to-accent/15 rounded-full blur-lg animate-float-2 -z-10" />
      <div className="absolute bottom-32 left-20 w-20 h-20 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full blur-md animate-float-3 -z-10" />
      
      {/* Geometric shapes with 3D effect */}
      <div className="absolute top-16 right-8 w-16 h-16 -z-10 animate-drift-1">
        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-transparent transform rotate-45 rounded-lg shadow-lg backdrop-blur-sm"></div>
      </div>
      
      <div className="absolute bottom-20 right-12 w-12 h-12 -z-10 animate-drift-2">
        <div className="w-full h-full bg-gradient-to-br from-secondary/25 to-transparent transform rotate-12 rounded-full shadow-md backdrop-blur-sm"></div>
      </div>
      
      {/* Sophisticated line patterns */}
      <div className="absolute inset-0 -z-10 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path 
            d="M50,50 Q200,20 350,80 T650,60" 
            stroke="url(#lineGradient)" 
            strokeWidth="2" 
            fill="none"
            className="animate-pulse-slow"
          />
          <path 
            d="M100,150 Q300,120 500,180 T800,160" 
            stroke="url(#lineGradient)" 
            strokeWidth="1.5" 
            fill="none"
            className="animate-pulse-slower"
          />
        </svg>
      </div>
      
      {/* Modern grid pattern */}
      <div className="absolute inset-0 -z-10 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      {/* Sophisticated glow effects */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-radial from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl -z-10 animate-pulse-slow" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-radial from-secondary/8 via-secondary/4 to-transparent rounded-full blur-2xl -z-10 animate-pulse-slower" />
    </>
  );
}