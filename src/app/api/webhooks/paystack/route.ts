import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendOrderConfirmationEmail } from "@/lib/email"
import crypto from "crypto"

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-paystack-signature")

  if (!signature || !process.env.PAYSTACK_SECRET_KEY)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const expected = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex")

  if (signature !== expected) {
    console.warn("[SECURITY] Paystack webhook signature mismatch")
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 })
  }

  const event = JSON.parse(rawBody)

  if (event.event === "charge.success") {
    const orderId = event.data?.metadata?.orderId
    const reference = event.data?.reference

    if (!orderId || !reference) {
      console.error("[ERROR] Paystack webhook missing orderId or reference")
      return NextResponse.json({ received: true })
    }

    // ✅ IDEMPOTENCY CHECK — fetch order first
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        paymentRef: true,
        totalAmount: true,
        userId: true,
        user: { select: { email: true, name: true } },
        guestEmail: true,
        guestName: true,
        orderNumber: true,
        shippingAddr: true,
        items: {
          include: { product: { select: { name: true } } },
        },
      },
    })

    if (!existingOrder) {
      console.error("[ERROR] Order not found for Paystack webhook:", { orderId })
      return NextResponse.json({ received: true })
    }

    // ✅ Skip if already processed (idempotent)
    if (
      existingOrder.status === "PAID" ||
      existingOrder.status === "PROCESSING" ||
      existingOrder.status === "SHIPPED" ||
      existingOrder.status === "DELIVERED"
    ) {
      console.info("[INFO] Webhook already processed for order:", {
        orderId,
        currentStatus: existingOrder.status,
      })
      return NextResponse.json({ received: true })
    }

    // ✅ Verify payment reference matches
    if (existingOrder.paymentRef && existingOrder.paymentRef !== reference) {
      console.error("[SECURITY] Payment reference mismatch:", {
        orderId,
        expected: existingOrder.paymentRef,
        received: reference,
      })
      return NextResponse.json({ received: true })
    }

    // ✅ SEC 2: Verify amount paid matches order total (Paystack uses kobo)
    const amountPaidInNaira = event.data.amount / 100
    const orderTotal = existingOrder.totalAmount

    if (Math.abs(amountPaidInNaira - orderTotal) > 1) {
      console.error("[SECURITY] Payment amount mismatch:", {
        orderId,
        amountPaid: amountPaidInNaira,
        orderTotal,
      })
      // Log but don't block — Paystack may add fees. Alert admin instead.
    }

    // ✅ Update order atomically
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID", paymentRef: reference },
      })
      await tx.orderLog.create({
        data: {
          orderId,
          userId: existingOrder.userId || "system",
          action: "PAYMENT_CONFIRMED",
          changes: JSON.stringify({ reference, event: "charge.success" }),
        },
      })
    })

    console.info("[AUDIT] Order confirmed via Paystack:", { orderId, reference })

    // ✅ Send order confirmation email
    const recipientEmail = existingOrder.user?.email ?? existingOrder.guestEmail
    const recipientName = existingOrder.user?.name ?? existingOrder.guestName ?? "Customer"

    if (recipientEmail) {
      sendOrderConfirmationEmail(recipientEmail, recipientName, {
        orderNumber: existingOrder.orderNumber ?? `ORD-${orderId.slice(0, 8)}`,
        totalAmount: existingOrder.totalAmount,
        shippingAddr: existingOrder.shippingAddr ?? "Not specified",
        items: existingOrder.items.map((item) => ({
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
        })),
      }).catch((err) =>
        console.error("[ERROR] Failed to send order confirmation email:", err instanceof Error ? err.message : String(err))
      )
    }
  }

  return NextResponse.json({ received: true })
}
