import type { Metadata } from "next"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { type Category } from "@prisma/client"
import DashboardShopClient from "./DashboardShopClient"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Shop | My Account — Iyosiola Foods",
}

interface PageProps {
  searchParams?: Promise<{
    category?: string
    q?: string
    sort?: string
  }>
}

const VALID_CATEGORIES: Category[] = ["BAKING", "WHEAT", "ALL_PURPOSE", "SEMOLINA"]

export default async function DashboardShopPage({ searchParams }: PageProps) {
  const session = await auth()
  const params = searchParams ? await searchParams : {}

  const rawCategory = (params.q ? "" : params.category || "").toUpperCase()
  const activeCategory = VALID_CATEGORIES.includes(rawCategory as Category)
    ? (rawCategory as Category)
    : null

  const searchQuery = params.q?.trim() || ""
  const sortBy = params.sort || "newest"

  // Build where clause
  const where = {
    isActive: true,
    ...(activeCategory && { category: activeCategory }),
    ...(searchQuery && {
      OR: [
        { name: { contains: searchQuery, mode: "insensitive" as const } },
        { description: { contains: searchQuery, mode: "insensitive" as const } },
      ],
    }),
  }

  // Build orderBy
  const orderBy =
    sortBy === "price-asc"  ? { price: "asc" as const }  :
    sortBy === "price-desc" ? { price: "desc" as const }  :
    sortBy === "name"       ? { name: "asc" as const }    :
                              { createdAt: "desc" as const }

  // Fetch products + saved item IDs in parallel
  const [products, savedItems, categoryCounts] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      select: {
        id: true, name: true, price: true, stock: true,
        image: true, description: true, category: true,
      },
    }),
    session?.user?.id
      ? prisma.savedItem.findMany({
          where: { userId: session.user.id },
          select: { productId: true },
        })
      : Promise.resolve([]),
    // Count per category for badge display
    prisma.product.groupBy({
      by: ["category"],
      where: { isActive: true },
      _count: { id: true },
    }),
  ])

  const savedProductIds = new Set(savedItems.map((s) => s.productId))
  const categoryCountMap = Object.fromEntries(
    categoryCounts.map((c) => [c.category, c._count.id])
  )

  return (
    <DashboardShopClient
      products={products}
      savedProductIds={Array.from(savedProductIds)}
      activeCategory={activeCategory}
      searchQuery={searchQuery}
      sortBy={sortBy}
      categoryCountMap={categoryCountMap}
      totalCount={products.length}
    />
  )
}
