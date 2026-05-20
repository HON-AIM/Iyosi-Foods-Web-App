import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function SavedItemsPage() {
  const session = await auth();
  
  if (!session?.user?.id) return null;

  const savedItems = await prisma.savedItem.findMany({
    where: { userId: session.user.id },
    include: { product: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-[400px]">
      <div className="border-b border-gray-100 pb-4 mb-6 relative">
         <h1 className="text-2xl font-bold text-gray-900">Saved Items</h1>
         <span className="absolute top-0 right-0 inline-flex items-center space-x-1 mt-1 text-sm font-medium text-gray-500">
             <span>{savedItems.length}</span>
             <span>Items</span>
         </span>
      </div>
      
      {savedItems.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center justify-center">
              <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                  </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">You haven't saved any items yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm">Found something you like? Tap on the heart shaped icon next to the item to add it to your wishlist!</p>
              <Link href="/" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium transition-colors inline-block">
                  Start Shopping
              </Link>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden group hover:shadow-md transition-shadow flex flex-col">
                      <div className="h-48 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                          {item.product.image ? (
                              <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                          )}
                           <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm text-primary-600 hover:text-red-500 transition-colors" title="Remove from wishlist">
                              <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                           </button>
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                          <h4 className="text-base font-medium text-gray-900 line-clamp-2 mb-2 flex-1">{item.product.name}</h4>
                          <p className="text-lg font-bold text-gray-900 mb-4">₦{item.product.price.toLocaleString()}</p>
                          <button className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors uppercase tracking-wider">
                              Buy Now
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
}
