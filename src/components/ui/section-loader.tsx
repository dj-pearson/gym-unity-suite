import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton, SkeletonCard, SkeletonTableRow, SkeletonText } from '@/components/ui/skeleton';

type SectionLoaderVariant = 'cards' | 'table' | 'list' | 'text' | 'spinner';

interface SectionLoaderProps {
  variant?: SectionLoaderVariant;
  count?: number;
  columns?: number;
  className?: string;
  message?: string;
}

/**
 * Reusable SectionLoader component for section-level loading states.
 * Unlike PageLoader (full-page), this is designed for partial page sections.
 *
 * Usage:
 * ```tsx
 * <SectionLoader variant="cards" count={4} />
 * <SectionLoader variant="table" count={5} columns={4} />
 * <SectionLoader variant="list" count={3} />
 * <SectionLoader variant="spinner" message="Loading data..." />
 * ```
 */
export function SectionLoader({
  variant = 'spinner',
  count = 3,
  columns = 4,
  className,
  message,
}: SectionLoaderProps) {
  if (variant === 'spinner') {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <div className="relative">
          <div className="h-8 w-8 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 h-8 w-8 rounded-full border-4 border-t-primary animate-spin" />
        </div>
        {message && (
          <p className="text-sm text-muted-foreground mt-3 animate-pulse">{message}</p>
        )}
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn("space-y-1", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonTableRow key={i} columns={columns} />
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border border-border rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    );
  }

  // text variant
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonText key={i} lines={3} />
      ))}
    </div>
  );
}
