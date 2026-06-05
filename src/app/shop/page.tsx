import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import ProductCard from "@/components/shop/ProductCard";
import HeroBanner from "@/components/shop/HeroBanner";
import FlashSale from "@/components/shop/FlashSale";

export const dynamic = "force-dynamic";
import CategoryStrip from "@/components/shop/CategoryStrip";
import PromoBanners from "@/components/shop/PromoBanners";
import Link from "next/link";
import { ChevronRight, Flame, Percent, TrendingUp, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Shop Premium Flour Online | Iyosiola Foods",
  description:
    "Shop premium quality flour, semolina, wheat products, and baking essentials from Iyosiola Foods. Fresh products delivered to your doorstep across Nigeria.",
  keywords: [
    "buy flour online Nigeria",
    "premium flour",
    "baking flour Nigeria",
    "semolina online",
    "wheat flour",
    "buy flour online",
    "baking essentials Nigeria",
  ],
  openGraph: {
    title: "Shop Premium Flour Online | Iyosiola Foods",
    description: "Shop premium quality flour, semolina, and baking essentials. Fresh products delivered across Nigeria.",
    type: "website",
    images: [{ url: "/og-shop.jpg", width: 1200, height: 630, alt: "Iyosiola Foods Shop" }],
  },
};

export default async function ShopHomePage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; q?: string }>
}) {
  const params = searchParams ? await searchParams : {};
  const rawCategory = (params?.category || "").toUpperCase();

  const CATEGORY_ALIAS: Record<string, string> = {
    "FLOUR": "BAKING",
    "BAKING": "BAKING",
    "WHEAT": "WHEAT",
    "ALL_PURPOSE": "ALL_PURPOSE",
    "ALL-PURPOSE": "ALL_PURPOSE",
    "SEMOLINA": "SEMOLINA",
    "SUGAR": "SUGAR",
    "OIL": "OIL",
    "RICE": "RICE",
    "TOMATO_PASTE": "TOMATO_PASTE",
    "TOMATO-PASTE": "TOMATO_PASTE",
  };
  const activeCategory = CATEGORY_ALIAS[rawCategory] || null;
  const categoryFilter = activeCategory
    ? { category: activeCategory as "BAKING" | "WHEAT" | "ALL_PURPOSE" | "SEMOLINA" | "SUGAR" | "OIL" | "RICE" | "TOMATO_PASTE" }
    : {};

  const [flashProducts, topProducts, recommendedProducts] = await Promise.all([
    prisma.product.findMany({
      where: { stock: { gt: 0 }, isActive: true, ...categoryFilter },
      take: 8,
      orderBy: { createdAt: "asc" },
    }).catch(() => [] as Awaited<ReturnType<typeof prisma.product.findMany>>),
    prisma.product.findMany({
      where: { stock: { gt: 0 }, isActive: true, ...categoryFilter },
      take: 12,
      orderBy: { createdAt: "desc" },
    }).catch(() => [] as Awaited<ReturnType<typeof prisma.product.findMany>>),
    prisma.product.findMany({
      where: { isActive: true, ...categoryFilter },
      orderBy: { updatedAt: "desc" },
      take: 18,
    }).catch(() => [] as Awaited<ReturnType<typeof prisma.product.findMany>>),
  ]);

  const categories = [
    { name: "All Products", icon: "🛒", link: "/shop" },
    { name: "Baking Flour", icon: "🧁", link: "/shop?category=BAKING" },
    { name: "Wheat Flour", icon: "🌾", link: "/shop?category=WHEAT" },
    { name: "All-Purpose", icon: "🍞", link: "/shop?category=ALL_PURPOSE" },
    { name: "Semolina", icon: "🥣", link: "/shop?category=SEMOLINA" },
    { name: "Sugar", icon: "🍬", link: "/shop?category=SUGAR" },
    { name: "Cooking Oil", icon: "🫙", link: "/shop?category=OIL" },
    { name: "Rice", icon: "🍚", link: "/shop?category=RICE" },
    { name: "Tomato Paste", icon: "🍅", link: "/shop?category=TOMATO_PASTE" },
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-3 md:px-4 py-4 space-y-4">

        {/* ═══ ROW 1: Category Sidebar + Hero Carousel + Side Promos ═══ */}
        <div className="flex gap-3 h-auto md:h-[380px]">
          {/* Category Sidebar - Desktop Only */}
          <div className="hidden md:flex flex-col w-56 bg-white rounded-lg shadow-sm border border-gray-100 shrink-0 overflow-hidden">
            <div className="bg-gray-900 text-white px-4 py-3 font-bold text-sm flex items-center gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              Categories
            </div>
            <nav className="flex-1 overflow-y-auto py-1">
              {categories.map((cat, index) => (
                <Link
                  key={index}
                  href={cat.link}
                  className={`px-4 py-2.5 hover:bg-orange-50 flex items-center justify-between transition-colors text-sm border-b border-gray-50 last:border-0 ${
                    (cat.link === "/shop" && !activeCategory) ||
                    (activeCategory && cat.link.includes(activeCategory))
                      ? "bg-orange-50 text-orange-600 font-semibold"
                      : "text-gray-700 hover:text-orange-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </Link>
              ))}
            </nav>
          </div>

          {/* Hero Banner Carousel */}
          <div className="flex-1 min-w-0">
            <HeroBanner />
          </div>

          {/* Side Promo Cards - Large Desktop Only */}
          <div className="hidden xl:flex flex-col w-52 gap-3 shrink-0">
            <Link
              href="/shop?category=BAKING"
              className="flex-1 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-4 flex flex-col justify-center items-center text-center text-white hover:shadow-lg transition-shadow group"
            >
              <div className="bg-white/20 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                <Flame className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-sm">Hot Deals</h4>
              <p className="text-[11px] text-white/80 mt-1">Daily discounts on staples</p>
            </Link>
            <Link
              href="/shop"
              className="flex-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-4 flex flex-col justify-center items-center text-center text-white hover:shadow-lg transition-shadow group"
            >
              <div className="bg-white/20 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                <Percent className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-sm">Bulk Orders</h4>
              <p className="text-[11px] text-white/80 mt-1">Save up to 25%</p>
            </Link>
          </div>
        </div>

        {/* ═══ ROW 2: Category Icon Strip (Mobile + Desktop) ═══ */}
        <CategoryStrip />

        {/* Active Category Indicator */}
        {activeCategory && (
          <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 text-sm text-gray-600 border border-gray-100">
            Filtering: <strong className="text-gray-900">{activeCategory.replace("_", " ")}</strong>
            <a href="/shop" className="ml-auto text-orange-500 hover:underline text-xs">Clear ✕</a>
          </div>
        )}

        {/* ═══ ROW 3: Flash Sale Section ═══ */}
        <FlashSale products={flashProducts} />

        {/* ═══ ROW 4: Promotional Banners ═══ */}
        <PromoBanners />

        {/* ═══ ROW 5: Top Selling Items ═══ */}
        {topProducts.length > 0 && (
          <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                Top Selling Items
              </h3>
              <Link href="/shop" className="text-orange-500 text-sm hover:underline font-medium flex items-center gap-1">
                SEE ALL <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-3 md:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
                {topProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══ ROW 6: Recommended For You ═══ */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              Recommended For You
            </h3>
            <Link href="/shop" className="text-orange-500 text-sm hover:underline font-medium flex items-center gap-1">
              SEE ALL <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-3 md:p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
              {recommendedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Trust Badges Footer ═══ */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: "🚚", title: "Fast Delivery", desc: "1-5 business days" },
              { icon: "✅", title: "100% Genuine", desc: "Authentic products" },
              { icon: "↩️", title: "Easy Returns", desc: "7-day return policy" },
              { icon: "🔒", title: "Secure Payment", desc: "SSL encrypted checkout" },
            ].map((badge, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <span className="text-3xl">{badge.icon}</span>
                <div>
                  <p className="font-bold text-sm text-gray-900">{badge.title}</p>
                  <p className="text-xs text-gray-500">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
