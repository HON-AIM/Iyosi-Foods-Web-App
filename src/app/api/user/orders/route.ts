import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { type NextRequest } from "next/server";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { CreateOrderSchema } from "@/schemas/order.schema";
import { checkoutLimiter, checkLimit } from "@/lib/redis-rate-limiter";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized: Please login" }, { status: 401 });
    }

    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1"));
    const pageSize = Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get("pageSize") || "20")));
    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: session.user.id },
        include: { items: { include: { product: { select: { id: true, name: true, price: true, image: true } } } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where: { userId: session.user.id } }),
    ]);

    const response = NextResponse.json(
      { orders, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } },
      { status: 200 }
    );
    response.headers.set("Cache-Control", "private, no-cache");

    return response;
  } catch (error) {
    console.error("[ERROR] GET orders failed:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ message: "Error fetching orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // ── Rate limit checkout (abuse/spike protection) ────────────────────────
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anon";
    const { success: rateOk, resetAt } = await checkLimit(checkoutLimiter, ip);
    if (!rateOk) {
      const retry = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { message: `Too many requests. Please wait ${retry}s and try again.` },
        { status: 429, headers: { "Retry-After": String(retry) } }
      );
    }

    const session = await auth();
    const isGuest = !session?.user?.id;

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ message: "Bad Request: Content-Type must be application/json" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Bad Request: Invalid request body" }, { status: 400 });
    }

    const parseResult = CreateOrderSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => ({ field: e.path.join("."), message: e.message }));
      return NextResponse.json({ message: "Validation failed", errors }, { status: 400 });
    }

    const { items, shippingAddress, notes, guestName, guestEmail } = parseResult.data;

    if (isGuest && (!guestEmail || !guestName)) {
      return NextResponse.json({ message: "Guest name and email are required" }, { status: 400 });
    }

    let order;
    try {
      order = await prisma.$transaction(async (tx) => {
        const productIds = items.map((item) => item.productId);
        const products = await tx.product.findMany({
          where: { id: { in: productIds }, isActive: true },
          select: { id: true, price: true, stock: true, name: true },
        });

        if (products.length !== items.length) {
          throw new Error("INVALID_PRODUCTS");
        }

        let totalAmount = 0;
        for (const item of items) {
          const product = products.find((p) => p.id === item.productId);
          if (!product) throw new Error("PRODUCT_NOT_FOUND");
          if (product.stock < item.quantity) {
            throw new Error(`INSUFFICIENT_STOCK:${product.name}:${product.stock}`);
          }
          totalAmount += product.price * item.quantity;
        }

        // Dedupe quantities per product — duplicate cart lines must not
        // produce multiple VALUES rows matching the same target row.
        const qtyById = new Map<string, number>();
        for (const item of items) {
          qtyById.set(item.productId, (qtyById.get(item.productId) ?? 0) + item.quantity);
        }

        // ── Batch stock decrement (1 statement, not N) ──────────────────────
        // The `stock >= qty` guard makes overselling impossible under
        // concurrent checkouts: row locks serialize writers and a losing
        // transaction updates fewer rows than expected → we roll back.
        const updatedRows = await tx.$executeRaw(
          Prisma.sql`
            UPDATE "Product" AS p
            SET stock = p.stock - data.qty
            FROM (VALUES ${Prisma.join(
              Array.from(qtyById.entries()).map(([pid, qty]) =>
                Prisma.sql`(${pid}::text, ${qty}::int)`
              )
            )}) AS data(id, qty)
            WHERE p.id = data.id AND p.stock >= data.qty
          `
        );

        if (updatedRows !== qtyById.size) {
          // Lost a race against another checkout — rollback the whole tx
          throw new Error("INSUFFICIENT_STOCK_RACE");
        }

        const shippingAddr = typeof shippingAddress === "string"
          ? shippingAddress
          : `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state}`;

        const newOrder = await tx.order.create({
          data: {
            userId: session?.user?.id || null,
            guestEmail: isGuest ? guestEmail! : null,
            guestName: isGuest ? guestName! : null,
            orderNumber: `ORD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
            items: {
              create: items.map((item) => {
                const product = products.find((p) => p.id === item.productId)!;
                return { productId: item.productId, quantity: item.quantity, price: product.price };
              }),
            },
            shippingAddr,
            shippingAddressData: typeof shippingAddress === "string" ? null : JSON.stringify(shippingAddress),
            totalAmount,
            subtotal: totalAmount,
            status: "PENDING",
            notes: notes || null,
          },
          include: { items: { include: { product: { select: { id: true, name: true, price: true, image: true } } } } },
        });

        return newOrder;
      }, { timeout: 10000 });
    } catch (txError) {
      if (txError instanceof Error) {
        // Handle insufficient stock with specific product info
        if (txError.message.startsWith("INSUFFICIENT_STOCK")) {
          const [, productName, available] = txError.message.split(":");
          if (!productName) {
            return NextResponse.json({
              message: "Some items in your cart just sold out or no longer have enough stock. Please review your cart.",
            }, { status: 409 });
          }
          return NextResponse.json({
            message: `Sorry, only ${available} units of "${productName}" are available.`,
          }, { status: 409 });
        }
        const errorMap: Record<string, [string, number]> = {
          INVALID_PRODUCTS: ["One or more products are no longer available", 400],
          PRODUCT_NOT_FOUND: ["Product not found", 404],
        };
        const [message, status] = errorMap[txError.message] || ["Failed to create order", 500];
        return NextResponse.json({ message }, { status });
      }
      throw txError;
    }

    console.info("[AUDIT] Order created:", { orderId: order.id, userId: session?.user?.id || "guest", itemsCount: items.length, totalAmount: order.totalAmount });

    const response = NextResponse.json(order, { status: 201 });
    response.headers.set("Cache-Control", "private, no-cache");

    return response;
  } catch (error) {
    console.error("[ERROR] POST order failed:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ message: "Error creating order" }, { status: 500 });
  }
}
