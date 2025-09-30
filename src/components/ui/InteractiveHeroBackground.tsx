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
      {/* Extended Hero Background - spans hero + features section */}
      <div 
        className="fixed inset-0 w-full h-[200vh] -z-20 overflow-hidden"
        style={{
          transform: `translateY(${parallaxOffset}px) scale(${scaleValue})`,
          opacity: opacity,
          transition: 'none', // Disable transitions for smooth scrolling
        }}
      >
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(/assets/Hero-Background.webp), linear-gradient(135deg, 
              hsl(var(--primary) / 0.1) 0%, 
              hsl(var(--secondary) / 0.05) 50%, 
              hsl(var(--accent) / 0.1) 100%)`,
            filter: 'brightness(0.4) contrast(1.1)',
          }}
        />
        
        {/* Enhanced gradient overlays for smooth blending into next section */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/30 to-background/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-transparent to-background/20" />
        
        {/* Additional overlay for features section transition */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[50vh] bg-gradient-to-t from-background via-background/80 to-transparent"
          style={{
            transform: `translateY(${scrollY * -0.1}px)`,
          }}
        />
      </div>

      {/* Secondary parallax layer for depth - extends further */}
      <div 
        className="fixed inset-0 w-full h-[180vh] -z-19 overflow-hidden"
        style={{
          transform: `translateY(${parallaxOffset * 0.3}px)`,
          opacity: opacity * 0.6,
        }}
      >
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-secondary/3" />
        
        {/* Moving gradient that follows scroll */}
        <div 
          className="absolute w-full h-full bg-gradient-to-b from-transparent via-primary/3 to-transparent"
          style={{
            transform: `translateY(${scrollY * 0.2}px)`,
          }}
        />
      </div>

      {/* Animated floating elements that respond to scroll - extend coverage */}
      <div 
        className="fixed top-20 left-10 w-32 h-32 rounded-full bg-gradient-primary/10 blur-xl -z-18"
        style={{
          transform: `translateY(${parallaxOffset * -0.2}px) rotate(${scrollY * 0.1}deg)`,
          opacity: opacity * 0.8,
        }}
      />
      
      <div 
        className="fixed top-40 right-20 w-24 h-24 rounded-full bg-gradient-secondary/10 blur-lg -z-18"
        style={{
          transform: `translateY(${parallaxOffset * -0.4}px) rotate(${-scrollY * 0.15}deg)`,
          opacity: opacity * 0.6,
        }}
      />

      <div 
        className="fixed bottom-20 left-1/4 w-40 h-40 rounded-full bg-gradient-accent/5 blur-2xl -z-18"
        style={{
          transform: `translateY(${parallaxOffset * -0.1}px) scale(${1 + scrollY * 0.0001})`,
          opacity: opacity * 0.4,
        }}
      />

      {/* Additional floating elements for extended section */}
      <div 
        className="fixed top-60 right-1/3 w-28 h-28 rounded-full bg-gradient-primary/8 blur-lg -z-18"
        style={{
          transform: `translateY(${parallaxOffset * -0.3}px) rotate(${scrollY * 0.08}deg)`,
          opacity: Math.max(0, opacity * 0.7 - scrollY * 0.0005),
        }}
      />
      
      <div 
        className="fixed bottom-40 right-10 w-36 h-36 rounded-full bg-gradient-secondary/6 blur-xl -z-18"
        style={{
          transform: `translateY(${parallaxOffset * -0.15}px) scale(${1 + scrollY * 0.00008})`,
          opacity: Math.max(0, opacity * 0.5 - scrollY * 0.0003),
        }}
      />
    </>
  );
}