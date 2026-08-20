import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { PenSquare, MapPin } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  // Fetch the default address from the database
  const defaultAddress = await prisma.address.findFirst({
    where: { userId: session.user.id, isDefault: true },
  }).catch(() => null)

  // Fetch recent order count for context
  const orderCount = await prisma.order.count({
    where: { userId: session.user.id }
  }).catch(() => 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Account Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Account Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Account Details</h2>
            <Link href="/dashboard/settings" className="text-green-600 hover:text-green-700">
              <PenSquare size={16} />
            </Link>
          </div>
          <div className="p-5 flex-1 space-y-1.5">
            <p className="text-gray-900 font-semibold">{session.user.name || "User"}</p>
            <p className="text-gray-500 text-sm">{session.user.email}</p>
            <p className="text-xs text-gray-400 pt-1">{orderCount} order{orderCount !== 1 ? "s" : ""} placed</p>
          </div>
          <div className="p-4 border-t border-gray-100">
            <Link href="/dashboard/settings" className="text-sm text-green-600 font-semibold hover:underline">
              CHANGE PASSWORD
            </Link>
          </div>
        </div>

        {/* Address Book — NOW FETCHES REAL DATA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Address Book</h2>
            <Link href="/dashboard/address-book" className="text-green-600 hover:text-green-700">
              <PenSquare size={16} />
            </Link>
          </div>
          <div className="p-5 flex-1">
            <h3 className="font-semibold text-gray-900 text-sm mb-2">Default Shipping Address</h3>
            {defaultAddress ? (
              <div className="flex gap-2.5">
                <MapPin className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-600 space-y-0.5">
                  <p className="font-semibold text-gray-800">{session.user.name}</p>
                  <p>{defaultAddress.street}</p>
                  <p>{defaultAddress.city}, {defaultAddress.state}</p>
                  {defaultAddress.postalCode && <p>{defaultAddress.postalCode}</p>}
                  <p>{defaultAddress.country}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No default address saved yet.</p>
            )}
          </div>
          <div className="p-4 border-t border-gray-100">
            <Link href="/dashboard/address-book" className="text-sm text-green-600 font-semibold hover:underline">
              {defaultAddress ? "MANAGE ADDRESSES" : "ADD DEFAULT ADDRESS"}
            </Link>
          </div>
        </div>

        {/* Store Credit */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Store Credit</h2>
          </div>
          <div className="p-5 flex-1 flex flex-col items-center justify-center py-8">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Available Balance</div>
            <div className="text-3xl font-extrabold text-gray-900">₦0.00</div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Newsletter</h2>
            <Link href="/dashboard/settings" className="text-green-600 hover:text-green-700">
              <PenSquare size={16} />
            </Link>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-center">
            <p className="text-sm text-gray-600">You are subscribed to our product updates and weekly newsletter.</p>
          </div>
          <div className="p-4 border-t border-gray-100">
            <Link href="/dashboard/settings" className="text-sm text-green-600 font-semibold hover:underline">
              EDIT PREFERENCES
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
