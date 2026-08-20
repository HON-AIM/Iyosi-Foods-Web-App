import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Star, Package, ShoppingCart } from "lucide-react"
import WishlistButton from "@/components/shop/WishlistButton"
import AddToCartButton from "./AddToCartButton"

export const dynamic = "force-dynamic"

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n)
}

export default async function DashboardProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [product, reviews, totalCount, ratingData, savedItem] = await Promise.all([
    prisma.product.findUnique({ where: { id, isActive: true } }),
    prisma.review.findMany({
      where: { productId: id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" }, take: 8,
    }),
    prisma.review.count({ where: { productId: id } }),
    prisma.review.aggregate({ where: { productId: id }, _avg: { rating: true } }),
    prisma.savedItem.findUnique({
      where: { userId_productId: { userId: session.user.id, productId: id } }
    }),
  ])

  if (!product) notFound()

  const avgRating = Math.round((ratingData._avg.rating ?? 0) * 10) / 10
  const isSaved = !!savedItem

  return (
    <div className="max-w-3xl space-y-4">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-gray-400 flex-wrap">
        <Link href="/dashboard" className="hover:text-green-600">My Account</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/dashboard/shop" className="hover:text-green-600">Shop</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/dashboard/shop?category=${product.category}`} className="hover:text-green-600">
          {product.category.replace("_", " ")}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-600 truncate max-w-[180px]">{product.name}</span>
      </nav>

      {/* Product Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="grid md:grid-cols-2">

          {/* Image */}
          <div className="relative aspect-square bg-gray-50">
            {product.image ? (
              <Image
                src={product.image} alt={product.name} fill priority
                className="object-contain p-8 mix-blend-multiply"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-16 h-16 text-gray-200" />
              </div>
            )}
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="bg-white text-gray-800 text-sm font-bold px-4 py-2 rounded-lg">Out of Stock</span>
              </div>
            )}
            <div className="absolute top-4 right-4">
              <WishlistButton productId={product.id} initialSaved={isSaved} />
            </div>
          </div>

          {/* Details */}
          <div className="p-6 flex flex-col gap-4">
            <div>
              <p className="text-xs font-bold text-green-600 uppercase tracking-wider">{product.category.replace("_", " ")}</p>
              <h1 className="text-xl font-extrabold text-gray-900 mt-1 leading-tight">{product.name}</h1>
            </div>

            {/* Rating */}
            {totalCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? "text-yellow-400 fill-current" : "text-gray-200 fill-current"}`} />
                  ))}
                </div>
                <span className="text-sm text-gray-500">{avgRating} ({totalCount} review{totalCount !== 1 ? "s" : ""})</span>
              </div>
            )}

            {/* Price */}
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-3xl font-extrabold text-gray-900">{formatMoney(product.price)}</p>
              {product.price >= 25000 && <p className="text-sm text-green-600 font-semibold mt-1">✓ Free delivery</p>}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>

            {/* Stock */}
            <p className={`text-sm font-semibold ${product.stock > 5 ? "text-green-600" : product.stock > 0 ? "text-orange-500" : "text-red-500"}`}>
              {product.stock > 5 ? `✓ In Stock (${product.stock} available)` :
               product.stock > 0 ? `⚠ Only ${product.stock} left` : "✗ Out of Stock"}
            </p>

            {/* Add to Cart — client component */}
            <AddToCartButton product={{ id: product.id, name: product.name, price: product.price, stock: product.stock, image: product.image }} />
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">Customer Reviews ({totalCount})</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No reviews yet for this product.</p>
        ) : (
          <div className="space-y-4 divide-y divide-gray-50">
            {reviews.map(r => (
              <div key={r.id} className="flex gap-3 pt-4 first:pt-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                  {r.user.name?.charAt(0) || "U"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">{r.user.name || "Customer"}</span>
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= r.rating ? "text-yellow-400 fill-current" : "text-gray-200 fill-current"}`} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-500 mt-1">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link href="/dashboard/shop" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition-colors font-medium">
        <ChevronLeft className="w-4 h-4" /> Back to Shop
      </Link>
    </div>
  )
}
