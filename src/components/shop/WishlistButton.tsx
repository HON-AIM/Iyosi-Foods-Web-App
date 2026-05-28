"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import toast from "react-hot-toast"
import { useSession } from "next-auth/react"

export default function WishlistButton({ productId, className = "" }: { productId: string; className?: string }) {
  const { data: session } = useSession()
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!session?.user) return
    fetch("/api/user/saved")
      .then(r => r.json())
      .then(d => {
        const saved = d.savedItems?.some((i: { product: { id: string } }) => i.product.id === productId)
        setIsSaved(saved ?? false)
      })
      .catch(() => {})
  }, [session, productId])

  const handleToggle = async () => {
    if (!session?.user) {
      toast.error("Please log in to save items")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/user/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })
      const data = await res.json()
      if (res.ok) {
        setIsSaved(data.saved)
        toast.success(data.message)
      } else {
        toast.error(data.message || "Failed to update wishlist")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
      className={`flex items-center justify-center gap-2 py-3 border rounded-lg transition-colors font-medium
        ${isSaved ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100" : "border-gray-200 text-gray-700 hover:bg-gray-50"}
        ${className}`}
    >
      <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
      <span className="text-sm">{isSaved ? "Saved ♥" : "Add to Wishlist"}</span>
    </button>
  )
}
