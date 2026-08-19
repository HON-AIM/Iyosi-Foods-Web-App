"use client";
import Link from "next/link";
import { ShoppingCart, Bell } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface Props {
  userName: string;
  userEmail: string;
}

export default function DashboardTopbar({ userName, userEmail }: Props) {
  const { cartItemsCount, setIsCartOpen } = useCart();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">IF</span>
          </div>
          <span className="font-bold text-gray-900 text-sm hidden sm:block">
            Iyosiola Foods
          </span>
          <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full hidden sm:block">
            My Account
          </span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Cart */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Shopping cart"
          >
            <ShoppingCart className="w-5 h-5 text-gray-600" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {cartItemsCount > 9 ? "9+" : cartItemsCount}
              </span>
            )}
          </button>

          {/* Notifications bell */}
          <button className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Notifications">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>

          {/* Avatar */}
          <div className="flex items-center gap-2 ml-1 pl-3 border-l border-gray-200">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-gray-800 leading-none">{userName.split(" ")[0]}</p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5 truncate max-w-[100px]">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
