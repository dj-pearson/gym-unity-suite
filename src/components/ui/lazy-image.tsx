import * as React from "react"
import { cn } from "@/lib/utils"

export interface LazyImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "loading"> {
  /** Fallback/placeholder to show while loading */
  fallback?: React.ReactNode
  /** Whether to show loading skeleton */
  showSkeleton?: boolean
  /** Aspect ratio for the container (e.g., "16/9", "4/3", "1/1") */
  aspectRatio?: string
  /** Object fit style */
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down"
  /** Low-quality image placeholder (LQIP) src */
  placeholderSrc?: string
  /** Additional wrapper className */
  wrapperClassName?: string
  /** Callback when image loads */
  onLoad?: () => void
  /** Callback when image fails to load */
  onError?: () => void
}

/**
 * LazyImage - A performance-optimized image component for mobile
 *
 * Features:
 * - Native lazy loading
 * - Loading skeleton/placeholder
 * - Blur-up effect with LQIP
 * - Aspect ratio container to prevent layout shift
 * - Error state handling
 * - Intersection observer for better control
 */
export const LazyImage = React.forwardRef<HTMLImageElement, LazyImageProps>(
  (
    {
      src,
      alt,
      className,
      fallback,
      showSkeleton = true,
      aspectRatio,
      objectFit = "cover",
      placeholderSrc,
      wrapperClassName,
      onLoad,
      onError,
      ...props
    },
    ref
  ) => {
    const [isLoaded, setIsLoaded] = React.useState(false)
    const [hasError, setHasError] = React.useState(false)
    const [isInView, setIsInView] = React.useState(false)
    const imgRef = React.useRef<HTMLImageElement>(null)

    // Combine refs
    React.useImperativeHandle(ref, () => imgRef.current as HTMLImageElement)

    // Intersection Observer for viewport-based loading
    React.useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        },
        {
          rootMargin: "50px", // Load slightly before visible
          threshold: 0.01,
        }
      )

      if (imgRef.current) {
        observer.observe(imgRef.current)
      }

      return () => observer.disconnect()
    }, [])

    const handleLoad = () => {
      setIsLoaded(true)
      onLoad?.()
    }

    const handleError = () => {
      setHasError(true)
      onError?.()
    }

    // Determine object-fit class
    const objectFitClass = {
      cover: "object-cover",
      contain: "object-contain",
      fill: "object-fill",
      none: "object-none",
      "scale-down": "object-scale-down",
    }[objectFit]

    // Error fallback
    if (hasError) {
      return (
        <div
          className={cn(
            "flex items-center justify-center bg-muted",
            aspectRatio && `aspect-[${aspectRatio}]`,
            wrapperClassName
          )}
          style={aspectRatio ? { aspectRatio } : undefined}
        >
          {fallback || (
            <div className="text-center p-4">
              <svg
                className="mx-auto h-8 w-8 text-muted-foreground/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mt-1 text-xs text-muted-foreground">
                Image not available
              </p>
            </div>
          )}
        </div>
      )
    }

    return (
      <div
        className={cn(
          "relative overflow-hidden",
          aspectRatio && `aspect-[${aspectRatio}]`,
          wrapperClassName
        )}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        {/* Loading skeleton */}
        {showSkeleton && !isLoaded && (
          <div
            className={cn(
              "absolute inset-0 bg-muted animate-pulse",
              aspectRatio && "aspect-[var(--aspect)]"
            )}
          />
        )}

        {/* Low quality placeholder (blur-up effect) */}
        {placeholderSrc && !isLoaded && (
          <img
            src={placeholderSrc}
            alt=""
            aria-hidden="true"
            className={cn(
              "absolute inset-0 w-full h-full blur-md scale-105",
              objectFitClass
            )}
          />
        )}

        {/* Main image */}
        <img
          ref={imgRef}
          src={isInView ? src : undefined}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full transition-opacity duration-300",
            objectFitClass,
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
LazyImage.displayName = "LazyImage"

/**
 * ResponsiveImage - Image with srcset for different screen sizes
 */
export interface ResponsiveImageProps extends LazyImageProps {
  /** Srcset for responsive images */
  srcSet?: string
  /** Sizes attribute for responsive images */
  sizes?: string
}

export const ResponsiveImage = React.forwardRef<
  HTMLImageElement,
  ResponsiveImageProps
>(({ srcSet, sizes, ...props }, ref) => {
  return (
    <LazyImage
      ref={ref}
      {...props}
      // These will be passed to the img element
      {...(srcSet && { srcSet })}
      {...(sizes && { sizes })}
    />
  )
})
ResponsiveImage.displayName = "ResponsiveImage"

/**
 * Avatar image with mobile-optimized loading
 */
export interface AvatarImageProps extends Omit<LazyImageProps, "aspectRatio"> {
  /** Size in pixels */
  size?: number
  /** Fallback initials */
  initials?: string
}

export const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ size = 40, initials, className, wrapperClassName, ...props }, ref) => {
    return (
      <LazyImage
        ref={ref}
        aspectRatio="1/1"
        objectFit="cover"
        fallback={
          initials && (
            <div className="flex items-center justify-center w-full h-full bg-primary/10 text-primary font-medium">
              {initials.slice(0, 2).toUpperCase()}
            </div>
          )
        }
        className={cn("rounded-full", className)}
        wrapperClassName={cn("rounded-full", wrapperClassName)}
        style={{ width: size, height: size }}
        {...props}
      />
    )
  }
)
AvatarImage.displayName = "AvatarImage"

export default LazyImage
