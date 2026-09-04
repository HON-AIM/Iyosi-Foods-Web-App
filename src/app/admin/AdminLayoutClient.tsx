"use client"

import { useState, useRef, useEffect } from "react"
import { Menu, X, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import AdminSidebar from "@/components/admin/AdminSidebar"

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const adminMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target as Node)) {
        setAdminMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

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
          <div className="relative" ref={adminMenuRef}>
            <button
              onClick={() => setAdminMenuOpen(!adminMenuOpen)}
              className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm hover:ring-2 hover:ring-green-300 transition-all"
              aria-label="Admin menu"
            >
              A
            </button>
            {adminMenuOpen && (
              <div className="absolute right-0 top-10 w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden py-1">
                <button
                  onClick={async () => {
                    setAdminMenuOpen(false)
                    localStorage.clear()
                    await signOut({ callbackUrl: "/login", redirect: true })
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 md:p-8 max-w-full">{children}</div>
      </main>
    </div>
  )
}
