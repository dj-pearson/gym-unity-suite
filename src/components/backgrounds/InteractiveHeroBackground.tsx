import React, { useEffect, useRef, useState } from 'react';
import { ParallaxBackground } from '../ui/ParallaxBackground';

interface InteractiveHeroBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export const InteractiveHeroBackground: React.FC<InteractiveHeroBackgroundProps> = ({
  className = "",
  children
}) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [showInteractive, setShowInteractive] = useState(false);

  useEffect(() => {
    // Defer interactive effects until after LCP
    const timer = setTimeout(() => setShowInteractive(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showInteractive) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
        setMousePosition({ x, y });
      }
    };

    const handleScroll = () => {
      setScrollY(window.pageYOffset);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showInteractive]);

  return (
    <div 
      ref={heroRef}
      className={`relative w-full h-screen overflow-hidden ${className}`}
    >
      {/* Multi-layer parallax background */}
      <ParallaxBackground
        imageSrc="/assets/Hero-Background.webp"
        speed={0.3}
        scale={1.15}
        opacity={0.8}
        className="z-0"
      />
      
      {/* Secondary parallax layer for depth - defer for performance */}
      {showInteractive && (
        <>
          <div
            className="absolute inset-0 z-10"
            style={{
              background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.1) 100%)',
              transform: `translateX(${mousePosition.x * 20}px) translateY(${mousePosition.y * 20}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          />

          {/* Interactive mouse-following gradient */}
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background: `radial-gradient(600px circle at ${(mousePosition.x + 0.5) * 100}% ${(mousePosition.y + 0.5) * 100}%, 
                          rgba(255,255,255,0.1) 0%, 
                          rgba(255,255,255,0.05) 30%, 
                          transparent 70%)`,
              transition: 'background 0.3s ease-out',
            }}
          />

          {/* Dynamic scroll indicator */}
          <div 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50 opacity-70"
            style={{
              transform: `translateX(-50%) translateY(${Math.sin(Date.now() * 0.003) * 5}px)`,
            }}
          >
            <div className="flex flex-col items-center text-white/70">
              <span className="text-sm mb-2">Scroll to explore</span>
              <div className="w-6 h-10 border-2 border-white/30 rounded-full relative">
                <div 
                  className="w-1 h-3 bg-white/50 rounded-full absolute top-2 left-1/2 transform -translate-x-1/2 animate-bounce"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Content area - children passed from parent */}
      <div className="relative z-40 h-full">
        {children}
      </div>
    </div>
  );
};