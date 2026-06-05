"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";
import { Star, Trash2, Search, MessageSquareX, AlertCircle, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { SkeletonTable } from "@/components/admin/SkeletonTable";

type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { name: string | null; email: string | null } | null;
  product: { name: string; image: string | null };
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

const ITEMS_PER_PAGE = 10;

export default function AdminReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | "ALL">("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: ITEMS_PER_PAGE,
    pages: 1,
  });

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok || response.status === 401) {
          router.push("/login");
          return;
        }
      } catch (error) {
        console.error("[ERROR] Auth check failed:", error instanceof Error ? error.message : String(error));
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  const fetchReviews = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(ratingFilter !== "ALL" && { rating: ratingFilter.toString() }),
      });

      const response = await fetch(`/api/admin/reviews?${queryParams}`);

      // Handle authentication errors
      if (response.status === 401) {
        router.push("/login");
        return;
      }

      // Handle permission errors
      if (response.status === 403) {
        setError("You do not have permission to view reviews");
        toast.error("Access denied");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load reviews");
      }

      const data = await response.json();
      setReviews(data.reviews || []);
      setPagination(data.pagination || {
        total: 0,
        page: 1,
        limit: ITEMS_PER_PAGE,
        pages: 1,
      });
    } catch (error) {
      console.error("[ERROR] Error fetching reviews:", error instanceof Error ? error.message : String(error));
      setError("Failed to load reviews");
      toast.error("Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, ratingFilter, router]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchReviews(1);
    }, 300); // Debounce search

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, ratingFilter, fetchReviews]);

  const handleDelete = async (id: string, productName: string, userName: string) => {
    const confirmed = window.confirm(
      `⚠️ DELETE REVIEW\n\n` +
        `Product: "${productName}"\n` +
        `Reviewer: ${userName || "Guest"}\n\n` +
        `This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(id);

    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
      });

      // Handle authentication errors
      if (response.status === 401) {
        router.push("/login");
        return;
      }

      // Handle permission errors
      if (response.status === 403) {
        toast.error("You do not have permission to delete reviews");
        return;
      }

      if (response.ok) {
        toast.success(`Review deleted`);
        setReviews((prev) => prev.filter((r) => r.id !== id));
      } else {
        const data = await response.json();
        toast.error(
          data.message || "Failed to delete review. Please try again."
        );
      }
    } catch (error) {
      console.error("[ERROR] Error deleting review:", error instanceof Error ? error.message : String(error));
      toast.error("An error occurred while deleting the review");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      review.product.name.toLowerCase().includes(searchLower) ||
      (review.user?.name &&
        review.user.name.toLowerCase().includes(searchLower)) ||
      (review.user?.email &&
        review.user.email.toLowerCase().includes(searchLower)) ||
      review.comment.toLowerCase().includes(searchLower);

    const matchesRating = ratingFilter === "ALL" || review.rating === ratingFilter;

    return matchesSearch && matchesRating;
  });

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
        <SkeletonTable
          headers={["Product", "Customer", "Rating", "Date", "Actions"]}
          rows={8}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => fetchReviews(1)}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reviews Moderation</h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor and manage customer feedback. Average rating:{" "}
          <span className="font-semibold text-gray-900">{averageRating}/5</span>
        </p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search
              className="h-4 w-4 text-gray-400"
              aria-hidden="true"
            />
          </div>
          <input
            type="text"
            placeholder="Search by product, customer, or comment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search reviews"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm bg-gray-50 transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 min-w-fit">
          <Filter
            className="h-4 w-4 text-gray-400 flex-shrink-0"
            aria-hidden="true"
          />
          <select
            value={ratingFilter}
            onChange={(e) =>
              setRatingFilter(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value))
            }
            aria-label="Filter reviews by rating"
            className="py-2 pl-3 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all"
          >
            <option value="ALL">All Ratings</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 stars)</option>
            <option value="4">⭐⭐⭐⭐ (4 stars)</option>
            <option value="3">⭐⭐⭐ (3 stars)</option>
            <option value="2">⭐⭐ (2 stars)</option>
            <option value="1">⭐ (1 star)</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredReviews.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3 text-center">
            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
              <MessageSquareX
                className="h-6 w-6 text-gray-400"
                aria-hidden="true"
              />
            </div>
            <p className="text-gray-500 font-medium">
              {searchTerm || ratingFilter !== "ALL"
                ? "No reviews match your filters."
                : "No reviews found yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className="p-6 hover:bg-gray-50 transition-colors flex flex-col lg:flex-row gap-6"
              >
                {/* Product Image */}
                <div className="flex-shrink-0">
                  <div className="h-20 w-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center relative">
                    {review.product.image ? (
                      <Image
                        src={review.product.image}
                        alt={review.product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    ) : null}
                    {!review.product.image && (
                      <MessageSquareX
                        className="h-8 w-8 text-gray-300"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </div>

                {/* Product & User Info */}
                <div className="lg:w-1/4 space-y-2 flex-shrink-0">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                      Product
                    </p>
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                      {review.product.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                      Reviewed by
                    </p>
                    <p className="text-sm text-gray-900">
                      {review.user?.name || "Guest User"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {review.user?.email || "no-email"}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 pt-1">
                    {format(new Date(review.createdAt), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>

                {/* Review Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-gray-300"
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                      {review.rating}/5
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed max-w-2xl">
                    "{review.comment}"
                  </p>
                </div>

                {/* Actions */}
                <div className="lg:w-auto flex-shrink-0 flex items-start justify-end">
                  <button
                    onClick={() =>
                      handleDelete(
                        review.id,
                        review.product.name,
                        review.user?.name || "Guest"
                      )
                    }
                    disabled={deletingId === review.id}
                    className="inline-flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={`Delete review for ${review.product.name}`}
                    aria-label={`Delete review for ${review.product.name}`}
                  >
                    {deletingId === review.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span>Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchReviews(pagination.page - 1)}
              disabled={pagination.page === 1 || isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              Previous
            </button>
            <button
              onClick={() => fetchReviews(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages || isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
