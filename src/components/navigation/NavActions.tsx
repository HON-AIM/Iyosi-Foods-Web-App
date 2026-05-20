"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Search, ShoppingCart, User, Menu, ChevronDown, X, LogOut, Package } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface NavActionsProps {
  mobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
}

export default function NavActions({ mobileMenuOpen, onMobileMenuToggle }: NavActionsProps) {
  const { data: session } = useSession();
  const { cartItemsCount, setIsCartOpen } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/shop?q=${encodeURIComponent(searchTerm)}`;
      setSearchOpen(false);
    }
  };

  const handleAccountEnter = useCallback(() => {
    if (accountTimeoutRef.current) clearTimeout(accountTimeoutRef.current);
    setAccountOpen(true);
  }, []);

  const handleAccountLeave = useCallback(() => {
    accountTimeoutRef.current = setTimeout(() => {
      setAccountOpen(false);
    }, 250);
  }, []);

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {/* Search Toggle */}
      <div className="relative hidden lg:block">
        {searchOpen ? (
          <form onSubmit={handleSearch} className="flex items-center">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="w-48 pl-4 pr-3 py-2 rounded-l-lg border border-surface-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-sm bg-surface-50 focus:bg-white transition-all"
            />
            <button
              type="submit"
              className="bg-primary-600 text-white px-3 py-2 rounded-r-lg hover:bg-primary-700 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => { setSearchOpen(false); setSearchTerm(""); }}
              className="ml-1 p-2 text-surface-400 hover:text-surface-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2.5 hover:bg-surface-50 rounded-lg transition-colors text-surface-600 hover:text-primary-600"
            aria-label="Open search"
          >
            <Search className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Account Dropdown */}
      <div
        className="relative hidden sm:block"
        onMouseEnter={handleAccountEnter}
        onMouseLeave={handleAccountLeave}
      >
        <button
          className="flex items-center gap-1.5 p-2.5 hover:bg-surface-50 rounded-lg transition-colors"
          aria-label="Account menu"
          aria-expanded={accountOpen}
        >
          <User className="h-5 w-5 text-surface-600" />
          <span className="hidden lg:block text-sm font-medium text-surface-700 max-w-[80px] truncate">
            {session?.user ? session.user.name?.split(" ")[0] : "Account"}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-surface-400" />
        </button>

        <div
          className={`absolute top-full right-0 pt-1 z-50 transition-all duration-200 ease-out ${
            accountOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <div className="w-60 bg-white border border-surface-200 shadow-2xl rounded-xl overflow-hidden">
            <div className="h-[3px] bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500" />

            {session ? (
              <>
                <div className="py-3 px-4 border-b border-surface-100 bg-surface-50">
                  <p className="text-sm font-semibold text-surface-900 truncate">{session.user?.name}</p>
                  <p className="text-xs text-surface-500 truncate">{session.user?.email}</p>
                </div>
                <div className="py-2">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 hover:text-primary-600 transition-colors"
                  >
                    <User className="w-4 h-4" />My Account
                  </Link>
                  <Link
                    href="/dashboard/orders"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 hover:text-primary-600 transition-colors"
                  >
                    <Package className="w-4 h-4" />Orders
                  </Link>
                  <Link
                    href="/dashboard/inbox"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 hover:text-primary-600 transition-colors"
                  >
                    <span className="w-4 h-4 flex items-center justify-center text-xs">💬</span>Inbox
                  </Link>
                </div>
                <div className="border-t border-surface-100 py-1">
                  <button
                    onClick={() => signOut({ callbackUrl: "/shop" })}
                    className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 border-b border-surface-100">
                  <Link
                    href="/login"
                    className="block w-full text-center bg-primary-600 text-white font-bold py-2.5 rounded-lg shadow-md hover:bg-primary-700 transition-colors"
                  >
                    SIGN IN
                  </Link>
                  <div className="mt-3 text-center text-sm">
                    <span className="text-surface-600">New customer? </span>
                    <Link href="/register" className="text-primary-600 font-semibold hover:underline">
                      Create Account
                    </Link>
                  </div>
                </div>
                <div className="py-2">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 hover:text-primary-600 transition-colors"
                  >
                    <User className="w-4 h-4" />My Account
                  </Link>
                  <Link
                    href="/dashboard/orders"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 hover:text-primary-600 transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />Orders
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cart */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="relative p-2.5 hover:bg-surface-50 rounded-lg transition-colors"
        aria-label="Shopping cart"
      >
        <ShoppingCart className="h-5 w-5 text-surface-600" />
        {cartItemsCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-accent-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full shadow-sm">
            {cartItemsCount > 99 ? "99+" : cartItemsCount}
          </span>
        )}
      </button>

      {/* Mobile Menu Toggle */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden p-2.5 hover:bg-surface-50 rounded-lg transition-colors"
        aria-label="Toggle menu"
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? (
          <X className="h-5 w-5 text-surface-700" />
        ) : (
          <Menu className="h-5 w-5 text-surface-700" />
        )}
      </button>
    </div>
  );
}
