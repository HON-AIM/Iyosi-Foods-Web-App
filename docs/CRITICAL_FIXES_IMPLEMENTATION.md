# Critical Fixes - Implementation Guide

## Fix #1: Remove Duplicate Register Route

**STATUS**: 🔴 CRITICAL (< 5 minutes)

### What to Do

```bash
# STEP 1: Delete the duplicate file
rm src/app/api/register/route.ts

# STEP 2: Verify only canonical exists
ls -la src/app/api/auth/register/

# Output should show:
# route.ts  ← This is the only one
```

### Verify It Works

```bash
# Test the canonical endpoint
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!"
  }'

# Should return 201 (success) or 400 (validation error)
# NOT 404 (route not found)
```

### Update Frontend

If your frontend calls `/api/register`, change to `/api/auth/register`:

```typescript
// ❌ OLD (don't use)
await fetch('/api/register', { method: 'POST', body: ... })

// ✅ NEW (use this)
await fetch('/api/auth/register', { method: 'POST', body: ... })
```

---

## Fix #2: Add Rate Limiting to Admin Routes

**STATUS**: 🔴 CRITICAL (30-45 minutes)

### STEP 1: Create Admin Rate Limiter

Create new file: `src/lib/admin-rate-limiter.ts`

```typescript
/**
 * Admin Route Rate Limiting
 * Prevents DOS, enumeration, and bulk operations on admin endpoints
 */

import { RateLimiter } from "./rate-limiter";

// GET endpoints: Higher limit (reading data)
export const adminGetLimiter = new RateLimiter({
  maxRequests: 20,      // 20 requests
  windowMs: 60 * 1000,  // per 1 minute
  keyPrefix: "admin:get:",
});

// POST/PATCH/DELETE endpoints: Lower limit (modifying data)
export const adminMutateLimiter = new RateLimiter({
  maxRequests: 5,       // 5 requests
  windowMs: 60 * 1000,  // per 1 minute
  keyPrefix: "admin:mutate:",
});

/**
 * Helper function to create rate limit response
 */
export function createRateLimitErrorResponse(
  remaining: number,
  resetTime: number
) {
  return {
    message: "Rate limit exceeded. Please try again later.",
    retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
    remaining,
  };
}

/**
 * Helper to add rate limit headers to response
 */
export function setRateLimitHeaders(
  response: Response,
  remaining: number,
  resetTime: number
): Response {
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(resetTime));
  response.headers.set("Retry-After", String(Math.ceil((resetTime - Date.now()) / 1000)));
  return response;
}
```

### STEP 2: Update `src/app/api/admin/customers/route.ts`

Add this to the **top** of the GET function:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminGetLimiter, adminMutateLimiter, createRateLimitErrorResponse, setRateLimitHeaders } from "@/lib/admin-rate-limiter";

export async function GET(request: NextRequest) {
  // === ADD THIS BLOCK ===
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized: Please login" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
  }

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                   request.headers.get("x-real-ip") || 
                   "unknown";

  // Rate limit check (GET = 20 per minute)
  const isAllowed = await adminGetLimiter.check(clientIp);
  if (!isAllowed) {
    const remaining = adminGetLimiter.getRemaining(clientIp);
    const resetTime = adminGetLimiter.getResetTime(clientIp);
    const response = NextResponse.json(
      createRateLimitErrorResponse(remaining, resetTime),
      { status: 429 }
    );
    return setRateLimitHeaders(response, remaining, resetTime);
  }
  // === END OF ADDITION ===

  try {
    // ... rest of GET function (existing code unchanged)
```

### STEP 3: Repeat for All Admin Routes

Apply the same pattern to these 8 routes:

**GET endpoints** (use `adminGetLimiter`):
1. ✅ `src/app/api/admin/customers/route.ts` (GET)
2. ✅ `src/app/api/admin/orders/route.ts` (GET)
3. ✅ `src/app/api/admin/products/route.ts` (GET)
4. ✅ `src/app/api/admin/reviews/route.ts` (GET)
5. ✅ `src/app/api/admin/messages/route.ts` (GET)

**POST/PATCH/DELETE endpoints** (use `adminMutateLimiter`):
1. ✅ `src/app/api/admin/customers/[id]/route.ts` (PATCH, DELETE)
2. ✅ `src/app/api/admin/orders/[id]/route.ts` (PATCH)
3. ✅ `src/app/api/admin/products/[id]/route.ts` (PATCH, DELETE)
4. ✅ `src/app/api/admin/reviews/[id]/route.ts` (DELETE)
5. ✅ `src/app/api/admin/messages/[id]/route.ts` (DELETE)

Plus POST for products:
6. ✅ `src/app/api/admin/products/route.ts` (POST)

### Template for All Other Routes

```typescript
// For GET requests:
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const isAllowed = await adminGetLimiter.check(clientIp);
  if (!isAllowed) {
    const remaining = adminGetLimiter.getRemaining(clientIp);
    const resetTime = adminGetLimiter.getResetTime(clientIp);
    const response = NextResponse.json(createRateLimitErrorResponse(remaining, resetTime), { status: 429 });
    return setRateLimitHeaders(response, remaining, resetTime);
  }

  try {
    // ... existing route code
  } catch (error) {
    // ... existing error handling
  }
}

