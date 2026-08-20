import { NextResponse } from "next/server";
import { prisma, TransactionClient } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendOrderStatusUpdate } from "@/lib/email";
import { generateTrackingNumber } from "@/lib/tracking";
import { type NextRequest } from "next/server";
import { UpdateOrderSchema } from "@/schemas/order.schema";

const VALID_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

type OrderStatus = (typeof VALID_STATUSES)[number];

// ✅ Define valid status transitions
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

function isValidStatus(status: string): status is OrderStatus {
  return VALID_STATUSES.includes(status as OrderStatus);
}

// ✅ Check if transition is allowed
function canTransitionTo(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params;

    // ✅ Validate ID parameter
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json(
        { message: "Bad Request: Invalid order ID" },
        { status: 400 }
      );
    }

    // ✅ Fetch order with all details
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            product: { select: { id: true, name: true, image: true, price: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Not Found: Order does not exist" },
        { status: 404 }
      );
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error("[ERROR] Fetch order failed:", {
      orderId: _req.nextUrl.pathname.split("/").pop(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        message:
          "Internal Server Error: Failed to fetch order. Please try again.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // ✅ Consistent auth checks
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

    const { id } = await params;
    const body = await request.json().catch(() => null);

    // ✅ Validate required fields
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json(
        { message: "Bad Request: Invalid order ID" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { message: "Bad Request: Invalid request body" },
        { status: 400 }
      );
    }

    const parseResult = UpdateOrderSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          message: "Bad Request: Invalid request body",
          errors: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { status, trackingNumber, trackingCarrier, estimatedDelivery, reason } =
      parseResult.data;

    if (!status) {
      return NextResponse.json(
        { message: "Bad Request: Status is required" },
        { status: 400 }
      );
    }

    // ✅ Fetch current order
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        trackingNumber: true,
        user: { select: { email: true, name: true } },
      },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { message: "Not Found: Order does not exist" },
        { status: 404 }
      );
    }

    // ✅ Validate status transition
    if (
      !canTransitionTo(
        currentOrder.status as OrderStatus,
        status as OrderStatus
      )
    ) {
      return NextResponse.json(
        {
          message: `Bad Request: Cannot transition from ${currentOrder.status} to ${status}`,
        },
        { status: 400 }
      );
    }

    // ✅ Auto-generate tracking number when moving to SHIPPED
    let autoTrackingNumber: string | undefined;
    if (
      status === "SHIPPED" &&
      currentOrder.status !== "SHIPPED" &&
      !currentOrder.trackingNumber &&
      !trackingNumber
    ) {
      autoTrackingNumber = generateTrackingNumber();
    }

    // ✅ Update order in transaction with audit
    const updatedOrder = await prisma.$transaction(async (tx: TransactionClient) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
          trackingNumber: trackingNumber || autoTrackingNumber || undefined,
          trackingCarrier: trackingCarrier || undefined,
          estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
        },
        include: {
          user: { select: { name: true, email: true } },
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      });

      // ✅ Create audit log entry
      await tx.orderLog.create({
        data: {
          orderId: id,
          userId: session.user?.id || "system",
          action: "STATUS_CHANGE",
          changes: JSON.stringify({
            oldStatus: currentOrder.status,
            newStatus: status,
            reason,
            ...(autoTrackingNumber && { autoTrackingNumber }),
          }),
        },
      });

      return updated;
    });

    // ✅ Send email notification asynchronously
    if (currentOrder.user?.email) {
      try {
        await sendOrderStatusUpdate(
          currentOrder.user.email,
          currentOrder.user.name || "Customer",
          id,
          status
        );
      } catch (emailError) {
        console.warn("[WARN] Failed to send order status email:", {
          orderId: id,
          userEmail: currentOrder.user.email,
          error: emailError instanceof Error ? emailError.message : String(emailError),
        });
        // Don't fail the entire request if email fails
      }
    }

    // ✅ Log audit trail
    console.info("[AUDIT] Order status updated:", {
      orderId: id,
      adminId: session.user?.id,
      adminEmail: session.user?.email,
      oldStatus: currentOrder.status,
      newStatus: status,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        message: `Order status updated to ${status}`,
        order: updatedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR] Update order status failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        message:
          "Internal Server Error: Failed to update order. Please try again.",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/orders/[id]
 * Cancel an order (soft delete)
 *
 * @requires Admin role
 * @param id - Order ID
 * @body reason - Reason for cancellation
 * @returns { message, order }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { id } = await params;

    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json(
        { message: "Bad Request: Invalid order ID" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    const reason = body?.reason || "Cancelled by admin";

    // ✅ Fetch order to check state
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        user: { select: { email: true, name: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Not Found: Order does not exist" },
        { status: 404 }
      );
    }

    // ✅ Prevent cancelling already delivered/cancelled orders
    const cancelableStatuses = ["PENDING", "PAID", "PROCESSING"];
    if (!cancelableStatuses.includes(order.status)) {
      return NextResponse.json(
        {
          message: `Bad Request: Cannot cancel order with status ${order.status}`,
        },
        { status: 400 }
      );
    }

    // ✅ Cancel order in transaction with stock restoration
    const cancelledOrder = await prisma.$transaction(async (tx: TransactionClient) => {
      const cancelled = await tx.order.update({
        where: { id },
        data: {
          status: "CANCELLED",
          updatedAt: new Date(),
        },
        include: {
          user: { select: { name: true, email: true } },
          items: { select: { productId: true, quantity: true } },
        },
      });

      // ✅ Restore stock for all items in this cancelled order
      for (const item of cancelled.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      // ✅ Create audit log
      await tx.orderLog.create({
        data: {
          orderId: id,
          userId: session.user?.id || "system",
          action: "CANCELLED",
          changes: JSON.stringify({
            oldStatus: order.status,
            newStatus: "CANCELLED",
            reason,
            stockRestored: cancelled.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            })),
          }),
        },
      });

      return cancelled;
    });

    console.info("[AUDIT] Order cancelled by admin — stock restored:", {
      orderId: id,
      adminId: session.user?.id,
      reason,
      itemsRestored: cancelledOrder.items.length,
      timestamp: new Date().toISOString(),
    });

    // ✅ Send cancellation email
    if (order.user?.email) {
      try {
        await sendOrderStatusUpdate(
          order.user.email,
          order.user.name || "Customer",
          id,
          "CANCELLED"
        );
      } catch (emailError) {
        console.warn("[WARN] Failed to send cancellation email:", {
          orderId: id,
          error: emailError instanceof Error ? emailError.message : String(emailError),
        });
      }
    }

    console.info("[AUDIT] Order cancelled by admin:", {
      orderId: id,
      adminId: session.user?.id,
      reason,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        message: "Order cancelled successfully",
        order: cancelledOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ERROR] Cancel order failed:", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        message:
          "Internal Server Error: Failed to cancel order. Please try again.",
      },
      { status: 500 }
    );
  }
}
