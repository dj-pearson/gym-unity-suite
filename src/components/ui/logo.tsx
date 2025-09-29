import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  linkToHome?: boolean;
  onClick?: () => void;
}

const sizeMap = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12', 
  xl: 'h-16'
};

export function Logo({ 
  className = '', 
  size = 'md', 
  showText = false, 
  linkToHome = true,
  onClick 
}: LogoProps) {
  const logoElement = (
    <div className={`flex items-center ${showText ? 'space-x-3' : ''} ${className}`}>
      <img 
        src="/assets/repclub-logo.png" 
        alt="Rep Club Logo"
        className={`${sizeMap[size]} w-auto object-contain`}
      />
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-foreground">Rep Club</span>
          <span className="text-xs text-muted-foreground">Elite Fitness Management</span>
        </div>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <a 
        href="/" 
        className="flex items-center hover:opacity-90 transition-opacity"
        onClick={onClick}
      >
        {logoElement}
      </a>
    );
  }

  return logoElement;
}