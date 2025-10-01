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
  const [enhanceImage, setEnhanceImage] = useState(false);

  useEffect(() => {
    // Defer ALL effects until after LCP has painted
    const effectsTimer = setTimeout(() => setShowEffects(true), 200);
    const enhanceTimer = setTimeout(() => setEnhanceImage(true), 50);
    
    return () => {
      clearTimeout(effectsTimer);
      clearTimeout(enhanceTimer);
    };
  }, []);

  useEffect(() => {
    if (!enhanceImage) return; // Don't attach scroll until image is enhanced
    
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

    // Add scroll listener only after image is enhanced
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, enhanceImage]);

  return (
    <div
      ref={backgroundRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Critical LCP image - pure CSS, no JS for fastest paint */}
      <img
        src={imageSrc}
        alt="Hero background"
        className="absolute inset-0 w-full h-full object-cover"
        style={enhanceImage ? {
          transform: `translateY(${scrollY}px) scale(${scale})`,
          opacity: opacity,
          willChange: scrollY !== 0 ? 'transform' : 'auto',
        } : {
          transform: `scale(${scale})`,
          opacity: opacity,
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
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};