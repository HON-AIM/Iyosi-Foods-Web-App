"use client"

import { motion, useReducedMotion } from "framer-motion"
import { buttonVariants } from "@/components/ui/button"
import { ShoppingCart, Star, Heart, Eye, Package } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/context/CartContext"
import toast from "react-hot-toast"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductRevealCardProps {
  product: {
    id: string
    name: string
    price: number
    compareAtPrice?: number | null
    stock: number
    image: string | null
    description?: string
    category?: string
    avgRating?: number
    reviewCount?: number
  }
  className?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductRevealCard({ product, className }: ProductRevealCardProps) {
  const { addToCart } = useCart()
  const shouldReduceMotion = useReducedMotion()
  const [isSaved, setIsSaved] = useState(false)
  const [savingWishlist, setSavingWishlist] = useState(false)

  const shouldAnimate = !shouldReduceMotion

  // Stock state
  const isOutOfStock = product.stock === 0
  const isLowStock = product.stock > 0 && product.stock <= 5
  const avgRating = product.avgRating ?? 0
  const reviewCount = product.reviewCount ?? 0
  const hasDiscount =
    product.compareAtPrice != null && product.compareAtPrice > product.price
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100
      )
    : 0

  useEffect(() => {
    let cancelled = false
    fetch("/api/user/saved")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.savedItems) return
        const saved = data.savedItems.some(
          (item: { product: { id: string } }) => item.product.id === product.id
        )
        setIsSaved(saved)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [product.id])

  // ─── Animation Variants ───────────────────────────────────────────────────

  const noMotionTransition = { duration: 0 }

  const containerVariants = {
    rest: { scale: 1, y: 0 },
    hover: shouldAnimate
      ? {
          scale: 1.03,
          y: -6,
          transition: { type: "spring" as const, stiffness: 300, damping: 28, mass: 0.8 },
        }
      : { scale: 1, y: 0, transition: noMotionTransition },
  }

  const imageVariants = {
    rest: { scale: 1 },
    hover: shouldAnimate
      ? { scale: 1.08, transition: { type: "spring" as const, stiffness: 300, damping: 28 } }
      : { scale: 1, transition: noMotionTransition },
  }

  const overlayVariants = {
    rest: { y: "100%", opacity: 0 },
    hover: shouldAnimate
      ? {
          y: "0%",
          opacity: 1,
          transition: {
            type: "spring" as const,
            stiffness: 400,
            damping: 28,
            mass: 0.6,
            staggerChildren: 0.07,
            delayChildren: 0.05,
          },
        }
      : { y: "100%", opacity: 0, transition: noMotionTransition },
  }

  const itemVariants = {
    rest: { opacity: 0, y: 16 },
    hover: shouldAnimate
      ? { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 25 } }
      : { opacity: 0, y: 16, transition: noMotionTransition },
  }

  const btnMotion = {
    rest:  { scale: 1 },
    hover: shouldAnimate ? { scale: 1.04, transition: { type: "spring" as const, stiffness: 400, damping: 20 } } : {},
    tap:   shouldAnimate ? { scale: 0.97 } : {},
  }

  const heartMotion = {
    rest:    { scale: 1 },
    animate: shouldAnimate
      ? { scale: [1, 1.4, 1], transition: { duration: 0.4 } }
      : {},
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) return
    addToCart({ id: product.id, name: product.name, price: product.price, image: product.image, stock: product.stock }, 1)
  }

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSavingWishlist(true)
    try {
      const res = await fetch("/api/user/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      })
      if (res.status === 401) { toast.error("Please log in to save items"); return }
      const data = await res.json()
      setIsSaved(data.saved)
      toast.success(data.message)
    } catch {
      toast.error("Could not update wishlist")
    } finally {
      setSavingWishlist(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial="rest"
      whileHover={shouldAnimate ? "hover" : undefined}
      variants={containerVariants}
      className={cn(
        "relative w-full rounded-xl border border-gray-100 bg-white overflow-hidden",
        "shadow-sm hover:shadow-xl cursor-pointer group",
        className
      )}
    >
      {/* ── Image ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden aspect-square bg-gray-50">
        <motion.div variants={imageVariants} className="w-full h-full">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-contain p-4 mix-blend-multiply"
              priority={false}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
              <Package className="w-12 h-12" />
              <span className="text-xs">No Image</span>
            </div>
          )}
        </motion.div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

        {/* Wishlist button */}
        <motion.button
          onClick={handleWishlist}
          disabled={savingWishlist}
          variants={heartMotion}
          animate={isSaved ? "animate" : "rest"}
          aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
          className={cn(
            "absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm border transition-colors z-10",
            isSaved
              ? "bg-red-500 border-red-400 text-white"
              : "bg-white/80 border-white/40 text-gray-600 hover:bg-red-50 hover:text-red-500"
          )}
        >
          <Heart className={cn("w-4 h-4", isSaved && "fill-current")} />
        </motion.button>

        {hasDiscount && !isOutOfStock && (
          <div className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded z-10">
            -{discountPercent}%
          </div>
        )}

        {/* Stock badges */}
        {isOutOfStock && (
          <div
            className={cn(
              "absolute top-3 bg-gray-700 text-white text-[10px] font-bold px-2 py-0.5 rounded z-10",
              hasDiscount ? "left-14" : "left-3"
            )}
          >
            OUT OF STOCK
          </div>
        )}
        {isLowStock && !isOutOfStock && (
          <div
            className={cn(
              "absolute top-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse z-10",
              hasDiscount ? "left-14" : "left-3"
            )}
          >
            Only {product.stock} left!
          </div>
        )}
      </div>

      {/* ── Static Card Body ──────────────────────────────────── */}
      <div className="p-3 space-y-2">
        {/* Rating */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-3 h-3",
                    star <= Math.round(avgRating)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-200 fill-current"
                  )}
                />
              ))}
            </div>
            <span className="text-[10px] text-gray-400">({reviewCount})</span>
          </div>
        )}

        {/* Name */}
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-green-700 transition-colors">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-base font-bold text-gray-900">{formatMoney(product.price)}</p>
          {hasDiscount && (
            <p className="text-xs text-gray-400 line-through">
              {formatMoney(product.compareAtPrice!)}
            </p>
          )}
        </div>

        {/* Free delivery badge */}
        {product.price >= 25000 && (
          <p className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5">
            🚚 Free delivery
          </p>
        )}

        {!shouldAnimate && (
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full h-9 text-xs font-bold",
                isOutOfStock && "opacity-50 cursor-not-allowed"
              )}
            >
              <ShoppingCart className="w-4 h-4 mr-1.5" />
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </button>
            <Link href={`/shop/product/${product.id}`}>
              <span
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full h-9 text-xs font-medium inline-flex"
                )}
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                View Details
              </span>
            </Link>
          </div>
        )}
      </div>

      {/* ── Hover Reveal Overlay (animated hover only) ─────────── */}
      {shouldAnimate && (
      <motion.div
        variants={overlayVariants}
        className="absolute inset-0 bg-white/97 backdrop-blur-lg flex flex-col justify-end pointer-events-none group-hover:pointer-events-auto"
      >
        <div className="p-4 space-y-3">
          {/* Description */}
          {product.description && (
            <motion.p variants={itemVariants} className="text-xs text-gray-500 leading-relaxed line-clamp-3">
              {product.description}
            </motion.p>
          )}

          {/* Category tag */}
          {product.category && (
            <motion.div variants={itemVariants}>
              <span className="inline-block bg-green-50 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
                {product.category.replace("_", " ")}
              </span>
            </motion.div>
          )}

          {/* Price in overlay */}
          <motion.div variants={itemVariants} className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-extrabold text-gray-900">{formatMoney(product.price)}</span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                {formatMoney(product.compareAtPrice!)}
              </span>
            )}
            {product.price >= 25000 && (
              <span className="text-[10px] text-green-600 font-semibold">+ Free delivery</span>
            )}
          </motion.div>

          {/* Buttons */}
          <motion.div variants={itemVariants} className="space-y-2">
            <motion.button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              variants={btnMotion}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full h-10 text-xs font-bold",
                isOutOfStock && "opacity-50 cursor-not-allowed"
              )}
            >
              <ShoppingCart className="w-4 h-4 mr-1.5" />
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </motion.button>

            <Link href={`/shop/product/${product.id}`} onClick={(e) => e.stopPropagation()}>
              <motion.div
                variants={btnMotion}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-full h-9 text-xs font-medium inline-flex"
                )}
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                View Details
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </motion.div>
      )}
    </motion.div>
  )
}
