import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { confirmOrderPayment, OrderPaymentError } from "@/lib/payments"
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

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { totalAmount: true, status: true },
    })

    if (!order) {
      console.error("[ERROR] Order not found for Paystack webhook:", { orderId })
      return NextResponse.json({ received: true })
    }

    if (order.status !== "PENDING") {
      console.info("[INFO] Webhook already processed for order:", { orderId, currentStatus: order.status })
      return NextResponse.json({ received: true })
    }

    const amountPaidInNaira = event.data.amount / 100
    const orderTotal = order.totalAmount

    if (isNaN(amountPaidInNaira) || Math.abs(amountPaidInNaira - orderTotal) > 0.01) {
      console.error("[SECURITY] Blocking webhook — payment amount mismatch:", {
        orderId,
        amountPaid: amountPaidInNaira,
        orderTotal,
      })
      await prisma.orderLog.create({
        data: {
          orderId,
          userId: "system",
          action: "PAYMENT_AMOUNT_MISMATCH",
          changes: JSON.stringify({ amountPaid: amountPaidInNaira, orderTotal }),
        },
      }).catch((err) =>
        console.error("[ERROR] Failed to log amount mismatch:", err instanceof Error ? err.message : String(err))
      )
      return NextResponse.json({ received: true }, { status: 200 })
    }

    try {
      const result = await confirmOrderPayment(orderId, reference)
      if (result.confirmed) {
        console.info("[AUDIT] Order confirmed via Paystack:", { orderId, reference })
      }
    } catch (error) {
      if (error instanceof OrderPaymentError) {
        console.error(
          error.message === "REFERENCE_MISMATCH"
            ? "[SECURITY] Payment reference mismatch:"
            : "[ERROR] Payment status race:",
          { orderId, reference }
        )
        return NextResponse.json({ received: true })
      }
      console.error("[ERROR] Webhook processing failed:", error)
      throw error
    }
  }

  return NextResponse.json({ received: true })
}
