/**
 * PrefetchLink - Performance-optimized link component with prefetching
 *
 * This component prefetches linked pages on hover or when in viewport,
 * improving perceived navigation speed for users.
 */

import React, { useCallback, useState } from 'react';
import { Link, LinkProps } from 'react-router-dom';

interface PrefetchLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  prefetch?: 'hover' | 'viewport' | 'none';
  children: React.ReactNode;
}

// Cache for prefetched routes
const prefetchedRoutes = new Set<string>();

// Dynamic import map for common routes
const routeImports: Record<string, () => Promise<unknown>> = {
  '/features': () => import('@/pages/FeaturesPage'),
  '/solutions': () => import('@/pages/solutions/SolutionsIndexPage'),
  '/compare/mindbody-alternative': () => import('@/pages/compare/MindbodyAlternativePage'),
  '/compare/glofox-alternative': () => import('@/pages/compare/GlofoxAlternativePage'),
  '/compare/zen-planner-alternative': () => import('@/pages/compare/ZenPlannerAlternativePage'),
  '/solutions/yoga-studios': () => import('@/pages/solutions/YogaStudiosPage'),
  '/solutions/crossfit-gyms': () => import('@/pages/solutions/CrossFitGymsPage'),
  '/solutions/martial-arts-schools': () => import('@/pages/solutions/MartialArtsSchoolsPage'),
  '/solutions/pilates-studios': () => import('@/pages/solutions/PilatesStudiosPage'),
  '/solutions/personal-training': () => import('@/pages/solutions/PersonalTrainingStudiosPage'),
  '/local': () => import('@/pages/local/LocalIndexPage'),
  '/blog': () => import('@/pages/BlogPage'),
  '/pricing': () => import('@/pages/LandingPage'),
};

const prefetchRoute = (path: string) => {
  // Skip if already prefetched
  if (prefetchedRoutes.has(path)) return;

  // Check if we have a known import for this route
  const importFn = routeImports[path];
  if (importFn) {
    // Prefetch the route
    importFn()
      .then(() => {
        prefetchedRoutes.add(path);
      })
      .catch(() => {
        // Silently fail - prefetching is a nice-to-have
      });
  }
};

export const PrefetchLink = ({
  to,
  prefetch = 'hover',
  children,
  onMouseEnter,
  onFocus,
  ...props
}: PrefetchLinkProps) => {
  const [hasPrefetched, setHasPrefetched] = useState(false);

  const handlePrefetch = useCallback(() => {
    if (!hasPrefetched && prefetch !== 'none') {
      prefetchRoute(to);
      setHasPrefetched(true);
    }
  }, [to, hasPrefetched, prefetch]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (prefetch === 'hover') {
        handlePrefetch();
      }
      onMouseEnter?.(e);
    },
    [prefetch, handlePrefetch, onMouseEnter]
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLAnchorElement>) => {
      if (prefetch === 'hover') {
        handlePrefetch();
      }
      onFocus?.(e);
    },
    [prefetch, handlePrefetch, onFocus]
  );

  return (
    <Link
      to={to}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      {...props}
    >
      {children}
    </Link>
  );
};

/**
 * usePrefetchRoutes - Hook to prefetch multiple routes at once
 *
 * Useful for preloading likely navigation targets when a page loads.
 */
export const usePrefetchRoutes = (routes: string[]) => {
  React.useEffect(() => {
    // Delay prefetching to not interfere with initial page load
    const timer = setTimeout(() => {
      routes.forEach(prefetchRoute);
    }, 2000);

    return () => clearTimeout(timer);
  }, [routes]);
};

/**
 * PrefetchOnIdle - Prefetch routes during browser idle time
 */
export const prefetchOnIdle = (routes: string[]) => {
  if ('requestIdleCallback' in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
      routes.forEach(prefetchRoute);
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      routes.forEach(prefetchRoute);
    }, 200);
  }
};

export default PrefetchLink;
