import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Call this route via a Vercel cron job every 15 minutes
// Add to vercel.json:
// "crons": [{ "path": "/api/cron/cleanup-pending-orders", "schedule": "*/15 * * * *" }]

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized execution
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

  const stalePendingOrders = await prisma.order.findMany({
    where: {
      status: "PENDING",
      createdAt: { lt: thirtyMinutesAgo },
    },
    include: {
      items: { select: { productId: true, quantity: true } },
    },
  })

  let restored = 0
  for (const order of stalePendingOrders) {
    try {
      await prisma.$transaction(async (tx) => {
        // Cancel the order
        await tx.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        })
        // Restore stock
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        }
        // Audit log
        await tx.orderLog.create({
          data: {
            orderId: order.id,
            userId: "system",
            action: "AUTO_CANCELLED",
            changes: JSON.stringify({
              reason: "Payment timeout — order was PENDING for over 30 minutes",
              itemsRestored: order.items.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
              })),
            }),
          },
        })
      })
      restored++
      console.info("[AUDIT] Stale PENDING order cancelled and stock restored:", {
        orderId: order.id,
      })
    } catch (err) {
      console.error("[ERROR] Failed to cleanup stale order:", {
        orderId: order.id,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return NextResponse.json({
    processed: stalePendingOrders.length,
    cancelled: restored,
    timestamp: new Date().toISOString(),
  })
}
