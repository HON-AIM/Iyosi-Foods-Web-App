# NextAuth Middleware - Quick Reference

## ✅ What's Protected Now

| Route | Auth Required | Role | Redirect on Fail |
|-------|---|---|---|
| `/dashboard/*` | ✓ | USER+ | `/login?callbackUrl=/dashboard` |
| `/checkout/*` | ✓ | USER+ | `/login?callbackUrl=/checkout` |
| `/admin/*` | ✓ | ADMIN | `/dashboard` (permission denied) |

## 📋 Security Improvements

- **Unauthorized Access Logging**: All unauthenticated attempts to protected routes are logged with IP, User-Agent, timestamp
- **Permission Denial Logging**: All role-based rejections are logged (e.g., USER trying to access `/admin`)
- **Edge-Runtime Safe**: Middleware uses only session data, no database queries
- **Smart Matching**: Static assets, API routes, and public files bypass middleware entirely

## 🔍 How It Works (3-Step Flow)

```
1. User requests protected route
   ↓ Middleware checks
2. Is user authenticated?
   - NO → Redirect to /login
   - YES → Check role
   ↓
3. Does user have required role?
   - NO → Redirect to /dashboard or deny
   - YES → Allow access
```

## 📍 Matcher Explanation

The middleware runs on everything EXCEPT:

```
❌ /api/*                          # API routes (own auth)
❌ /_next/static/*                 # Build assets
❌ /_next/image/*                  # Image optimization
❌ /favicon.ico, /robots.txt, etc. # Special files
❌ *.png, *.jpg, *.svg, etc.       # Image/document files
```

Everything else goes through middleware! This means:
- ✅ `/dashboard/orders` - Checked
- ✅ `/login` - Checked (but public)
- ✅ `/shop` - Checked (but public)

## 🧪 Testing Scenarios

### Test 1: Unauthorized Access
```bash
# Open browser, try: http://localhost:3000/dashboard
# Expected: Redirects to http://localhost:3000/login?callbackUrl=/dashboard
```

### Test 2: Permission Denied
```bash
# Sign in as regular user (role: USER)
# Try: http://localhost:3000/admin
# Expected: Redirects to http://localhost:3000/dashboard
# Check logs: [SECURITY] PERMISSION_DENIED
```

### Test 3: Admin Access
```bash
# Sign in as admin user (role: ADMIN)
# Try: http://localhost:3000/admin
# Expected: Page loads successfully
```

## 📊 Log Format

When security events happen, you'll see:

```
[SECURITY] UNAUTHORIZED_ACCESS - /dashboard/orders - User: ANONYMOUS - Role: NONE - IP: 192.168.1.100 - 2026-04-30T10:30:00Z
[SECURITY] PERMISSION_DENIED - /admin/users - User: user@example.com - Role: USER - IP: 192.168.1.100 - 2026-04-30T10:31:00Z
```

## 🚀 Deployment Checklist

- [ ] Test protected routes in local dev (`npm run dev`)
- [ ] Verify redirects work with `callbackUrl`
- [ ] Check static assets load without delays
- [ ] Test API routes still work (no middleware interference)
- [ ] Deploy to staging first
- [ ] Monitor middleware logs for false positives
- [ ] Set up production logging integration (CloudWatch, etc.)

## 🔗 Files Modified

1. **middleware.ts** - Main protection logic (154 lines)
2. **src/lib/auth.config.ts** - Enhanced callbacks
3. **MIDDLEWARE_DOCUMENTATION.md** - Full documentation

## 🆘 Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| Routes not protected | Check PROTECTED_ROUTES config + matcher pattern |
| Infinite redirect | Verify login page not in PROTECTED_ROUTES |
| Static files slow | Verify exclusion in matcher pattern |
| Admin routes broken | Check user role is ADMIN in database |
| Logs not showing | Ensure NODE_ENV is 'development' |

## 📝 To Add a New Protected Route

1. Open `middleware.ts`
2. Add to `PROTECTED_ROUTES` object:
   ```typescript
   myNewRoute: {
     pattern: /^\/my-new-route(\/|$)/,
     requireAuth: true,
     requiredRole: "USER", // or "ADMIN"
     description: "My New Protected Route",
   },
   ```
3. Update `auth.config.ts` authorized callback to include `/my-new-route`
4. Test with unauthenticated user - should redirect to login

## 💡 Tips

- **Callback URL**: Login page receives `?callbackUrl=/original-route` - use this to redirect users back
- **Role Fallback**: Users without ADMIN role on `/admin` redirect to `/dashboard`
- **API Routes**: API endpoints handle auth separately - middleware doesn't interfere
- **Performance**: Middleware runs on edge (Vercel) - faster than origin server checks

---

**Need help?** See `MIDDLEWARE_DOCUMENTATION.md` for detailed explanations
