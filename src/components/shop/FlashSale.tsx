"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import ProductRevealCard from "@/components/shop/ProductRevealCard";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string | null;
  description: string;
  category: string;
  avgRating?: number;
  reviewCount?: number;
};

export default function FlashSale({ products }: { products: Product[] }) {
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        const flashEnd = data.flashSaleEndTime || data.settings?.flashSaleEndTime;
        if (flashEnd) {
          const end = new Date(flashEnd);
          if (end > new Date()) {
            setEndTime(end);
          } else {
            setIsExpired(true);
          }
        } else {
          // Default: end of today
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          setEndTime(today);
        }
      })
      .catch(() => {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        setEndTime(today);
      });
  }, []);

  useEffect(() => {
    if (!endTime) return;
    const tick = () => {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();
      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  if (products.length === 0) {
    return (
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-orange-500 px-4 py-3 flex items-center gap-3">
          <Zap className="h-5 w-5 text-yellow-300 fill-yellow-300 flex-shrink-0" />
          <h3 className="font-bold text-lg text-white">Flash Sale</h3>
          <span className="ml-auto text-white/70 text-xs">Coming soon</span>
        </div>
        <div className="p-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-3">
            <Zap className="w-8 h-8 text-orange-400" strokeWidth={1.5} />
          </div>
          <p className="font-semibold text-gray-700">Flash Sale Coming Soon</p>
          <p className="text-sm text-gray-400 mt-1 max-w-xs">
            Check back regularly for limited-time deals on our premium products.
          </p>
        </div>
      </section>
    )
  }

  if (isExpired) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-500 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-yellow-300 fill-yellow-300" />
          <h3 className="font-bold text-lg text-white">Flash Sale</h3>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-white/80 text-xs font-medium mr-1">Time Left:</span>
          {[
            { val: pad(timeLeft.hours), label: "H" },
            { val: pad(timeLeft.minutes), label: "M" },
            { val: pad(timeLeft.seconds), label: "S" },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="bg-white text-red-600 font-bold text-sm px-2 py-1 rounded min-w-[32px] text-center tabular-nums">
                {t.val}
              </span>
              {i < 2 && <span className="text-white font-bold">:</span>}
            </div>
          ))}
        </div>

        <Link href="/shop" className="text-white text-sm font-medium hover:underline hidden sm:block">
          SEE ALL &gt;
        </Link>
      </div>

      {/* Products - Horizontal Scroll */}
      <div className="p-3 md:p-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {products.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-[160px] md:w-[180px]">
              <ProductRevealCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
