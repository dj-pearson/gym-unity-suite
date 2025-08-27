import React from 'react';

export default function MobileGymElements() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden opacity-10 pointer-events-none">
      {/* Floating Dumbbells - positioned to avoid text area */}
      <div className="absolute top-16 left-8 animate-float-1">
        <DumbbellSVG className="w-12 h-12 text-primary/50 rotate-12" />
      </div>
      
      <div className="absolute bottom-16 right-8 animate-float-2">
        <DumbbellSVG className="w-10 h-10 text-secondary/50 -rotate-12" />
      </div>
      
      <div className="absolute top-32 right-16 animate-float-3">
        <DumbbellSVG className="w-8 h-8 text-accent/50 rotate-45" />
      </div>

      {/* Floating Orbs - very subtle */}
      <div className="absolute top-24 right-24 animate-pulse-slow">
        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary/20 to-primary-glow/20"></div>
      </div>
      
      <div className="absolute bottom-32 left-16 animate-pulse-slower">
        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-secondary/20 to-accent/20"></div>
      </div>

      {/* Background Gradient Shapes - very subtle */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-8 left-4 w-20 h-20 bg-gradient-primary/5 rounded-full animate-drift-1"></div>
        <div className="absolute bottom-8 right-4 w-16 h-16 bg-gradient-secondary/5 rounded-full animate-drift-2"></div>
      </div>
    </div>
  );
}

function DumbbellSVG({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 100 40" fill="currentColor">
      {/* Handle */}
      <rect x="25" y="18" width="50" height="4" rx="2" />
      
      {/* Left weight */}
      <rect x="10" y="10" width="20" height="20" rx="3" />
      
      {/* Right weight */}
      <rect x="70" y="10" width="20" height="20" rx="3" />
      
      {/* Weight details */}
      <rect x="12" y="12" width="16" height="2" rx="1" opacity="0.6" />
      <rect x="12" y="26" width="16" height="2" rx="1" opacity="0.6" />
      <rect x="72" y="12" width="16" height="2" rx="1" opacity="0.6" />
      <rect x="72" y="26" width="16" height="2" rx="1" opacity="0.6" />
    </svg>
  );
}