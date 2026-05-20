/**
 * Rate Limiting Utility
 * 
 * Provides in-memory rate limiting for API routes.
 * For production with multiple servers, use Redis instead.
 * 
 * Usage:
 * ```ts
 * const limiter = new RateLimiter({ maxRequests: 5, windowMs: 15 * 60 * 1000 });
 * const isAllowed = await limiter.check(ipAddress);
 * if (!isAllowed) return 429 response;
 * ```
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  keyPrefix?: string;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private config: RateLimitConfig;
  private store: Map<string, RequestRecord> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyPrefix: "ratelimit:",
      ...config,
    };

    // Cleanup old entries every 60 seconds to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if a request from the given identifier is allowed
   */
  async check(identifier: string): Promise<boolean> {
    const key = `${this.config.keyPrefix}${identifier}`;
    const now = Date.now();

    const record = this.store.get(key);

    // First request or window has expired
    if (!record || now > record.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    // Request is within the window
    if (record.count < this.config.maxRequests) {
      record.count++;
      return true;
    }

    // Max requests exceeded
    return false;
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemaining(identifier: string): number {
    const key = `${this.config.keyPrefix}${identifier}`;
    const record = this.store.get(key);

    if (!record || Date.now() > record.resetTime) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - record.count);
  }

  /**
   * Get reset time for an identifier (Unix timestamp)
   */
  getResetTime(identifier: string): number {
    const key = `${this.config.keyPrefix}${identifier}`;
    const record = this.store.get(key);

    if (!record || Date.now() > record.resetTime) {
      return Date.now() + this.config.windowMs;
    }

    return record.resetTime;
  }

  /**
   * Cleanup expired entries to free memory
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Reset limit for an identifier
   */
  reset(identifier: string): void {
    const key = `${this.config.keyPrefix}${identifier}`;
    this.store.delete(key);
  }

  /**
   * Clear all records
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Cleanup and close
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }

  /**
   * Get store stats (for monitoring)
   */
  getStats(): {
    totalKeys: number;
    memoryUsage: string;
  } {
    const approximateBytes = this.store.size * 100; // Rough estimate
    const mb = (approximateBytes / 1024 / 1024).toFixed(2);

    return {
      totalKeys: this.store.size,
      memoryUsage: `${mb}MB`,
    };
  }
}

// Create singleton instances for different endpoints
const registrationLimiter = new RateLimiter({
  maxRequests: 5, // 5 attempts
  windowMs: 15 * 60 * 1000, // per 15 minutes
  keyPrefix: "register:",
});

const loginLimiter = new RateLimiter({
  maxRequests: 10, // 10 attempts
  windowMs: 15 * 60 * 1000, // per 15 minutes
  keyPrefix: "login:",
});

const passwordResetLimiter = new RateLimiter({
  maxRequests: 3, // 3 attempts
  windowMs: 60 * 60 * 1000, // per hour
  keyPrefix: "pwd_reset:",
});

/**
 * Helper function to create rate limit response
 */
export function createRateLimitResponse(
  remaining: number,
  resetTime: number
) {
  return {
    message: "Too many requests. Please try again later.",
    retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
    remaining,
  };
}

/**
 * Helper function to set rate limit headers
 */
export function setRateLimitHeaders(
  response: any,
  remaining: number,
  resetTime: number
) {
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetTime / 1000)));
  response.headers.set(
    "Retry-After",
    String(Math.ceil((resetTime - Date.now()) / 1000))
  );
  return response;
}

export {
  RateLimiter,
  registrationLimiter,
  loginLimiter,
  passwordResetLimiter,
};
