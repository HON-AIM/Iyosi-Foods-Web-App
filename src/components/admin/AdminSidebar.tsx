"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  Users,
  Star,
  Settings,
  LogOut,
  ImageIcon,
  ExternalLink,
  Store,
  Zap,
} from "lucide-react";
import { useSession } from "next-auth/react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiredRole?: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: <Package className="h-5 w-5" />,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: <ShoppingCart className="h-5 w-5" />,
  },
  {
    label: "Messages",
    href: "/admin/messages",
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    label: "Customers",
    href: "/admin/customers",
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: "Reviews",
    href: "/admin/reviews",
    icon: <Star className="h-5 w-5" />,
  },
  {
    label: "Shop Content",
    href: "/admin/shop-content",
    icon: <ImageIcon className="h-5 w-5" />,
  },
  {
    label: "Flash Sale",
    href: "/admin/flash-sale",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5" />,
  },
  {
    label: "View Store",
    href: "/shop",
    icon: <ExternalLink className="h-5 w-5" />,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (confirmed) {
      // Call logout endpoint
      await fetch("/api/auth/logout", { method: "POST" });
      // Redirect will be handled by middleware
      window.location.href = "/login";
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-50 flex items-center justify-between p-4">
        <Link href="/admin" className="font-bold text-lg text-gray-900">
          IYOSIOLA
        </Link>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileOpen}
        >
          {isMobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 md:transition-none`}
      >
        {/* Logo */}
        <div className="hidden md:flex items-center justify-center h-16 border-b border-gray-200">
          <Link href="/admin" className="font-bold text-xl text-gray-900">
            IYOSIOLA
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-green-100 text-green-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          {session?.user && (
            <div className="px-2 py-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Logged in as
              </p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {session.user.name || session.user.email}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
