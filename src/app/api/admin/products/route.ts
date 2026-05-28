import { NextResponse } from "next/server";
import { prisma, TransactionClient } from "@/lib/db";
import { auth } from "@/lib/auth";
import { type NextRequest } from "next/server";
import { checkAdminRateLimit, rateLimitResponse } from "@/lib/admin-rate-limiter";
import { ProductSchema } from "@/schemas/product.schema";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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
      return NextResponse.json({ message: "Unauthorized: Please login" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT))));
    const search = (searchParams.get("search") || "").trim();
    const category = (searchParams.get("category") || "").trim();
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    const validSortFields = ["createdAt", "name", "price", "stock"];
    const validSortOrders = ["asc", "desc"];
    const validCategories = ["BAKING", "WHEAT", "ALL_PURPOSE", "SEMOLINA"];

    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json({ message: `Bad Request: sortBy must be one of: ${validSortFields.join(", ")}` }, { status: 400 });
    }

    if (!validSortOrders.includes(sortOrder)) {
      return NextResponse.json({ message: "Bad Request: sortOrder must be 'asc' or 'desc'" }, { status: 400 });
    }

    if (category && !validCategories.includes(category)) {
      return NextResponse.json({ message: `Bad Request: category must be one of: ${validCategories.join(", ")}` }, { status: 400 });
    }

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(category && { category: category as "BAKING" | "WHEAT" | "ALL_PURPOSE" | "SEMOLINA" }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: { id: true, name: true, description: true, price: true, stock: true, category: true, image: true, createdAt: true },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json(
      { products, pagination: { total, page, limit, pages } },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR] Fetch products failed:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ message: "Internal Server Error: Failed to fetch products" }, { status: 500 });
  }
}

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
      return NextResponse.json({ message: "Unauthorized: Please login" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Bad Request: Invalid request body" }, { status: 400 });
    }

    const priceValue = typeof body.price === "number" ? body.price : parseFloat(body.price);
    const stockValue = typeof body.stock === "number" ? body.stock : parseInt(body.stock, 10);

    if (isNaN(priceValue) || isNaN(stockValue)) {
      return NextResponse.json({ message: "Bad Request: price and stock must be valid numbers" }, { status: 400 });
    }

    const parseResult = ProductSchema.safeParse({
      ...body,
      price: priceValue,
      stock: stockValue,
      image: body.image || null,
    });

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return NextResponse.json({ message: "Validation failed", errors }, { status: 400 });
    }

    const { name, description, price, stock, image, category } = parseResult.data;

    const existingProduct = await prisma.product.findFirst({
      where: { name: name.trim(), isActive: true },
    });

    if (existingProduct) {
      return NextResponse.json({ message: "Bad Request: A product with this name already exists" }, { status: 400 });
    }

    const newProduct = await prisma.$transaction(async (tx: TransactionClient) => {
      const product = await tx.product.create({
        data: { name, description, price, stock, image: image || null, category },
        include: { _count: { select: { reviews: true, orderItems: true } } },
      });

      try {
        await tx.productAuditLog.create({
          data: {
            productId: product.id,
            adminId: session.user?.id || "system",
            changes: JSON.stringify({ action: "product_created", fields: { name, description, price, stock, category } }),
          },
        });
      } catch {}

      return product;
    }, { timeout: 10000 });

    console.info("[AUDIT] Admin created product:", { adminId: session.user.id, productId: newProduct.id, productName: name, category, price, stock });

    return NextResponse.json({ message: "Product created successfully", product: newProduct }, { status: 201 });
  } catch (error) {
    console.error("[ERROR] Create product failed:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ message: "Internal Server Error: Failed to create product" }, { status: 500 });
  }
}
