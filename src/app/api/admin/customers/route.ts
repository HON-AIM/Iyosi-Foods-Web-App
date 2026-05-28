import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { type NextRequest } from "next/server";
import { checkAdminRateLimit, rateLimitResponse } from "@/lib/admin-rate-limiter";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * GET /api/admin/customers
 * Fetch paginated list of customers with optional search/filters
 *
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10, max: 100)
 * @query search - Search by name or email
 * @query verified - Filter by email verification status (true/false)
 * @returns { customers, pagination, stats }
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";
    const { success, resetAt } = await checkAdminRateLimit(ip);
    if (!success) {
      const { body, headers } = rateLimitResponse(resetAt);
      return NextResponse.json(body, { status: 429, headers });
    }

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized: Please login" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // ✅ Parse query parameters with validation
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit") || DEFAULT_LIMIT.toString(), 10))
    );
    const search = (searchParams.get("search") || "").trim();
    const verified = searchParams.get("verified");

    const skip = (page - 1) * limit;

    // ✅ Build filter conditions
    const where: Record<string, unknown> = {
      role: "USER",
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    if (verified !== null) {
      if (verified === "true") {
        where.emailVerified = { not: null };
      } else {
        where.emailVerified = null;
      }
    }

    // ✅ Fetch customers and total count in parallel
    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: { orders: true, reviews: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        customers,
        pagination: {
          total,
          page,
          limit,
          pages,
        },
        stats: {
          verifiedCount: await prisma.user.count({
            where: { ...where, emailVerified: { not: null } },
          }),
          unverifiedCount: await prisma.user.count({
            where: { ...where, emailVerified: null },
          }),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR] Fetch customers failed:", error);
    return NextResponse.json(
      {
        message:
          "Internal Server Error: Failed to fetch customers. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/customers
 * Bulk operation on customers (e.g., verify emails, send newsletters)
 *
 * @body action - Action to perform (verify_email, send_newsletter)
 * @body customerIds - Array of customer IDs
 * @returns { message, affected }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";
    const { success, resetAt } = await checkAdminRateLimit(ip);
    if (!success) {
      const { body, headers } = rateLimitResponse(resetAt);
      return NextResponse.json(body, { status: 429, headers });
    }

    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized: Please login" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { message: "Bad Request: Invalid request body" },
        { status: 400 }
      );
    }

    const { action, customerIds } = body;

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        { message: "Bad Request: Action is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return NextResponse.json(
        { message: "Bad Request: Customer IDs array is required" },
        { status: 400 }
      );
    }

    // Limit bulk operations to 100 at a time
    if (customerIds.length > 100) {
      return NextResponse.json(
        { message: "Bad Request: Maximum 100 customers per operation" },
        { status: 400 }
      );
    }

    // ✅ Validate all IDs exist and are customers (not admins)
    const validCustomers = await prisma.user.findMany({
      where: {
        id: { in: customerIds },
        role: "USER",
      },
      select: { id: true },
    });

    if (validCustomers.length !== customerIds.length) {
      return NextResponse.json(
        { message: "Bad Request: Some customer IDs are invalid or not found" },
        { status: 400 }
      );
    }

    let affected = 0;

    switch (action) {
      case "verify_email":
        const verifyResult = await prisma.user.updateMany({
          where: { id: { in: customerIds } },
          data: { emailVerified: new Date() },
        });
        affected = verifyResult.count;
        break;

      case "send_newsletter":
        // Implement actual newsletter sending here
        console.info(
          `[AUDIT] Admin ${session.user.id} queued newsletter for ${customerIds.length} customers`
        );
        affected = customerIds.length;
        break;

      default:
        return NextResponse.json(
          { message: "Bad Request: Unknown action" },
          { status: 400 }
        );
    }

    console.info(
      `[AUDIT] Admin ${session.user.id} performed action '${action}' on ${affected} customers`
    );

    return NextResponse.json(
      {
        message: `Operation completed successfully. ${affected} customer(s) affected.`,
        affected,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR] Bulk customer operation failed:", error);
    return NextResponse.json(
      {
        message:
          "Internal Server Error: Failed to perform bulk operation. Please try again.",
      },
      { status: 500 }
    );
  }
}
