"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ChevronDown, Search, User, Package, LogOut } from "lucide-react";
import { navConfig } from "@/config/navConfig";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setOpenSubmenu(null); // Reset when closed
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/shop?q=${encodeURIComponent(searchTerm)}`;
      onClose();
    }
  };

  const toggleSubmenu = useCallback((label: string) => {
    setOpenSubmenu((prev) => (prev === label ? null : label));
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div className="lg:hidden fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-50 shadow-2xl overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-100">
          <span className="text-lg font-bold text-primary-900">Menu</span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-50 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex m-4">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-l-lg border border-surface-200 focus:outline-none focus:border-primary-500 text-sm"
          />
          <button
            type="submit"
            className="bg-primary-600 text-white px-4 rounded-r-lg hover:bg-primary-700 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
        </form>

        {/* Navigation Items */}
        <nav className="px-4 pb-4" role="navigation" aria-label="Mobile navigation">
          <div className="space-y-0.5">
            {navConfig.map((item) => {
              const hasChildren = !!item.children?.length;
              const isSubmenuOpen = openSubmenu === item.label;
              const isActive =
                pathname === item.href ||
                (hasChildren && item.children!.some((c) => pathname.startsWith(c.href)));

              return (
                <div key={item.label}>
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      onClick={() => !hasChildren && onClose()}
                      className={`flex-1 flex items-center px-4 py-3 font-medium rounded-lg transition-colors ${
                        isActive
                          ? "text-primary-600 bg-primary-50"
                          : "text-surface-800 hover:bg-surface-50"
                      }`}
                    >
                      {item.label}
                    </Link>
                    {hasChildren && (
                      <button
                        onClick={() => toggleSubmenu(item.label)}
                        className="p-3 hover:bg-surface-50 rounded-lg transition-colors"
                        aria-label={`${isSubmenuOpen ? "Collapse" : "Expand"} ${item.label} submenu`}
                        aria-expanded={isSubmenuOpen}
                      >
                        <ChevronDown
                          className={`w-4 h-4 text-surface-500 transition-transform duration-200 ${
                            isSubmenuOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Accordion Submenu */}
                  {hasChildren && (
                    <div
                      className="overflow-hidden transition-all duration-300 ease-in-out"
                      style={{
                        maxHeight: isSubmenuOpen ? `${item.children!.length * 60}px` : "0px",
                        opacity: isSubmenuOpen ? 1 : 0,
                      }}
                    >
                      <div className="pl-4 space-y-0.5 pb-2">
                        {item.children!.map((child) => {
                          const childActive = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={onClose}
                              className={`flex flex-col gap-0.5 px-4 py-2.5 rounded-lg transition-colors ${
                                childActive
                                  ? "bg-primary-50 text-primary-700"
                                  : "text-surface-600 hover:bg-surface-50 hover:text-primary-600"
                              }`}
                            >
                              <span className="text-sm font-medium">{child.label}</span>
                              {child.description && (
                                <span className="text-xs text-surface-400">{child.description}</span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Auth Section */}
        <div className="border-t border-surface-200 px-4 pt-4 pb-8">
          {session ? (
            <div className="space-y-1">
              <Link
                href="/dashboard"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 font-medium text-surface-800 hover:bg-surface-50 rounded-lg"
              >
                <User className="w-5 h-5" />
                My Account
              </Link>
              <Link
                href="/dashboard/orders"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 font-medium text-surface-800 hover:bg-surface-50 rounded-lg"
              >
                <Package className="w-5 h-5" />
                Orders
              </Link>
              <button
                onClick={() => {
                  onClose();
                  signOut({ callbackUrl: "/shop" });
                }}
                className="w-full text-left flex items-center gap-3 px-4 py-3 font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <Link
                href="/login"
                onClick={onClose}
                className="py-3 px-4 text-center font-semibold text-primary-700 border border-primary-200 hover:bg-primary-50 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="py-3 px-4 text-center font-bold bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
