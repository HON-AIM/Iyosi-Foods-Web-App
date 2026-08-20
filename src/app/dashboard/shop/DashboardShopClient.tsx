"use client"
import { useState, useTransition } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Search, X, ShoppingCart, Heart, Package, ChevronDown,
  LayoutGrid, FlameKindling, Wheat, Layers, Coffee, Eye,
} from "lucide-react"
import { useCart } from "@/context/CartContext"
import WishlistButton from "@/components/shop/WishlistButton"
import toast from "react-hot-toast"

type Product = {
  id: string; name: string; price: number; stock: number
  image: string | null; description: string; category: string
}

interface Props {
  products: Product[]
  savedProductIds: string[]
  activeCategory: string | null
  searchQuery: string
  sortBy: string
  categoryCountMap: Record<string, number>
}

const CATEGORIES = [
  { value: "",            label: "All Products", icon: LayoutGrid },
  { value: "BAKING",      label: "Baking Flour", icon: FlameKindling },
  { value: "WHEAT",       label: "Wheat Flour",  icon: Wheat },
  { value: "ALL_PURPOSE", label: "All-Purpose",  icon: Layers },
  { value: "SEMOLINA",    label: "Semolina",     icon: Coffee },
]

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest First" },
  { value: "price-asc",  label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "name",       label: "Name A–Z" },
]

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n)
}

export default function DashboardShopClient({
  products, savedProductIds, activeCategory, searchQuery, sortBy, categoryCountMap,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const { addToCart } = useCart()
  const [savedIds, setSavedIds] = useState(new Set(savedProductIds))
  const [localSearch, setLocalSearch] = useState(searchQuery)

  function navigate(updates: Record<string, string>) {
    const p = new URLSearchParams()
    if (activeCategory) p.set("category", activeCategory)
    if (searchQuery) p.set("q", searchQuery)
    if (sortBy !== "newest") p.set("sort", sortBy)
    Object.entries(updates).forEach(([k, v]) => v ? p.set(k, v) : p.delete(k))
    startTransition(() => router.push(`${pathname}?${p.toString()}`))
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate({ q: localSearch.trim(), category: "" })
  }

  function handleAddToCart(product: Product, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    if (product.stock === 0) return
    addToCart({ id: product.id, name: product.name, price: product.price, image: product.image, stock: product.stock }, 1)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {searchQuery ? `Results for "${searchQuery}"` : activeCategory ? CATEGORIES.find(c => c.value === activeCategory)?.label : "All Products"}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {isPending ? "Updating..." : `${products.length} product${products.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={localSearch} onChange={e => setLocalSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {localSearch && (
              <button type="button" onClick={() => { setLocalSearch(""); navigate({ q: "" }) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            Search
          </button>
        </form>
        <div className="relative">
          <select value={sortBy} onChange={e => navigate({ sort: e.target.value })}
            className="appearance-none pl-4 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700 font-medium cursor-pointer">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon
          const isActive = activeCategory === cat.value || (!activeCategory && cat.value === "")
          const count = cat.value ? categoryCountMap[cat.value] || 0 : Object.values(categoryCountMap).reduce((a, b) => a + b, 0)
          return (
            <button key={cat.value} onClick={() => navigate({ category: cat.value, q: "" })}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all
                ${isActive ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-200 hover:border-green-300"}`}>
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
          <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="font-bold text-gray-600">No products found</p>
          <button onClick={() => { setLocalSearch(""); navigate({ category: "", q: "" }) }}
            className="mt-4 text-sm bg-green-600 text-white px-5 py-2 rounded-xl hover:bg-green-700 transition-colors font-semibold">
            View All Products
          </button>
        </div>
      ) : (
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 transition-opacity ${isPending ? "opacity-50" : ""}`}>
          {products.map(product => {
            const isOut = product.stock === 0
            const isLow = product.stock > 0 && product.stock <= 5
            return (
              <div key={product.id} className="group bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-md transition-all overflow-hidden flex flex-col relative">

                {/* Badges */}
                {isOut && <div className="absolute top-2 left-2 z-10 bg-gray-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">OUT OF STOCK</div>}
                {isLow && !isOut && <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">{product.stock} left</div>}

                {/* Wishlist */}
                <div className="absolute top-2 right-2 z-10">
                  <WishlistButton productId={product.id} initialSaved={savedIds.has(product.id)} size="sm" />
                </div>

                {/* Image */}
                <Link href={`/dashboard/shop/product/${product.id}`} className="relative aspect-square bg-gray-50 block overflow-hidden">
                  {product.image ? (
                    <Image
                      src={product.image} alt={product.name} fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-contain p-3 mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-gray-200" />
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="p-3 flex flex-col flex-1">
                  <p className="text-[9px] font-bold text-green-600 uppercase tracking-wide">{product.category.replace("_", " ")}</p>
                  <Link href={`/dashboard/shop/product/${product.id}`}>
                    <h3 className="text-xs font-semibold text-gray-800 line-clamp-2 mt-0.5 hover:text-green-700 transition-colors">{product.name}</h3>
                  </Link>
                  <p className="text-sm font-extrabold text-gray-900 mt-1.5">{formatMoney(product.price)}</p>

                  {/* TWO CTAs: Add to Cart + View Details */}
                  <div className="mt-2 flex gap-1.5">
                    <button
                      onClick={e => handleAddToCart(product, e)}
                      disabled={isOut}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-bold transition-all
                        ${isOut ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"}`}
                    >
                      <ShoppingCart className="w-3 h-3" />
                      {isOut ? "Sold Out" : "Add"}
                    </button>
                    <Link
                      href={`/dashboard/shop/product/${product.id}`}
                      className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg border border-gray-200 hover:border-green-300 text-gray-600 hover:text-green-700 text-[10px] font-bold transition-all"
                    >
                      <Eye className="w-3 h-3" />
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
