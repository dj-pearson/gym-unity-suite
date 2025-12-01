import React from 'react';
import { useNavigate } from 'react-router-dom';

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

const textSizeMap = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-2xl'
};

export function Logo({
  className = '',
  size = 'md',
  showText = true,
  linkToHome = false,
  onClick
}: LogoProps) {
  const navigate = useNavigate();
  
  const handleClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (onClick) {
      onClick();
    } else if (linkToHome) {
      navigate('/');
    }
  };

  const logoElement = (
    <div className={`flex items-center gap-2 ${sizeMap[size]} ${className}`}>
      {/* Logo Image */}
      <div className={`${sizeMap[size]} w-auto flex-shrink-0`}>
        <img
          src="/RepClub-Icon.png"
          alt="Rep Club Logo"
          className={`${sizeMap[size]} w-auto object-contain`}
          onError={(e) => {
            // Fallback to text if image fails
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
      
      {/* Logo Text */}
      {showText && (
        <span className={`font-bold text-foreground ${textSizeMap[size]}`}>
          Rep Club
        </span>
      )}
    </div>
  );

  if (linkToHome || onClick) {
    return (
      <a
        href={linkToHome ? '/' : '#'}
        onClick={handleClick}
        className="flex items-center hover:opacity-90 transition-opacity group cursor-pointer"
      >
        {logoElement}
      </a>
    );
  }

  return logoElement;
}
