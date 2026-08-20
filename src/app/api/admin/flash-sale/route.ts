import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const FlashSaleSchema = z.object({
  isFlashSale: z.boolean(),
  flashSalePrice: z.number().positive().optional().nullable(),
  flashSaleEndsAt: z.string().datetime().optional().nullable(),
  productIds: z.array(z.string()).min(1).max(50),
})

const SettingsSchema = z.object({
  flashSaleTitle: z.string().max(100).trim().optional(),
  flashSaleActive: z.boolean().optional(),
  flashSaleEndTime: z.string().datetime().optional().nullable(),
})

// GET — fetch all flash sale products + current settings
export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN")
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const [products, settings] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        image: true,
        category: true,
        isFlashSale: true,
        flashSalePrice: true,
        flashSaleEndsAt: true,
      },
      orderBy: [{ isFlashSale: "desc" }, { name: "asc" }],
    }),
    prisma.storeSettings.findFirst({
      where: { id: "global" },
      select: {
        flashSaleTitle: true,
        flashSaleActive: true,
        flashSaleEndTime: true,
      },
    }),
  ])

  return NextResponse.json({ products, settings })
}

// PATCH — update flash sale status for one or more products, or update settings
export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN")
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)

  // Handle settings update
  if (body?.type === "settings") {
    const parsed = SettingsSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ message: "Validation failed", errors: parsed.error.flatten() }, { status: 400 })

    const settings = await prisma.storeSettings.upsert({
      where: { id: "global" },
      update: {
        flashSaleTitle: parsed.data.flashSaleTitle,
        flashSaleActive: parsed.data.flashSaleActive,
        flashSaleEndTime: parsed.data.flashSaleEndTime ? new Date(parsed.data.flashSaleEndTime) : null,
      },
      create: {
        id: "global",
        flashSaleTitle: parsed.data.flashSaleTitle,
        flashSaleActive: parsed.data.flashSaleActive,
        flashSaleEndTime: parsed.data.flashSaleEndTime ? new Date(parsed.data.flashSaleEndTime) : null,
      },
    })
    return NextResponse.json({ settings })
  }

  // Handle product flash sale toggle
  const parsed = FlashSaleSchema.safeParse(body)
  if (!parsed.success)
    return NextResponse.json({ message: "Validation failed", errors: parsed.error.flatten() }, { status: 400 })

  const { productIds, isFlashSale, flashSalePrice, flashSaleEndsAt } = parsed.data

  await prisma.product.updateMany({
    where: { id: { in: productIds } },
    data: {
      isFlashSale,
      flashSalePrice: isFlashSale ? flashSalePrice : null,
      flashSaleEndsAt: isFlashSale && flashSaleEndsAt ? new Date(flashSaleEndsAt) : null,
    },
  })

  return NextResponse.json({ message: `Updated ${productIds.length} product(s)` })
}
