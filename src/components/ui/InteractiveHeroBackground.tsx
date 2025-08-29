import React, { useEffect, useState } from 'react';

export default function InteractiveHeroBackground() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate transform values based on scroll
  const parallaxOffset = scrollY * 0.5;
  const scaleValue = 1 + (scrollY * 0.0002); // Subtle zoom out effect
  const opacity = Math.max(0.3, 1 - (scrollY * 0.001)); // Fade out gradually

  return (
    <>
      {/* Main Hero Background */}
      <div 
        className="absolute inset-0 w-full h-[150vh] -z-20 overflow-hidden"
        style={{
          transform: `translateY(${parallaxOffset}px) scale(${scaleValue})`,
          opacity: opacity,
          transition: 'none', // Disable transitions for smooth scrolling
        }}
      >
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(/assets/Hero-Background.png), linear-gradient(135deg, 
              hsl(var(--primary) / 0.1) 0%, 
              hsl(var(--secondary) / 0.05) 50%, 
              hsl(var(--accent) / 0.1) 100%)`,
            filter: 'brightness(0.4) contrast(1.1)',
          }}
        />
        
        {/* Gradient overlays for smooth blending */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30" />
      </div>

      {/* Secondary parallax layer for depth */}
      <div 
        className="absolute inset-0 w-full h-[120vh] -z-19 overflow-hidden"
        style={{
          transform: `translateY(${parallaxOffset * 0.3}px)`,
          opacity: opacity * 0.6,
        }}
      >
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-secondary/3" />
      </div>

      {/* Animated floating elements that respond to scroll */}
      <div 
        className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-primary/10 blur-xl -z-18"
        style={{
          transform: `translateY(${parallaxOffset * -0.2}px) rotate(${scrollY * 0.1}deg)`,
          opacity: opacity * 0.8,
        }}
      />
      
      <div 
        className="absolute top-40 right-20 w-24 h-24 rounded-full bg-gradient-secondary/10 blur-lg -z-18"
        style={{
          transform: `translateY(${parallaxOffset * -0.4}px) rotate(${-scrollY * 0.15}deg)`,
          opacity: opacity * 0.6,
        }}
      />

      <div 
        className="absolute bottom-20 left-1/4 w-40 h-40 rounded-full bg-gradient-accent/5 blur-2xl -z-18"
        style={{
          transform: `translateY(${parallaxOffset * -0.1}px) scale(${1 + scrollY * 0.0001})`,
          opacity: opacity * 0.4,
        }}
      />
    </>
  );
}