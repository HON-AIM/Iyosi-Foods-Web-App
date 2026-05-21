# Quick Reference: Remaining Risks & Action Items

## 🔴 CRITICAL (Do Before Deploying)

### Issue #1: Duplicate Register Route
```
❌ src/app/api/register/route.ts           (DELETE THIS)
✅ src/app/api/auth/register/route.ts     (Use this instead)
```
**Action**: `rm src/app/api/register/route.ts`  
**Why**: Old route has no rate limiting - vulnerable to brute force  
**Time**: < 5 minutes

### Issue #2: Missing Admin Rate Limiting
**Routes Affected** (8 total):
- `/api/admin/customers/*`
- `/api/admin/orders/*`
- `/api/admin/products/*`
- `/api/admin/reviews/*`
- `/api/admin/messages/*`

**Action**: Add rate limiting to each route (example below)  
**Why**: Allows enumeration attacks, DOS, data scraping  
**Time**: 30-45 minutes

```typescript
// Pattern to add to each admin route:
const clientIp = request.headers.get("x-forwarded-for") || "unknown";
const isAllowed = await adminRateLimiter.check(clientIp);
if (!isAllowed) {
  return NextResponse.json({ message: "Too many requests" }, { status: 429 });
}
```

---

## 🟡 MEDIUM (Do Before Full Launch)

| # | Issue | File | Impact | Time |
|---|-------|------|--------|------|
| 3 | Production logging not implemented | middleware.ts | Can't detect attacks | 1-2 hrs |
| 4 | Pagination params not validated | admin routes (4 files) | Invalid parameters accepted | 1 hour |
| 5 | CSRF protection unclear | auth.config.ts | POST/PATCH/DELETE vulnerable? | 30 min |
| 6 | Reset token reusable | reset-password/route.ts | Token can be used multiple times | 30 min |

---

## 🟢 MINOR (Nice to Have)

| # | Issue | File | Impact | Time |
|---|-------|------|--------|------|
| 7 | No API documentation | N/A | Harder to audit/integrate | 2-4 hrs |
| 8 | Error messages inconsistent | Various | Leaks details, UX issues | 1 hour |
| 9 | No request signing | upload/route.ts | Extra CSRF protection | 30 min |
| 10 | Hardcoded config values | Various | Can't change without code edits | 30 min |

---

## Risk Matrix

```
┌─────────────────────────────────────────┐
│ IMPACT                                  │
│                                         │
│ HIGH   ┌──────────────────────────┐    │
│        │  #1  #2                  │    │
│        │  (CRITICAL)             │    │
│        ├────────────────────────┤    │
│ MEDIUM │  #3  #4  #5  #6        │    │
│        │  (MEDIUM)              │    │
│        ├────────────────────────┤    │
│ LOW    │  #7  #8  #9  #10       │    │
│        │  (MINOR)               │    │
│        └──────────────────────────┘    │
│        LOW   MEDIUM   HIGH      LIKELIHOOD
└─────────────────────────────────────────┘
```

---

## Security Strengths (Already Implemented ✅)

**Authentication**
- ✅ Strong password requirements (8+ chars, mixed case, numbers, special)
- ✅ Proper bcryptjs hashing (salt 12)
- ✅ Email verification required
- ✅ Account lockout (5 attempts/15 min)
- ✅ Login attempt tracking

**Data Protection**
- ✅ No SQL injection (Prisma ORM)
- ✅ No XSS (Next.js sanitization)
- ✅ Decimal type for monetary values
- ✅ Proper audit logging
- ✅ Cascading deletes in database

**Files & Uploads**
- ✅ Magic byte validation (prevents spoofing)
- ✅ Image optimization
- ✅ MIME type whitelist
- ✅ File size limits
- ✅ Admin-only access
- ✅ User-scoped storage
- ✅ Cloud storage (no filesystem)

**API**
- ✅ Rate limiting on auth routes
- ✅ Input validation with Zod
- ✅ Proper HTTP status codes
- ✅ Role-based access control
- ✅ Middleware route protection

---

## Deployment Steps

### Pre-Deployment (TODAY)
```bash
# 1. Delete duplicate register route
rm src/app/api/register/route.ts

# 2. Verify no other duplicate routes
find src/app/api -name "route.ts" | sort

# 3. Run tests
npm run test

# 4. Build check
npm run build
```

### Critical Fixes (THIS WEEK)
1. Add rate limiting to 8 admin routes
2. Implement production logging
3. Verify CSRF protection
4. Test password reset token behavior

### Before Going Live
- [ ] Set `AUTH_SECRET` (32+ random characters)
- [ ] Configure database URLs (DATABASE_URL, DIRECT_URL)
- [ ] Setup email SMTP
- [ ] Configure upload provider (Vercel Blob or Cloudinary)
- [ ] Setup logging service (CloudWatch, Datadog, etc.)
- [ ] Create backups for database
- [ ] Load test rate limiting
- [ ] Security scan (OWASP)

---

