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
  lg: 'h-16',
  xl: 'h-24'
};

export function Logo({
  className = '',
  size = 'md',
  showText = false,
  linkToHome = true,
  onClick
}: LogoProps) {
  const uniqueId = React.useId();
  const goldGradientId = `gold-gradient-${uniqueId}`;
  const darkGradientId = `dark-gradient-${uniqueId}`;

  const logoElement = (
    <div className={`flex items-center ${showText ? 'space-x-3' : ''} ${className}`}>
      <div className={`${sizeMap[size]} aspect-square relative flex items-center justify-center`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-lg"
        >
          <defs>
            <linearGradient id={goldGradientId} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#EAB308" />
              <stop offset="50%" stopColor="#CA8A04" />
              <stop offset="100%" stopColor="#A16207" />
            </linearGradient>
            <linearGradient id={darkGradientId} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#27272A" />
              <stop offset="100%" stopColor="#09090B" />
            </linearGradient>
          </defs>

          {/* Background Shape */}
          <rect x="5" y="5" width="90" height="90" rx="20" fill={`url(#${darkGradientId})`} stroke={`url(#${goldGradientId})`} strokeWidth="2" />

          {/* R Shape */}
          <path
            d="M35 30 H50 C60 30 65 35 65 42 C65 49 60 54 50 54 H42 V70 H35 V30 Z M42 36 V48 H50 C54 48 57 46 57 42 C57 38 54 36 50 36 H42 Z"
            fill={`url(#${goldGradientId})`}
          />

          {/* C Shape overlapping */}
          <path
            d="M65 70 C55 70 48 65 45 58 L51 54 C53 59 58 63 65 63 C72 63 77 58 77 50 C77 42 72 37 65 37 C60 37 56 39 54 42"
            stroke={`url(#${goldGradientId})`}
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
            className="opacity-90"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-foreground tracking-tight">Rep Club</span>
          <span className="text-[0.65rem] uppercase tracking-wider text-primary font-medium">Elite Fitness Management</span>
        </div>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <a
        href="/"
        className="flex items-center hover:opacity-90 transition-opacity group"
        onClick={onClick}
      >
        {logoElement}
      </a>
    );
  }

  return logoElement;
}