import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { type NextRequest } from "next/server";
import { z } from "zod";

const OrderItemSchema = z.object({
  productId: z.string().cuid("Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(1000),
});

const AddressSchema = z.union([
  z.object({
    street: z.string().min(5).max(255).trim(),
    city: z.string().min(2).max(100).trim(),
    state: z.string().min(2).max(100).trim(),
    postalCode: z.string().max(20).trim().optional().nullable(),
    country: z.string().max(100).trim().default("Nigeria"),
  }),
  z.string().min(5).max(500).trim(),
]);

const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1).max(100),
  shippingAddress: AddressSchema,
  notes: z.string().max(1000).trim().optional().nullable(),
});

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
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized: Please login" }, { status: 401 });
    }

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

    const { items, shippingAddress, notes } = parseResult.data;

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
          if (product.stock < item.quantity) throw new Error("OUT_OF_STOCK");
          totalAmount += product.price * item.quantity;
        }

        const shippingAddr = typeof shippingAddress === "string"
          ? shippingAddress
          : `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state}`;

        const newOrder = await tx.order.create({
          data: {
            userId: session.user.id,
            orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
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

        for (const item of items) {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
        }

        return newOrder;
      }, { timeout: 10000 });
    } catch (txError) {
      if (txError instanceof Error) {
        const errorMap: Record<string, [string, number]> = {
          INVALID_PRODUCTS: ["One or more products are no longer available", 400],
          PRODUCT_NOT_FOUND: ["Product not found", 404],
          OUT_OF_STOCK: ["One or more products are out of stock", 400],
        };
        const [message, status] = errorMap[txError.message] || ["Failed to create order", 500];
        return NextResponse.json({ message }, { status });
      }
      throw txError;
    }

    console.info("[AUDIT] Order created:", { orderId: order.id, userId: session.user.id, itemsCount: items.length, totalAmount: order.totalAmount });

    const response = NextResponse.json(order, { status: 201 });
    response.headers.set("Cache-Control", "private, no-cache");

    return response;
  } catch (error) {
    console.error("[ERROR] POST order failed:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ message: "Error creating order" }, { status: 500 });
  }
}
