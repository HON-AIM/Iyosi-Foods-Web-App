import { NextResponse } from "next/server";
import { prisma, TransactionClient } from "@/lib/db";
import { auth } from "@/lib/auth";
import { type NextRequest } from "next/server";
import { checkAdminRateLimit, rateLimitResponse } from "@/lib/admin-rate-limiter";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * GET /api/admin/orders
 * Fetch paginated list of orders with optional filters and sorting
 *
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 20, max: 100)
 * @query search - Search by order ID, customer name, or email
 * @query status - Filter by status (PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
 * @query sortBy - Sort field (createdAt, totalAmount, status) (default: createdAt)
 * @query sortOrder - Sort order (asc, desc) (default: desc)
 * @query dateFrom - Filter orders from this date (ISO string)
 * @query dateTo - Filter orders up to this date (ISO string)
 * @returns { orders, pagination, stats }
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
    const status = (searchParams.get("status") || "").trim();
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const skip = (page - 1) * limit;

    // ✅ Validate sort parameters
    const validSortFields = ["createdAt", "totalAmount", "status"];
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
        {
          message: "Bad Request: sortOrder must be 'asc' or 'desc'",
        },
        { status: 400 }
      );
    }

    const validStatuses = [
      "PENDING",
      "PAID",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          message: `Bad Request: status must be one of: ${validStatuses.join(", ")}`,
        },
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
    const where: Record<string, unknown> = {
      ...(search && {
        OR: [
          { id: { contains: search, mode: "insensitive" as const } },
          { user: { name: { contains: search, mode: "insensitive" as const } } },
          { user: { email: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
      ...(status && { status: status as "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" }),
      ...((dateFromObj || dateToObj) && {
        createdAt: {
          ...(dateFromObj && { gte: dateFromObj }),
          ...(dateToObj && { lte: dateToObj }),
        },
      }),
    };

    // ✅ Build sort condition
    const orderBy = {
      [sortBy]: sortOrder,
    };

    // ✅ Fetch orders and total count in parallel
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          guestName: true,
          guestEmail: true,
          trackingNumber: true,
          trackingCarrier: true,
          estimatedDelivery: true,
          user: { select: { id: true, name: true, email: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              price: true,
              product: { select: { name: true } },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    // ✅ Get status distribution for dashboard stats
    const statusCounts = await prisma.order.groupBy({
      by: ["status"],
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

    // ✅ Calculate revenue statistics
    const revenueStats = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
      where: {
        status: { in: ["DELIVERED", "PROCESSING", "SHIPPED"] },
        ...(dateFromObj || dateToObj) && {
          createdAt: {
            ...(dateFromObj && { gte: dateFromObj }),
            ...(dateToObj && { lte: dateToObj }),
          },
        },
      },
    });

    // ✅ Log admin access for audit trail
    console.info("[AUDIT] Admin accessed orders list:", {
      adminId: session.user.id,
      adminEmail: session.user.email,
      filters: {
        search,
        status,
        dateFrom: dateFromObj?.toISOString(),
        dateTo: dateToObj?.toISOString(),
      },
      pagination: { page, limit },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        orders,
        pagination: {
          total,
          page,
          limit,
          pages,
        },
        stats: {
          statusCounts: Object.fromEntries(
            statusCounts.map((s: { status: string; _count: number }) => [s.status, s._count])
          ),
          revenue: {
            total: revenueStats._sum.totalAmount || 0,
            average: revenueStats._avg.totalAmount || 0,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR] Fetch admin orders failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestUrl: request.nextUrl.toString(),
    });

    return NextResponse.json(
      {
        message:
          "Internal Server Error: Failed to fetch orders. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/orders
 * Create a manual order (admin only)
 *
 * @requires Admin role
 * @body userId - User ID
 * @body items - Array of { productId, quantity }
 * @body addressId - Address ID
 * @returns { message, order }
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

    const { userId, items, shippingAddr } = body;

    // ✅ Validate required fields
    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { message: "Bad Request: Invalid userId" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: "Bad Request: Items array is required and must not be empty" },
        { status: 400 }
      );
    }

    if (!shippingAddr || typeof shippingAddr !== "string") {
      return NextResponse.json(
        { message: "Bad Request: Invalid shippingAddr" },
        { status: 400 }
      );
    }

    // ✅ Validate items structure
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { message: "Bad Request: Each item must have valid productId and quantity" },
          { status: 400 }
        );
      }
    }

    // ✅ Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Not Found: User does not exist" },
        { status: 404 }
      );
    }

    // ✅ Verify all products exist and get prices
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, stock: true },
    }) as Array<{ id: string; price: number; stock: number }>;

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { message: "Bad Request: Some products do not exist" },
        { status: 400 }
      );
    }

    // ✅ Verify stock availability
    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product || product.stock < item.quantity) {
        return NextResponse.json(
          { message: "Bad Request: Insufficient stock for one or more products" },
          { status: 400 }
        );
      }
    }

    // ✅ Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      const product = productMap.get(item.productId);
      totalAmount += (product?.price || 0) * item.quantity;
    }

    // ✅ Create order in transaction
    const newOrder = await prisma.$transaction(async (tx: TransactionClient) => {
      // Create order
      const order = await tx.order.create({
        data: {
          userId,
          shippingAddr,
          totalAmount,
          status: "PAID", // Admin-created orders start as PAID
        },
        include: {
          items: true,
          user: { select: { name: true, email: true } },
        },
      });

      // Create order items
      const orderItems = await Promise.all(
        items.map((item) =>
          tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              quantity: item.quantity,
              price: productMap.get(item.productId)?.price || 0,
            },
          })
        )
      );

      // Update product stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return { ...order, items: orderItems };
    });

    console.info("[AUDIT] Admin created manual order:", {
      adminId: session.user.id,
      orderId: newOrder.id,
      userId,
      totalAmount,
      itemCount: items.length,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        message: "Order created successfully",
        order: newOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ERROR] Create order failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        message:
          "Internal Server Error: Failed to create order. Please try again.",
      },
      { status: 500 }
    );
  }
}
