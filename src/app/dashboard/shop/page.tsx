import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import DashboardShopClient from "./DashboardShopClient"

export const dynamic = "force-dynamic"

export default async function DashboardShopPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; q?: string; sort?: string }>
}) {
  const session = await auth()
  const params = searchParams ? await searchParams : {}

  const VALID = ["BAKING", "WHEAT", "ALL_PURPOSE", "SEMOLINA"]
  const rawCat = (params.category || "").toUpperCase()
  const activeCategory = VALID.includes(rawCat) ? rawCat : null
  const searchQuery = params.q?.trim() || ""
  const sortBy = params.sort || "newest"

  const orderBy =
    sortBy === "price-asc"  ? { price: "asc" as const }  :
    sortBy === "price-desc" ? { price: "desc" as const }  :
    sortBy === "name"       ? { name: "asc" as const }    :
                              { createdAt: "desc" as const }

  const where = {
    isActive: true,
    ...(activeCategory && { category: activeCategory as "BAKING" | "WHEAT" | "ALL_PURPOSE" | "SEMOLINA" }),
    ...(searchQuery && {
      OR: [
        { name: { contains: searchQuery, mode: "insensitive" as const } },
        { description: { contains: searchQuery, mode: "insensitive" as const } },
      ],
    }),
  }

  const [products, savedItems, categoryCounts] = await Promise.all([
    prisma.product.findMany({
      where, orderBy,
      select: { id: true, name: true, price: true, stock: true, image: true, description: true, category: true },
    }),
    session?.user?.id
      ? prisma.savedItem.findMany({ where: { userId: session.user.id }, select: { productId: true } })
      : [],
    prisma.product.groupBy({ by: ["category"], where: { isActive: true }, _count: { id: true } }),
  ])

  const savedProductIds = savedItems.map(s => s.productId)
  const countMap = Object.fromEntries(categoryCounts.map(c => [c.category, c._count.id]))

  return (
    <DashboardShopClient
      products={products}
      savedProductIds={savedProductIds}
      activeCategory={activeCategory}
      searchQuery={searchQuery}
      sortBy={sortBy}
      categoryCountMap={countMap}
    />
  )
}
