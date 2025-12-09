/**
 * Rate Limiter Utility
 * Implements per-user and per-endpoint rate limiting
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for client-side rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default configurations for different endpoint types
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints - stricter limits
  auth: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'auth',
  },
  // Login attempts - very strict
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: 'login',
  },
  // Password reset - prevent abuse
  passwordReset: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'password_reset',
  },
  // API calls - general limit
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'api',
  },
  // Bulk operations - stricter limit
  bulk: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'bulk',
  },
  // Export operations - very limited
  export: {
    maxRequests: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
    keyPrefix: 'export',
  },
  // File uploads
  upload: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'upload',
  },
  // Email sending
  email: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'email',
  },
} as const;

/**
 * Generate a unique key for rate limiting
 */
export function generateRateLimitKey(
  userId: string | null,
  endpoint: string,
  prefix?: string
): string {
  const userPart = userId || 'anonymous';
  const prefixPart = prefix ? `${prefix}:` : '';
  return `${prefixPart}${userPart}:${endpoint}`;
}

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();

  // Cleanup old entries periodically
  if (Math.random() < 0.1) {
    cleanupExpiredEntries();
  }

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    // No entry or expired - create new window
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Entry exists and is still valid
  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  // Increment counter
  entry.count += 1;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Reset rate limit for a specific key
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
    };
  }

  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    allowed: remaining > 0,
    remaining,
    resetAt: entry.resetAt,
    retryAfter: remaining === 0 ? Math.ceil((entry.resetAt - now) / 1000) : undefined,
  };
}

/**
 * Create a rate limiter for a specific endpoint
 */
export function createRateLimiter(config: RateLimitConfig) {
  return {
    check: (userId: string | null, endpoint: string): RateLimitResult => {
      const key = generateRateLimitKey(userId, endpoint, config.keyPrefix);
      return checkRateLimit(key, config);
    },
    status: (userId: string | null, endpoint: string): RateLimitResult => {
      const key = generateRateLimitKey(userId, endpoint, config.keyPrefix);
      return getRateLimitStatus(key, config);
    },
    reset: (userId: string | null, endpoint: string): void => {
      const key = generateRateLimitKey(userId, endpoint, config.keyPrefix);
      resetRateLimit(key);
    },
  };
}

/**
 * Rate limit tracking for failed login attempts
 */
interface LoginAttemptTracker {
  attempts: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

const loginAttemptStore = new Map<string, LoginAttemptTracker>();

export const LOGIN_LOCKOUT_CONFIG = {
  maxAttempts: 5,
  lockoutDurationMs: 15 * 60 * 1000, // 15 minutes
  attemptWindowMs: 5 * 60 * 1000, // 5 minutes
};

/**
 * Record a failed login attempt
 */
export function recordFailedLogin(identifier: string): {
  locked: boolean;
  attemptsRemaining: number;
  lockoutEndsAt?: number;
} {
  const now = Date.now();
  const tracker = loginAttemptStore.get(identifier);

  // Check if currently locked out
  if (tracker?.lockedUntil && tracker.lockedUntil > now) {
    return {
      locked: true,
      attemptsRemaining: 0,
      lockoutEndsAt: tracker.lockedUntil,
    };
  }

  // Check if we should reset the counter (window expired)
  if (!tracker || now - tracker.lastAttempt > LOGIN_LOCKOUT_CONFIG.attemptWindowMs) {
    loginAttemptStore.set(identifier, {
      attempts: 1,
      lastAttempt: now,
      lockedUntil: null,
    });
    return {
      locked: false,
      attemptsRemaining: LOGIN_LOCKOUT_CONFIG.maxAttempts - 1,
    };
  }

  // Increment attempts
  const newAttempts = tracker.attempts + 1;

  if (newAttempts >= LOGIN_LOCKOUT_CONFIG.maxAttempts) {
    // Lock the account
    const lockoutEndsAt = now + LOGIN_LOCKOUT_CONFIG.lockoutDurationMs;
    loginAttemptStore.set(identifier, {
      attempts: newAttempts,
      lastAttempt: now,
      lockedUntil: lockoutEndsAt,
    });
    return {
      locked: true,
      attemptsRemaining: 0,
      lockoutEndsAt,
    };
  }

  loginAttemptStore.set(identifier, {
    attempts: newAttempts,
    lastAttempt: now,
    lockedUntil: null,
  });

  return {
    locked: false,
    attemptsRemaining: LOGIN_LOCKOUT_CONFIG.maxAttempts - newAttempts,
  };
}

/**
 * Clear failed login attempts on successful login
 */
export function clearFailedLogins(identifier: string): void {
  loginAttemptStore.delete(identifier);
}

/**
 * Check if an identifier is currently locked out
 */
export function isLockedOut(identifier: string): {
  locked: boolean;
  lockoutEndsAt?: number;
  attemptsRemaining: number;
} {
  const now = Date.now();
  const tracker = loginAttemptStore.get(identifier);

  if (!tracker) {
    return {
      locked: false,
      attemptsRemaining: LOGIN_LOCKOUT_CONFIG.maxAttempts,
    };
  }

  if (tracker.lockedUntil && tracker.lockedUntil > now) {
    return {
      locked: true,
      lockoutEndsAt: tracker.lockedUntil,
      attemptsRemaining: 0,
    };
  }

  // Check if window expired
  if (now - tracker.lastAttempt > LOGIN_LOCKOUT_CONFIG.attemptWindowMs) {
    return {
      locked: false,
      attemptsRemaining: LOGIN_LOCKOUT_CONFIG.maxAttempts,
    };
  }

  return {
    locked: false,
    attemptsRemaining: LOGIN_LOCKOUT_CONFIG.maxAttempts - tracker.attempts,
  };
}
