import React, { useEffect, useRef, useState } from 'react';

interface ParallaxBackgroundProps {
  imageSrc: string;
  className?: string;
  speed?: number;
  scale?: number;
  opacity?: number;
}

export const ParallaxBackground: React.FC<ParallaxBackgroundProps> = ({
  imageSrc,
  className = "",
  speed = 0.5,
  scale = 1.1,
  opacity = 0.6
}) => {
  const backgroundRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [showEffects, setShowEffects] = useState(false);

  useEffect(() => {
    // Defer non-critical effects until after initial paint
    const timer = setTimeout(() => setShowEffects(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (backgroundRef.current) {
        const rect = backgroundRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Check if element is in viewport
        setIsVisible(rect.top < windowHeight && rect.bottom > 0);
        
        if (rect.top < windowHeight && rect.bottom > 0) {
          // Calculate parallax offset
          const scrolled = window.pageYOffset;
          setScrollY(scrolled * speed);
        }
      }
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div
      ref={backgroundRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{
        willChange: 'transform',
      }}
    >
      {/* Optimized img element for LCP - loads with high priority */}
      <img
        src={imageSrc}
        alt="Hero background"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          transform: `translateY(${scrollY}px) scale(${scale})`,
          opacity: opacity,
          willChange: 'transform',
        }}
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
      
      {/* Additional animated overlay for more depth - defer for performance */}
      {showEffects && (
        <>
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/30"
            style={{
              transform: `translateY(${scrollY * 0.3}px)`,
              willChange: 'transform',
            }}
          />
          
          {/* Floating particles effect - defer for performance */}
          <div className="absolute inset-0">
            {Array.from({ length: 15 }, (_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
                style={{
                  left: `${(i * 7 + 10) % 100}%`,
                  top: `${(i * 11 + 15) % 100}%`,
                  animationDelay: `${i * 0.5}s`,
                  transform: `translateY(${scrollY * (0.2 + (i % 5) * 0.1)}px)`,
                  willChange: 'transform',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};