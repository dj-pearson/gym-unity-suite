import React from 'react';

interface InteractiveHeroBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export const InteractiveHeroBackground: React.FC<InteractiveHeroBackgroundProps> = ({
  className = "",
  children
}) => {
  return (
    <div className={`relative w-full h-screen overflow-hidden ${className}`}>
      {/* Static gradient background - 3D disabled due to reconciler issues */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-background">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
      </div>

      {/* Content area */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
};