import React from 'react';

export default function ModernHeroElements() {
  return (
    <>
      {/* Large, visible floating orbs - more prominent */}
      <div className="absolute top-20 left-4 w-40 h-40 bg-gradient-to-br from-primary/40 to-secondary/40 rounded-full blur-2xl animate-float-1 -z-10" />
      <div className="absolute top-32 right-4 w-32 h-32 bg-gradient-to-br from-secondary/35 to-accent/35 rounded-full blur-xl animate-float-2 -z-10" />
      <div className="absolute bottom-40 left-8 w-28 h-28 bg-gradient-to-br from-accent/30 to-primary/30 rounded-full blur-lg animate-float-3 -z-10" />
      
      {/* More visible geometric shapes */}
      <div className="absolute top-16 right-8 w-20 h-20 -z-10 animate-drift-1">
        <div className="w-full h-full bg-gradient-to-br from-primary/50 to-secondary/30 transform rotate-45 rounded-xl shadow-2xl"></div>
      </div>
      
      <div className="absolute bottom-24 right-12 w-16 h-16 -z-10 animate-drift-2">
        <div className="w-full h-full bg-gradient-to-br from-secondary/40 to-accent/25 transform rotate-12 rounded-2xl shadow-xl"></div>
      </div>
      
      <div className="absolute top-40 left-6 w-14 h-14 -z-10 animate-bounce-gentle">
        <div className="w-full h-full bg-gradient-to-br from-accent/45 to-primary/25 transform -rotate-12 rounded-lg shadow-lg"></div>
      </div>
      
      {/* Visible animated lines */}
      <div className="absolute inset-0 -z-10 opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800">
          <defs>
            <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="lineGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path 
            d="M20,100 Q150,50 280,120 T380,100" 
            stroke="url(#lineGrad1)" 
            strokeWidth="3" 
            fill="none"
            className="animate-pulse-slow"
          />
          <path 
            d="M50,200 Q200,150 350,220 T400,200" 
            stroke="url(#lineGrad2)" 
            strokeWidth="2" 
            fill="none"
            className="animate-pulse-slower"
          />
          <circle
            cx="100"
            cy="300"
            r="3"
            fill="url(#lineGrad1)"
            className="animate-pulse-slow"
          />
          <circle
            cx="300"
            cy="400"
            r="2"
            fill="url(#lineGrad2)"
            className="animate-pulse-slower"
          />
        </svg>
      </div>
      
      {/* More prominent glow effects */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-radial from-primary/20 via-primary/10 to-transparent rounded-full blur-3xl -z-10 animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-radial from-secondary/15 via-secondary/8 to-transparent rounded-full blur-2xl -z-10 animate-pulse-slower" />
      
      {/* Subtle grid with better contrast */}
      <div className="absolute inset-0 -z-10 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />
      </div>
    </>
  );
}