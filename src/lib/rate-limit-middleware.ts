/**
 * Rate Limiting Middleware/Wrapper
 * 
 * High-level wrapper around Upstash rate limiter for easy integration into routes.
 * Handles IP extraction, rate limit checking, and response formatting.
 * 
 * Usage in routes:
 * ```ts
 * import { withRateLimit } from "@/lib/rate-limit-middleware";
 * import { type NextRequest } from "next/server";
 * 
 * const handler = withRateLimit("registration")(async (request) => {
 *   // Your route handler
 *   return NextResponse.json({ success: true }, { status: 201 });
 * });
 * 
 * export const POST = handler;
 * ```
 */

import { NextResponse, type NextRequest } from "next/server";
import {
  checkRateLimit,
  type RateLimitType,
  extractClientIP,
  createRateLimitResponse,
  setRateLimitHeaders,
  createUserIdentifier,
} from "./upstash-rate-limiter";

/**
 * Rate limit middleware wrapper
 */
export function withRateLimit(
  type: RateLimitType,
  options?: {
    /**
     * Extract user ID from request (for authenticated endpoints)
     * Use this for stricter per-user limits
     */
    getUserId?: (request: NextRequest) => Promise<string | undefined>;

    /**
     * Custom identifier extraction
     * Overrides default IP-based identification
     */
    getIdentifier?: (request: NextRequest) => Promise<string>;

    /**
     * Custom key for combining with identifier
     * Useful for API keys or custom identifiers
     */
    getCustomKey?: (request: NextRequest) => Promise<string | undefined>;

    /**
     * Skip rate limiting for certain requests
     * Useful for health checks, metrics, etc.
     */
    shouldSkip?: (request: NextRequest) => boolean;

    /**
     * Callback when rate limit is hit
     * Useful for logging, alerts, etc.
     */
    onLimitExceeded?: (context: {
      type: RateLimitType;
      identifier: string;
      ip: string;
      timestamp: string;
    }) => Promise<void>;

    /**
     * Log rate limit checks (useful for debugging)
     */
    debug?: boolean;
  }
) {
  return (
    handler: (request: NextRequest) => Promise<Response>
  ) => {
    return async (request: NextRequest): Promise<Response> => {
      try {
        // Allow skipping rate limiting for certain requests
        if (options?.shouldSkip?.(request)) {
          return handler(request);
        }

        // Extract IP
        const ip = extractClientIP(request.headers);

        // Get identifier
        let identifier: string;
        if (options?.getIdentifier) {
          identifier = await options.getIdentifier(request);
        } else {
          identifier = ip;
        }

        // Get custom key if provided
        let customKey: string | undefined;
        if (options?.getCustomKey) {
          customKey = await options.getCustomKey(request);
        }

        // Get user ID for authenticated requests
        let userId: string | undefined;
        if (options?.getUserId) {
          userId = await options.getUserId(request);
        }

        // Check rate limit
        const result = await checkRateLimit(type, identifier, {
          customKey,
          ipBased: !userId,
          userBased: !!userId,
        });

        // Rate limit exceeded
        if (!result.allowed) {
          if (options?.onLimitExceeded) {
            await options.onLimitExceeded({
              type,
              identifier,
              ip,
              timestamp: new Date().toISOString(),
            });
          }

          console.warn("[SECURITY] Rate limit exceeded:", {
            type,
            identifier,
            customKey,
            userId,
            ip,
            timestamp: new Date().toISOString(),
          });

          const response = NextResponse.json(
            createRateLimitResponse(type, result.retryAfter),
            { status: 429 }
          );

          return setRateLimitHeaders(response, result);
        }

        // Request allowed - call handler
        let response: Response;
        try {
          response = await handler(request);
        } catch (error) {
          console.error("[ERROR] Handler failed:", {
            type,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }

        // Add rate limit headers to successful response
        return setRateLimitHeaders(response, result);
      } catch (error) {
        console.error("[ERROR] Rate limit middleware failed:", {
          error: error instanceof Error ? error.message : String(error),
          type,
          pathname: request.nextUrl.pathname,
        });

        // Fail open - allow request if middleware fails
        // This prevents blocking legitimate users
        return handler(request);
      }
    };
  };
}

/**
 * Middleware for routes that require authentication
 * Allows stricter per-user rate limiting
 */
export function withAuthenticatedRateLimit(
  type: RateLimitType,
  getUserId: (request: NextRequest) => Promise<string | undefined>,
  options?: Parameters<typeof withRateLimit>[1]
) {
  return withRateLimit(type, {
    ...options,
    getUserId,
  });
}

/**
 * Middleware factory for custom rate limit configurations
 */
export function withCustomRateLimit(
  config: {
    maxRequests: number;
    windowMs: number;
    keyPrefix: string;
    label: string;
  },
  options?: Parameters<typeof withRateLimit>[1]
) {
  // This would require extending the RATE_LIMIT_CONFIG
  // For now, use standard withRateLimit with custom getIdentifier
  return withRateLimit("login", options);
}

/**
 * Compose multiple rate limit middleware
 * Useful for endpoints with multiple rate limit rules
 */
export function composeRateLimits(
  ...limiters: Parameters<typeof withRateLimit>[]
) {
  return (handler: (request: NextRequest) => Promise<Response>) => {
    let finalHandler = handler;

    // Apply limiters from last to first (proper composition order)
    for (let i = limiters.length - 1; i >= 0; i--) {
      const [type, options] = limiters[i];
      finalHandler = withRateLimit(type, options)(finalHandler);
    }

    return finalHandler;
  };
}
