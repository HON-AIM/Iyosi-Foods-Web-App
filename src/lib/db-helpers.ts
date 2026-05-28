import { prisma } from "./db"

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id, isActive: true },
    select: { id: true, name: true, price: true, stock: true, image: true, category: true },
  })
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, isActive: true, emailVerified: true },
  })
}

export async function getOrdersByUserId(userId: string, page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: { select: { id: true, name: true, price: true, image: true } } } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.order.count({ where: { userId } }),
  ])
  return { orders, total, pages: Math.ceil(total / pageSize) }
}
