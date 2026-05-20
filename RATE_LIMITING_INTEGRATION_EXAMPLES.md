/**
 * Rate Limiting Integration Examples
 * 
 * This file shows how to integrate Upstash Redis rate limiting
 * into different types of API routes.
 * 
 * See the actual route files for complete implementations.
 */

// ============================================================================
// EXAMPLE 1: Registration Route (IP-based)
// File: src/app/api/auth/register/route.ts
// ============================================================================

import { withRateLimit } from "@/lib/rate-limit-middleware";
import { NextRequest, NextResponse } from "next/server";

/**
 * Basic rate limiting with wrapper
 * - 5 attempts per 15 minutes per IP
 * - Automatic IP extraction
 * - Standard response formatting
 */
const registerHandler = withRateLimit("registration")(
  async (request: NextRequest) => {
    // Your existing registration logic here
    // The rate limit check happens automatically before this

    const body = await request.json();

    // Validate, hash password, create user, send email, etc.

    return NextResponse.json(
      {
        message: "Account created successfully. Please check your email.",
        userId: "user-uuid",
      },
      { status: 201 }
    );
  }
);

// This would be your actual export
// export const POST = registerHandler;

// ============================================================================
// EXAMPLE 2: Login Route (with custom logging)
// File: src/app/api/auth/[...nextauth]/route.ts
// ============================================================================

const loginHandler = withRateLimit("login", {
  debug: true, // Enable debug logging
  onLimitExceeded: async (context) => {
    console.warn("[SECURITY ALERT] Login brute force attempt:", {
      ip: context.ip,
      timestamp: context.timestamp,
    });
    // TODO: Send alert to admin, increment brute force counter, etc.
  },
})(async (request: NextRequest) => {
  // Login logic here
  return NextResponse.json({ sessionId: "..." }, { status: 200 });
});

// export const POST = loginHandler;

// ============================================================================
// EXAMPLE 3: Forgot Password (stricter limits)
// File: src/app/api/forgot-password/route.ts
// ============================================================================

const forgotPasswordHandler = withRateLimit("forgotPassword", {
  // Custom identifier: by email instead of IP
  // This prevents one person from flooding multiple emails
  getIdentifier: async (request) => {
    const body = await request.json();
    const email = body.email?.toLowerCase() || "";
    return `email:${email}`;
  },
  onLimitExceeded: async (context) => {
    console.warn("[SECURITY] Password reset attempt throttled:", {
      identifier: context.identifier,
      timestamp: context.timestamp,
    });
  },
})(async (request: NextRequest) => {
  // Forgot password logic
  return NextResponse.json(
    { message: "If email exists, reset link will be sent" },
    { status: 200 }
  );
});

// export const POST = forgotPasswordHandler;

// ============================================================================
// EXAMPLE 4: Authenticated Endpoint (user-based limiting)
// File: src/app/api/user/settings/route.ts
// ============================================================================

import { auth } from "@/lib/auth";

// For authenticated endpoints, use per-user limiting
const authenticatedHandler = withRateLimit("login", {
  getUserId: async () => {
    const session = await auth();
    return session?.user?.id;
  },
  // If not authenticated, fall back to IP-based
})(async (request: NextRequest) => {
  // Your authenticated endpoint logic
  return NextResponse.json({ data: "..." }, { status: 200 });
});

// export const GET = authenticatedHandler;

// ============================================================================
// EXAMPLE 5: Multiple Rate Limits (Composition)
// File: Endpoint with multiple rules
// ============================================================================

import { composeRateLimits } from "@/lib/rate-limit-middleware";

// Apply multiple limiters - per-IP and per-email
const composedHandler = composeRateLimits(
  [
    "registration",
    {
      // First limit: per IP (5 per 15 min)
      onLimitExceeded: async (context) => {
        console.warn("[IP LIMIT] Registration from IP:", context.ip);
      },
    },
  ],
  [
    "forgotPassword",
    {
      // Second limit: per email (3 per hour)
      getIdentifier: async (request) => {
        const body = await request.json();
        return `email:${body.email}`;
      },
      onLimitExceeded: async (context) => {
        console.warn("[EMAIL LIMIT] Too many attempts for email:", context.identifier);
      },
    },
  ]
)(async (request: NextRequest) => {
  // Handler - both limits are checked before reaching here
  return NextResponse.json({ success: true }, { status: 201 });
});

