"use client"
import { Star } from "lucide-react"

interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  user: { name: string | null }
}

interface Props {
  productId: string
  reviews: Review[]
  totalCount: number
  avgRating: number
}

export default function DashboardProductReviews({ reviews, totalCount, avgRating }: Props) {
  if (totalCount === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
        <p className="text-gray-400 text-sm">No reviews yet. Be the first to review this product after your purchase.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <h2 className="font-bold text-gray-900">Customer Reviews</h2>
        <span className="text-sm text-gray-400">({totalCount})</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex">
            {[1,2,3,4,5].map((s) => (
              <Star key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? "text-yellow-400 fill-current" : "text-gray-200 fill-current"}`} />
            ))}
          </div>
          <span className="text-sm font-bold text-gray-700">{avgRating}</span>
        </div>
      </div>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="flex gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
              {review.user.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-800">{review.user.name || "Customer"}</span>
                <div className="flex">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "text-yellow-400 fill-current" : "text-gray-200 fill-current"}`} />
                  ))}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
