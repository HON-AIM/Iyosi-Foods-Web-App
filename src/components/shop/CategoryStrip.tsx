"use client"

import Link from "next/link"
import {
  ShoppingBag,
  Wheat,
  Coffee,
  Layers,
  Package,
  Sparkles,
  LayoutGrid,
  FlameKindling,
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

const CATEGORIES = [
  {
    name: "All Products",
    icon: LayoutGrid,
    link: "/shop",
    color: "from-gray-100 to-gray-200 text-gray-600",
    activeColor: "from-green-500 to-green-600 text-white",
    param: "",
  },
  {
    name: "Baking Flour",
    icon: FlameKindling,
    link: "/shop?category=BAKING",
    color: "from-orange-50 to-orange-100 text-orange-600",
    activeColor: "from-orange-500 to-orange-600 text-white",
    param: "BAKING",
  },
  {
    name: "Wheat Flour",
    icon: Wheat,
    link: "/shop?category=WHEAT",
    color: "from-yellow-50 to-amber-100 text-amber-600",
    activeColor: "from-amber-500 to-amber-600 text-white",
    param: "WHEAT",
  },
  {
    name: "All-Purpose",
    icon: Layers,
    link: "/shop?category=ALL_PURPOSE",
    color: "from-blue-50 to-blue-100 text-blue-600",
    activeColor: "from-blue-500 to-blue-600 text-white",
    param: "ALL_PURPOSE",
  },
  {
    name: "Semolina",
    icon: Coffee,
    link: "/shop?category=SEMOLINA",
    color: "from-purple-50 to-purple-100 text-purple-600",
    activeColor: "from-purple-500 to-purple-600 text-white",
    param: "SEMOLINA",
  },
  {
    name: "Bulk Orders",
    icon: Package,
    link: "/shop?category=BAKING&bulk=true",
    color: "from-green-50 to-emerald-100 text-emerald-600",
    activeColor: "from-emerald-500 to-emerald-600 text-white",
    param: "",
  },
  {
    name: "New Arrivals",
    icon: Sparkles,
    link: "/shop?sort=newest",
    color: "from-pink-50 to-rose-100 text-rose-500",
    activeColor: "from-rose-500 to-pink-500 text-white",
    param: "",
  },
]

function CategoryStripInner() {
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get("category") || ""

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const isActive = cat.param ? activeCategory === cat.param : !activeCategory && cat.param === ""

          return (
            <Link
              key={cat.name}
              href={cat.link}
              className="flex flex-col items-center gap-2 min-w-[72px] group flex-shrink-0"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center
                transition-all duration-200 group-hover:scale-110 group-hover:shadow-md
                ${isActive ? cat.activeColor : cat.color}`}
              >
                <Icon className="w-6 h-6" strokeWidth={1.8} />
              </div>
              <span className={`text-[11px] font-semibold text-center leading-tight whitespace-nowrap transition-colors
                ${isActive ? "text-green-700" : "text-gray-600 group-hover:text-green-600"}`}>
                {cat.name}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default function CategoryStrip() {
  return (
    <Suspense fallback={
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[72px]">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 animate-pulse" />
              <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    }>
      <CategoryStripInner />
    </Suspense>
  )
}
