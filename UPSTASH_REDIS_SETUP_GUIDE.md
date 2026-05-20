/**
 * Upstash Redis Rate Limiting Configuration
 * 
 * This guide covers everything needed to set up and use Upstash Redis
 * rate limiting in your Next.js application.
 */

// ============================================================================
// STEP 1: Create Upstash Redis Database
// ============================================================================

/**
 * 1. Go to https://console.upstash.com/redis
 * 2. Click "Create Database"
 * 3. Choose:
 *    - Type: Redis
 *    - Name: "iyosiola-rate-limiting" (or similar)
 *    - Region: Choose closest to your deployment (e.g., us-east-1 for Vercel)
 *    - Eviction Policy: "No Eviction" or "LRU" (optional)
 * 4. Click "Create"
 * 5. Copy the REST API credentials
 */

// ============================================================================
// STEP 2: Add Environment Variables
// ============================================================================

/**
 * Create or update .env.local with:
 */

// UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
// UPSTASH_REDIS_REST_TOKEN=your-secure-token-here

/**
 * For Vercel deployment:
 * 1. Go to your Vercel project settings
 * 2. Environment Variables
 * 3. Add both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * 4. Select environments: Production, Preview, Development
 * 5. Deploy
 */

// ============================================================================
// STEP 3: Install Dependencies
// ============================================================================

/**
 * Install the Upstash Redis client:
 * 
 * npm install @upstash/redis
 * 
 * This library:
 * - Works on serverless (Vercel, AWS Lambda, etc.)
 * - Uses REST API (no persistent connections)
 * - Has built-in retry logic
 * - Minimal dependencies
 */

// ============================================================================
// STEP 4: Update package.json
// ============================================================================

/**
 * Check your package.json has @upstash/redis:
 * 
 * {
 *   "dependencies": {
 *     "@upstash/redis": "^1.x.x",
 *     ...
 *   }
 * }
 * 
 * Current recommendation: @upstash/redis@^1.25.0 or latest
 */

// ============================================================================
// STEP 5: Verify Setup
// ============================================================================

/**
 * Test locally first:
 * 
 * 1. Create a test file test-redis.ts
 * 2. Add this code:
 */

import { Redis } from "@upstash/redis";

async function testRedisConnection() {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || "",
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    });

    // Test command
    const result = await redis.ping();
    console.log("✅ Redis connection successful:", result);

    // Test write/read
    await redis.set("test-key", "test-value");
    const value = await redis.get("test-key");
    console.log("✅ Redis read/write successful:", value);

    // Cleanup
    await redis.del("test-key");
    console.log("✅ All tests passed!");
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
    process.exit(1);
  }
}

// testRedisConnection();

// ============================================================================
// STEP 6: Rate Limit Configuration Reference
// ============================================================================

/**
 * Available rate limit endpoints and their defaults:
 */

interface RateLimitEndpoint {
  endpoint: string;
  maxRequests: number;
  windowMs: number;
  reason: string;
}

const endpoints: RateLimitEndpoint[] = [
  {
    endpoint: "/api/auth/register",
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    reason: "Prevent registration spam and account creation abuse",
  },
  {
    endpoint: "/api/forgot-password",
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    reason: "Prevent password reset link spam",
  },
  {
    endpoint: "/api/auth/[...nextauth] (signin)",
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    reason: "Prevent brute force login attacks",
  },
  {
    endpoint: "/api/auth/reset-password",
    maxRequests: 3,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    reason: "Prevent password reset abuse",
  },
  {
    endpoint: "/api/auth/verify-email",
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    reason: "Prevent email verification spam",
  },
];

// ============================================================================
// STEP 7: Monitoring & Debugging
// ============================================================================

