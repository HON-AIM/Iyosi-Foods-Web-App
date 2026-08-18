import Link from "next/link"
import { PackageSearch, ArrowRight } from "lucide-react"

interface EmptyProductGridProps {
  message?: string
  hint?: string
  showShopAllLink?: boolean
}

export default function EmptyProductGrid({
  message = "No products available right now",
  hint = "Check back soon — new products are added regularly.",
  showShopAllLink = true,
}: EmptyProductGridProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
        <PackageSearch className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
      </div>
      <h3 className="font-bold text-gray-700 text-base mb-1">{message}</h3>
      <p className="text-sm text-gray-400 max-w-sm">{hint}</p>
      {showShopAllLink && (
        <Link
          href="/shop"
          className="mt-5 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          Browse All Products <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  )
}
