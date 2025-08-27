import React from 'react';

export default function MobileGymElements() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden opacity-30">
      {/* Floating Dumbbells */}
      <div className="absolute top-1/4 left-1/4 animate-float-1">
        <DumbbellSVG className="w-16 h-16 text-primary rotate-12" />
      </div>
      
      <div className="absolute top-3/4 right-1/4 animate-float-2">
        <DumbbellSVG className="w-12 h-12 text-secondary -rotate-12" />
      </div>
      
      <div className="absolute top-1/2 left-1/6 animate-float-3">
        <DumbbellSVG className="w-10 h-10 text-accent rotate-45" />
      </div>

      {/* Floating Orbs */}
      <div className="absolute top-1/3 right-1/3 animate-pulse-slow">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary-glow opacity-60"></div>
      </div>
      
      <div className="absolute bottom-1/3 left-1/5 animate-pulse-slower">
        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-secondary to-accent opacity-40"></div>
      </div>
      
      <div className="absolute top-1/6 right-1/2 animate-bounce-gentle">
        <div className="w-4 h-4 rounded-full bg-gradient-primary opacity-50"></div>
      </div>

      {/* Background Gradient Shapes */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-primary rounded-full opacity-5 animate-drift-1"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-secondary rounded-full opacity-5 animate-drift-2"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-full animate-spin-slow"></div>
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