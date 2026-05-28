"use client";

import Link from "next/link";

const CATEGORIES = [
  { name: "All Products", icon: "🛒", link: "/shop" },
  { name: "Baking Flour", icon: "🧁", link: "/shop?category=BAKING" },
  { name: "Wheat Flour", icon: "🌾", link: "/shop?category=WHEAT" },
  { name: "All-Purpose", icon: "🍞", link: "/shop?category=ALL_PURPOSE" },
  { name: "Semolina", icon: "🥣", link: "/shop?category=SEMOLINA" },
];

export default function CategoryStrip() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-thin">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.name}
            href={cat.link}
            className="flex flex-col items-center gap-2 min-w-[72px] group"
          >
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-100 group-hover:border-orange-300 group-hover:shadow-md flex items-center justify-center text-2xl transition-all duration-200 group-hover:scale-110">
              {cat.icon}
            </div>
            <span className="text-[11px] md:text-xs text-gray-600 group-hover:text-orange-600 font-medium text-center whitespace-nowrap transition-colors">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
