import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import {
  ChevronLeft, ChevronRight, Package, CreditCard,
  MapPin, Clock, Truck, Home, CheckCircle, XCircle,
  MessageSquare,
} from "lucide-react"

export const dynamic = "force-dynamic"

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n)
}

const STATUS_STEPS = [
  { key: "PENDING",    label: "Order Placed",        icon: Clock,        desc: "Your order was received" },
  { key: "PAID",       label: "Payment Confirmed",   icon: CheckCircle,  desc: "Payment verified" },
  { key: "PROCESSING", label: "Preparing Order",     icon: Package,      desc: "Being packed and prepared" },
  { key: "SHIPPED",    label: "Out for Delivery",    icon: Truck,        desc: "On its way to you" },
  { key: "DELIVERED",  label: "Delivered",           icon: Home,         desc: "Successfully delivered" },
] as const

const STATUS_ORDER = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"]

const STATUS_COLORS: Record<string, string> = {
  DELIVERED:  "bg-green-100 text-green-800 border-green-200",
  SHIPPED:    "bg-blue-100 text-blue-800 border-blue-200",
  PROCESSING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PAID:       "bg-emerald-100 text-emerald-800 border-emerald-200",
  CANCELLED:  "bg-red-100 text-red-800 border-red-200",
  PENDING:    "bg-gray-100 text-gray-700 border-gray-200",
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, image: true, category: true },
          },
        },
      },
      user: { select: { name: true, email: true } },
    },
  })

  if (!order || order.userId !== session.user.id) notFound()

  const currentStatusIndex = STATUS_ORDER.indexOf(order.status)
  const isCancelled = order.status === "CANCELLED"

  let addressObj: Record<string, string> | null = null
  try {
    if (order.shippingAddressData) addressObj = JSON.parse(order.shippingAddressData)
  } catch {}

  return (
    <div className="space-y-4 max-w-3xl">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-400">
        <Link href="/dashboard" className="hover:text-green-600">My Account</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/dashboard/orders" className="hover:text-green-600">My Orders</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-600 font-medium">
          {order.orderNumber || order.id.slice(-8).toUpperCase()}
        </span>
      </nav>

      {/* Order Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Order Number</p>
            <h1 className="text-xl font-extrabold text-gray-900 font-mono">
              {order.orderNumber || order.id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Placed on {format(new Date(order.createdAt), "EEEE, MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${STATUS_COLORS[order.status] || STATUS_COLORS.PENDING}`}>
              {order.status}
            </span>
          </div>
        </div>
      </div>

      {/* Order Timeline */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-5 text-sm uppercase tracking-wide">Order Progress</h2>
        {isCancelled ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
            <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-700">Order Cancelled</p>
              <p className="text-sm text-red-500 mt-0.5">
                This order was cancelled. Contact support if you have questions.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[18px] top-9 bottom-3 w-0.5 bg-gray-100" />
            <div
              className="absolute left-[18px] top-9 w-0.5 bg-green-500 transition-all duration-700"
              style={{ height: `${(currentStatusIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
            />
            <div className="space-y-0">
              {STATUS_STEPS.map((step, index) => {
                const Icon = step.icon
                const done = index <= currentStatusIndex
                const current = index === currentStatusIndex
                return (
                  <div key={step.key} className="flex gap-4 relative pb-5 last:pb-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 transition-all
                      ${done
                        ? current ? "bg-green-600 border-green-600 text-white" : "bg-green-100 border-green-400 text-green-700"
                        : "bg-white border-gray-200 text-gray-300"
                      }`}>
                      {done && !current
                        ? <CheckCircle className="w-4 h-4 fill-green-500 text-white" />
                        : <Icon className="w-4 h-4" />
                      }
                    </div>
                    <div className="flex-1 pt-1.5">
                      <p className={`font-semibold text-sm ${done ? "text-gray-900" : "text-gray-300"}`}>
                        {step.label}
                        {current && (
                          <span className="ml-2 text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                            CURRENT
                          </span>
                        )}
                      </p>
                      <p className={`text-xs mt-0.5 ${done ? "text-gray-400" : "text-gray-200"}`}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {order.trackingNumber && (
          <div className="mt-5 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Tracking Number</p>
                <p className="font-mono font-bold text-blue-900 text-lg mt-0.5">{order.trackingNumber}</p>
                {order.trackingCarrier && (
                  <p className="text-xs text-blue-400">via {order.trackingCarrier}</p>
                )}
              </div>
              {order.estimatedDelivery && (
                <div className="text-sm">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Est. Delivery</p>
                  <p className="font-bold text-blue-900 mt-0.5">
                    {format(new Date(order.estimatedDelivery), "EEE, MMM d, yyyy")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
            Items Ordered ({order.items.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4">
              <div className="w-16 h-16 bg-gray-50 rounded-xl border border-gray-100 flex-shrink-0 overflow-hidden">
                {item.product.image
                  ? <Image src={item.product.image} alt={item.product.name} width={64} height={64} className="w-full h-full object-contain p-1" />
                  : <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-gray-300" /></div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/dashboard/shop/product/${item.product.id}`}
                  className="text-sm font-semibold text-gray-900 hover:text-green-700 transition-colors line-clamp-2"
                >
                  {item.product.name}
                </Link>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.product.category?.replace("_", " ")} · Qty: {item.quantity}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-gray-900">{formatMoney(item.price * item.quantity)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatMoney(item.price)} each</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Total */}
        <div className="p-5 bg-gray-50 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatMoney(order.subtotal ?? order.totalAmount)}</span>
          </div>
          {order.taxAmount && order.taxAmount > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>VAT (7.5%)</span>
              <span>{formatMoney(order.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery</span>
            <span className="text-green-600 font-semibold">FREE</span>
          </div>
          <div className="flex justify-between font-extrabold text-gray-900 text-base pt-2 border-t border-gray-200 mt-2">
            <span>Total Paid</span>
            <span>{formatMoney(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Shipping + Payment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-gray-400" />
            <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Delivery Address</h2>
          </div>
          {addressObj ? (
            <div className="text-sm text-gray-600 space-y-0.5">
              <p className="font-semibold text-gray-900">{order.user?.name}</p>
              <p>{addressObj.street}</p>
              <p>{addressObj.city}, {addressObj.state}</p>
              {addressObj.postalCode && <p>{addressObj.postalCode}</p>}
              <p>{addressObj.country || "Nigeria"}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{order.shippingAddr}</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-gray-400" />
            <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Payment</h2>
          </div>
          <div className="text-sm text-gray-600 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-400">Method</span>
              <span className="font-semibold">{order.paymentMethod || "Paystack"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status</span>
              <span className={`font-bold ${["PAID","DELIVERED","SHIPPED","PROCESSING"].includes(order.status) ? "text-green-600" : "text-gray-600"}`}>
                {["PAID","DELIVERED","SHIPPED","PROCESSING"].includes(order.status) ? "PAID" : order.status === "CANCELLED" ? "REFUND PENDING" : "PENDING"}
              </span>
            </div>
            {order.paymentRef && (
              <div className="flex justify-between">
                <span className="text-gray-400">Ref</span>
                <span className="font-mono text-xs">{order.paymentRef.slice(-12)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard/orders"
          className="flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-green-300 text-gray-700 font-semibold py-3 px-5 rounded-xl text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <Link
          href="/dashboard/shop"
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-5 rounded-xl text-sm transition-colors"
        >
          Continue Shopping
        </Link>
        <Link
          href="/dashboard/inbox"
          className="flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-blue-300 text-gray-700 font-semibold py-3 px-5 rounded-xl text-sm transition-colors"
        >
          <MessageSquare className="w-4 h-4" /> Contact Support
        </Link>
      </div>
    </div>
  )
}
