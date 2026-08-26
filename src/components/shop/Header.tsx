"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Search, ShoppingCart, User, Menu, ChevronDown, LogOut } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function ShopHeader() {
  const { data: session } = useSession();
  const { cartItemsCount, setIsCartOpen } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        if (data.settings?.announcementText) {
          setAnnouncement(data.settings.announcementText);
        }
      })
      .catch(err => console.error("[ERROR] Failed to load announcement", err instanceof Error ? err.message : String(err)));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/shop?q=${encodeURIComponent(searchTerm)}`;
    }
  };

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50">
      {/* Top Banner (Dynamic from StoreSettings) */}
      {announcement && (
        <div className="bg-primary-900 text-white text-xs py-1.5 text-center font-medium">
          {announcement}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4 md:gap-8">
          
          {/* Logo & Mobile Menu */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <button className="md:hidden text-gray-600 hover:text-primary-600">
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/shop" className="flex items-center gap-2">
              <Image src="/logo.jpg" alt="Iyosi Foods Foods Logo" width={40} height={40} className="object-contain" />
              <span className="font-extrabold text-xl text-primary-900 tracking-tight hidden sm:block">Iyosi Foods STORE</span>
            </Link>
          </div>

          {/* Search Bar - Center */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Search products, brands and categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 rounded-l-md border border-gray-300 focus:outline-none focus:border-primary-500 text-sm"
                />
                <button 
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-r-md font-medium transition-colors flex items-center shadow-md shadow-primary-500/20"
                >
                  <Search className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:block">SEARCH</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Actions (Account & Cart) */}
          <div className="flex items-center gap-2 sm:gap-6 flex-shrink-0">
            
            {/* Account Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setIsAccountMenuOpen(true)}
              onMouseLeave={() => setIsAccountMenuOpen(false)}
            >
              <div className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-md transition-colors text-gray-700 font-medium">
                <User className="h-6 w-6" />
                <span className="hidden lg:block text-sm">
                  {session?.user ? `Hi, ${session.user.name?.split(' ')[0]}` : 'Account'}
                </span>
                <ChevronDown className="h-4 w-4 hidden lg:block" />
              </div>

              {/* Dropdown Menu */}
              {isAccountMenuOpen && (
                <div className="absolute top-full right-0 w-56 bg-white border border-gray-100 shadow-xl rounded-b-md z-50 pt-2 pb-2">
                  {!session ? (
                    <div className="p-4 border-b border-gray-100">
                      <Link 
                        href="/login" 
                        className="block w-full text-center bg-primary-600 text-white font-bold py-2.5 rounded shadow-md hover:bg-primary-700 transition"
                      >
                        SIGN IN
                      </Link>
                      <div className="mt-4 text-center text-sm">
                        <Link href="/register" className="text-primary-600 hover:underline">
                          Create an Account
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 border-b border-gray-100 px-4 mb-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{session.user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                    </div>
                  )}

                  <div className="py-2">
                    <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600">
                      My Account
                    </Link>
                    <Link href="/dashboard/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600">
                      Orders
                    </Link>
                    {/* Add Admin Link if user is ADMIN */}
                    {/* Note: In a real app we'd fetch the role securely, but this is a placeholder */}
                    <Link href="/dashboard/inbox" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600">
                      Inbox
                    </Link>
                  </div>

                  {session && (
                    <div className="border-t border-gray-100 pt-2 pb-1">
                      <button 
                         onClick={() => signOut({ callbackUrl: "/shop" })}
                         className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition"
                      >
                         <LogOut className="h-4 w-4 mr-2" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Button */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md transition-colors text-gray-700 font-medium relative"
            >
              <div className="relative">
                <ShoppingCart className="h-6 w-6" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow border-2 border-white">
                    {cartItemsCount}
                  </span>
                )}
              </div>
              <span className="hidden lg:block text-sm">Cart</span>
            </button>

          </div>
        </div>

        {/* Mobile Search Bar (Shows below header on small screens) */}
        <div className="md:hidden pb-3">
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 rounded-l-md border border-gray-300 focus:outline-none focus:border-primary-500 text-sm"
              />
              <button 
                type="submit"
                className="bg-primary-600 text-white px-4 py-2.5 rounded-r-md flex items-center"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
        </div>
      </div>
    </header>
  );
}
