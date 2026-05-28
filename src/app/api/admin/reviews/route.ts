import { NextResponse } from "next/server";
import { prisma, TransactionClient } from "@/lib/db";
import { auth } from "@/lib/auth";
import { type NextRequest } from "next/server";
import { checkAdminRateLimit, rateLimitResponse } from "@/lib/admin-rate-limiter";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * GET /api/admin/reviews
 * Fetch paginated list of reviews with optional filters and sorting
 *
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 20, max: 100)
 * @query search - Search by product name or comment text
 * @query productId - Filter by product ID
 * @query userId - Filter by user ID
 * @query rating - Filter by exact rating (1-5)
 * @query ratingMin - Filter by minimum rating
 * @query ratingMax - Filter by maximum rating
 * @query isHidden - Filter by moderation status (true/false/all)
 * @query sortBy - Sort field (createdAt, rating, isHidden) (default: createdAt)
 * @query sortOrder - Sort order (asc, desc) (default: desc)
 * @query dateFrom - Filter reviews from this date (ISO string)
 * @query dateTo - Filter reviews up to this date (ISO string)
 * @returns { reviews, pagination, stats }
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

    // ✅ Correct status code: 401 for missing session, 403 for insufficient permissions
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

    // ✅ Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit") || DEFAULT_LIMIT.toString(), 10))
    );
    const search = (searchParams.get("search") || "").trim();
    const productId = (searchParams.get("productId") || "").trim();
    const userId = (searchParams.get("userId") || "").trim();
    const ratingStr = searchParams.get("rating");
    const ratingMinStr = searchParams.get("ratingMin");
    const ratingMaxStr = searchParams.get("ratingMax");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const skip = (page - 1) * limit;

    // ✅ Validate sort parameters
    const validSortFields = ["createdAt", "rating"];
    const validSortOrders = ["asc", "desc"];

    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        {
          message: `Bad Request: sortBy must be one of: ${validSortFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!validSortOrders.includes(sortOrder)) {
      return NextResponse.json(
        { message: "Bad Request: sortOrder must be 'asc' or 'desc'" },
        { status: 400 }
      );
    }

    // ✅ Validate and parse rating filters
    let rating: number | undefined;
    let ratingMin = 1;
    let ratingMax = 5;

    if (ratingStr) {
      rating = parseInt(ratingStr, 10);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        return NextResponse.json(
          { message: "Bad Request: rating must be a number between 1 and 5" },
          { status: 400 }
        );
      }
    }

    if (ratingMinStr) {
      ratingMin = parseInt(ratingMinStr, 10);
      if (isNaN(ratingMin) || ratingMin < 1 || ratingMin > 5) {
        return NextResponse.json(
          { message: "Bad Request: ratingMin must be a number between 1 and 5" },
          { status: 400 }
        );
      }
    }

    if (ratingMaxStr) {
      ratingMax = parseInt(ratingMaxStr, 10);
      if (isNaN(ratingMax) || ratingMax < 1 || ratingMax > 5) {
        return NextResponse.json(
          { message: "Bad Request: ratingMax must be a number between 1 and 5" },
          { status: 400 }
        );
      }
    }

    if (ratingMin > ratingMax) {
      return NextResponse.json(
        { message: "Bad Request: ratingMin must be less than or equal to ratingMax" },
        { status: 400 }
      );
    }

    // ✅ Parse and validate date filters
    let dateFromObj: Date | undefined;
    let dateToObj: Date | undefined;

    if (dateFrom) {
      dateFromObj = new Date(dateFrom);
      if (isNaN(dateFromObj.getTime())) {
        return NextResponse.json(
          { message: "Bad Request: Invalid dateFrom format (use ISO string)" },
          { status: 400 }
        );
      }
    }

    if (dateTo) {
      dateToObj = new Date(dateTo);
      if (isNaN(dateToObj.getTime())) {
        return NextResponse.json(
          { message: "Bad Request: Invalid dateTo format (use ISO string)" },
          { status: 400 }
        );
      }
    }

    // ✅ Build filter conditions
    const where = {
      ...(search && {
        OR: [
          { comment: { contains: search, mode: "insensitive" as const } },
          { product: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
      ...(productId && { productId }),
      ...(userId && { userId }),
      ...(rating !== undefined && { rating }),
      ...(!rating && { rating: { gte: ratingMin, lte: ratingMax } }),
      ...(dateFromObj || dateToObj) && {
        createdAt: {
          ...(dateFromObj && { gte: dateFromObj }),
          ...(dateToObj && { lte: dateToObj }),
        },
      },
    };

    // ✅ Build sort condition
    const orderBy = {
      [sortBy]: sortOrder,
    };

    // ✅ Fetch reviews and total count in parallel
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, name: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    // ✅ Get rating distribution for dashboard stats
    const ratingStats = await prisma.review.groupBy({
      by: ["rating"],
      _count: true,
      where: {
        ...(dateFromObj || dateToObj) && {
          createdAt: {
            ...(dateFromObj && { gte: dateFromObj }),
            ...(dateToObj && { lte: dateToObj }),
          },
        },
      },
    });

    // ✅ Get rating stats
    const [totalCount, averageRating] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.aggregate({
        _avg: { rating: true },
        where,
      }),
    ]);

    // ✅ Log admin access for audit trail
    console.info("[AUDIT] Admin accessed reviews list:", {
      adminId: session.user.id,
      adminEmail: session.user.email,
      filters: {
        search,
        productId,
        userId,
        rating,
        ratingMin,
        ratingMax,
        dateFrom: dateFromObj?.toISOString(),
        dateTo: dateToObj?.toISOString(),
      },
      pagination: { page, limit },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        reviews,
        pagination: {
          total,
          page,
          limit,
          pages,
        },
        stats: {
          ratingDistribution: Object.fromEntries(
            ratingStats.map((r: { rating: number; _count: number }) => [r.rating, r._count])
          ),
          totalReviews: totalCount,
          averageRating: averageRating._avg.rating || 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR] Fetch reviews failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestUrl: request.nextUrl.toString(),
    });

    return NextResponse.json(
      {
        message:
          "Internal Server Error: Failed to fetch reviews. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/reviews/bulk
 * Bulk operations on reviews (e.g., delete multiple)
 *
 * @requires Admin role
 * @body action - Action to perform (delete)
 * @body reviewIds - Array of review IDs
 * @body reason - Reason for bulk action
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

    const { action, reviewIds, reason } = body;

    // ✅ Validate required fields
    if (!action || typeof action !== "string") {
      return NextResponse.json(
        { message: "Bad Request: Action is required" },
        { status: 400 }
      );
    }

    const validActions = ["delete"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { message: "Bad Request: Action must be 'delete'" },
        { status: 400 }
      );
    }

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return NextResponse.json(
        { message: "Bad Request: Review IDs array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Limit bulk operations to 100 at a time
    if (reviewIds.length > 100) {
      return NextResponse.json(
        { message: "Bad Request: Maximum 100 reviews per operation" },
        { status: 400 }
      );
    }

    let affected = 0;

    try {
      switch (action) {
        case "delete":
          const deleteResult = await prisma.review.deleteMany({
            where: { id: { in: reviewIds } },
          });
          affected = deleteResult.count;
          break;

        default:
          return NextResponse.json(
            { message: "Bad Request: Unknown action. Must be 'delete'" },
            { status: 400 }
          );
      }
    } catch (opError) {
      console.error("[ERROR] Bulk review operation failed:", {
        action,
        error: opError instanceof Error ? opError.message : String(opError),
      });

      return NextResponse.json(
        {
          message:
            "Internal Server Error: Failed to perform bulk operation. Please try again.",
        },
        { status: 500 }
      );
    }

    // ✅ Log bulk action for audit trail
    console.info("[AUDIT] Bulk review operation performed:", {
      adminId: session.user.id,
      adminEmail: session.user.email,
      action,
      reviewCount: reviewIds.length,
      affected,
      reason: reason || "No reason provided",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        message: `${action} operation completed successfully. ${affected} review(s) affected.`,
        affected,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR] Bulk review operation failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        message:
          "Internal Server Error: Failed to perform bulk operation. Please try again.",
      },
      { status: 500 }
    );
  }
}
