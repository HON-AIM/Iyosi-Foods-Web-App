import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await auth();
  
  if (!session?.user?.id) return null;

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'DELIVERED': return 'bg-green-100 text-green-800';
          case 'SHIPPED': return 'bg-blue-100 text-blue-800';
          case 'PROCESSING': return 'bg-yellow-100 text-yellow-800';
          case 'CANCELLED': return 'bg-red-100 text-red-800';
          case 'PAID': return 'bg-emerald-100 text-emerald-800';
          default: return 'bg-gray-100 text-gray-800'; // PENDING
      }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-[400px]">
      <div className="border-b border-gray-100 pb-4 mb-6">
         <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
      </div>
      
      {orders.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center justify-center">
              <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                  </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">You have placed no orders yet!</h3>
              <p className="text-gray-500 mb-6 max-w-sm">All your orders will be saved here for you to access their state anytime.</p>
              <Link href="/" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium transition-colors inline-block">
                  Continue Shopping
              </Link>
          </div>
      ) : (
          <div className="space-y-4">
              {orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Order Header */}
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                          <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Order No</p>
                              <p className="text-sm font-medium text-gray-900">{order.id.slice(-8).toUpperCase()}</p>
                          </div>
                          <div className="flex justify-between md:justify-end md:gap-8 gap-4 w-full md:w-auto">
                              <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Date Placed</p>
                                  <p className="text-sm text-gray-900">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</p>
                              </div>
                              <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Amount</p>
                                  <p className="text-sm font-bold text-gray-900">₦{order.totalAmount.toLocaleString()}</p>
                              </div>
                          </div>
                      </div>
                      
                      {/* Order Items */}
                      <div className="divide-y divide-gray-100">
                          {order.items.map((item) => (
                              <div key={item.id} className="p-4 flex gap-4">
                                  <div className="w-20 h-20 bg-gray-100 rounded-md shrink-0 border border-gray-200 overflow-hidden flex items-center justify-center">
                                      {item.product.image ? (
                                           <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                                      ) : (
                                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                          </svg>
                                      )}
                                  </div>
                                  <div className="flex-1">
                                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{item.product.name}</h4>
                                      <p className="text-sm text-gray-500">QTY: {item.quantity}</p>
                                      <div className="mt-2 flex items-center gap-2">
                                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${getStatusColor(order.status)}`}>
                                              {order.status}
                                          </span>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                      
                      {/* Order Footer Actions */}
                      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end">
                          <Link href={`/dashboard/orders/${order.id}`} className="text-sm font-medium text-primary-600 hover:text-primary-800 uppercase tracking-wider transition-colors inline-block text-center w-full md:w-auto">
                              See Details
                          </Link>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
}
