import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const Schema = z.object({ productId: z.string().cuid() })

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const savedItems = await prisma.savedItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: { id: true, name: true, price: true, image: true, stock: true, isActive: true, category: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })
  return NextResponse.json({ savedItems })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  const body = await request.json().catch(() => null)
  const result = Schema.safeParse(body)
  if (!result.success) return NextResponse.json({ message: "Invalid product ID" }, { status: 400 })
  const { productId } = result.data
  const product = await prisma.product.findUnique({
    where: { id: productId, isActive: true },
    select: { id: true }
  })
  if (!product) return NextResponse.json({ message: "Product not found" }, { status: 404 })
  const existing = await prisma.savedItem.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } }
  })
  if (existing) {
    await prisma.savedItem.delete({
      where: { userId_productId: { userId: session.user.id, productId } }
    })
    return NextResponse.json({ saved: false, message: "Removed from wishlist" })
  }
  await prisma.savedItem.create({ data: { userId: session.user.id, productId } })
  return NextResponse.json({ saved: true, message: "Added to wishlist ♥" })
}
