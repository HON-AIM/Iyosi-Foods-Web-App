"use client"

import Link from "next/link"
import { ShoppingCart, Bell, Store } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { useState, useEffect, useRef } from "react"

interface Props {
  userName: string
  userEmail: string
}

interface Notification {
  id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  link?: string | null
}

export default function DashboardTopbar({ userName, userEmail }: Props) {
  const { cartItemsCount, setIsCartOpen } = useCart()
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notifRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Fetch notifications
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await fetch("/api/user/notifications")
        if (!res.ok) return
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      } catch {
        // Notifications API may not be set up yet — fail silently
      }
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 60000)
    return () => clearInterval(interval)
  }, [])

  const markAllRead = async () => {
    try {
      await fetch("/api/user/notifications", { method: "PATCH" })
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch {}
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">

        {/* Logo / Brand */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-xs">IF</span>
          </div>
          <span className="font-bold text-gray-900 text-sm hidden sm:block">Iyosiola Foods</span>
          <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full hidden sm:block">
            My Account
          </span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-1">

          {/* Shop shortcut */}
          <Link
            href="/dashboard/shop"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
          >
            <Store className="w-4 h-4" />
            Shop
          </Link>

          {/* Cart button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Shopping cart"
          >
            <ShoppingCart className="w-5 h-5 text-gray-600" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-0.5">
                {cartItemsCount > 9 ? "9+" : cartItemsCount}
              </span>
            )}
          </button>

          {/* Notifications bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen && unreadCount > 0) markAllRead() }}
              className="relative p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-0.5">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-green-600 hover:underline font-medium">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center">
                      <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No notifications yet</p>
                      <p className="text-xs text-gray-300 mt-1">We will notify you about your orders here</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map(notif => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 hover:bg-gray-50 transition-colors ${!notif.isRead ? "bg-green-50/40" : ""}`}
                      >
                        <div className="flex gap-2.5">
                          {!notif.isRead && (
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                          )}
                          <div className={!notif.isRead ? "" : "pl-4"}>
                            <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              {new Date(notif.createdAt).toLocaleDateString("en-NG", {
                                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                  <Link
                    href="/dashboard/orders"
                    onClick={() => setNotifOpen(false)}
                    className="text-xs text-green-600 hover:underline font-semibold"
                  >
                    View My Orders →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-2 ml-1 pl-3 border-l border-gray-200">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-extrabold text-sm flex-shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-gray-800 leading-none">{userName.split(" ")[0]}</p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5 max-w-[120px] truncate">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
