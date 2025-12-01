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
    <div className={`relative w-full overflow-hidden ${className}`}>
      {/* Background overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none z-0"></div>

      {/* Content area */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
};