import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkRateLimit,
  getRateLimitStatus,
  generateRateLimitKey,
  resetRateLimit,
  createRateLimiter,
  recordFailedLogin,
  clearFailedLogins,
  isLockedOut,
  RATE_LIMIT_CONFIGS,
  LOGIN_LOCKOUT_CONFIG,
} from './rate-limiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Reset all rate limits before each test
    // Since we can't easily clear the internal store, we'll use unique keys
  });

  describe('generateRateLimitKey', () => {
    it('should generate key with user id and endpoint', () => {
      const key = generateRateLimitKey('user123', '/api/test', 'api');
      expect(key).toBe('api:user123:/api/test');
    });

    it('should handle anonymous users', () => {
      const key = generateRateLimitKey(null, '/api/test', 'api');
      expect(key).toBe('api:anonymous:/api/test');
    });

    it('should handle missing prefix', () => {
      const key = generateRateLimitKey('user123', '/api/test');
      expect(key).toBe('user123:/api/test');
    });
  });

  describe('checkRateLimit', () => {
    it('should allow first request', () => {
      const key = `test:${Date.now()}:first`;
      const config = { maxRequests: 5, windowMs: 60000 };

      const result = checkRateLimit(key, config);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should track request count correctly', () => {
      const key = `test:${Date.now()}:count`;
      const config = { maxRequests: 5, windowMs: 60000 };

      // Make 4 requests
      checkRateLimit(key, config);
      checkRateLimit(key, config);
      checkRateLimit(key, config);
      const result = checkRateLimit(key, config);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it('should block requests when limit exceeded', () => {
      const key = `test:${Date.now()}:block`;
      const config = { maxRequests: 3, windowMs: 60000 };

      // Exhaust the limit
      checkRateLimit(key, config);
      checkRateLimit(key, config);
      checkRateLimit(key, config);

      const result = checkRateLimit(key, config);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset after window expires', async () => {
      const key = `test:${Date.now()}:reset`;
      const config = { maxRequests: 2, windowMs: 100 }; // 100ms window

      // Exhaust the limit
      checkRateLimit(key, config);
      checkRateLimit(key, config);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      const result = checkRateLimit(key, config);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return status without incrementing counter', () => {
      const key = `test:${Date.now()}:status`;
      const config = { maxRequests: 5, windowMs: 60000 };

      // Check status first
      const status1 = getRateLimitStatus(key, config);
      expect(status1.remaining).toBe(5);

      // Check again - should still be 5
      const status2 = getRateLimitStatus(key, config);
      expect(status2.remaining).toBe(5);
    });

    it('should reflect current count after requests', () => {
      const key = `test:${Date.now()}:status2`;
      const config = { maxRequests: 5, windowMs: 60000 };

      // Make some requests
      checkRateLimit(key, config);
      checkRateLimit(key, config);

      const status = getRateLimitStatus(key, config);
      expect(status.remaining).toBe(3);
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for a key', () => {
      const key = `test:${Date.now()}:resetkey`;
      const config = { maxRequests: 3, windowMs: 60000 };

      // Exhaust the limit
      checkRateLimit(key, config);
      checkRateLimit(key, config);
      checkRateLimit(key, config);

      // Should be blocked
      expect(checkRateLimit(key, config).allowed).toBe(false);

      // Reset
      resetRateLimit(key);

      // Should be allowed again
      const result = checkRateLimit(key, config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });
  });

  describe('createRateLimiter', () => {
    it('should create a rate limiter with check and reset methods', () => {
      const config = { maxRequests: 5, windowMs: 60000, keyPrefix: 'test' };
      const limiter = createRateLimiter(config);

      expect(limiter.check).toBeDefined();
      expect(limiter.status).toBeDefined();
      expect(limiter.reset).toBeDefined();
    });

    it('should work correctly through the interface', () => {
      const config = { maxRequests: 2, windowMs: 60000, keyPrefix: `limiter:${Date.now()}` };
      const limiter = createRateLimiter(config);

      const result1 = limiter.check('user1', 'endpoint1');
      expect(result1.allowed).toBe(true);

      const result2 = limiter.check('user1', 'endpoint1');
      expect(result2.allowed).toBe(true);

      const result3 = limiter.check('user1', 'endpoint1');
      expect(result3.allowed).toBe(false);

      limiter.reset('user1', 'endpoint1');

      const result4 = limiter.check('user1', 'endpoint1');
      expect(result4.allowed).toBe(true);
    });
  });

  describe('RATE_LIMIT_CONFIGS', () => {
    it('should have all required configurations', () => {
      expect(RATE_LIMIT_CONFIGS.auth).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.login).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.api).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.bulk).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.export).toBeDefined();
      expect(RATE_LIMIT_CONFIGS.email).toBeDefined();
    });

    it('should have stricter limits for login than general API', () => {
      expect(RATE_LIMIT_CONFIGS.login.maxRequests).toBeLessThanOrEqual(
        RATE_LIMIT_CONFIGS.api.maxRequests
      );
    });
  });
});

