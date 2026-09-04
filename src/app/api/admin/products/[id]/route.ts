import { NextResponse } from "next/server";
import { prisma, TransactionClient } from "@/lib/db";
import { auth } from "@/lib/auth";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { invalidateCache, CACHE_KEYS } from "@/lib/cache";

const UpdateProductSchema = z.object({
  name: z.string().min(2).max(200).trim().optional(),
  description: z.string().min(10).max(2000).trim().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  image: z.string().url().nullable().optional(),
  category: z.enum(["BAKING", "WHEAT", "ALL_PURPOSE", "SEMOLINA", "SUGAR", "OIL", "RICE", "TOMATO_PASTE"]).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized: Please login" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;

    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json({ message: "Bad Request: Invalid product ID" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { reviews: true, orderItems: true } } },
    });

    if (!product) {
      return NextResponse.json({ message: "Not Found: Product does not exist" }, { status: 404 });
    }

    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error("[ERROR] Fetch product failed:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ message: "Internal Server Error: Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized: Please login" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;

    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json({ message: "Bad Request: Invalid product ID" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Bad Request: Invalid request body" }, { status: 400 });
    }

    const parseResult = UpdateProductSchema.safeParse({
      ...body,
      price: body.price !== undefined ? Number(body.price) : undefined,
      stock: body.stock !== undefined ? Number(body.stock) : undefined,
    });

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((e) => ({ field: e.path.join("."), message: e.message }));
      return NextResponse.json({ message: "Validation failed", errors }, { status: 400 });
    }

    const currentProduct = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, price: true, stock: true, image: true, category: true, isActive: true },
    });

    if (!currentProduct) {
      return NextResponse.json({ message: "Not Found: Product does not exist" }, { status: 404 });
    }

    if (parseResult.data.name && parseResult.data.name !== currentProduct.name) {
      const existingProduct = await prisma.product.findFirst({ where: { name: parseResult.data.name, id: { not: id } } });
      if (existingProduct) {
        return NextResponse.json({ message: "Bad Request: A product with this name already exists" }, { status: 400 });
      }
    }

    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const [key, newValue] of Object.entries(parseResult.data)) {
      const oldValue = currentProduct[key as keyof typeof currentProduct];
      if (oldValue !== newValue) {
        changes[key] = { old: oldValue, new: newValue };
      }
    }

    let updatedProduct;
    try {
      updatedProduct = await prisma.$transaction(async (tx: TransactionClient) => {
        const updated = await tx.product.update({
          where: { id },
          data: parseResult.data,
          include: { _count: { select: { reviews: true, orderItems: true } } },
        });

        if (Object.keys(changes).length > 0) {
          try {
            await tx.productAuditLog.create({
              data: {
                productId: id,
                adminId: session.user?.id || "system",
                changes: JSON.stringify(changes),
              },
            });
          } catch {}
        }

        return updated;
      }, { timeout: 10000 });
    } catch (txError) {
      console.error("[ERROR] Transaction failed during product update:", { productId: id, error: txError instanceof Error ? txError.message : String(txError) });
      return NextResponse.json({ message: "Failed to update product. Please try again." }, { status: 409 });
    }

    console.info("[AUDIT] Admin updated product:", { adminId: session.user?.id, productId: id, changesCount: Object.keys(changes).length });

    await invalidateCache(
      CACHE_KEYS.products(),
      CACHE_KEYS.recommended(),
      CACHE_KEYS.productDetail(id),
      CACHE_KEYS.flashSaleProducts()
    );

    return NextResponse.json({ message: "Product updated successfully", product: updatedProduct, changes: Object.keys(changes) }, { status: 200 });
  } catch (error) {
    console.error("[ERROR] Update product failed:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ message: "Internal Server Error: Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized: Please login" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;

    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json({ message: "Bad Request: Invalid product ID" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id }, select: { id: true, name: true, isActive: true } });

    if (!product) {
      return NextResponse.json({ message: "Not Found: Product does not exist" }, { status: 404 });
    }

    const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });

    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      let message: string;
      let softDeleted: boolean;

      if (orderItemCount > 0) {
        await tx.product.update({
          where: { id },
          data: { isActive: false, stock: 0, deactivatedAt: new Date() },
        });
        message = `Product "${product.name}" has been deactivated (soft delete). It has ${orderItemCount} existing order(s).`;
        softDeleted = true;
      } else {
        await tx.product.delete({ where: { id } });
        message = `Product "${product.name}" has been permanently deleted.`;
        softDeleted = false;
      }

      try {
        await tx.productAuditLog.create({
          data: {
            productId: id,
            adminId: session.user?.id || "system",
            changes: JSON.stringify({ action: softDeleted ? "soft_delete" : "hard_delete", reason: orderItemCount > 0 ? `Has ${orderItemCount} order(s)` : "No order history" }),
          },
        });
      } catch {}

      return { message, softDeleted, orderItemCount };
    }, { timeout: 10000 });

    console.info("[AUDIT] Admin deleted product:", { adminId: session.user?.id, productId: id, softDeleted: result.softDeleted });

    await invalidateCache(
      CACHE_KEYS.products(),
      CACHE_KEYS.recommended(),
      CACHE_KEYS.productDetail(id),
      CACHE_KEYS.flashSaleProducts()
    );

    return NextResponse.json({ message: result.message, softDeleted: result.softDeleted }, { status: 200 });
  } catch (error) {
    console.error("[ERROR] Delete product failed:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ message: "Internal Server Error: Failed to delete product" }, { status: 500 });
  }
}
