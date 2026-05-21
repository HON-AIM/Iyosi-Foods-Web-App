# Next.js Middleware Security Implementation

## Overview

This document explains the complete middleware implementation for protecting routes with NextAuth in your IYOSIOLA Foods application.

---

## Architecture

### Three-Layer Security

1. **Middleware Layer** (`middleware.ts`)
   - Edge-runtime protection for all protected routes
   - First line of defense before requests reach your API/pages
   - Handles redirects for unauthorized access

2. **Auth Config Layer** (`src/lib/auth.config.ts`)
   - NextAuth configuration with callbacks
   - Session and JWT token management
   - Client-side route protection

3. **Auth Service Layer** (`src/lib/auth.ts`)
   - Credentials provider with password validation
   - Login attempt tracking and rate limiting
   - User verification and account status checks

---

## Protected Routes

### 1. **User Dashboard** (`/dashboard/*`)
- **Required Role:** USER or ADMIN
- **Purpose:** User profile, orders, settings
- **Redirect on Auth Failure:** `/login?callbackUrl=/dashboard`

### 2. **Checkout Flow** (`/checkout/*`)
- **Required Role:** USER or ADMIN
- **Purpose:** Order completion
- **Redirect on Auth Failure:** `/login?callbackUrl=/checkout`

### 3. **Admin Panel** (`/admin/*`)
- **Required Role:** ADMIN only
- **Purpose:** Store management, analytics, user management
- **Redirect on Auth Failure:** `/dashboard` (non-admins)

---

## Matcher Logic Explained

The middleware uses a negative lookahead regex pattern to exclude non-essential routes while protecting everything else:

```
/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml)$).*)/
```

### What Gets Processed (Goes Through Middleware)
- ✅ `/dashboard/orders` → Checked
- ✅ `/checkout` → Checked  
- ✅ `/admin/analytics` → Checked
- ✅ `/` → Checked
- ✅ `/login` → Checked (public)

### What Gets Bypassed (Skips Middleware)
- ❌ `/api/products` → API routes handle auth themselves
- ❌ `/_next/static/chunks/main.js` → Build assets
- ❌ `/_next/image?url=...` → Image optimization
- ❌ `/public/image.png` → Public assets
- ❌ `/favicon.ico`, `/robots.txt`, `/sitemap.xml` → Special files

### Why This Approach

1. **Edge Compatibility**: Middleware runs on the edge server. Excluding API routes prevents double-checking auth.
2. **Performance**: Static assets bypass all checks, reducing latency.
3. **Flexibility**: APIs can implement different auth strategies (JWT headers, etc.)
4. **Simplicity**: Clear separation of concerns between route protection and API auth.

---

## Security Events Logging

### Logged Events

The middleware logs three types of security events:

#### 1. **UNAUTHORIZED_ACCESS**
```
[SECURITY] UNAUTHORIZED_ACCESS - /dashboard/orders - User: ANONYMOUS - Role: NONE - IP: 192.168.1.1 - 2026-04-30T10:30:00Z
```
- User attempts to access protected route without authentication
- **Action:** Redirected to login

#### 2. **PERMISSION_DENIED**
```
[SECURITY] PERMISSION_DENIED - /admin/analytics - User: user@example.com - Role: USER - IP: 192.168.1.1 - 2026-04-30T10:30:00Z
```
- Authenticated user lacks required role (e.g., USER trying to access ADMIN panel)
- **Action:** Redirected to dashboard

#### 3. **INVALID_TOKEN** (Reserved for future use)
- JWT token validation failures

### Log Details Captured

- `type`: Event classification
- `pathname`: Route attempted
- `email`: User email (if authenticated)
- `role`: User role (USER or ADMIN)
- `ip`: IP address
- `userAgent`: Browser/client info
- `timestamp`: ISO 8601 timestamp

### Production Logging

In development, logs go to console. For production, integrate with:
- **CloudWatch**: `console.log()` → CloudWatch Logs
- **Datadog**: Send via API
- **Sentry**: Security events integration
- **Custom Logger**: Implement in `logSecurityEvent()` function

Example production setup:
```typescript
// In logSecurityEvent() function
if (process.env.NODE_ENV === "production") {
  await fetch("https://your-logging-service.com/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  })
}
```

---

## Implementation Details

### Middleware Flow

```
User Request
    ↓
[Matcher Check]
    ├─ Static asset? → Skip (return next())
    └─ Route pattern matches? → Continue to route protection check
    ↓
[Route Protection Check]
    ├─ Not protected? → Skip (return next())
    └─ Protected route? → Check authentication
    ↓
[Authentication Check]
    ├─ No session? → Log UNAUTHORIZED_ACCESS → Redirect to login
    └─ Has session? → Check role
    ↓
[Role Check]
    ├─ Role sufficient? → Grant access (return next())
    └─ Role insufficient? → Log PERMISSION_DENIED → Redirect
```

### Code Breakdown

#### Protected Routes Configuration
```typescript
const PROTECTED_ROUTES = {
  dashboard: {
    pattern: /^\/dashboard(\/|$)/,
    requireAuth: true,
    requiredRole: "USER",
    description: "User Dashboard",
  },
  // ... more routes
}
```

#### Route Detection
```typescript
function getRouteProtection(pathname: string) {
  for (const [key, route] of Object.entries(PROTECTED_ROUTES)) {
    if (route.pattern.test(pathname)) {
      return route
    }
  }
  return null
}
```

#### Session Extraction
```typescript
const session = await auth() // Gets session from JWT token
```