/**
 * Monitor your Upstash Redis database:
 * 
 * 1. Upstash Dashboard (https://console.upstash.com)
 *    - View command count
 *    - Monitor database size
 *    - Check response times
 *    - View recent commands
 * 
 * 2. Local debugging:
 *    - Enable debug mode: withRateLimit("registration", { debug: true })
 *    - Watch console logs
 *    - Check key names starting with "ratelimit:"
 * 
 * 3. Redis CLI (if available):
 *    - View all keys: KEYS ratelimit:*
 *    - Check key count: DBSIZE
 *    - Monitor memory: INFO memory
 * 
 * 4. Metrics to watch:
 *    - Request latency (should be <100ms)
 *    - Failed rate limit checks
 *    - Database size growth
 *    - Command errors
 */

// ============================================================================
// STEP 8: Production Deployment (Vercel)
// ============================================================================

/**
 * Vercel deployment checklist:
 * 
 * ☑️ Create Upstash Redis database
 * ☑️ Copy REST URL and token
 * ☑️ Add environment variables to Vercel
 * ☑️ Install @upstash/redis: npm install @upstash/redis
 * ☑️ Add rate limiter files:
 *    - src/lib/upstash-rate-limiter.ts
 *    - src/lib/rate-limit-middleware.ts
 * ☑️ Integrate into routes (start with critical endpoints)
 * ☑️ Test locally: npm run dev
 * ☑️ Deploy to Vercel: git push
 * ☑️ Monitor dashboard
 * ☑️ Set up alerts (if available)
 */

// ============================================================================
// STEP 9: Troubleshooting
// ============================================================================

/**
 * Common issues and solutions:
 * 
 * Issue: "UPSTASH_REDIS_REST_URL is not defined"
 * Solution: 
 *   1. Check .env.local has the variable
 *   2. Restart dev server: npm run dev
 *   3. Verify variable spelling exactly
 * 
 * Issue: "Connection refused" or timeout
 * Solution:
 *   1. Verify REST URL is correct
 *   2. Check REST token is valid
 *   3. Verify network/firewall allows outbound HTTPS
 *   4. Check Upstash status page
 * 
 * Issue: Rate limiting not working (all requests allowed)
 * Solution:
 *   1. Check Redis is initialized: console.log(redis)
 *   2. Verify middleware is applied
 *   3. Enable debug mode: { debug: true }
 *   4. Check Redis keys exist: KEYS ratelimit:*
 * 
 * Issue: High latency or timeouts
 * Solution:
 *   1. Database might be too far (choose closer region)
 *   2. Check Upstash dashboard for command count
 *   3. Verify network connectivity
 *   4. Consider caching if doing multiple checks
 * 
 * Issue: Wrong rate limit being applied
 * Solution:
 *   1. Verify identifier extraction is correct
 *   2. Check custom keys aren't interfering
 *   3. Verify TTL is set (Redis cleanup)
 *   4. Check timestamp consistency
 */

// ============================================================================
// STEP 10: Cost Estimation
// ============================================================================

/**
 * Upstash Redis pricing:
 * - Free tier: 10,000 commands/day
 * - Pay-as-you-go: $0.2 per 100K commands
 * 
 * Typical usage:
 * - 1 zcard check per request: ~1 command
 * - 1 zremrangebyscore cleanup: ~1 command
 * - 1 zadd or skip: ~1 command
 * - 1 expire: ~1 command
 * Total: ~3-4 commands per rate-limited request
 * 
 * Example: 10,000 registrations/day
 * - 10K × 3 commands = 30K commands/day
 * - Free tier handles this easily (100K limit)
 * - Cost: $0 (within free tier)
 * 
 * Example: 100,000 API requests/day
 * - 100K × 3 commands = 300K commands/day
 * - Exceeds free tier by 200K commands
 * - Cost: 200K commands × ($0.2 / 100K) = $0.40/day ≈ $12/month
 */

// ============================================================================
// STEP 11: Security Best Practices
// ============================================================================

