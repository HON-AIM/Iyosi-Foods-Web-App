import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, TrendingUp, Sparkles, Wheat, FlameKindling, Layers, Coffee, Package, LayoutGrid, Tag, PackageOpen, Truck, ShieldCheck, RefreshCw, Lock } from "lucide-react";
import { prisma } from "@/lib/db";
import ProductRevealCard from "@/components/shop/ProductRevealCard";
import HeroBanner from "@/components/shop/HeroBanner";
import FlashSale from "@/components/shop/FlashSale";
import CategoryStrip from "@/components/shop/CategoryStrip";
import PromoBanners from "@/components/shop/PromoBanners";
import EmptyProductGrid from "@/components/shop/EmptyProductGrid";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/ScrollReveal";
import { getCached, CACHE_KEYS } from "@/lib/cache";

export const dynamic = "force-dynamic";

type ProductWithRating = {
  id: string
  name: string
  price: number
  stock: number
  image: string | null
  description: string
  category: string
  avgRating: number
  reviewCount: number
}

async function enrichWithRatings(
  products: { id: string; name: string; price: number; stock: number; image: string | null; description: string; category: string }[]
): Promise<ProductWithRating[]> {
  if (products.length === 0) return []

  const productIds = products.map(p => p.id)

  const ratings = await prisma.review.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds } },
    _avg: { rating: true },
    _count: { rating: true },
  })

  const ratingMap = new Map(ratings.map(r => [
    r.productId,
    { avgRating: r._avg.rating ?? 0, reviewCount: r._count.rating }
  ]))

  return products.map(p => ({
    ...p,
    avgRating: Math.round((ratingMap.get(p.id)?.avgRating ?? 0) * 10) / 10,
    reviewCount: ratingMap.get(p.id)?.reviewCount ?? 0,
  }))
}