// For POST/PATCH/DELETE requests:
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const isAllowed = await adminMutateLimiter.check(clientIp);  // ← Use MUTATE limiter
  if (!isAllowed) {
    const remaining = adminMutateLimiter.getRemaining(clientIp);
    const resetTime = adminMutateLimiter.getResetTime(clientIp);
    const response = NextResponse.json(createRateLimitErrorResponse(remaining, resetTime), { status: 429 });
    return setRateLimitHeaders(response, remaining, resetTime);
  }

  try {
    // ... existing route code
  } catch (error) {
    // ... existing error handling
  }
}
```

### Test Rate Limiting

```bash
# Test with 25 rapid requests (should fail after 20th)
#!/bin/bash
ADMIN_TOKEN="your_admin_jwt_token_here"
for i in {1..25}; do
  echo "Request $i"
  curl -H "Authorization: Bearer $ADMIN_TOKEN" \
       -H "x-forwarded-for: 127.0.0.1" \
       http://localhost:3000/api/admin/customers?page=1
  sleep 0.1
done

# Output should show:
# Request 1-20: 200 OK
# Request 21-25: 429 Too Many Requests
```

---

## Medium Priority Fixes

### Fix #3: Production Logging Integration

**TIME**: 1-2 hours  
**PRIORITY**: Do before launch

#### Option A: AWS CloudWatch (Recommended for Vercel)

```typescript
// src/lib/logging.ts
import { CloudWatchLogs } from "@aws-sdk/client-cloudwatch-logs";

const cloudWatch = process.env.AWS_REGION ? 
  new CloudWatchLogs({ region: process.env.AWS_REGION }) : 
  null;

export async function logSecurityEvent(event: {
  type: string;
  pathname?: string;
  email?: string;
  ip?: string;
  timestamp: string;
}) {
  // Local development
  if (process.env.NODE_ENV === "development") {
    console.warn("[SECURITY]", JSON.stringify(event));
    return;
  }

  // Production
  if (cloudWatch && process.env.AWS_REGION) {
    try {
      const logGroupName = "/iyosiola/security-events";
      const logStreamName = new Date().toISOString().split("T")[0];
      
      await cloudWatch.putLogEvents({
        logGroupName,
        logStreamName,
        logEvents: [{
          message: JSON.stringify(event),
          timestamp: Date.now(),
        }],
      });
    } catch (error) {
      console.error("[ERROR] Failed to log to CloudWatch:", error);
      // Don't crash - fail silently
    }
  }
}
```

Update middleware.ts:

```typescript
// middleware.ts
import { logSecurityEvent } from "@/lib/logging";

