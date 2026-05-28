import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
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
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "PAID", paymentRef: event.data.reference },
      })
      console.info("[AUDIT] Order paid via Paystack:", { orderId, reference: event.data.reference })
    }
  }

  return NextResponse.json({ received: true })
}
