"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ShoppingCart, Search, Filter, AlertCircle, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";
import { SkeletonTable } from "@/components/admin/SkeletonTable";

type Order = {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  user: { name: string | null; email: string | null } | null;
  items: {
    id: string;
    quantity: number;
    priceAtTime: number;
    product: { name: string };
  }[];
  shippingAddress: string;
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const ITEMS_PER_PAGE = 10;

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: ITEMS_PER_PAGE,
    pages: 1,
  });

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok || response.status === 401) {
          router.push("/login");
          return;
        }
      } catch (error) {
        console.error("[ERROR] Auth check failed:", error instanceof Error ? error.message : String(error));
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  const fetchOrders = useCallback(
    async (page: number = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: ITEMS_PER_PAGE.toString(),
          ...(statusFilter !== "ALL" && { status: statusFilter }),
        });

        const response = await fetch(`/api/admin/orders?${queryParams}`);

        // Handle authentication errors
        if (response.status === 401) {
          router.push("/login");
          return;
        }

        // Handle permission errors
        if (response.status === 403) {
          setError("You do not have permission to view orders");
          toast.error("Access denied");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load orders");
        }

        const data = await response.json();
        setOrders(data.orders || []);
        setPagination(data.pagination || {
          total: 0,
          page: 1,
          limit: ITEMS_PER_PAGE,
          pages: 1,
        });
      } catch (error) {
        console.error("[ERROR] Error fetching orders:", error instanceof Error ? error.message : String(error));
        setError("Failed to load orders");
        toast.error("Failed to load orders");
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter, router]
  );

  // Fetch orders on mount and when filters change
  useEffect(() => {
    fetchOrders(1);
  }, [statusFilter, fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Confirm status change
    const confirmed = window.confirm(
      `⚠️ UPDATE ORDER STATUS\n\n` +
        `Order: #${orderId.slice(-8).toUpperCase()}\n` +
        `Current: ${order.status}\n` +
        `New: ${newStatus}\n\n` +
        `Are you sure?`
    );

    if (!confirmed) return;

    // Store previous state for rollback
    const previousOrders = orders;
    setUpdatingId(orderId);

    // Optimistically update UI
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      // Handle authentication errors
      if (response.status === 401) {
        router.push("/login");
        setOrders(previousOrders);
        return;
      }

      // Handle permission errors
      if (response.status === 403) {
        toast.error("You do not have permission to update orders");
        setOrders(previousOrders);
        return;
      }

      if (response.ok) {
        toast.success("Order status updated successfully");
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to update order status");
        // Rollback optimistic update
        setOrders(previousOrders);
      }
    } catch (error) {
      console.error("[ERROR] Error updating order status:", error instanceof Error ? error.message : String(error));
      toast.error("An error occurred while updating the order");
      // Rollback optimistic update
      setOrders(previousOrders);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.user?.name &&
        order.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.user?.email &&
        order.user.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
        <SkeletonTable
          headers={["Order ID", "Customer", "Date", "Amount", "Status", "Actions"]}
          rows={10}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => fetchOrders(1)}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track {pagination.total} customer orders
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors">
            Export
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="Search by Order ID, Name, or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search orders"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm bg-gray-50"
          />
        </div>

        <div className="flex items-center space-x-2 min-w-fit">
          <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter orders by status"
            className="py-2 pl-3 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
          >
            <option value="ALL">All Statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Order Details</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-gray-400" aria-hidden="true" />
                      </div>
                      <p className="text-gray-500">
                        {searchTerm || statusFilter !== "ALL"
                          ? "No orders match your filters."
                          : "No orders found."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        #{order.id.slice(-8).toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {format(new Date(order.createdAt), "MMM dd, yyyy HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {order.user?.name || "Guest User"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {order.user?.email || "no-email"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {order.items.length > 0
                        ? `${order.items[0].product.name}${
                            order.items.length > 1
                              ? ` + ${order.items.length - 1} more`
                              : ""
                          }`
                        : "No items"}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value)
                          }
                          disabled={updatingId === order.id}
                          aria-label={`Update status for order ${order.id}`}
                          className={`text-sm rounded-full px-3 py-1 font-medium border-0 focus:ring-2 focus:ring-offset-1 focus:ring-green-500 focus:border-green-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8 ${
                            STATUS_COLORS[order.status] ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        {updatingId === order.id && (
                          <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchOrders(pagination.page - 1)}
              disabled={pagination.page === 1 || isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => fetchOrders(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages || isLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
