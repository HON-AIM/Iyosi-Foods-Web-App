import { type Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import { subDays, format } from "date-fns";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  Calendar,
  Download,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics | Admin - Iyosi Foods",
  description: "Store analytics and reports",
  robots: { index: false, follow: false },
};

const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

async function getAnalyticsData() {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sixtyDaysAgo = subDays(now, 60);
  const sevenDaysAgo = subDays(now, 7);

  const [
    revenueThisMonth,
    revenueLastMonth,
    ordersThisMonth,
    ordersLastMonth,
    totalCustomers,
    newCustomersThisMonth,
    newCustomersLastMonth,
    avgOrderValue,
    ordersByStatus,
    orderItemsForTopProducts,
    recentDailyRevenue,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: { in: [...PAID_STATUSES] },
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: { in: [...PAID_STATUSES] },
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    }),
    prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.order.count({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({
      where: { role: "USER", createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.user.count({
      where: { role: "USER", createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),
    prisma.order.aggregate({
      _avg: { totalAmount: true },
      where: { status: { in: [...PAID_STATUSES] } },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.orderItem.findMany({
      where: {
        order: { status: { in: [...PAID_STATUSES] } },
      },
      select: {
        productId: true,
        quantity: true,
        price: true,
        subtotal: true,
      },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: { in: [...PAID_STATUSES] },
      },
      select: { createdAt: true, totalAmount: true },
    }),
  ]);

  const revThis = revenueThisMonth._sum.totalAmount || 0;
  const revLast = revenueLastMonth._sum.totalAmount || 0;
  const revenueChange =
    revLast > 0 ? Math.round(((revThis - revLast) / revLast) * 100) : 0;

  const ordersChange =
    ordersLastMonth > 0
      ? Math.round(((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100)
      : 0;

  const custChange =
    newCustomersLastMonth > 0
      ? Math.round(
          ((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth) * 100
        )
      : 0;

  const dailyRevenueMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const date = format(subDays(now, i), "MMM dd");
    dailyRevenueMap.set(date, 0);
  }
  recentDailyRevenue.forEach((order) => {
    const date = format(new Date(order.createdAt), "MMM dd");
    if (dailyRevenueMap.has(date)) {
      dailyRevenueMap.set(
        date,
        (dailyRevenueMap.get(date) || 0) + order.totalAmount
      );
    }
  });

  const productRevenueMap = new Map<string, { revenue: number; count: number }>();
  for (const item of orderItemsForTopProducts) {
    const lineTotal = item.subtotal ?? item.price * item.quantity;
    const existing = productRevenueMap.get(item.productId) ?? {
      revenue: 0,
      count: 0,
    };
    productRevenueMap.set(item.productId, {
      revenue: existing.revenue + lineTotal,
      count: existing.count + item.quantity,
    });
  }

  const topProductIds = [...productRevenueMap.entries()]
    .map(([productId, data]) => ({
      productId,
      revenue: data.revenue,
      count: data.count,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const productDetails =
    topProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: topProductIds.map((p) => p.productId) } },
          select: { id: true, name: true, image: true },
        })
      : [];

  const topProducts = topProductIds.map((t) => ({
    ...t,
    name: productDetails.find((p) => p.id === t.productId)?.name || "Unknown",
    image: productDetails.find((p) => p.id === t.productId)?.image,
  }));

  return {
    revenue: { value: revThis, change: revenueChange },
    orders: { value: ordersThisMonth, change: ordersChange },
    customers: {
      total: totalCustomers,
      new: newCustomersThisMonth,
      change: custChange,
    },
    avgOrderValue: avgOrderValue._avg.totalAmount || 0,
    ordersByStatus: Object.fromEntries(
      ordersByStatus.map((s) => [s.status, s._count])
    ),
    topProducts,
    dailyRevenue: Array.from(dailyRevenueMap.entries()).map(([date, amount]) => ({
      date,
      amount,
    })),
  };
}

function formatChange(change: number): { label: string; positive: boolean } {
  const positive = change >= 0;
  const prefix = change > 0 ? "+" : "";
  return { label: `${prefix}${change}%`, positive };
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  const reportCards = [
    {
      title: "Sales Report",
      description: "View detailed sales data by date range",
      icon: <DollarSign className="w-6 h-6" />,
      color: "green",
      href: "/admin/analytics/sales",
    },
    {
      title: "Orders Report",
      description: "Order volume and fulfillment metrics",
      icon: <ShoppingCart className="w-6 h-6" />,
      color: "blue",
      href: "/admin/analytics/orders",
    },
    {
      title: "Customer Report",
      description: "Customer acquisition and retention",
      icon: <Users className="w-6 h-6" />,
      color: "purple",
      href: "/admin/analytics/customers",
    },
    {
      title: "Products Report",
      description: "Product performance and inventory",
      icon: <Package className="w-6 h-6" />,
      color: "orange",
      href: "/admin/analytics/products",
    },
  ];

  const revenueChange = formatChange(data.revenue.change);
  const ordersChange = formatChange(data.orders.change);
  const customersChange = formatChange(data.customers.change);

  const metrics = [
    {
      label: "Revenue (30 days)",
      value: formatCurrency(data.revenue.value),
      change: revenueChange.label,
      positive: revenueChange.positive,
    },
    {
      label: "Orders (30 days)",
      value: data.orders.value.toLocaleString(),
      change: ordersChange.label,
      positive: ordersChange.positive,
    },
    {
      label: "Customers",
      value: data.customers.total.toLocaleString(),
      change: customersChange.label,
      positive: customersChange.positive,
      subtext: `${data.customers.new} new this month`,
    },
    {
      label: "Avg. Order Value",
      value: formatCurrency(data.avgOrderValue),
      change: "All time",
      positive: true,
      hideTrend: true,
    },
  ];

  const maxDailyRevenue = Math.max(...data.dailyRevenue.map((d) => d.amount), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Analytics & Reports
          </h1>
          <p className="text-gray-500 mt-1">
            Live store performance from your database
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 rounded-lg hover:bg-green-700 text-white font-medium text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white rounded-xl p-5 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                {metric.label}
              </span>
              {!metric.hideTrend &&
                (metric.positive ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                ))}
            </div>
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            {"subtext" in metric && metric.subtext && (
              <p className="text-xs text-gray-500 mt-1">{metric.subtext}</p>
            )}
            <p
              className={`text-sm font-medium mt-1 ${
                metric.hideTrend
                  ? "text-gray-500"
                  : metric.positive
                    ? "text-green-600"
                    : "text-red-600"
              }`}
            >
              {metric.hideTrend
                ? metric.change
                : `${metric.change} vs previous 30 days`}
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            7-Day Revenue
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 uppercase text-xs tracking-wider">
                  <th className="pb-3 pr-4 font-semibold">Date</th>
                  <th className="pb-3 pr-4 font-semibold">Revenue</th>
                  <th className="pb-3 font-semibold w-1/2">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.dailyRevenue.map((day) => (
                  <tr key={day.date}>
                    <td className="py-3 pr-4 font-medium text-gray-900">
                      {day.date}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-gray-900">
                      {formatCurrency(day.amount)}
                    </td>
                    <td className="py-3">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{
                            width: `${Math.round((day.amount / maxDailyRevenue) * 100)}%`,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td className="pt-3 font-semibold text-gray-900">Total</td>
                  <td className="pt-3 font-bold text-green-700">
                    {formatCurrency(
                      data.dailyRevenue.reduce((sum, d) => sum + d.amount, 0)
                    )}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            Top Products by Revenue
          </h2>
          {data.topProducts.length === 0 ? (
            <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-gray-500 text-sm">No paid orders yet</p>
            </div>
          ) : (
            <ol className="space-y-3">
              {data.topProducts.map((product, index) => (
                <li
                  key={product.productId}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="w-12 h-12 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex-shrink-0 relative">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {product.count} units sold
                    </p>
                  </div>
                  <p className="font-bold text-gray-900 flex-shrink-0">
                    {formatCurrency(product.revenue)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Orders by Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(
            [
              "PENDING",
              "PAID",
              "PROCESSING",
              "SHIPPED",
              "DELIVERED",
              "CANCELLED",
            ] as const
          ).map((status) => (
            <div
              key={status}
              className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center"
            >
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {status}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.ordersByStatus[status] ?? 0}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Available Reports</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {reportCards.map((report) => (
            <Link
              key={report.title}
              href={report.href}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg hover:border-green-200 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl bg-${report.color}-50 text-${report.color}-600 group-hover:scale-110 transition-transform`}
                >
                  {report.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                    {report.title}
                    <ArrowUpRight className="w-4 h-4 text-gray-400" />
                  </h3>
                  <p className="text-sm text-gray-500">{report.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
