import React from "react";
import { type Metadata } from "next";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  DollarSign,
  Eye,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  MessageSquare,
  Star,
  Settings,
  BarChart3,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard | Admin - Iyosi Foods",
  description: "Complete store management dashboard",
  robots: { index: false, follow: false },
};

async function getDashboardData() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const paidStatuses = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

    const [
      totalOrders,
      pendingOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      lowStockProducts,
      recentOrders,
      recentMessages,
      todayOrders,
      yesterdayOrders,
      revenueThisMonth,
      revenueLastMonth,
      customersThisMonth,
      customersLastMonth,
      productsThisMonth,
      productsLastMonth,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
      }),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.findMany({
        where: { stock: { lte: 10 }, isActive: true },
        select: { id: true, name: true, stock: true, price: true },
        orderBy: { stock: "asc" },
        take: 5,
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.message.findMany({
        where: { isRead: false },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      }),
      prisma.order.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 1)),
            lt: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { in: [...paidStatuses] }, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: { in: [...paidStatuses] },
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
      prisma.user.count({ where: { role: "USER", createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({
        where: { role: "USER", createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
      prisma.product.count({ where: { isActive: true, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.product.count({
        where: { isActive: true, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
    ]);

    const revThis = revenueThisMonth._sum.totalAmount || 0;
    const revLast = revenueLastMonth._sum.totalAmount || 0;
    const revenueChange =
      revLast > 0 ? Math.round(((revThis - revLast) / revLast) * 100) : revThis > 0 ? 100 : 0;

    const custChange =
      customersLastMonth > 0
        ? Math.round(((customersThisMonth - customersLastMonth) / customersLastMonth) * 100)
        : customersThisMonth > 0
          ? 100
          : 0;

    const productsChange =
      productsLastMonth > 0
        ? Math.round(((productsThisMonth - productsLastMonth) / productsLastMonth) * 100)
        : productsThisMonth > 0
          ? 100
          : 0;

    return {
      totalOrders,
      pendingOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalCustomers,
      totalProducts,
      lowStockProducts,
      recentOrders,
      recentMessages,
      todayOrders,
      yesterdayOrders,
      revenueChange,
      custChange,
      productsChange,
    };
  } catch (error) {
    console.error("[ERROR] Dashboard error:", error);
    return {
      totalOrders: 0,
      pendingOrders: 0,
      totalRevenue: 0,
      totalCustomers: 0,
      totalProducts: 0,
      lowStockProducts: [],
      recentOrders: [],
      recentMessages: [],
      todayOrders: 0,
      yesterdayOrders: 0,
      revenueChange: 0,
      custChange: 0,
      productsChange: 0,
    };
  }
}

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  PENDING: { color: "text-yellow-600", bg: "bg-yellow-100", icon: <Clock className="w-4 h-4" /> },
  PAID: { color: "text-blue-600", bg: "bg-blue-100", icon: <CheckCircle className="w-4 h-4" /> },
  PROCESSING: { color: "text-purple-600", bg: "bg-purple-100", icon: <RefreshCw className="w-4 h-4" /> },
  SHIPPED: { color: "text-indigo-600", bg: "bg-indigo-100", icon: <Truck className="w-4 h-4" /> },
  DELIVERED: { color: "text-green-600", bg: "bg-green-100", icon: <CheckCircle className="w-4 h-4" /> },
  CANCELLED: { color: "text-red-600", bg: "bg-red-100", icon: <XCircle className="w-4 h-4" /> },
};

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  const orderChange = data.yesterdayOrders > 0
    ? Math.round(((data.todayOrders - data.yesterdayOrders) / data.yesterdayOrders) * 100)
    : data.todayOrders > 0 ? 100 : 0;

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(data.totalRevenue),
      change: `${data.revenueChange > 0 ? "+" : ""}${data.revenueChange}%`,
      positive: data.revenueChange >= 0,
      icon: <DollarSign className="w-6 h-6" />,
      color: "green",
      href: "/admin/orders",
    },
    {
      title: "Total Orders",
      value: data.totalOrders.toLocaleString(),
      change: `${orderChange > 0 ? "+" : ""}${orderChange}%`,
      positive: orderChange >= 0,
      icon: <ShoppingCart className="w-6 h-6" />,
      color: "blue",
      href: "/admin/orders",
    },
    {
      title: "Active Customers",
      value: data.totalCustomers.toLocaleString(),
      change: `${data.custChange > 0 ? "+" : ""}${data.custChange}%`,
      positive: data.custChange >= 0,
      icon: <Users className="w-6 h-6" />,
      color: "purple",
      href: "/admin/customers",
    },
    {
      title: "Total Products",
      value: data.totalProducts.toLocaleString(),
      change: `${data.productsChange > 0 ? "+" : ""}${data.productsChange}%`,
      positive: data.productsChange >= 0,
      icon: <Package className="w-6 h-6" />,
      color: "orange",
      href: "/admin/products",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors"
          >
            <Eye className="w-4 h-4" />
            View Store
          </Link>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 rounded-lg hover:bg-green-700 text-white font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Link
            key={i}
            href={stat.href}
            className={`bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg hover:border-${stat.color}-200 transition-all group`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${stat.positive ? "text-green-600" : "text-red-600"}`}>
                {stat.positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {stat.change}
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">{stat.title}</p>
            <h3 className="text-xl lg:text-2xl font-bold text-gray-900">{stat.value}</h3>
          </Link>
        ))}
      </div>

      {/* Alerts Banner */}
      {data.pendingOrders > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="font-semibold text-yellow-800">{data.pendingOrders} Pending Orders</p>
              <p className="text-sm text-yellow-600">Action required to process these orders</p>
            </div>
          </div>
          <Link href="/admin/orders?status=PENDING" className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium text-sm transition-colors">
            View Orders
          </Link>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
              <p className="text-sm text-gray-500">Latest customer orders</p>
            </div>
            <Link href="/admin/orders" className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1">
              View All <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-gray-500">
                      <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p>No orders yet</p>
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <Link href={`/admin/orders`} className="font-semibold text-green-600 hover:text-green-700">
                          #{order.id.slice(-8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{order.user?.name || "Guest"}</p>
                        <p className="text-xs text-gray-500">{order.user?.email}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {format(new Date(order.createdAt), "MMM dd, yyyy")}
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.bg} ${statusConfig[order.status]?.color}`}>
                          {statusConfig[order.status]?.icon}
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {[
                { label: "Add Product", icon: <Plus className="w-5 h-5" />, href: "/admin/products/new", color: "green" },
                { label: "View Orders", icon: <ShoppingCart className="w-5 h-5" />, href: "/admin/orders", color: "blue" },
                { label: "View Messages", icon: <MessageSquare className="w-5 h-5" />, href: "/admin/messages", color: "purple" },
                { label: "Store Settings", icon: <Settings className="w-5 h-5" />, href: "/admin/settings", color: "gray" },
                { label: "View Reports", icon: <BarChart3 className="w-5 h-5" />, href: "/admin/analytics", color: "orange" },
                { label: "Manage Reviews", icon: <Star className="w-5 h-5" />, href: "/admin/reviews", color: "yellow" },
              ].map((action, i) => (
                <Link
                  key={i}
                  href={action.href}
                  className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors group"
                >
                  <div className={`p-2 rounded-lg mb-2 text-${action.color}-600 bg-${action.color}-50 group-hover:bg-${action.color}-100 transition-colors`}>
                    {action.icon}
                  </div>
                  <span className="text-xs font-medium text-gray-700">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-bold text-gray-900">Low Stock</h2>
              </div>
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                {data.lowStockProducts.length}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {data.lowStockProducts.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p>All products well stocked</p>
                </div>
              ) : (
                data.lowStockProducts.map((product) => (
                  <div key={product.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900 text-sm line-clamp-1">{product.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(product.price)}</p>
                    </div>
                    <span className={`font-bold text-sm ${product.stock === 0 ? "text-red-600" : "text-orange-600"}`}>
                      {product.stock} left
                    </span>
                  </div>
                ))
              )}
            </div>
            {data.lowStockProducts.length > 0 && (
              <div className="p-4 border-t border-gray-100">
                <Link href="/admin/products" className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center justify-center gap-1">
                  View All Products <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Recent Messages */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold text-gray-900">Messages</h2>
              </div>
              {data.recentMessages.length > 0 && (
                <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-1 rounded-full">
                  {data.recentMessages.length} new
                </span>
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {data.recentMessages.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <MessageSquare className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p>No unread messages</p>
                </div>
              ) : (
                data.recentMessages.map((msg) => (
                  <Link key={msg.id} href="/admin/messages" className="block p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                        {msg.user?.name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{msg.user?.name || "User"}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{msg.subject}</p>
                        <p className="text-xs text-gray-400 mt-1">{format(new Date(msg.createdAt), "MMM dd")}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
