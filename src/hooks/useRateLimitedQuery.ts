/**
 * useRateLimitedQuery - A wrapper around TanStack Query that applies
 * client-side rate limiting to Supabase queries.
 *
 * Also provides a useRateLimitedMutation for write operations.
 *
 * Usage:
 * ```typescript
 * const { data, isLoading } = useRateLimitedQuery({
 *   queryKey: ['members', orgId],
 *   queryFn: async () => {
 *     const { data, error } = await supabase.from('members').select('*');
 *     if (error) throw error;
 *     return data;
 *   },
 *   rateLimitType: 'api',
 * });
 * ```
 */

import { useRef, useCallback } from 'react';
import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
} from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  checkRateLimit,
  getRateLimitStatus,
  generateRateLimitKey,
  RATE_LIMIT_CONFIGS,
  RateLimitConfig,
} from '@/lib/rate-limiter';

type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS;

interface RateLimitedQueryOptions<TData, TError>
  extends Omit<UseQueryOptions<TData, TError>, 'queryFn'> {
  queryFn: () => Promise<TData>;
  rateLimitType?: RateLimitType;
  customRateLimit?: RateLimitConfig;
  userId?: string | null;
  showRateLimitWarning?: boolean;
}

interface RateLimitedMutationOptions<TData, TError, TVariables>
  extends Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  rateLimitType?: RateLimitType;
  customRateLimit?: RateLimitConfig;
  userId?: string | null;
}

/**
 * Rate-limited wrapper around useQuery.
 * Checks the client-side rate limit before each query execution.
 */
export function useRateLimitedQuery<TData = unknown, TError = Error>({
  queryFn,
  rateLimitType = 'api',
  customRateLimit,
  userId = null,
  showRateLimitWarning = true,
  ...queryOptions
}: RateLimitedQueryOptions<TData, TError>) {
  const { toast } = useToast();
  const config = customRateLimit || RATE_LIMIT_CONFIGS[rateLimitType];
  const lastWarningRef = useRef<number>(0);

  const wrappedQueryFn = useCallback(async (): Promise<TData> => {
    const key = generateRateLimitKey(
      userId,
      Array.isArray(queryOptions.queryKey) ? queryOptions.queryKey.join(':') : 'query',
      config.keyPrefix
    );

    const result = checkRateLimit(key, config);

    if (!result.allowed) {
      // Show warning toast at most once per 10 seconds
      const now = Date.now();
      if (showRateLimitWarning && now - lastWarningRef.current > 10_000) {
        lastWarningRef.current = now;
        toast({
          title: 'Too many requests',
          description: `Please wait ${result.retryAfter || 5} seconds before refreshing.`,
          variant: 'destructive',
        });
      }
      throw new Error(`Rate limited. Retry after ${result.retryAfter} seconds.`);
    }

    // Warn when approaching limit (20% remaining)
    if (showRateLimitWarning && result.remaining <= Math.ceil(config.maxRequests * 0.2)) {
      const now = Date.now();
      if (now - lastWarningRef.current > 30_000) {
        lastWarningRef.current = now;
        toast({
          title: 'Approaching rate limit',
          description: `${result.remaining} requests remaining. Please slow down.`,
        });
      }
    }

    return queryFn();
  }, [queryFn, userId, config, showRateLimitWarning, toast, queryOptions.queryKey]);

  return useQuery<TData, TError>({
    ...queryOptions,
    queryFn: wrappedQueryFn,
  } as UseQueryOptions<TData, TError>);
}

/**
 * Rate-limited wrapper around useMutation.
 * Checks the client-side rate limit before each mutation execution.
 */
export function useRateLimitedMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
>({
  mutationFn,
  rateLimitType = 'api',
  customRateLimit,
  userId = null,
  ...mutationOptions
}: RateLimitedMutationOptions<TData, TError, TVariables>) {
  const { toast } = useToast();
  const config = customRateLimit || RATE_LIMIT_CONFIGS[rateLimitType];

  const wrappedMutationFn = useCallback(
    async (variables: TVariables): Promise<TData> => {
      const key = generateRateLimitKey(userId, 'mutation', config.keyPrefix);
      const result = checkRateLimit(key, config);

      if (!result.allowed) {
        toast({
          title: 'Too many requests',
          description: `Please wait ${result.retryAfter || 5} seconds before trying again.`,
          variant: 'destructive',
        });
        throw new Error(`Rate limited. Retry after ${result.retryAfter} seconds.`);
      }

      return mutationFn(variables);
    },
    [mutationFn, userId, config, toast]
  );

  return useMutation<TData, TError, TVariables>({
    ...mutationOptions,
    mutationFn: wrappedMutationFn,
  } as UseMutationOptions<TData, TError, TVariables>);
}
