import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const session = await auth();
  
  if (!session?.user?.id) return null;

  const reviews = await prisma.review.findMany({
    where: { userId: session.user.id },
    include: { product: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-[400px]">
      <div className="border-b border-gray-100 pb-4 mb-6">
         <h1 className="text-2xl font-bold text-gray-900">Pending Reviews</h1>
      </div>
      
      {reviews.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center justify-center">
              <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                  </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">You have no orders waiting for review</h3>
              <p className="text-gray-500 mb-6 max-w-sm">After you purchase and receive an item from us, you can review it to help others make better choices.</p>
              <Link href="/dashboard/orders" className="text-primary-600 hover:text-primary-800 font-medium transition-colors hover:underline">
                  View your Orders
              </Link>
          </div>
      ) : (
          <div className="space-y-4">
              {reviews.map((review) => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-4 flex gap-4 hover:shadow-sm transition-shadow">
                      <div className="w-24 h-24 bg-gray-100 rounded-md shrink-0 border border-gray-200 overflow-hidden flex items-center justify-center">
                          {review.product.image ? (
                               <img src={review.product.image} alt={review.product.name} className="w-full h-full object-cover" />
                          ) : (
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                          )}
                      </div>
                      <div className="flex-1 flex flex-col">
                          <h4 className="text-base font-medium text-gray-900 line-clamp-1 mb-1">{review.product.name}</h4>
                          <div className="flex items-center gap-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                  <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l4.46 4.73L2.82 19z" clipRule="evenodd" />
                                  </svg>
                              ))}
                              <span className="text-xs text-gray-500 ml-2">{format(new Date(review.createdAt), 'MMM dd, yyyy')}</span>
                          </div>
                          <p className="text-sm text-gray-700 italic flex-1">"{review.comment || 'No written comment provided.'}"</p>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
}