/**
 * 🔒 Protect your credentials:
 * 
 * ☑️ Never commit .env.local to git
 * ☑️ Use .gitignore to exclude .env*
 * ☑️ Rotate tokens regularly
 * ☑️ Use separate database for staging/production
 * ☑️ Monitor access logs in Upstash dashboard
 * ☑️ Implement IP allowlisting if possible
 * ☑️ Enable read-only replica for backups (optional)
 * 
 * In code:
 * ☑️ Never log tokens or credentials
 * ☑️ Use middleware to validate before checking Redis
 * ☑️ Implement fail-open (allow request if Redis fails)
 * ☑️ Log rate limit violations for analysis
 * ☑️ Set up alerts for suspicious patterns
 */

// ============================================================================
// STEP 12: Advanced Configuration
// ============================================================================

/**
 * Custom rate limits for specific scenarios:
 */

import {
  checkRateLimit,
  type RateLimitType,
} from "@/lib/upstash-rate-limiter";

async function exampleAdvancedUsage() {
  // Example 1: Combined IP + user limiting
  const userId = "user-123";
  const ip = "192.168.1.1";
  const combinedKey = `${userId}:${ip}`;

  const result = await checkRateLimit("registration", combinedKey);

  if (!result.allowed) {
    console.log(`Rate limited. Retry after ${result.retryAfter} seconds`);
  }

  // Example 2: Custom threshold per user
  // (Would require extending the config)

  // Example 3: Gradual backoff
  // If user hits limit multiple times, increase cooldown
}

// ============================================================================
// STEP 13: Performance Tips
// ============================================================================

/**
 * ⚡ Optimize rate limiting performance:
 * 
 * 1. Fail-open strategy
 *    - Allow request if Redis fails
 *    - Better UX than blocking legitimate users
 *    - Implemented in middleware
 * 
 * 2. Batch operations (if needed)
 *    - Use Redis pipelines
 *    - Check multiple endpoints in one call
 * 
 * 3. Reduce cleanup frequency
 *    - Expire keys automatically (TTL)
 *    - Let Redis handle cleanup
 * 
 * 4. Cache identifier extraction
 *    - Extract IP once
 *    - Reuse across multiple checks
 * 
 * 5. Use appropriate window sizes
 *    - Shorter windows = more accurate
 *    - Longer windows = fewer Redis calls
 *    - Balance based on use case
 */

// ============================================================================
// STEP 14: Migration from In-Memory to Upstash
// ============================================================================

/**
 * Upgrade from in-memory limiter to Upstash:
 * 
 * 1. Keep old in-memory limiter for fallback
 * 2. Create new Upstash-based limiter
 * 3. Test in staging environment
 * 4. Gradually roll out to production
 * 5. Monitor for issues
 * 6. After verification, remove in-memory limiter
 * 
 * Timeline: 1-2 weeks of monitoring recommended
 */

// ============================================================================
// SUMMARY CHECKLIST
// ============================================================================

/**
 * ✅ Complete Setup Checklist:
 * 
 * Infrastructure:
 *   [ ] Create Upstash Redis database
 *   [ ] Copy REST URL and token
 *   [ ] Add to .env.local for local dev
 *   [ ] Add to Vercel for production
 * 
 * Code:
 *   [ ] npm install @upstash/redis
 *   [ ] Create src/lib/upstash-rate-limiter.ts
 *   [ ] Create src/lib/rate-limit-middleware.ts
 *   [ ] Add to critical routes
 * 
 * Testing:
 *   [ ] Test locally with npm run dev
 *   [ ] Verify rate limiting works
 *   [ ] Check response headers
 *   [ ] Test 429 responses
 * 
 * Deployment:
 *   [ ] Commit code to git
 *   [ ] Push to Vercel
 *   [ ] Monitor dashboard
 *   [ ] Set up alerts
 * 
 * Monitoring:
 *   [ ] Watch Redis command count
 *   [ ] Monitor error rates
 *   [ ] Check latency
 *   [ ] Review logs regularly
 */

export {};