## Environment Variables Checklist

### Required (Will Break if Missing)
```
AUTH_SECRET                    # JWT signing key (32+ chars random)
DATABASE_URL                   # PostgreSQL connection
DIRECT_URL                     # Direct DB connection
NEXTAUTH_URL                   # http://localhost:3000 (dev) → https://yourdomain.com (prod)
```

### Email (For Verification/Password Reset)
```
EMAIL_SERVER_HOST              # smtp.gmail.com or similar
EMAIL_SERVER_PORT              # 587 or 465
EMAIL_SERVER_USER              # your-email@gmail.com
EMAIL_SERVER_PASSWORD          # app-specific password
EMAIL_FROM                     # noreply@iyosiolagroup.com
```

### File Upload
```
UPLOAD_PROVIDER                # "vercel-blob" or "cloudinary"
BLOB_READ_WRITE_TOKEN          # (for Vercel Blob)
CLOUDINARY_CLOUD_NAME          # (for Cloudinary)
CLOUDINARY_API_KEY             # (for Cloudinary)
CLOUDINARY_API_SECRET          # (for Cloudinary)
OPTIMIZE_IMAGES                # true or false
```

### Optional (Nice to Have)
```
NODE_ENV                       # "production" for security events
LOGGING_API_ENDPOINT           # Your logging service URL
LOGGING_API_TOKEN              # Auth token for logging service
AWS_REGION                     # If using CloudWatch
```

---

## Testing Checklist

### Rate Limiting
```bash
# Should fail on 6th request
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"test'$i'@example.com","password":"TestPass123!","confirmPassword":"TestPass123!"}'
done
```

### Admin Access
```bash
# Test user without ADMIN role cannot access
curl -H "Authorization: Bearer USER_TOKEN" \
  http://localhost:3000/api/admin/products
# Should return 403
```

### Input Validation
```bash
# Test invalid pagination
curl "http://localhost:3000/api/admin/products?page=-1&limit=999999"
# Should return 400 with error details
```

### Password Reset
```bash
# Get reset token, use twice
# Second use should fail: "Token already used" or "Invalid token"
```

---

## Monitoring Setup

### CloudWatch (AWS)
```typescript
const logs = new CloudWatchLogs({ region: process.env.AWS_REGION });
await logs.putLogEvents({
  logGroupName: "/iyosiola/security-events",
  logStreamName: new Date().toISOString().split("T")[0],
  logEvents: [{ message: JSON.stringify(event), timestamp: Date.now() }],
});
```

### Datadog (Recommended)
```typescript
const logger = new Logger();
logger.warn("Security Event", {
  event_type: "UNAUTHORIZED_ACCESS",
  ip: event.ip,
  email: event.email,
});
```

### Custom Service
```typescript
await fetch(process.env.LOGGING_API_ENDPOINT, {
  method: "POST",
  headers: { "Authorization": `Bearer ${process.env.LOGGING_API_TOKEN}` },
  body: JSON.stringify(event),
});
```

---

## Rollback Plan

If critical issue found in production:

1. **Database Issue**: Use backup restore
   ```bash
   # Example (depends on your setup):
   psql -U postgres < backup_$(date +%Y%m%d).sql
   ```

2. **Auth/Login Down**: Revert last commit
   ```bash
   git revert HEAD
   git push
   ```

3. **File Upload Issue**: Disable upload endpoint
   ```typescript
   // Temporarily return 503 Service Unavailable
   if (process.env.DISABLE_UPLOADS === "true") {
     return NextResponse.json({ message: "Uploads temporarily disabled" }, { status: 503 });
   }
   ```

---

## Estimated Timeline to Production

- **Critical Fixes**: 45 minutes
- **Medium Fixes**: 3-4 hours  
- **Testing**: 2-3 hours
- **Deployment**: 1-2 hours
- **Monitoring Setup**: 1 hour

**Total**: **~8-10 hours** from now

---

## Questions to Ask Before Launch

1. ✅ Are all environment variables configured securely?
2. ✅ Has admin rate limiting been tested with > 20 requests/min?
3. ✅ Is production logging receiving events?
4. ✅ Does password reset token prevent reuse?
5. ✅ Is database backup working and tested?
6. ✅ Is CSRF protection enabled in NextAuth?
7. ✅ Have you tested the file upload workflow end-to-end?
8. ✅ Are Vercel Blob/Cloudinary credentials working?
9. ✅ Is email sending working for verification/password reset?
10. ✅ Have you load-tested with expected concurrent users?

---

## Support Resources

- **Next.js**: https://nextjs.org/docs
- **NextAuth.js**: https://next-auth.js.org/
- **Prisma**: https://www.prisma.io/docs
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Rate Limiting**: https://www.npmjs.com/package/express-rate-limit

---

**Last Updated**: May 1, 2026  
**Status**: ⚠️ **CRITICAL ISSUES MUST BE FIXED BEFORE LAUNCH**  
**Approval**: CONDITIONAL (after critical fixes)
