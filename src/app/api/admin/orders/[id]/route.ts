import { NextResponse } from "next/server";
import { prisma, TransactionClient } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendOrderStatusUpdate, sendDeliveryConfirmationEmail } from "@/lib/email";
import { generateTrackingNumber } from "@/lib/tracking";
import { refundTransaction } from "@/lib/paystack";
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
  const { id } = await params;

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

    // ✅ Update order in transaction with audit (compare-and-set against the status we read)
    const updatedOrder = await prisma.$transaction(async (tx: TransactionClient) => {
      const updatedCount = await tx.order.updateMany({
        where: { id, status: currentOrder.status as OrderStatus },
        data: {
          status,
          updatedAt: new Date(),
          trackingNumber: trackingNumber || autoTrackingNumber || undefined,
          trackingCarrier: trackingCarrier || undefined,
          estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
        },
      });

      if (updatedCount.count !== 1) throw new Error("ORDER_STATUS_RACE");

      const updated = await tx.order.findUnique({
        where: { id },
        include: {
          user: { select: { name: true, email: true } },
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      });

      if (!updated) throw new Error("ORDER_STATUS_RACE");

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

      // ✅ Send delivery confirmation email when order is delivered
      if (status === "DELIVERED") {
        const customerEmail = currentOrder.user?.email;
        if (customerEmail) {
          sendDeliveryConfirmationEmail({
            email: customerEmail,
            name: currentOrder.user?.name || "Customer",
            orderNumber: id.slice(-8).toUpperCase(),
          }).catch((err) =>
            console.error("[ERROR] Delivery confirmation email failed:", err instanceof Error ? err.message : String(err))
          );
        }
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
    if (error instanceof Error && error.message === "ORDER_STATUS_RACE") {
      console.warn("[WARN] Order status race detected:", { orderId: id });
      return NextResponse.json(
        {
          message: "Order status was changed by another action. Refresh and try again.",
        },
        { status: 409 }
      );
    }

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
  const { id } = await params;

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
        paymentRef: true,
        totalAmount: true,
        refundStatus: true,
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
    const cancelableStatuses: OrderStatus[] = ["PENDING", "PAID", "PROCESSING"];
    if (!cancelableStatuses.includes(order.status)) {
      return NextResponse.json(
        {
          message: `Bad Request: Cannot cancel order with status ${order.status}`,
        },
        { status: 400 }
      );
    }

    // ✅ Was payment received before this cancellation?
    const wasPaid = order.status === "PAID" || order.status === "PROCESSING";

    // ✅ Cancel order in transaction with stock restoration (compare-and-set)
    const cancelledOrder = await prisma.$transaction(async (tx: TransactionClient) => {
      const cancelledCount = await tx.order.updateMany({
        where: { id, status: { in: cancelableStatuses } },
        data: {
          status: "CANCELLED",
          ...(wasPaid ? { refundStatus: "PENDING" } : {}),
          updatedAt: new Date(),
        },
      });

      if (cancelledCount.count !== 1) throw new Error("ORDER_STATUS_RACE");

      const cancelled = await tx.order.findUnique({
        where: { id },
        include: {
          user: { select: { name: true, email: true } },
          items: { select: { productId: true, quantity: true } },
        },
      });

      if (!cancelled) throw new Error("ORDER_STATUS_RACE");

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

    // ✅ Initiate refund AFTER the transaction commits — a Paystack failure must
    //    never roll back the cancellation or the stock restoration.
    if (wasPaid && order.paymentRef && cancelledOrder.refundStatus === "PENDING") {
      try {
        const refund = await refundTransaction(order.paymentRef, Math.round(order.totalAmount * 100));
        await prisma.order.update({
          where: { id },
          data: { refundStatus: "SUCCEEDED", refundId: String(refund.id) },
        });
        await prisma.orderLog.create({
          data: {
            orderId: id,
            userId: session.user?.id || "system",
            action: "REFUND_INITIATED",
            changes: JSON.stringify({ reference: order.paymentRef, refundId: refund.id, status: refund.status }),
          },
        });
        console.info("[AUDIT] Refund initiated for cancelled order:", { orderId: id, refundId: refund.id });
      } catch (refundError) {
        await prisma.order.update({
          where: { id },
          data: { refundStatus: "FAILED" },
        }).catch(() => {});
        console.error("[ERROR] Refund initiation failed — admin must process manually:", {
          orderId: id,
          reference: order.paymentRef,
          error: refundError instanceof Error ? refundError.message : String(refundError),
        });
      }
    }

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
    if (error instanceof Error && error.message === "ORDER_STATUS_RACE") {
      console.warn("[WARN] Cancel race detected — order status already changed:", { orderId: id });
      return NextResponse.json(
        {
          message: "Order status was changed by another action. Refresh and try again.",
        },
        { status: 409 }
      );
    }

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
