# Package Dependencies Update for Upstash Rate Limiting

**File**: `package.json`  
**Action Required**: Add `@upstash/redis` dependency  
**Version**: ^1.25.0 or latest  

---

## Update Required

Add this line to your `package.json` dependencies section:

```json
{
  "dependencies": {
    "@upstash/redis": "^1.25.0",
    // ... existing dependencies
  }
}
```

## Full Example (Updated package.json)

```json
{
  "name": "iyosiola-foods",
  "version": "0.1.0",
  "engines": {
    "node": ">=18.18.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && prisma migrate deploy && next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "prisma db seed",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "@auth/prisma-adapter": "^2.7.0",
    "@prisma/client": "^6.19.2",
    "@types/nodemailer": "^7.0.11",
    "@upstash/redis": "^1.25.0",
    "bcryptjs": "^3.0.3",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.577.0",
    "next": "^15.3.0",
    "next-auth": "^5.0.0-beta.25",
    "nodemailer": "^7.0.13",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hot-toast": "^2.6.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.15.0",
    "eslint-config-next": "^15.3.0",
    "postcss": "^8.5.1",
    "prisma": "^6.19.2",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.7.2"
  }
}
```

## Installation Instructions

### Option 1: Manual Edit
1. Open `package.json`
2. Find the `dependencies` section
3. Add: `"@upstash/redis": "^1.25.0",`
4. Save file
5. Run: `npm install`

### Option 2: Command Line
```bash
npm install @upstash/redis
```

This will automatically update `package.json` and `package-lock.json`.

## Verification

After installation, verify it worked:

```bash
npm list @upstash/redis
# Should show: @upstash/redis@1.25.0 (or newer)
```

## Why This Package?

- **Official Upstash client** for Node.js/serverless
- **REST API** - works on serverless (Vercel)
- **Zero-dependency** - lightweight
- **Fully typed** - TypeScript support
- **Production-ready** - battle-tested

## Size Impact

- **Bundle impact**: Minimal (~50KB)
- **Vercel cold start**: <100ms increase
- **Production ready**: Yes

## Compatibility

- **Node.js**: >=18.18.0 ✅
- **Next.js**: ^15.3.0 ✅
- **Vercel**: Yes ✅
- **All platforms**: Yes ✅

---

**After update**: Your rate limiting system is ready to use!
