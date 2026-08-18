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
    if (orderId) {
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: "PAID", paymentRef: event.data.reference },
        include: {
          user: { select: { email: true, name: true } },
          items: {
            include: { product: { select: { name: true } } },
          },
        },
      })

      console.info("[AUDIT] Order paid via Paystack:", {
        orderId,
        reference: event.data.reference,
      })

      if (updatedOrder.user.email) {
        sendOrderConfirmationEmail(updatedOrder.user.email, updatedOrder.user.name || "Customer", {
          orderNumber: updatedOrder.orderNumber ?? `ORD-${orderId.slice(0, 8)}`,
          totalAmount: updatedOrder.totalAmount,
          shippingAddr: updatedOrder.shippingAddr ?? "Not specified",
          items: updatedOrder.items.map((item) => ({
            productName: item.product.name,
            quantity: item.quantity,
            price: item.price,
          })),
        }).catch((err) =>
          console.error("[ERROR] Failed to send order confirmation email:", err instanceof Error ? err.message : String(err))
        )
      }
    }
  }

  return NextResponse.json({ received: true })
}
