"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Users, Search, Mail, ShoppingBag, Star, Trash2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { SkeletonTable } from "@/components/admin/SkeletonTable";

type Customer = {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
  _count: {
    orders: number;
    reviews: number;
  };
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

const ITEMS_PER_PAGE = 10;

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: ITEMS_PER_PAGE,
    pages: 1,
  });
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok || response.status === 401) {
          router.push("/login");
        }
      } catch (error) {
        console.error("[ERROR] Auth check failed:", error instanceof Error ? error.message : String(error));
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  const fetchCustomers = useCallback(
    async (page: number = 1, search: string = "") => {
      setIsLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: ITEMS_PER_PAGE.toString(),
          ...(search && { search }),
        });

        const response = await fetch(`/api/admin/customers?${queryParams}`);

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (response.status === 403) {
          setError("You do not have permission to view customers");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load customers");
        }

        const data = await response.json();
        setCustomers(data.customers || []);
        setPagination(data.pagination || {
          total: 0,
          page: 1,
          limit: ITEMS_PER_PAGE,
          pages: 1,
        });
      } catch (error) {
        console.error("[ERROR] Error fetching customers:", error instanceof Error ? error.message : String(error));
        setError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        );
        toast.error("Failed to load customers");
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // Fetch on mount and when search changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchCustomers(1, searchTerm);
    }, 300); // Debounce search

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, fetchCustomers]);

  const handleDelete = async (id: string, name: string | null) => {
    const customerName = name || "this customer";

    const confirmed = window.confirm(
      `⚠️ PERMANENT DELETE\n\n` +
        `You are about to permanently delete ${customerName}.\n\n` +
        `This will remove:\n` +
        `• Customer profile\n` +
        `• All order history\n` +
        `• All reviews\n\n` +
        `This action CANNOT be undone.\n\n` +
        `Type "DELETE" to confirm.`
    );

    if (!confirmed) return;

    setIsDeleting(id);

    try {
      const response = await fetch(`/api/admin/customers/${id}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        toast.error("You do not have permission to delete customers");
        return;
      }

      if (response.ok) {
        toast.success(`${customerName} deleted successfully`);
        setCustomers((prev) => prev.filter((c) => c.id !== id));
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to delete customer");
      }
    } catch (error) {
      console.error("[ERROR] Error deleting customer:", error instanceof Error ? error.message : String(error));
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(null);
    }
  };

  // Filter customers (local search for current page)
  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (customer.name && customer.name.toLowerCase().includes(searchLower)) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower))
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-28 animate-pulse" />
        <SkeletonTable
          headers={["Name", "Email", "Joined", "Orders", "Actions"]}
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage {pagination.total} registered users on your platform
        </p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent sm:text-sm bg-gray-50"
            aria-label="Search customers"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-center">Orders</th>
                <th className="px-6 py-4 text-center">Reviews</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500">No customers found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {customer.name ? customer.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{customer.name || "Unknown User"}</p>
                          <p className="text-xs text-gray-500">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(customer.createdAt), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                        <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                        {customer._count.orders}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-sm font-medium">
                        <Star className="h-3.5 w-3.5 mr-1 fill-amber-500 text-amber-500" />
                        {customer._count.reviews}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {customer.email && (
                          <a
                            href={`mailto:${customer.email}`}
                            className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-primary transition-colors hover:bg-primary/5 rounded-lg"
                            title="Send Email"
                          >
                            <Mail className="h-5 w-5" />
                          </a>
                        )}
                        <button
                           onClick={() => handleDelete(customer.id, customer.name)}
                           className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100"
                           title="Delete Customer"
                        >
                           <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
