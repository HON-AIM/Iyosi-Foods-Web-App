import { prisma } from "@/lib/db"
import { sendOrderConfirmationEmail } from "@/lib/email"

export class OrderPaymentError extends Error {
  constructor(code: string) {
    super(code)
    this.name = "OrderPaymentError"
  }
}

export type ConfirmOrderPaymentResult =
  | { confirmed: true }
  | { confirmed: false; reason: "NOT_FOUND" | "NOT_PENDING" }

export async function confirmOrderPayment(
  orderId: string,
  reference: string
): Promise<ConfirmOrderPaymentResult> {
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

  if (!existingOrder) return { confirmed: false, reason: "NOT_FOUND" }
  if (existingOrder.status !== "PENDING") return { confirmed: false, reason: "NOT_PENDING" }
  if (!existingOrder.paymentRef || existingOrder.paymentRef !== reference) {
    throw new OrderPaymentError("REFERENCE_MISMATCH")
  }

  await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "PAID", paymentRef: reference },
    })
    if (updated.count !== 1) throw new OrderPaymentError("STATUS_RACE")

    await tx.orderLog.create({
      data: {
        orderId,
        userId: existingOrder.userId || "system",
        action: "PAYMENT_CONFIRMED",
        changes: JSON.stringify({ reference, event: "charge.success" }),
      },
    })
  })

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
      console.error(
        "[ERROR] Failed to send order confirmation email:",
        err instanceof Error ? err.message : String(err)
      )
    )
  }

  return { confirmed: true }
}
