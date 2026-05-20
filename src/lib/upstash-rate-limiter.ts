/**
 * Upstash Redis Rate Limiter
 * 
 * Production-grade rate limiting using Upstash Redis.
 * Implements sliding window algorithm for accurate rate limiting.
 * 
 * Features:
 * - Sliding window rate limiting (accurate count per time window)
 * - IP-based and user-based limiting
 * - Configurable thresholds per endpoint
 * - Automatic cleanup (TTL-based)
 * - Distributed across servers
 * - Vercel-compatible
 * 
 * Setup:
 * 1. Install: npm install @upstash/redis
 * 2. Add env vars:
 *    UPSTASH_REDIS_REST_URL=https://...
 *    UPSTASH_REDIS_REST_TOKEN=...
 * 3. Import and use in routes
 */

import { Redis } from "@upstash/redis";

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

/**
 * Rate limit configuration per endpoint
 */
export const RATE_LIMIT_CONFIG = {
  registration: {
    label: "Registration",
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: "ratelimit:register:",
  },
  forgotPassword: {
    label: "Forgot Password",
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: "ratelimit:forgot_pwd:",
  },
  login: {
    label: "Login",
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: "ratelimit:login:",
  },
  passwordReset: {
    label: "Password Reset",
    maxRequests: 3,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    keyPrefix: "ratelimit:pwd_reset:",
  },
  emailVerification: {
    label: "Email Verification",
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: "ratelimit:verify_email:",
  },
} as const;

/**
 * Rate limit identifier types
 */
export type RateLimitType = keyof typeof RATE_LIMIT_CONFIG;

/**
 * Sliding window rate limit check
 * 
 * Algorithm: Counts requests in the current time window and allows/denies based on threshold
 * More accurate than fixed window, prevents thundering herd at window boundaries
 */
export async function checkRateLimit(
  type: RateLimitType,
  identifier: string,
  options?: {
    customKey?: string;
    ipBased?: boolean;
    userBased?: boolean;
  }
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter: number;
}> {
  const config = RATE_LIMIT_CONFIG[type];
  
  // Build composite key (IP + user or just IP)
  let key: string;
  if (options?.customKey) {
    key = `${config.keyPrefix}${options.customKey}`;
  } else {
    key = `${config.keyPrefix}${identifier}`;
  }

  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  try {
    // Use Redis ZSET to implement sliding window
    // Remove old entries outside the window
    await redis.zremrangebyscore(key, 0, windowStart);

    // Get current count in window
    const currentCount = await redis.zcard(key);

    if (currentCount < config.maxRequests) {
      // Request is allowed - add it to the set
      await redis.zadd(key, {
        score: now,
        member: `${now}-${Math.random()}`, // Unique member
      });

      // Set TTL to window size + buffer to clean up old keys
      await redis.expire(key, Math.ceil(config.windowMs / 1000) + 60);

      return {
        allowed: true,
        remaining: config.maxRequests - currentCount - 1,
        resetTime: now + config.windowMs,
        retryAfter: 0,
      };
    } else {
      // Rate limit exceeded - get earliest request time for reset
      const oldest = await redis.zrange(key, 0, 0, { byScore: true, withScores: true });
      const resetTime =
        oldest && oldest.length > 1
          ? (oldest[1] as number) + config.windowMs
          : now + config.windowMs;

      const retryAfter = Math.max(
        1,
        Math.ceil((resetTime - now) / 1000)
      );

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter,
      };
    }
  } catch (error) {
    console.error("[ERROR] Rate limit check failed:", {
      type,
      identifier,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    // Fail open - allow request if Redis fails (better than blocking users)
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
      retryAfter: 0,
    };
  }
}

/**
 * Combined IP + User identifier
 * Use this when user is authenticated for stricter limits
 */
export function createUserIdentifier(ip: string, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  return `ip:${ip}`;
}

/**
 * Extract client IP from request headers
 * Handles proxies and various header formats
 */
export function extractClientIP(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return (
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    headers.get("x-client-ip") ||
    "unknown"
  );
}

/**
 * Format rate limit response
 */
export function createRateLimitResponse(
  type: RateLimitType,
  retryAfter: number
) {
  const config = RATE_LIMIT_CONFIG[type];
  return {
    error: "TOO_MANY_REQUESTS",
    message: `Too many ${config.label.toLowerCase()} attempts. Please try again later.`,
    retryAfter,
  };
}

/**
 * Set rate limit headers on response
 */
export function setRateLimitHeaders(
  response: any,
  result: {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter: number;
  }
): any {
  response.headers.set("X-RateLimit-Limit", "1"); // Can vary by config
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set(
    "X-RateLimit-Reset",
    String(Math.ceil(result.resetTime / 1000))
  );
  if (result.retryAfter > 0) {
    response.headers.set("Retry-After", String(result.retryAfter));
  }
  return response;
}

/**
 * Reset rate limit for an identifier (admin function)
 */
export async function resetRateLimit(
  type: RateLimitType,
  identifier: string
): Promise<void> {
  const config = RATE_LIMIT_CONFIG[type];
  const key = `${config.keyPrefix}${identifier}`;
  await redis.del(key);
}

/**
 * Get rate limit stats for monitoring
 */
export async function getRateLimitStats(
  type: RateLimitType,
  identifier: string
): Promise<{
  currentCount: number;
  maxRequests: number;
  windowMs: number;
  percentageUsed: number;
}> {
  const config = RATE_LIMIT_CONFIG[type];
  const key = `${config.keyPrefix}${identifier}`;

  try {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    await redis.zremrangebyscore(key, 0, windowStart);
    const currentCount = await redis.zcard(key);

    return {
      currentCount,
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      percentageUsed: (currentCount / config.maxRequests) * 100,
    };
  } catch (error) {
    console.error("[ERROR] Failed to get rate limit stats:", {
      type,
      identifier,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      currentCount: 0,
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      percentageUsed: 0,
    };
  }
}

export { redis };
