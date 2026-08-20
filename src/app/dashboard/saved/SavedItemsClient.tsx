"use client"
import { useState } from "react"
import { Heart, ShoppingCart, Package } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import toast from "react-hot-toast"
import { useCart } from "@/context/CartContext"

type SavedItem = {
  id: string
  product: {
    id: string; name: string; price: number
    image: string | null; stock: number; category: string
  }
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n)
}

export default function SavedItemsClient({ initialItems }: { initialItems: SavedItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const { addToCart } = useCart()

  const handleRemove = async (productId: string) => {
    setRemovingId(productId)
    try {
      const res = await fetch("/api/user/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
      if (res.ok) {
        setItems(prev => prev.filter(i => i.product.id !== productId))
        toast.success("Removed from wishlist")
      }
    } catch {
      toast.error("Failed to remove item")
    } finally {
      setRemovingId(null)
    }
  }

  const handleAddToCart = (item: SavedItem) => {
    addToCart({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.image,
      stock: item.product.stock,
    }, 1)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
      <div className="border-b border-gray-100 pb-4 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Saved Items</h1>
        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-10 h-10 text-red-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-500 mb-6 max-w-sm text-sm">
            Browse our store and tap the heart icon on any product to save it here.
          </p>
          <Link
            href="/dashboard/shop"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="border border-gray-100 rounded-xl overflow-hidden group hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Image */}
              <div className="relative h-48 bg-gray-50">
                {item.product.image ? (
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-200" />
                  </div>
                )}
                {/* Remove button */}
                <button
                  onClick={() => handleRemove(item.product.id)}
                  disabled={removingId === item.product.id}
                  aria-label="Remove from wishlist"
                  className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>
                {/* Out of stock */}
                {item.product.stock === 0 && (
                  <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                    <span className="bg-white text-gray-700 text-xs font-bold px-3 py-1 rounded-full">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col flex-1">
                <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide mb-1">
                  {item.product.category.replace("_", " ")}
                </p>
                <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">{item.product.name}</h4>
                <p className="text-lg font-extrabold text-gray-900 mb-3">{formatMoney(item.product.price)}</p>

                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={item.product.stock === 0}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold py-2.5 rounded-lg transition-colors"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    {item.product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                  <Link
                    href={`/dashboard/shop/product/${item.product.id}`}
                    className="px-3 py-2.5 border border-gray-200 hover:border-green-300 rounded-lg text-xs font-semibold text-gray-600 hover:text-green-700 transition-colors"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
