import React, { Suspense } from 'react';
import Hero3DScene from './Hero3DScene';

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
      {/* 3D Background Scene */}
      <Suspense fallback={<div className="absolute inset-0 bg-slate-950" />}>
        <Hero3DScene />
      </Suspense>

      {/* Content area - children passed from parent */}
      <div className="relative z-10 h-full pointer-events-none">
        <div className="pointer-events-auto h-full">
          {children}
        </div>
      </div>
    </div>
  );
};