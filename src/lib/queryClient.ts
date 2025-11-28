import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized React Query configuration with optimized cache settings
 *
 * Performance optimizations:
 * - staleTime: Data considered fresh for 5 minutes (reduces refetches)
 * - gcTime: Unused data kept in cache for 10 minutes (improves navigation)
 * - refetchOnWindowFocus: false for stable data (members, settings)
 * - retry: Smart retry with exponential backoff
 */

// Lazy initialization to ensure React is fully loaded before creating QueryClient
let _queryClient: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!_queryClient) {
    _queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // How long data is considered fresh (no refetch needed)
          staleTime: 5 * 60 * 1000, // 5 minutes

          // How long unused data stays in cache
          gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

          // Disable refetch on window focus for better UX
          // (Users don't expect data to reload when switching tabs)
          refetchOnWindowFocus: false,

          // Retry failed requests with exponential backoff
          retry: (failureCount, error: any) => {
            // Don't retry on 4xx errors (client errors)
            if (error?.status >= 400 && error?.status < 500) {
              return false;
            }
            // Retry up to 2 times for network/server errors
            return failureCount < 2;
          },

          // Retry delay: 1s, 2s, 4s (exponential backoff)
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

          // Enable request deduplication
          // Multiple components requesting same data = single network request
          structuralSharing: true,
        },
        mutations: {
          // Retry mutations once on network failure
          retry: 1,

          // Mutation retry delay
          retryDelay: 1000,
        },
      },
    });
  }
  return _queryClient;
}

// For backwards compatibility
export const queryClient = getQueryClient();

/**
 * Query key factories for consistent cache keys across the app
 *
 * Usage:
 * const { data } = useQuery(queryKeys.members.list(organizationId))
 */
export const queryKeys = {
  members: {
    all: ['members'] as const,
    lists: () => [...queryKeys.members.all, 'list'] as const,
    list: (organizationId: string) => [...queryKeys.members.lists(), organizationId] as const,
    details: () => [...queryKeys.members.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.members.details(), id] as const,
    attendance: (id: string) => [...queryKeys.members.detail(id), 'attendance'] as const,
    documents: (id: string) => [...queryKeys.members.detail(id), 'documents'] as const,
  },
  classes: {
    all: ['classes'] as const,
    lists: () => [...queryKeys.classes.all, 'list'] as const,
    list: (organizationId: string) => [...queryKeys.classes.lists(), organizationId] as const,
    details: () => [...queryKeys.classes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.classes.details(), id] as const,
  },
  checkIns: {
    all: ['checkIns'] as const,
    lists: () => [...queryKeys.checkIns.all, 'list'] as const,
    list: (organizationId: string, filters?: Record<string, any>) =>
      [...queryKeys.checkIns.lists(), organizationId, filters] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    stats: (organizationId: string) => [...queryKeys.dashboard.all, 'stats', organizationId] as const,
    revenue: (organizationId: string, period?: string) =>
      [...queryKeys.dashboard.all, 'revenue', organizationId, period] as const,
  },
  billing: {
    all: ['billing'] as const,
    invoices: (organizationId: string) => [...queryKeys.billing.all, 'invoices', organizationId] as const,
  },
};

/**
 * Prefetch utility for dashboard data
 * Call this after successful login to warm the cache
 */
export async function prefetchDashboardData(organizationId: string) {
  if (!organizationId) return;

  const client = getQueryClient();
  
  // Prefetch dashboard stats in parallel
  await Promise.allSettled([
    client.prefetchQuery({
      queryKey: queryKeys.dashboard.stats(organizationId),
      staleTime: 2 * 60 * 1000, // 2 minutes
    }),
    client.prefetchQuery({
      queryKey: queryKeys.members.list(organizationId),
      staleTime: 5 * 60 * 1000, // 5 minutes
    }),
  ]);
}
