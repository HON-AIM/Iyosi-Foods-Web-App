import { auth } from "@/lib/auth";
import Link from "next/link";
import { PenSquare, Store, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Account Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Shop Card — first card in the grid */}
        <div className="md:col-span-2 bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl p-6 flex items-center justify-between text-white">
          <div>
            <p className="text-green-200 text-sm font-medium mb-1">Iyosiola Foods Store</p>
            <h2 className="text-2xl font-bold">Ready to stock up?</h2>
            <p className="text-green-100 text-sm mt-1">Browse premium flour, semolina, and baking essentials.</p>
          </div>
          <Link
            href="/dashboard/shop"
            className="flex-shrink-0 flex items-center gap-2 bg-white text-green-700 font-bold px-5 py-3 rounded-xl hover:bg-green-50 transition-colors shadow-lg"
          >
            <Store className="w-5 h-5" />
            Shop Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Account Details Box */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800 uppercase tracking-wide">Account Details</h2>
            <Link href="/dashboard/settings" className="text-primary-600 hover:text-primary-700">
               <PenSquare size={18} />
            </Link>
          </div>
          <div className="p-6 flex-1 space-y-2">
            <p className="text-gray-900 font-medium">{session?.user?.name || "User"}</p>
            <p className="text-gray-600 text-sm">{session?.user?.email}</p>
          </div>
          <div className="p-4 border-t border-gray-200 text-sm mt-auto">
             <Link href="/dashboard/settings" className="text-primary-600 font-medium hover:underline">
               CHANGE PASSWORD
             </Link>
          </div>
        </div>

        {/* Address Book Box */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800 uppercase tracking-wide">Address Book</h2>
            <Link href="/dashboard/address-book" className="text-primary-600 hover:text-primary-700">
               <PenSquare size={18} />
            </Link>
          </div>
          <div className="p-6 flex-1 space-y-2">
             <h3 className="font-medium text-gray-900">Default Shipping Address</h3>
             <p className="text-gray-600 text-sm">{session?.user?.name || "User"}</p>
             <p className="text-gray-600 text-sm italic">No default address provided yet.</p>
          </div>
          <div className="p-4 border-t border-gray-200 text-sm mt-auto">
             <Link href="/dashboard/address-book" className="text-primary-600 font-medium hover:underline">
               ADD DEFAULT ADDRESS
             </Link>
          </div>
        </div>
        
        {/* Store Credit Box */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800 uppercase tracking-wide">Store Credit</h2>
          </div>
          <div className="p-6 flex-1 flex flex-col items-center justify-center py-8">
             <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Available Balance</div>
             <div className="text-3xl font-bold text-gray-900">₦0.00</div>
          </div>
        </div>

        {/* Newsletter Box */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800 uppercase tracking-wide">Newsletter Preferences</h2>
            <Link href="/dashboard/settings" className="text-primary-600 hover:text-primary-700">
               <PenSquare size={18} />
            </Link>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center">
             <p className="text-gray-600 text-sm">You are currently subscribed to our daily and weekly newsletters.</p>
          </div>
          <div className="p-4 border-t border-gray-200 text-sm mt-auto">
             <Link href="/dashboard/settings" className="text-primary-600 font-medium hover:underline">
               EDIT PREFERENCES
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
