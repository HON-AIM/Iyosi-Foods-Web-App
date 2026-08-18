"use client"

import { CheckCircle, Clock, Package, Truck, Home, XCircle } from "lucide-react"

type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED"

interface OrderTimelineProps {
  status: OrderStatus
  createdAt: Date
  estimatedDelivery?: Date | null
  trackingNumber?: string | null
  trackingCarrier?: string | null
}

const STEPS = [
  { key: "PENDING",    label: "Order Placed",      icon: Clock,       description: "Your order has been received" },
  { key: "PAID",       label: "Payment Confirmed",  icon: CheckCircle, description: "Payment verified successfully" },
  { key: "PROCESSING", label: "Processing",         icon: Package,     description: "We are preparing your items" },
  { key: "SHIPPED",    label: "Shipped",            icon: Truck,       description: "Your order is on the way" },
  { key: "DELIVERED",  label: "Delivered",          icon: Home,        description: "Order delivered successfully" },
] as const

const STATUS_ORDER: OrderStatus[] = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"]

export default function OrderTimeline({
  status, createdAt, estimatedDelivery, trackingNumber, trackingCarrier
}: OrderTimelineProps) {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-100">
        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div>
          <p className="font-semibold text-red-700">Order Cancelled</p>
          <p className="text-sm text-red-500">This order was cancelled. Contact support if this was a mistake.</p>
        </div>
      </div>
    )
  }

  const currentIndex = STATUS_ORDER.indexOf(status)

  return (
    <div className="space-y-4">
      {trackingNumber && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Tracking Number</p>
            <p className="font-mono font-bold text-blue-900">{trackingNumber}</p>
            {trackingCarrier && <p className="text-xs text-blue-500">via {trackingCarrier}</p>}
          </div>
          {estimatedDelivery && (
            <div className="text-right">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Est. Delivery</p>
              <p className="font-semibold text-blue-900 text-sm">
                {new Date(estimatedDelivery).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="relative">
        {STEPS.map((step, index) => {
          const isCompleted = index <= currentIndex
          const isCurrent = index === currentIndex
          const Icon = step.icon

          return (
            <div key={step.key} className="flex gap-4 relative">
              {index < STEPS.length - 1 && (
                <div className={`absolute left-[18px] top-9 w-0.5 h-8 ${isCompleted && index < currentIndex ? "bg-green-400" : "bg-gray-200"}`} />
              )}

              <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border-2 mt-0.5 z-10
                ${isCompleted ? "bg-green-600 border-green-600 text-white" : isCurrent ? "border-green-600 bg-green-50 text-green-600" : "border-gray-200 bg-white text-gray-300"}`}
              >
                {isCompleted && !isCurrent
                  ? <CheckCircle className="w-4 h-4" />
                  : <Icon className="w-4 h-4" />
                }
              </div>

              <div className="pb-6 flex-1">
                <p className={`font-semibold text-sm ${isCompleted ? "text-gray-900" : "text-gray-400"}`}>
                  {step.label}
                  {isCurrent && <span className="ml-2 text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">CURRENT</span>}
                </p>
                <p className={`text-xs mt-0.5 ${isCompleted ? "text-gray-500" : "text-gray-300"}`}>
                  {step.description}
                </p>
                {isCurrent && index === 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Ordered {new Date(createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