#### Redirect with Callback URL
```typescript
const loginUrl = new URL("/login", request.url)
loginUrl.searchParams.set("callbackUrl", pathname)
loginUrl.searchParams.set("reason", "auth_required")
return NextResponse.redirect(loginUrl)
```

---

## How to Extend

### Adding a New Protected Route

1. **Add to PROTECTED_ROUTES**:
```typescript
const PROTECTED_ROUTES = {
  // ... existing routes
  newSection: {
    pattern: /^\/new-section(\/|$)/,
    requireAuth: true,
    requiredRole: "USER", // or "ADMIN"
    description: "New Protected Section",
  },
}
```

2. **Update auth.config.ts authorized callback**:
```typescript
const protectedRoutes = ["/dashboard", "/checkout", "/admin", "/new-section"]
```

3. **Test the route**:
```bash
# Without auth: Should redirect to login
# With USER role: Should allow access
# With ADMIN role: Should allow access (if requiredRole is "USER")
```

### Changing Matcher Pattern

To exclude additional file types:
```typescript
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml|pdf)$).*)",
    // Added |pdf
  ],
}
```

### Changing Redirect Behavior

Modify the redirect logic for different routes:
```typescript
// Different redirect for different route types
if (routeProtection.key === "admin") {
  return NextResponse.redirect(new URL("/", request.url))
} else if (routeProtection.key === "checkout") {
  return NextResponse.redirect(new URL("/shop", request.url))
}
```

---

## Testing Checklist

### Authentication Tests
- [ ] Unauthenticated user accessing `/dashboard` → Redirects to `/login?callbackUrl=/dashboard`
- [ ] Unauthenticated user accessing `/checkout` → Redirects to `/login?callbackUrl=/checkout`
- [ ] Unauthenticated user accessing `/admin` → Redirects to `/login?callbackUrl=/admin`

### Authorization Tests
- [ ] USER accessing `/dashboard` → Allowed ✓
- [ ] USER accessing `/checkout` → Allowed ✓
- [ ] USER accessing `/admin` → Redirects to `/dashboard` (permission denied)
- [ ] ADMIN accessing `/dashboard` → Allowed ✓
- [ ] ADMIN accessing `/checkout` → Allowed ✓
- [ ] ADMIN accessing `/admin` → Allowed ✓

### Static Asset Tests
- [ ] CSS files load without middleware check
- [ ] Images load without middleware check
- [ ] JS bundles load without middleware check

### API Route Tests
- [ ] `/api/products` returns data without middleware redirect
- [ ] `/api/user` respects API-level auth (not middleware)

### Public Route Tests
- [ ] `/login` accessible without auth
- [ ] `/register` accessible without auth
- [ ] `/` (home) accessible without auth
- [ ] `/shop` accessible without auth

---

## Performance Considerations

### Edge Runtime Benefits
- Middleware runs on Vercel's edge network, near users
- Redirects happen before reaching origin servers
- Reduced latency for blocked requests

### Optimization Tips

1. **Minimize Middleware Logic**
   - Complex operations should be in API routes
   - Keep middleware focused on routing decisions

2. **Cache Session Data**
   - NextAuth caches sessions automatically
   - Consider Redis for distributed systems

3. **Monitor Matcher Pattern**
   - Use `next dev` to check which routes hit middleware
   - Verify static assets are excluded

---

## Troubleshooting

### Routes Not Being Protected

**Symptom**: Unauthenticated users can access `/dashboard`

**Solution**:
1. Verify `PROTECTED_ROUTES` includes the route
2. Check matcher pattern includes the route
3. Ensure `auth()` call succeeds: `const session = await auth()`

### Infinite Redirect Loop

**Symptom**: `/login` redirects to itself

**Solution**:
1. Verify `/login` is NOT in `PROTECTED_ROUTES`
2. Check `authorized()` callback in auth.config.ts
3. Ensure `callbackUrl` parameter handling in login page

### Static Assets Loading Slowly

**Symptom**: CSS/JS/images take longer to load

**Solution**:
1. Verify all static extensions excluded from matcher
2. Check `public/` folder assets
3. Ensure `_next/static` and `_next/image` excluded

### Admin Routes Not Working

**Symptom**: Admin users can't access `/admin`

**Solution**:
1. Verify user has `role: "ADMIN"` in database
2. Check `session.user.role` is populated correctly
3. Verify JWT callback includes role in token

---

## Security Best Practices Implemented

✅ **Edge-Runtime Safe**: No database queries in middleware
✅ **Role-Based Access Control**: ADMIN-only and USER routes
✅ **Rate Limiting**: Login attempt tracking in auth.ts
✅ **Audit Logging**: All unauthorized access logged
✅ **Secure Redirects**: Whitelisted callback URLs
✅ **Session Management**: JWT with max age enforcement
✅ **CSRF Protection**: NextAuth handles automatically
✅ **Static Asset Bypass**: No unnecessary checks

---

## Related Files

- [middleware.ts](./middleware.ts) - Main middleware implementation
- [src/lib/auth.config.ts](./src/lib/auth.config.ts) - NextAuth configuration
- [src/lib/auth.ts](./src/lib/auth.ts) - Auth handlers and providers
- [src/types/next-auth.d.ts](./src/types/next-auth.d.ts) - Type definitions
- [prisma/schema.prisma](./prisma/schema.prisma) - User model with role enum

---

## Next Steps

1. **Test all scenarios** using the testing checklist above
2. **Deploy to staging** to verify edge runtime behavior
3. **Monitor logs** for any unauthorized access patterns
4. **Set up alerts** for excessive failed login attempts
5. **Document any customizations** for your team

