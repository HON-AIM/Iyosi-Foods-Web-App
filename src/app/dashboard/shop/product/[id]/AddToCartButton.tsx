"use client"
import { useState } from "react"
import { Minus, Plus, ShoppingCart } from "lucide-react"
import { useCart } from "@/context/CartContext"

interface Props {
  product: { id: string; name: string; price: number; stock: number; image: string | null }
}

export default function AddToCartButton({ product }: Props) {
  const { addToCart } = useCart()
  const [qty, setQty] = useState(1)

  if (product.stock === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-500">
        This product is currently out of stock.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Qty:</span>
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}
            className="px-3 py-2 hover:bg-gray-50 disabled:opacity-40">
            <Minus className="w-4 h-4 text-gray-600" />
          </button>
          <span className="w-10 text-center font-bold text-gray-900 text-sm">{qty}</span>
          <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} disabled={qty >= product.stock}
            className="px-3 py-2 hover:bg-gray-50 disabled:opacity-40">
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <span className="text-xs text-gray-400">({product.stock} available)</span>
      </div>
      <button
        onClick={() => addToCart({ id: product.id, name: product.name, price: product.price, image: product.image, stock: product.stock }, qty)}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
      >
        <ShoppingCart className="w-5 h-5" />
        Add {qty > 1 ? `${qty} items` : ""} to Cart
      </button>
    </div>
  )
}