describe('Login Attempt Tracker', () => {
  describe('recordFailedLogin', () => {
    it('should track first failed login', () => {
      const identifier = `login:${Date.now()}:1`;
      const result = recordFailedLogin(identifier);

      expect(result.locked).toBe(false);
      expect(result.attemptsRemaining).toBe(LOGIN_LOCKOUT_CONFIG.maxAttempts - 1);
    });

    it('should lock after max attempts', () => {
      const identifier = `login:${Date.now()}:2`;

      // Make max-1 attempts
      for (let i = 0; i < LOGIN_LOCKOUT_CONFIG.maxAttempts - 1; i++) {
        recordFailedLogin(identifier);
      }

      // Final attempt should trigger lock
      const result = recordFailedLogin(identifier);

      expect(result.locked).toBe(true);
      expect(result.attemptsRemaining).toBe(0);
      expect(result.lockoutEndsAt).toBeDefined();
    });

    it('should remain locked on subsequent attempts', () => {
      const identifier = `login:${Date.now()}:3`;

      // Lock the account
      for (let i = 0; i < LOGIN_LOCKOUT_CONFIG.maxAttempts; i++) {
        recordFailedLogin(identifier);
      }

      // Try again while locked
      const result = recordFailedLogin(identifier);

      expect(result.locked).toBe(true);
      expect(result.attemptsRemaining).toBe(0);
    });
  });

  describe('clearFailedLogins', () => {
    it('should clear failed login attempts', () => {
      const identifier = `login:${Date.now()}:4`;

      // Make some failed attempts
      recordFailedLogin(identifier);
      recordFailedLogin(identifier);

      // Clear attempts
      clearFailedLogins(identifier);

      // Check lockout status
      const status = isLockedOut(identifier);
      expect(status.locked).toBe(false);
      expect(status.attemptsRemaining).toBe(LOGIN_LOCKOUT_CONFIG.maxAttempts);
    });
  });

  describe('isLockedOut', () => {
    it('should return not locked for new identifier', () => {
      const identifier = `login:${Date.now()}:5`;
      const result = isLockedOut(identifier);

      expect(result.locked).toBe(false);
      expect(result.attemptsRemaining).toBe(LOGIN_LOCKOUT_CONFIG.maxAttempts);
    });

    it('should return locked status when locked', () => {
      const identifier = `login:${Date.now()}:6`;

      // Lock the account
      for (let i = 0; i < LOGIN_LOCKOUT_CONFIG.maxAttempts; i++) {
        recordFailedLogin(identifier);
      }

      const result = isLockedOut(identifier);

      expect(result.locked).toBe(true);
      expect(result.lockoutEndsAt).toBeDefined();
      expect(result.attemptsRemaining).toBe(0);
    });

    it('should return current attempts remaining', () => {
      const identifier = `login:${Date.now()}:7`;

      recordFailedLogin(identifier);
      recordFailedLogin(identifier);

      const result = isLockedOut(identifier);

      expect(result.locked).toBe(false);
      expect(result.attemptsRemaining).toBe(LOGIN_LOCKOUT_CONFIG.maxAttempts - 2);
    });
  });
});
