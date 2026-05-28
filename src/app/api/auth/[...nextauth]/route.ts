import { handlers } from "@/lib/auth";
import { type NextRequest, NextResponse } from "next/server";

/**
 * NextAuth Route Handlers
 * Handles all authentication operations including:
 * - Login/Logout
 * - OAuth callbacks
 * - CSRF protection
 * - Session management
 */

// ✅ Extract the original handlers
const { GET: nextAuthGet, POST: nextAuthPost } = handlers;

/**
 * GET /api/auth/[...nextauth]
 * Handles NextAuth GET requests (signin, callback, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ Validate request
    if (!request.nextUrl) {
      return NextResponse.json(
        { message: "Bad Request: Invalid request" },
        { status: 400 }
      );
    }

    // ✅ Extract NextAuth route segments
    const path = request.nextUrl.pathname.split("/api/auth/")[1]?.split("/") || [];

    if (!Array.isArray(path) || path.length === 0) {
      return NextResponse.json(
        { message: "Bad Request: Invalid NextAuth route" },
        { status: 400 }
      );
    }

    const route = path[0];

    // ✅ Validate known NextAuth routes
    const validRoutes = [
      "signin",
      "callback",
      "session",
      "csrf",
      "providers",
      "error",
      "signout",
      "verify-request",
    ];

    if (!validRoutes.includes(route)) {
      console.warn("[WARN] Unknown NextAuth GET route attempted:", {
        route,
        ip: request.headers.get("x-forwarded-for") || "unknown",
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { message: "Not Found: Unknown Auth route" },
        { status: 404 }
      );
    }

    // ✅ Log sensitive auth operations
    const sensitiveRoutes = ["signin", "callback", "signout"];
    if (sensitiveRoutes.includes(route)) {
      console.info("[AUDIT] Auth GET request:", {
        route,
        provider: request.nextUrl.searchParams.get("provider"),
        ip: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        timestamp: new Date().toISOString(),
      });
    }

    // ✅ Set security headers
    const response = await nextAuthGet(request);

    // ✅ Add security headers to response
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // ✅ Prevent caching of auth responses
    if (sensitiveRoutes.includes(route)) {
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      response.headers.set("Pragma", "no-cache");
    }

    return response;
  } catch (error) {
    console.error("[ERROR] NextAuth GET handler failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: "Authentication service temporarily unavailable" },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!request.nextUrl) {
      return NextResponse.json(
        { message: "Bad Request: Invalid request" },
        { status: 400 }
      );
    }

    const path = request.nextUrl.pathname.split("/api/auth/")[1]?.split("/") || [];

    if (!Array.isArray(path) || path.length === 0) {
      return NextResponse.json(
        { message: "Bad Request: Invalid NextAuth route" },
        { status: 400 }
      );
    }

    const route = path[0];

    // ✅ Validate known NextAuth routes
    const validRoutes = [
      "signin",
      "callback",
      "session",
      "csrf",
      "signout",
      "verify-request",
      "providers",
      "error",
    ];

    if (!validRoutes.includes(route)) {
      console.warn("[WARN] Unknown NextAuth POST route attempted:", {
        route,
        ip: request.headers.get("x-forwarded-for") || "unknown",
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { message: "Not Found: Unknown Auth route" },
        { status: 404 }
      );
    }

    // ✅ Validate Content-Type for POST requests
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json") && !contentType.includes("application/x-www-form-urlencoded")) {
      console.warn("[WARN] Invalid Content-Type for auth POST:", {
        contentType,
        route,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });

      return NextResponse.json(
        { message: "Bad Request: Invalid Content-Type" },
        { status: 400 }
      );
    }

    // ✅ Log auth operations (without sensitive data)
    console.info("[AUDIT] Auth POST request:", {
      route,
      provider: request.nextUrl.searchParams.get("provider"),
      ip: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent")?.substring(0, 50) || "unknown",
      timestamp: new Date().toISOString(),
    });

    // ✅ Call NextAuth handler
    const response = await nextAuthPost(request);

    // ✅ Add security headers to response
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");

    // ✅ Ensure secure cookie flags (should be set by NextAuth)
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader && !setCookieHeader.includes("Secure")) {
      console.warn("[WARN] Insecure cookie detected in auth response", {
        route,
        timestamp: new Date().toISOString(),
      });
    }

    return response;
  } catch (error) {
    console.error("[ERROR] NextAuth POST handler failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: "Authentication service temporarily unavailable" },
      { status: 503 }
    );
  }
}

/**
 * @deprecated Use GET or POST handlers instead
 * Prevents other HTTP methods from being used
 */
export async function PUT() {
  return NextResponse.json(
    { message: "Method Not Allowed" },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { message: "Method Not Allowed" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "Method Not Allowed" },
    { status: 405 }
  );
}

export async function HEAD() {
  return NextResponse.json(
    { message: "Method Not Allowed" },
    { status: 405 }
  );
}
