import React, { Suspense } from 'react';

// Lazy-load the 3D scene so any issues there don't break the whole app
const Hero3DScene = React.lazy(() => import('./Hero3DScene'));

interface InteractiveHeroBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

class HeroErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Hero3DScene failed to render', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-background" />
      );
    }

    return this.props.children;
  }
}

export const InteractiveHeroBackground: React.FC<InteractiveHeroBackgroundProps> = ({
  className = "",
  children
}) => {
  return (
    <div className={`relative w-full h-screen overflow-hidden ${className}`}>
      {/* 3D Background Scene with fallback */}
      <HeroErrorBoundary>
        <Suspense fallback={
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-background">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
          </div>
        }>
          <Hero3DScene />
        </Suspense>
      </HeroErrorBoundary>

      {/* Content area */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
};