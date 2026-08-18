"use client"
import { useState } from "react"
import { Minus, Plus, ShoppingCart, Heart } from "lucide-react"
import { useCart } from "@/context/CartContext"
import toast from "react-hot-toast"

interface Props {
  product: { id: string; name: string; price: number; stock: number; image: string | null }
  initialSaved: boolean
}

export default function DashboardProductActions({ product, initialSaved }: Props) {
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [saving, setSaving] = useState(false)

  const handleAddToCart = () => {
    if (product.stock === 0) return
    addToCart({ id: product.id, name: product.name, price: product.price, image: product.image, stock: product.stock }, quantity)
  }

  const handleToggleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/user/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      })
      const data = await res.json()
      if (res.ok) { setIsSaved(data.saved); toast.success(data.message) }
      else toast.error(data.message)
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  if (product.stock === 0) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
        <p className="text-red-600 font-semibold text-sm">This product is currently out of stock.</p>
        <p className="text-red-400 text-xs mt-1">Save it to your wishlist and we will notify you when it is back.</p>
        <button onClick={handleToggleSave} disabled={saving}
          className={`mt-3 flex items-center gap-2 mx-auto text-sm font-semibold px-4 py-2 rounded-lg transition-colors
            ${isSaved ? "bg-red-500 text-white" : "bg-white border border-red-200 text-red-500 hover:bg-red-50"}`}>
          <Heart className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
          {isSaved ? "Saved to Wishlist" : "Save to Wishlist"}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Quantity */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Quantity:</span>
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}
            className="px-3 py-2 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <Minus className="w-4 h-4 text-gray-600" />
          </button>
          <span className="w-12 text-center font-bold text-gray-900">{quantity}</span>
          <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock}
            className="px-3 py-2 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <span className="text-xs text-gray-400">({product.stock} available)</span>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button onClick={handleAddToCart}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm">
          <ShoppingCart className="w-5 h-5" />
          Add to Cart
        </button>
        <button onClick={handleToggleSave} disabled={saving}
          aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
          className={`px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-2 font-semibold text-sm
            ${isSaved ? "bg-red-50 border-red-200 text-red-500" : "border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500"}`}>
          <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
          <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
        </button>
      </div>
    </div>
  )
}
