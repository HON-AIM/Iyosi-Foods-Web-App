"use client"

import { useState, useTransition } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  Search, X, ShoppingCart, Heart,
  Wheat, FlameKindling, Layers, Coffee, LayoutGrid,
  Package, ChevronDown, Filter,
} from "lucide-react"
import { useCart } from "@/context/CartContext"
import toast from "react-hot-toast"
import { type Category } from "@prisma/client"

// ─── Types ──────────────────────────────────────────────────────────────────

interface Product {
  id: string
  name: string
  price: number
  stock: number
  image: string | null
  description: string
  category: string
}

interface Props {
  products: Product[]
  savedProductIds: string[]
  activeCategory: Category | null
  searchQuery: string
  sortBy: string
  categoryCountMap: Record<string, number>
  totalCount: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "",            label: "All Products",  icon: LayoutGrid,     color: "text-gray-600" },
  { value: "BAKING",      label: "Baking Flour",  icon: FlameKindling,  color: "text-orange-600" },
  { value: "WHEAT",       label: "Wheat Flour",   icon: Wheat,          color: "text-amber-600" },
  { value: "ALL_PURPOSE", label: "All-Purpose",   icon: Layers,         color: "text-blue-600" },
  { value: "SEMOLINA",    label: "Semolina",      icon: Coffee,         color: "text-purple-600" },
] as const

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest First" },
  { value: "price-asc",  label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name",       label: "Name A–Z" },
]

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", maximumFractionDigits: 0,
  }).format(amount)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardShopClient({
  products,
  savedProductIds,
  activeCategory,
  searchQuery,
  sortBy,
  categoryCountMap,
  totalCount,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const { addToCart } = useCart()

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(savedProductIds))
  const [savingId, setSavingId] = useState<string | null>(null)
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const [showFilters, setShowFilters] = useState(false)

  // ─── Navigation helpers ─────────────────────────────────────────────────

  function navigate(updates: Record<string, string>) {
    const current = new URLSearchParams()
    if (activeCategory) current.set("category", activeCategory)
    if (searchQuery) current.set("q", searchQuery)
    if (sortBy !== "newest") current.set("sort", sortBy)
    Object.entries(updates).forEach(([k, v]) => {
      if (v) current.set(k, v)
      else current.delete(k)
    })
    startTransition(() => {
      router.push(`${pathname}?${current.toString()}`)
    })
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate({ q: localSearch.trim(), category: "" })
  }

  function handleCategory(value: string) {
    navigate({ category: value, q: "" })
    setLocalSearch("")
  }

  function handleSort(value: string) {
    navigate({ sort: value })
  }

  // ─── Cart & Wishlist ────────────────────────────────────────────────────

  function handleAddToCart(product: Product, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (product.stock === 0) return
    addToCart({
      id: product.id, name: product.name, price: product.price,
      image: product.image, stock: product.stock,
    }, 1)
  }

  async function handleToggleSave(productId: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setSavingId(productId)
    try {
      const res = await fetch("/api/user/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
      if (res.status === 401) { toast.error("Please log in to save items"); return }
      const data = await res.json()
      setSavedIds((prev) => {
        const next = new Set(prev)
        data.saved ? next.add(productId) : next.delete(productId)
        return next
      })
      toast.success(data.message)
    } catch {
      toast.error("Could not update wishlist")
    } finally {
      setSavingId(null)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {searchQuery
              ? `Search results for "${searchQuery}"`
              : activeCategory
              ? CATEGORIES.find(c => c.value === activeCategory)?.label || "Products"
              : "All Products"}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isPending ? "Loading..." : `${totalCount} product${totalCount !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden flex items-center gap-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 px-3 py-2 rounded-lg"
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* ── Search + Sort Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => { setLocalSearch(""); navigate({ q: "" }) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
          >
            Search
          </button>
        </form>

        {/* Sort */}
        <div className="relative flex-shrink-0">
          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700 font-medium cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Category Filter Pills ─────────────────────────────────────── */}
      <div className={`${showFilters ? "flex" : "hidden"} md:flex flex-wrap gap-2`}>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const isActive = activeCategory === cat.value || (!activeCategory && cat.value === "")
          const count = cat.value ? categoryCountMap[cat.value] || 0 : Object.values(categoryCountMap).reduce((a, b) => a + b, 0)

          return (
            <button
              key={cat.value}
              onClick={() => handleCategory(cat.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all
                ${isActive
                  ? "bg-green-600 text-white border-green-600 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700"
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Active Search/Filter Notice ───────────────────────────────── */}
      {(searchQuery || activeCategory) && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-sm text-green-700">
          <Filter className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            {searchQuery && `Searching for "${searchQuery}"`}
            {searchQuery && activeCategory && " in "}
            {activeCategory && CATEGORIES.find(c => c.value === activeCategory)?.label}
          </span>
          <button
            onClick={() => { setLocalSearch(""); navigate({ category: "", q: "" }) }}
            className="ml-auto flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-800"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        </div>
      )}

      {/* ── Product Grid ─────────────────────────────────────────────── */}
      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-20 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
          </div>
          <h3 className="font-bold text-gray-700 text-base mb-1">No products found</h3>
          <p className="text-sm text-gray-400 mb-5 max-w-xs">
            {searchQuery
              ? `No products match "${searchQuery}". Try different keywords.`
              : "No products in this category yet. Check back soon."}
          </p>
          <button
            onClick={() => { setLocalSearch(""); navigate({ category: "", q: "" }) }}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            View All Products
          </button>
        </div>
      ) : (
        <div className={`grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 transition-opacity duration-200 ${isPending ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
          {products.map((product) => {
            const isSaved = savedIds.has(product.id)
            const isOutOfStock = product.stock === 0
            const isLowStock = product.stock > 0 && product.stock <= 5

            return (
              <Link
                key={product.id}
                href={`/dashboard/shop/product/${product.id}`}
                className="group bg-white rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden relative"
              >
                {/* Badges */}
                {isOutOfStock && (
                  <div className="absolute top-2 left-2 z-10 bg-gray-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    OUT OF STOCK
                  </div>
                )}
                {isLowStock && (
                  <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    Only {product.stock} left
                  </div>
                )}

                {/* Wishlist */}
                <button
                  onClick={(e) => handleToggleSave(product.id, e)}
                  disabled={savingId === product.id}
                  aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
                  className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all
                    ${isSaved
                      ? "bg-red-500 text-white shadow"
                      : "bg-white/80 text-gray-400 hover:text-red-500 hover:bg-white shadow-sm"
                    }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} />
                </button>

                {/* Image */}
                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-contain p-3 mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-gray-200" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col flex-1">
                  <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wide mb-1">
                    {product.category.replace("_", " ")}
                  </p>
                  <h3 className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-green-700 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-base font-bold text-gray-900 mt-2">
                    {formatMoney(product.price)}
                  </p>
                  {product.price >= 25000 && (
                    <p className="text-[10px] text-green-600 font-semibold mt-0.5">🚚 Free delivery</p>
                  )}
                  <button
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={isOutOfStock}
                    className={`mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all
                      ${isOutOfStock
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white shadow-sm opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
                      }`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                  </button>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
