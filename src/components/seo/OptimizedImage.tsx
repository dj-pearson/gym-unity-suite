import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  fallback?: string;
  sizes?: string;
}

export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
  priority = false,
  fallback = '/placeholder.svg',
  sizes,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Generate srcSet for responsive images
  const generateSrcSet = (baseSrc: string) => {
    if (baseSrc.includes('placeholder.svg')) return '';
    
    const sizes = [320, 480, 640, 768, 1024, 1280, 1920];
    return sizes
      .map(size => `${baseSrc}?w=${size} ${size}w`)
      .join(', ');
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const imgSrc = hasError ? fallback : src;
  const srcSet = generateSrcSet(imgSrc);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />
      )}
      
      <img
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading}
        srcSet={srcSet}
        sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        {...props}
      />
      
      {/* Add structured data for images */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ImageObject",
          "url": src,
          "description": alt,
          "width": width,
          "height": height
        })}
      </script>
    </div>
  );
}