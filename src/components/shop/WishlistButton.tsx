"use client"
import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import toast from "react-hot-toast"
import { useSession } from "next-auth/react"

interface Props {
  productId: string
  initialSaved?: boolean
  size?: "sm" | "md"
  className?: string
}

export default function WishlistButton({ productId, initialSaved = false, size = "md", className = "" }: Props) {
  const { data: session } = useSession()
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5"
  const btnSize = size === "sm" ? "w-7 h-7" : "w-9 h-9"

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!session?.user) {
      toast.error("Please log in to save items to your wishlist")
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
      className={`${btnSize} rounded-full flex items-center justify-center transition-all
        ${isSaved
          ? "bg-red-500 text-white shadow-md"
          : "bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white shadow-sm"
        }
        ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}`}
    >
      <Heart className={`${iconSize} ${isSaved ? "fill-current" : ""}`} />
    </button>
  )
}
