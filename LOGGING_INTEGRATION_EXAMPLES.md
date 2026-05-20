# Logging Integration Examples

This file contains example implementations for connecting middleware security events to production logging services.

## CloudWatch (AWS)

```typescript
// In middleware.ts, replace logSecurityEvent function

import { CloudWatchClient, PutLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs"

const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION })

async function logSecurityEvent(event: {
  type: "UNAUTHORIZED_ACCESS" | "PERMISSION_DENIED" | "INVALID_TOKEN"
  pathname: string
  email?: string
  role?: string
  ip?: string
  userAgent?: string
  timestamp: string
}) {
  const logMessage = `[SECURITY] ${event.type} - ${event.pathname} - User: ${event.email || "ANONYMOUS"} - Role: ${event.role || "NONE"} - IP: ${event.ip}`

  if (process.env.NODE_ENV === "development") {
    console.warn(logMessage)
    return
  }

  try {
    await cloudwatch.send(
      new PutLogEventsCommand({
        logGroupName: "/iyosiola/security",
        logStreamName: new Date().toISOString().split("T")[0],
        logEvents: [
          {
            message: JSON.stringify(event),
            timestamp: Date.now(),
          },
        ],
      })
    )
  } catch (error) {
    console.error("[LOGGING ERROR]", error)
  }
}
```

## Datadog

```typescript
// In middleware.ts, replace logSecurityEvent function

async function logSecurityEvent(event: {
  type: "UNAUTHORIZED_ACCESS" | "PERMISSION_DENIED" | "INVALID_TOKEN"
  pathname: string
  email?: string
  role?: string
  ip?: string
  userAgent?: string
  timestamp: string
}) {
  const logMessage = `[SECURITY] ${event.type} - ${event.pathname} - User: ${event.email || "ANONYMOUS"} - Role: ${event.role || "NONE"} - IP: ${event.ip}`

  if (process.env.NODE_ENV === "development") {
    console.warn(logMessage)
    return
  }

  try {
    await fetch("https://http-intake.logs.datadoghq.com/v1/input", {
      method: "POST",
      headers: {
        "DD-API-KEY": process.env.DATADOG_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service: "iyosiola-foods",
        environment: process.env.NODE_ENV,
        level: "warn",
        message: logMessage,
        security_event: event,
      }),
    })
  } catch (error) {
    console.error("[LOGGING ERROR]", error)
  }
}
```

## Sentry

```typescript
// Install: npm install @sentry/nextjs

import * as Sentry from "@sentry/nextjs"

async function logSecurityEvent(event: {
  type: "UNAUTHORIZED_ACCESS" | "PERMISSION_DENIED" | "INVALID_TOKEN"
  pathname: string
  email?: string
  role?: string
  ip?: string
  userAgent?: string
  timestamp: string
}) {
  const logMessage = `[SECURITY] ${event.type} - ${event.pathname} - User: ${event.email || "ANONYMOUS"} - Role: ${event.role || "NONE"} - IP: ${event.ip}`

  if (process.env.NODE_ENV === "development") {
    console.warn(logMessage)
    return
  }

  Sentry.captureMessage(logMessage, {
    level: "warning",
    tags: {
      security_event: event.type,
      route: event.pathname,
      user_role: event.role || "anonymous",
    },
    contexts: {
      security: {
        event_type: event.type,
        pathname: event.pathname,
        user_email: event.email,
        user_role: event.role,
        ip_address: event.ip,
        user_agent: event.userAgent,
      },
    },
  })
}
```

## Custom API Endpoint

```typescript
// In middleware.ts, replace logSecurityEvent function

async function logSecurityEvent(event: {
  type: "UNAUTHORIZED_ACCESS" | "PERMISSION_DENIED" | "INVALID_TOKEN"
  pathname: string
  email?: string
  role?: string
  ip?: string
  userAgent?: string
  timestamp: string
}) {
  const logMessage = `[SECURITY] ${event.type} - ${event.pathname} - User: ${event.email || "ANONYMOUS"} - Role: ${event.role || "NONE"} - IP: ${event.ip}`

  if (process.env.NODE_ENV === "development") {
    console.warn(logMessage)
    return
  }

  try {
    await fetch(`${process.env.LOGGING_API_ENDPOINT}/security-logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LOGGING_API_TOKEN}`,
      },
      body: JSON.stringify({
        event_type: event.type,
        pathname: event.pathname,
        user_email: event.email,
        user_role: event.role,
        ip_address: event.ip,
        user_agent: event.userAgent,
        timestamp: event.timestamp,
        application: "iyosiola-foods",
      }),
    })
  } catch (error) {
    console.error("[LOGGING ERROR]", error)
  }
}
```

## PostgreSQL (Database Logging)

```typescript
// In middleware.ts, replace logSecurityEvent function
// Requires: CREATE TABLE security_logs (...)

import { prisma } from "./src/lib/db"

async function logSecurityEvent(event: {
  type: "UNAUTHORIZED_ACCESS" | "PERMISSION_DENIED" | "INVALID_TOKEN"
  pathname: string
  email?: string
  role?: string
  ip?: string
  userAgent?: string
  timestamp: string
}) {
  const logMessage = `[SECURITY] ${event.type} - ${event.pathname} - User: ${event.email || "ANONYMOUS"} - Role: ${event.role || "NONE"} - IP: ${event.ip}`

  if (process.env.NODE_ENV === "development") {
    console.warn(logMessage)
    return
  }

  try {
    // Note: In edge runtime, Prisma may not be available
    // Use this only if running middleware in Node.js runtime
    await prisma.securityLog.create({
      data: {
        eventType: event.type,
        pathname: event.pathname,
        userEmail: event.email,
        userRole: event.role,
        ipAddress: event.ip,
        userAgent: event.userAgent,
        timestamp: new Date(event.timestamp),
      },
    })
  } catch (error) {
    console.error("[LOGGING ERROR]", error)
  }
}
```

## Environment Variables Required

```bash
# CloudWatch
AWS_REGION=us-east-1

# Datadog
DATADOG_API_KEY=your_datadog_api_key

# Sentry
SENTRY_DSN=https://...@sentry.io/...

# Custom API
LOGGING_API_ENDPOINT=https://your-logging-service.com
LOGGING_API_TOKEN=your_auth_token

# PostgreSQL (if using prisma)
DATABASE_URL=postgresql://...
```

## Recommendation

For the IYOSIOLA Foods application, I recommend:

1. **Development**: Keep console logging
2. **Staging**: Use Sentry (free tier) for error tracking
3. **Production**: Use either:
   - **Datadog** (best for comprehensive monitoring)
   - **CloudWatch** (if already using AWS)
   - **Custom PostgreSQL table** (cheapest option)

Start with console logging in dev, then upgrade before production deployment.

