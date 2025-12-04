/**
 * Rate-Limited Fetch Utility
 * Wraps fetch requests with automatic rate limiting
 */

import {
  checkRateLimit,
  generateRateLimitKey,
  RATE_LIMIT_CONFIGS,
  RateLimitConfig,
  RateLimitResult,
} from './rate-limiter';

export interface RateLimitedFetchOptions extends RequestInit {
  rateLimitType?: keyof typeof RATE_LIMIT_CONFIGS;
  customRateLimit?: RateLimitConfig;
  userId?: string;
  onRateLimited?: (result: RateLimitResult) => void;
}

export interface RateLimitedResponse<T = any> {
  data: T | null;
  error: Error | null;
  rateLimitResult: RateLimitResult;
  response: Response | null;
}

/**
 * Create a rate-limited fetch function
 */
export function createRateLimitedFetch(defaultUserId?: string) {
  return async function rateLimitedFetch<T = any>(
    url: string,
    options: RateLimitedFetchOptions = {}
  ): Promise<RateLimitedResponse<T>> {
    const {
      rateLimitType = 'api',
      customRateLimit,
      userId = defaultUserId,
      onRateLimited,
      ...fetchOptions
    } = options;

    const config = customRateLimit || RATE_LIMIT_CONFIGS[rateLimitType];
    const endpoint = new URL(url, window.location.origin).pathname;
    const key = generateRateLimitKey(userId || null, endpoint, config.keyPrefix);

    // Check rate limit
    const rateLimitResult = checkRateLimit(key, config);

    if (!rateLimitResult.allowed) {
      onRateLimited?.(rateLimitResult);
      return {
        data: null,
        error: new Error(
          `Rate limit exceeded. Please retry after ${rateLimitResult.retryAfter} seconds.`
        ),
        rateLimitResult,
        response: null,
      };
    }

    try {
      const response = await fetch(url, fetchOptions);

      // Check for server-side rate limit response
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const serverRateLimitResult: RateLimitResult = {
          allowed: false,
          remaining: 0,
          resetAt: Date.now() + (parseInt(retryAfter || '60', 10) * 1000),
          retryAfter: parseInt(retryAfter || '60', 10),
        };

        onRateLimited?.(serverRateLimitResult);
        return {
          data: null,
          error: new Error('Server rate limit exceeded'),
          rateLimitResult: serverRateLimitResult,
          response,
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data,
        error: null,
        rateLimitResult,
        response,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
        rateLimitResult,
        response: null,
      };
    }
  };
}

/**
 * Simple rate-limited fetch function
 */
export const rateLimitedFetch = createRateLimitedFetch();

/**
 * Queue for serializing requests when rate limited
 */
interface QueuedRequest<T> {
  url: string;
  options: RateLimitedFetchOptions;
  resolve: (value: RateLimitedResponse<T>) => void;
  reject: (reason: any) => void;
}

export class RateLimitedRequestQueue {
  private queue: QueuedRequest<any>[] = [];
  private processing = false;
  private userId: string | null;

  constructor(userId?: string) {
    this.userId = userId || null;
  }

  async enqueue<T = any>(
    url: string,
    options: RateLimitedFetchOptions = {}
  ): Promise<RateLimitedResponse<T>> {
    return new Promise((resolve, reject) => {
      this.queue.push({ url, options, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift();
      if (!request) continue;

      try {
        const fetch = createRateLimitedFetch(this.userId || undefined);
        const result = await fetch(request.url, request.options);

        if (!result.rateLimitResult.allowed && result.rateLimitResult.retryAfter) {
          // Re-queue and wait
          this.queue.unshift(request);
          await new Promise(resolve =>
            setTimeout(resolve, result.rateLimitResult.retryAfter! * 1000)
          );
        } else {
          request.resolve(result);
        }
      } catch (error) {
        request.reject(error);
      }
    }

    this.processing = false;
  }

  clear(): void {
    this.queue = [];
  }

  get length(): number {
    return this.queue.length;
  }
}
