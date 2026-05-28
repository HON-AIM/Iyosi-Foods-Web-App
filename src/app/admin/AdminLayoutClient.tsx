"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import AdminSidebar from "@/components/admin/AdminSidebar"

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-green-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-medium"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile sidebar */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-64 bg-white shadow-xl z-10 flex flex-col">
            <button
              className="absolute top-3 right-3 p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            <AdminSidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <main id="main-content" className="flex-1 overflow-y-auto overflow-x-hidden w-full" role="main">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between bg-white border-b px-4 py-3 sticky top-0 z-30">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <span className="font-semibold text-sm text-gray-900">Admin Dashboard</span>
          <div className="w-10" />
        </div>
        <div className="p-4 md:p-8 max-w-full">{children}</div>
      </main>
    </div>
  )
}
