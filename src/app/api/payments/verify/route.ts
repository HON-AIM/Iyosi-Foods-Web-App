import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { confirmOrderPayment, OrderPaymentError } from "@/lib/payments"
import { verifyTransaction } from "@/lib/paystack"

const FINAL_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"]

export async function POST(request: Request) {
  const session = await auth()
  const { orderId, orderToken } = await request.json().catch(() => ({}))
  if (!orderId || typeof orderId !== "string") {
    return NextResponse.json({ message: "Missing orderId" }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      status: true,
      paymentRef: true,
      totalAmount: true,
      orderToken: true,
    },
  })

  if (!order) {
    return NextResponse.json({ message: "Order not found" }, { status: 404 })
  }

  if (session?.user?.id) {
    if (order.userId !== session.user.id) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }
  } else {
    const tokenOk = order.userId === null && !!order.orderToken && order.orderToken === orderToken
    if (!tokenOk) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }
  }

  if (FINAL_STATUSES.includes(order.status)) {
    return NextResponse.json({ confirmed: true, status: order.status })
  }

  if (order.status === "CANCELLED") {
    return NextResponse.json({ confirmed: false, message: "This order was cancelled." }, { status: 400 })
  }

  if (!order.paymentRef) {
    return NextResponse.json(
      { confirmed: false, message: "No payment was started for this order." },
      { status: 400 }
    )
  }

  const verified = await verifyTransaction(order.paymentRef).catch(() => null)
  if (!verified || verified.status !== "success") {
    return NextResponse.json(
      { confirmed: false, message: "We could not confirm your payment yet." },
      { status: 200 }
    )
  }

  const amountPaidInNaira = (verified.amount ?? 0) / 100
  if (Math.abs(amountPaidInNaira - order.totalAmount) > 0.01) {
    console.error("[SECURITY] Verify amount mismatch:", {
      orderId,
      amountPaid: amountPaidInNaira,
      orderTotal: order.totalAmount,
    })
    await prisma.orderLog
      .create({
        data: {
          orderId,
          userId: order.userId || "system",
          action: "PAYMENT_AMOUNT_MISMATCH",
          changes: JSON.stringify({
            amountPaid: amountPaidInNaira,
            orderTotal: order.totalAmount,
            source: "verify",
          }),
        },
      })
      .catch(() => {})
    return NextResponse.json(
      { confirmed: false, message: "Payment amount mismatch — please contact support." },
      { status: 400 }
    )
  }

  try {
    const result = await confirmOrderPayment(order.id, order.paymentRef)
    if (result.confirmed) {
      return NextResponse.json({ confirmed: true, status: "PAID" })
    }
    return NextResponse.json(
      { confirmed: false, message: "Order is not in a payable state." },
      { status: 409 }
    )
  } catch (error) {
    if (error instanceof OrderPaymentError) {
      console.error("[SECURITY] Verify rejected payment confirmation:", { orderId, code: error.message })
      return NextResponse.json(
        { confirmed: false, message: "Payment verification failed." },
        { status: 409 }
      )
    }
    throw error
  }
}