export const metadata: Metadata = {
  title: "Shop Premium Flour Online | Iyosi Foods LTD",
  description:
    "Shop premium quality flour, semolina, wheat products, and baking essentials from Iyosi Foods LTD. Fresh products delivered to your doorstep across Nigeria.",
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
    title: "Shop Premium Flour Online | Iyosi Foods LTD",
    description: "Shop premium quality flour, semolina, and baking essentials. Fresh products delivered across Nigeria.",
    type: "website",
    images: [{ url: "/og-shop.jpg", width: 1200, height: 630, alt: "Iyosi Foods LTD Shop" }],
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

  // Cached: product listings are read thousands of times per minute but change
  // rarely. Redis serves repeat requests in <1ms; admin writes invalidate keys.
  const [flashProducts, topProducts, recommendedProducts] = await Promise.all([
    getCached(
      CACHE_KEYS.flashSaleProducts(),
      async () =>
        enrichWithRatings(
          await prisma.product
            .findMany({
              where: { isActive: true, isFlashSale: true, stock: { gt: 0 }, ...categoryFilter },
              take: 12,
              orderBy: { updatedAt: "desc" },
            })
            .catch(() => [] as Awaited<ReturnType<typeof prisma.product.findMany>>)
        ),
      { ttl: 60 }, // Flash sale changes fast — cache 1 minute only
    ),
    getCached(
      CACHE_KEYS.products(activeCategory || "all"),
      async () =>
        enrichWithRatings(
          await prisma.product
            .findMany({
              where: { isActive: true, stock: { gt: 0 }, ...categoryFilter },
              take: 12,
              orderBy: { createdAt: "desc" },
            })
            .catch(() => [] as Awaited<ReturnType<typeof prisma.product.findMany>>)
        ),
      { ttl: 300 },
    ),
    getCached(
      CACHE_KEYS.recommended(activeCategory || "all"),
      async () =>
        enrichWithRatings(
          await prisma.product
            .findMany({
              where: { isActive: true, ...categoryFilter },
              orderBy: { updatedAt: "desc" },
              take: 18,
            })
            .catch(() => [] as Awaited<ReturnType<typeof prisma.product.findMany>>)
        ),
      { ttl: 300 },
    ),
  ]);

  const categories = [
    { name: "All Products",  icon: <LayoutGrid className="h-4 w-4" />,     link: "/shop" },
    { name: "Baking Flour",  icon: <FlameKindling className="h-4 w-4" />,  link: "/shop?category=BAKING" },
    { name: "Wheat Flour",   icon: <Wheat className="h-4 w-4" />,          link: "/shop?category=WHEAT" },
    { name: "All-Purpose",   icon: <Layers className="h-4 w-4" />,         link: "/shop?category=ALL_PURPOSE" },
    { name: "Semolina",      icon: <Coffee className="h-4 w-4" />,         link: "/shop?category=SEMOLINA" },
    { name: "Bulk Orders",   icon: <Package className="h-4 w-4" />,        link: "/shop?category=BAKING&bulk=true" },
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-3 md:px-4 py-4 space-y-4">

        {/* ═══ ROW 1: Category Sidebar + Hero Carousel + Side Promos ═══ */}
        <div className="flex gap-3 h-auto md:h-[380px]">
          {/* Category Sidebar - Desktop Only */}
          <div className="hidden md:flex flex-col w-56 bg-white rounded-xl shadow-sm border border-gray-100 shrink-0 overflow-hidden">
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
                  className={`px-4 py-2.5 hover:bg-green-50 flex items-center justify-between transition-colors text-sm border-b border-gray-50 last:border-0 ${
                    (cat.link === "/shop" && !activeCategory) ||
                    (activeCategory && cat.link.includes(activeCategory))
                      ? "bg-green-50 text-green-700 font-semibold"
                      : "text-gray-700 hover:text-green-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-green-600">{cat.icon}</span>
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
              className="flex-1 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-4 flex flex-col justify-center items-center text-center text-white hover:shadow-xl transition-all group"
            >
              <div className="bg-white/20 p-3 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
                <Tag className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <h4 className="font-bold text-sm">Hot Deals</h4>
              <p className="text-[11px] text-white/80 mt-1">Daily discounts on staples</p>
              <span className="mt-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Shop Now →</span>
            </Link>
            <Link
              href="/shop"
              className="flex-1 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-4 flex flex-col justify-center items-center text-center text-white hover:shadow-xl transition-all group"
            >
              <div className="bg-white/20 p-3 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
                <PackageOpen className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <h4 className="font-bold text-sm">Bulk Orders</h4>
              <p className="text-[11px] text-white/80 mt-1">Save up to 25%</p>
              <span className="mt-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Order Now →</span>
            </Link>
          </div>
        </div>

        {/* ═══ ROW 2: Category Icon Strip (Mobile + Desktop) ═══ */}
        <CategoryStrip />

        {/* Active Category Indicator */}
        {activeCategory && (
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 text-sm text-gray-600 border border-gray-100">
            Filtering: <strong className="text-gray-900">{activeCategory.replace("_", " ")}</strong>
            <a href="/shop" className="ml-auto text-green-600 hover:underline text-xs">Clear ✕</a>
          </div>
        )}

        {/* ═══ ROW 3: Flash Sale Section ═══ */}
        <FlashSale products={flashProducts} />

        {/* ═══ ROW 4: Promotional Banners ═══ */}
        <PromoBanners />

        {/* ═══ Shop by Category Cards ═══ */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-900">Shop by Category</h3>
            <Link href="/shop" className="text-green-600 text-sm hover:underline font-medium">
              View All
            </Link>
          </div>
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3" staggerDelay={0.07}>
            {[
              {
                name: "Baking Flour",
                desc: "For bread, cakes & pastries",
                link: "/shop?category=BAKING",
                icon: <FlameKindling className="w-8 h-8" strokeWidth={1.5} />,
                gradient: "from-orange-400 to-red-500",
                bg: "bg-orange-50",
                text: "text-orange-600",
              },
              {
                name: "Wheat Flour",
                desc: "Whole grain goodness",
                link: "/shop?category=WHEAT",
                icon: <Wheat className="w-8 h-8" strokeWidth={1.5} />,
                gradient: "from-amber-400 to-yellow-500",
                bg: "bg-amber-50",
                text: "text-amber-600",
              },
              {
                name: "All-Purpose",
                desc: "Versatile everyday flour",
                link: "/shop?category=ALL_PURPOSE",
                icon: <Layers className="w-8 h-8" strokeWidth={1.5} />,
                gradient: "from-blue-500 to-indigo-600",
                bg: "bg-blue-50",
                text: "text-blue-600",
              },
              {
                name: "Semolina",
                desc: "For tuwo, couscous & pasta",
                link: "/shop?category=SEMOLINA",
                icon: <Coffee className="w-8 h-8" strokeWidth={1.5} />,
                gradient: "from-purple-500 to-violet-600",
                bg: "bg-purple-50",
                text: "text-purple-600",
              },
            ].map((cat) => (
              <StaggerItem key={cat.name} direction="up">
                <Link
                  href={cat.link}
                  className="group relative overflow-hidden rounded-xl border border-gray-100 hover:border-transparent hover:shadow-lg transition-all duration-300 block h-full"
                >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative p-4 md:p-5 flex flex-col gap-3">
                  <div className={`w-14 h-14 ${cat.bg} group-hover:bg-white/20 rounded-2xl flex items-center justify-center transition-colors`}>
                    <span className={`${cat.text} group-hover:text-white transition-colors`}>{cat.icon}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 group-hover:text-white text-sm transition-colors">{cat.name}</p>
                    <p className="text-xs text-gray-400 group-hover:text-white/80 mt-0.5 transition-colors">{cat.desc}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-green-600 group-hover:text-white transition-colors">
                    Shop now
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* ═══ ROW 5: Top Selling Items ═══ */}
        <ScrollReveal direction="up">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-700" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900">Top Selling Items</h3>
                <p className="text-xs text-gray-400">Most popular with our customers</p>
              </div>
            </div>
            <Link href="/shop" className="text-green-600 text-sm hover:underline font-medium flex items-center gap-1">
              SEE ALL <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-3 md:p-4">
            {topProducts.length > 0 ? (
              <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3" staggerDelay={0.05}>
                {topProducts.map((product) => (
                  <StaggerItem key={product.id} direction="up">
                    <ProductRevealCard product={product} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            ) : (
              <EmptyProductGrid
                message="Products coming soon"
                hint="We are restocking our shelves. New products will appear here shortly."
                showShopAllLink={false}
              />
            )}
          </div>
        </section>
        </ScrollReveal>

        {/* ═══ ROW 6: Recommended For You ═══ */}
        <ScrollReveal direction="up">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-purple-700" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900">Recommended For You</h3>
                <p className="text-xs text-gray-400">Chosen based on what&apos;s trending</p>
              </div>
            </div>
            <Link href="/shop" className="text-green-600 text-sm hover:underline font-medium flex items-center gap-1">
              SEE ALL <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-3 md:p-4">
            {recommendedProducts.length > 0 ? (
              <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3" staggerDelay={0.05}>
                {recommendedProducts.map((product) => (
                  <StaggerItem key={product.id} direction="up">
                    <ProductRevealCard product={product} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            ) : (
              <EmptyProductGrid
                message="No recommendations yet"
                hint="Start shopping and we will recommend products tailored to your taste."
              />
            )}
          </div>
        </section>
        </ScrollReveal>

        {/* ═══ Brand Stats Bar ═══ */}
        <ScrollReveal direction="up">
        <div className="bg-gradient-to-r from-green-700 to-green-800 rounded-xl p-5 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center text-white">
            {[
              { value: "5,000+", label: "Happy Customers" },
              { value: "15+", label: "Years Experience" },
              { value: "99.8%", label: "Quality Rate" },
              { value: "24/7", label: "Customer Support" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-2xl md:text-3xl font-extrabold text-yellow-300">{stat.value}</span>
                <span className="text-xs md:text-sm text-white/80 font-medium mt-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
        </ScrollReveal>

        {/* ═══ Trust Badges Footer ═══ */}
        <ScrollReveal direction="up">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                icon: <Truck className="w-7 h-7 text-green-600" strokeWidth={1.5} />,
                bg: "bg-green-50",
                title: "Fast Delivery",
                desc: "1–5 business days",
              },
              {
                icon: <ShieldCheck className="w-7 h-7 text-blue-600" strokeWidth={1.5} />,
                bg: "bg-blue-50",
                title: "100% Genuine",
                desc: "Authentic products",
              },
              {
                icon: <RefreshCw className="w-7 h-7 text-orange-600" strokeWidth={1.5} />,
                bg: "bg-orange-50",
                title: "Easy Returns",
                desc: "7-day return policy",
              },
              {
                icon: <Lock className="w-7 h-7 text-purple-600" strokeWidth={1.5} />,
                bg: "bg-purple-50",
                title: "Secure Payment",
                desc: "SSL encrypted",
              },
            ].map((badge, i) => (
              <div key={i} className="flex flex-col items-center gap-3 text-center">
                <div className={`w-14 h-14 ${badge.bg} rounded-2xl flex items-center justify-center`}>
                  {badge.icon}
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">{badge.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        </ScrollReveal>

      </div>
    </div>
  );
}