// ============================================================================
// EXAMPLE 6: Custom Configuration
// ============================================================================

import {
  extractClientIP,
  checkRateLimit,
  setRateLimitHeaders,
  createRateLimitResponse,
} from "@/lib/upstash-rate-limiter";

// Manual integration (if middleware doesn't suit your needs)
export async function manualRateLimitExample(
  request: NextRequest
): Promise<Response> {
  const ip = extractClientIP(request.headers);

  // Check rate limit
  const result = await checkRateLimit("registration", ip);

  if (!result.allowed) {
    const response = NextResponse.json(
      createRateLimitResponse("registration", result.retryAfter),
      { status: 429 }
    );
    return setRateLimitHeaders(response, result);
  }

  // Process request
  const response = NextResponse.json({ success: true }, { status: 201 });

  // Add rate limit headers
  return setRateLimitHeaders(response, result);
}

// ============================================================================
// EXAMPLE 7: Skip Rate Limiting for Health Checks
// ============================================================================

const healthCheckHandler = withRateLimit("registration", {
  shouldSkip: (request) => {
    // Skip rate limiting for health checks
    return request.nextUrl.pathname === "/api/health";
  },
})(async (request: NextRequest) => {
  return NextResponse.json({ status: "ok" }, { status: 200 });
});

// ============================================================================
// EXAMPLE 8: Rate Limit Headers in Response
// ============================================================================

/**
 * All wrapped handlers automatically include these headers:
 * 
 * X-RateLimit-Limit: 5                    // Max requests
 * X-RateLimit-Remaining: 3                // Requests left in window
 * X-RateLimit-Reset: 1698765432           // Unix timestamp when limit resets
 * Retry-After: 847                        // Seconds to wait before retry (429 only)
 * 
 * Example 429 Response:
 * {
 *   "error": "TOO_MANY_REQUESTS",
 *   "message": "Too many registration attempts. Please try again later.",
 *   "retryAfter": 847
 * }
 */

// ============================================================================
// ENVIRONMENT VARIABLES REQUIRED
// ============================================================================

/**
 * Add to .env.local:
 * 
 * UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
 * UPSTASH_REDIS_REST_TOKEN=your-secure-token
 * 
 * Get these from: https://console.upstash.com/redis
 */

// ============================================================================
// TESTING RATE LIMITS
// ============================================================================

/**
 * Test registration rate limit (5 requests per 15 minutes):
 * 
 * for i in {1..6}; do
 *   curl -X POST http://localhost:3000/api/auth/register \
 *     -H "Content-Type: application/json" \
 *     -d '{
 *       "name":"Test User",
 *       "email":"test@example.com",
 *       "password":"Test@12345",
 *       "confirmPassword":"Test@12345"
 *     }' \
 *     -w "\nStatus: %{http_code}\n"
 *   sleep 2
 * done
 * 
 * Requests 1-5: Should succeed (201 or 400 if validation fails)
 * Request 6: Should be rate limited (429)
 * 
 * Check headers:
 * curl -X POST http://localhost:3000/api/auth/register \
 *   -H "Content-Type: application/json" \
 *   -d '...' \
 *   -i
 * 
 * Look for:
 * HTTP/1.1 429 Too Many Requests
 * X-RateLimit-Remaining: 0
 * X-RateLimit-Reset: 1698765432
 * Retry-After: 847
 */

// ============================================================================
// MONITORING & DEBUGGING
// ============================================================================

/**
 * To debug rate limiting in development:
 * 
 * 1. Enable debug mode:
 *    withRateLimit("registration", { debug: true })(handler)
 * 
 * 2. Watch Redis key activity:
 *    - Registration: ratelimit:register:*
 *    - Login: ratelimit:login:*
 *    - Forgot Password: ratelimit:forgot_pwd:*
 * 
 * 3. Check Upstash dashboard:
 *    - Monitor command usage
 *    - View key statistics
 *    - Check database size
 * 
 * 4. Logs to check:
 *    - [RATE-LIMIT] messages for normal activity
 *    - [SECURITY] messages for limit exceeded
 *    - [ERROR] messages for failures
 */