function logSecurityEvent(event: {...}) {
  // Replace the old function with:
  return logSecurityEvent(event);
}
```

#### Option B: HTTP-based Logging Service

```typescript
// src/lib/logging.ts
export async function logSecurityEvent(event: {
  type: string;
  pathname?: string;
  email?: string;
  ip?: string;
  timestamp: string;
}) {
  if (!process.env.LOGGING_API_ENDPOINT) {
    console.warn("[SECURITY]", JSON.stringify(event));
    return;
  }

  try {
    const response = await fetch(process.env.LOGGING_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LOGGING_API_TOKEN}`,
      },
      body: JSON.stringify({
        ...event,
        service: "iyosiola-web-app",
        version: "1.0.0",
      }),
    });

    if (!response.ok) {
      console.warn("[WARN] Logging service returned:", response.status);
    }
  } catch (error) {
    console.error("[ERROR] Failed to log event:", error);
    // Fail silently - don't break application
  }
}
```

Environment variables:

```
# .env.production
LOGGING_API_ENDPOINT=https://logs.example.com/api/events
LOGGING_API_TOKEN=your_logging_service_token
AWS_REGION=us-east-1
```

---

### Fix #4: Verify CSRF Protection

**TIME**: 30 minutes

Check if NextAuth CSRF is enabled:

```typescript
// src/lib/auth.config.ts
export const authConfig = {
  // ... other config
  
  // Should have:
  csrf: true,                    // ← Verify this is true
  useSecureCookies: true,        // ← For HTTPS in production
  cookiePolicy: "lax",           // ← Recommended for CSRF
  sessionStrategy: "jwt",
};
```

If not present, add it:

```typescript
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    // ... other pages
  },
  csrf: true,  // ← ADD THIS
  useSecureCookies: process.env.NODE_ENV === "production", // ← ADD THIS
  cookiePolicy: "lax", // ← ADD THIS
  callbacks: {
    // ... existing callbacks
  },
  providers: [
    // ... existing providers
  ],
};
```

Test CSRF protection:

```bash
# This should work (normal request)
curl -X POST http://localhost:3000/api/upload \
  -H "Cookie: next-auth.session-token=..." \
  -F "file=@image.jpg"
# Returns 201 or error

# This should fail if CSRF properly enabled
# (Note: This is hard to test manually, usually tested in E2E tests)
```

---

### Fix #5: Password Reset Token One-Time Use

**TIME**: 30 minutes

Check reset-password route:

```typescript
// src/app/api/reset-password/route.ts

export async function POST(request: NextRequest) {
  // ... existing code ...
  
  // Find user with valid token
  const user = await prisma.user.findFirst({
    where: {
      resetToken: resetTokenHash,
      resetTokenExpiry: { gt: new Date() },
      // ✅ ADD THIS CHECK:
      resetTokenUsed: { not: true },
    },
  });

  if (!user) {
    return NextResponse.json(
      { message: "Invalid or expired reset link" },
      { status: 400 }
    );
  }

  // ... verify new password ...

  // ✅ IMPORTANT: Mark token as used and clear it
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,          // ← Clear the token
      resetTokenExpiry: null,
      resetTokenUsed: true,      // ← Mark as used (if field exists)
      lastLogin: new Date(),
    },
  });

  // ... send confirmation email ...
}
```

Database schema update (if needed):

```prisma
// prisma/schema.prisma
model User {
  // ... existing fields ...
  resetToken           String?   @unique
  resetTokenExpiry     DateTime?
  resetTokenUsed       Boolean   @default(false)  // ← ADD THIS
  // ... other fields ...
}
```

If you added the field, run migration:

```bash
npx prisma migrate dev --name add_reset_token_used
```

---

## Verification Checklist

### After Fix #1 (Delete Duplicate)
- [ ] `rm src/app/api/register/route.ts` succeeded
- [ ] `src/app/api/auth/register/route.ts` still exists
- [ ] Test `/api/auth/register` endpoint works
- [ ] Frontend uses `/api/auth/register` (not `/api/register`)

### After Fix #2 (Admin Rate Limiting)
- [ ] Created `src/lib/admin-rate-limiter.ts`
- [ ] Updated all 8 admin routes with rate limiting code
- [ ] Tested: 20 GET requests succeed, 21st returns 429
- [ ] Tested: 5 POST/PATCH/DELETE succeed, 6th returns 429
- [ ] Rate limit headers present in response

### After Fix #3 (Production Logging)
- [ ] CloudWatch or logging service configured
- [ ] Environment variables set (LOGGING_API_ENDPOINT, etc.)
- [ ] Test: Unauthorized access logs to service
- [ ] Test: Permission denied logs to service
- [ ] Verify logs appear in CloudWatch/service dashboard

### After Fix #4 (CSRF)
- [ ] `csrf: true` confirmed in auth.config.ts
- [ ] `useSecureCookies: true` set in production
- [ ] Test POST endpoints still work
- [ ] No CSRF errors in browser console

### After Fix #5 (Reset Token)
- [ ] `resetTokenUsed` field added to schema (if needed)
- [ ] Migration applied (if schema changed)
- [ ] Reset token cleared after successful reset
- [ ] Test: Using reset token twice fails on 2nd attempt

---

## Quick Implementation Timeline

| Task | Time | Team |
|------|------|------|
| Delete duplicate route | 5 min | 1 dev |
| Add admin rate limiting | 30-45 min | 1 dev |
| Production logging | 1-2 hrs | 1 dev |
| CSRF verification | 30 min | 1 dev |
| Reset token fix | 30 min | 1 dev |
| Testing | 1-2 hrs | QA |
| **TOTAL** | **~5 hours** | - |

---

## Git Commit After Fixes

```bash
# Stage changes
git add -A

# Commit
git commit -m "fix: critical security issues

- Remove duplicate register route (no rate limiting)
- Add rate limiting to all admin routes (8 endpoints)
- Implement production logging integration
- Verify CSRF protection enabled
- Ensure password reset tokens are one-time use

Addresses critical security audit findings:
- Prevents brute force registration attacks
- Prevents DOS and enumeration attacks on admin
- Enables security monitoring and alerting
- Reduces CSRF and token reuse vulnerabilities"

# Push
git push origin main
```

---

**Total Time to Fix**: **4-6 hours**  
**Difficulty**: **Low to Medium**  
**Risk**: **Low** (all changes are additive, no breaking changes)

Start with Fix #1 (5 minutes, immediate impact) and work through the list.
