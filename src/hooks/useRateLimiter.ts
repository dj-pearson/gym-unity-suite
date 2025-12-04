/**
 * useRateLimiter Hook
 * Provides rate limiting functionality for React components
 */

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  checkRateLimit,
  getRateLimitStatus,
  generateRateLimitKey,
  RATE_LIMIT_CONFIGS,
  RateLimitConfig,
  RateLimitResult,
  recordFailedLogin,
  clearFailedLogins,
  isLockedOut,
} from '@/lib/rate-limiter';

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIGS;

interface UseRateLimiterOptions {
  type: RateLimitType;
  endpoint?: string;
  customConfig?: Partial<RateLimitConfig>;
}

interface UseRateLimiterReturn {
  /**
   * Check if a request is allowed and consume a token
   */
  checkLimit: () => RateLimitResult;
  /**
   * Get current status without consuming a token
   */
  getStatus: () => RateLimitResult;
  /**
   * Whether the rate limit is currently exceeded
   */
  isLimited: boolean;
  /**
   * Number of remaining requests in current window
   */
  remaining: number;
  /**
   * Time when the rate limit resets (timestamp)
   */
  resetAt: number | null;
  /**
   * Seconds until retry is allowed (only set when limited)
   */
  retryAfter: number | null;
  /**
   * Refresh the current status
   */
  refresh: () => void;
}

export function useRateLimiter(options: UseRateLimiterOptions): UseRateLimiterReturn {
  const { user } = useAuth();
  const [status, setStatus] = useState<RateLimitResult | null>(null);

  const config = useMemo(() => {
    const baseConfig = RATE_LIMIT_CONFIGS[options.type];
    return {
      ...baseConfig,
      ...options.customConfig,
    };
  }, [options.type, options.customConfig]);

  const endpoint = options.endpoint || options.type;
  const userId = user?.id || null;

  const checkLimit = useCallback((): RateLimitResult => {
    const key = generateRateLimitKey(userId, endpoint, config.keyPrefix);
    const result = checkRateLimit(key, config);
    setStatus(result);
    return result;
  }, [userId, endpoint, config]);

  const getStatus = useCallback((): RateLimitResult => {
    const key = generateRateLimitKey(userId, endpoint, config.keyPrefix);
    const result = getRateLimitStatus(key, config);
    setStatus(result);
    return result;
  }, [userId, endpoint, config]);

  const refresh = useCallback(() => {
    getStatus();
  }, [getStatus]);

  return {
    checkLimit,
    getStatus,
    isLimited: status ? !status.allowed : false,
    remaining: status?.remaining ?? config.maxRequests,
    resetAt: status?.resetAt ?? null,
    retryAfter: status?.retryAfter ?? null,
    refresh,
  };
}

/**
 * Hook for tracking login attempts and lockouts
 */
interface UseLoginRateLimitReturn {
  /**
   * Record a failed login attempt
   */
  recordFailure: () => {
    locked: boolean;
    attemptsRemaining: number;
    lockoutEndsAt?: number;
  };
  /**
   * Clear failed attempts (call on successful login)
   */
  clearAttempts: () => void;
  /**
   * Check current lockout status
   */
  checkLockout: () => {
    locked: boolean;
    lockoutEndsAt?: number;
    attemptsRemaining: number;
  };
}

export function useLoginRateLimit(identifier: string): UseLoginRateLimitReturn {
  const recordFailure = useCallback(() => {
    return recordFailedLogin(identifier);
  }, [identifier]);

  const clearAttempts = useCallback(() => {
    clearFailedLogins(identifier);
  }, [identifier]);

  const checkLockout = useCallback(() => {
    return isLockedOut(identifier);
  }, [identifier]);

  return {
    recordFailure,
    clearAttempts,
    checkLockout,
  };
}

/**
 * Higher-order function to wrap async operations with rate limiting
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  rateLimiter: UseRateLimiterReturn,
  onLimited?: (result: RateLimitResult) => void
): (...args: Parameters<T>) => Promise<ReturnType<T> | null> {
  return async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
    const result = rateLimiter.checkLimit();

    if (!result.allowed) {
      onLimited?.(result);
      return null;
    }

    return fn(...args);
  };
}
