import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import DashboardProductActions from "./DashboardProductActions"
import DashboardProductReviews from "./DashboardProductReviews"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DashboardProductPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()

  const [product, reviews, totalReviewCount, ratingData, isSaved] = await Promise.all([
    prisma.product.findUnique({
      where: { id, isActive: true },
    }),
    prisma.review.findMany({
      where: { productId: id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.review.count({ where: { productId: id } }),
    prisma.review.aggregate({
      where: { productId: id },
      _avg: { rating: true },
    }),
    session?.user?.id
      ? prisma.savedItem.findUnique({
          where: { userId_productId: { userId: session.user.id, productId: id } },
        }).then(Boolean)
      : Promise.resolve(false),
  ])

  if (!product) notFound()

  const avgRating = Math.round((ratingData._avg.rating ?? 0) * 10) / 10
  const formatMoney = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-4">

      {/* ── Breadcrumb ─────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1 text-sm text-gray-400">
        <Link href="/dashboard" className="hover:text-green-600 transition-colors">
          My Account
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/dashboard/shop" className="hover:text-green-600 transition-colors">
          Shop
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/dashboard/shop?category=${product.category}`} className="hover:text-green-600 transition-colors">
          {product.category.replace("_", " ")}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-600 font-medium truncate max-w-[160px]">{product.name}</span>
      </nav>

      {/* ── Product Card ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">

          {/* Image */}
          <div className="relative aspect-square bg-gray-50 p-6 flex items-center justify-center">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-contain p-8 mix-blend-multiply"
                priority
              />
            ) : (
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 text-sm">
                No Image
              </div>
            )}
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-gray-900/30 flex items-center justify-center">
                <span className="bg-gray-800 text-white text-sm font-bold px-4 py-2 rounded-lg">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 md:p-8 flex flex-col gap-4">

            {/* Category + Name */}
            <div>
              <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">
                {product.category.replace("_", " ")}
              </p>
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Rating */}
            {totalReviewCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1,2,3,4,5].map((star) => (
                    <svg key={star} className={`w-4 h-4 ${star <= Math.round(avgRating) ? "text-yellow-400" : "text-gray-200"} fill-current`} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  {avgRating} ({totalReviewCount} review{totalReviewCount !== 1 ? "s" : ""})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-3xl font-extrabold text-gray-900">
                {formatMoney(product.price)}
              </p>
              {product.price >= 25000 && (
                <p className="text-sm text-green-600 font-semibold mt-1">
                  ✓ Free delivery on this order
                </p>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed">
              {product.description}
            </p>

            {/* Stock */}
            <p className={`text-sm font-semibold ${product.stock > 5 ? "text-green-600" : product.stock > 0 ? "text-orange-500" : "text-red-500"}`}>
              {product.stock > 5 ? `✓ In Stock (${product.stock} available)` :
               product.stock > 0 ? `⚠ Only ${product.stock} left in stock` :
               "✗ Out of Stock"}
            </p>

            {/* Add to Cart + Wishlist — client component */}
            <DashboardProductActions
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                stock: product.stock,
                image: product.image,
              }}
              initialSaved={isSaved}
            />
          </div>
        </div>
      </div>

      {/* ── Reviews ─────────────────────────────────────────────────── */}
      <DashboardProductReviews
        productId={product.id}
        reviews={reviews.map(r => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt.toISOString(),
          user: { name: r.user.name },
        }))}
        totalCount={totalReviewCount}
        avgRating={avgRating}
      />

      {/* ── Back to shop ────────────────────────────────────────────── */}
      <Link
        href="/dashboard/shop"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition-colors font-medium"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Shop
      </Link>
    </div>
  )
}
