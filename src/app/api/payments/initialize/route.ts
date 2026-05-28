import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const { orderId } = await request.json().catch(() => ({}))
  if (!orderId) return NextResponse.json({ message: "Missing orderId" }, { status: 400 })

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { email: true } } },
  })

  if (!order || order.userId !== session.user.id)
    return NextResponse.json({ message: "Order not found" }, { status: 404 })
  if (order.status !== "PENDING")
    return NextResponse.json({ message: "Order is not in a payable state" }, { status: 400 })
  if (!process.env.PAYSTACK_SECRET_KEY)
    return NextResponse.json({ message: "Payment service not configured" }, { status: 503 })

  const customerEmail = order.user.email ?? session.user.email
  if (!customerEmail)
    return NextResponse.json({ message: "Account email required for payment" }, { status: 400 })

  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3001"

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: customerEmail,
      amount: Math.round(order.totalAmount * 100),
      reference: `PAY-${order.id}-${Date.now()}`,
      callback_url: `${baseUrl}/dashboard/orders?payment=success`,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    }),
  })

  const paystackData = await paystackRes.json()
  if (!paystackData.status)
    return NextResponse.json({ message: "Payment initialization failed" }, { status: 500 })

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentRef: paystackData.data.reference },
  })

  return NextResponse.json({ authorizationUrl: paystackData.data.authorization_url })
}
