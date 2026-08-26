"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  badgeText: string | null;
  bgColor: string | null;
  image: string | null;
};

const DEFAULT_BANNERS: Banner[] = [
  {
    id: "default-1",
    title: "Premium Baking Flour,\nNow 15% Off",
    subtitle: "Stock up your bakery with Iyosi Foods's finest grade.",
    ctaText: "SHOP NOW",
    ctaLink: "/shop",
    badgeText: "Flash Sale 24h Only",
    bgColor: "#1e3a8a",
    image: null,
  },
  {
    id: "default-2",
    title: "Bulk Orders?\nSave Up To 25%",
    subtitle: "Special prices for bakeries, restaurants and wholesalers.",
    ctaText: "ORDER IN BULK",
    ctaLink: "/shop",
    badgeText: "Best Value",
    bgColor: "#0f1f4b",
    image: null,
  },
  {
    id: "default-3",
    title: "Free Delivery\nOn Orders Above ₦25,000",
    subtitle: "Fast and reliable door-to-door delivery across Nigeria.",
    ctaText: "START SHOPPING",
    ctaLink: "/shop",
    badgeText: "Limited Time",
    bgColor: "#047857",
    image: null,
  },
];

export default function HeroBanner() {
  const [banners, setBanners] = useState<Banner[]>(DEFAULT_BANNERS);
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    fetch("/api/admin/banners")
      .then((r) => r.json())
      .then((data) => {
        if (data.banners && data.banners.length > 0) {
          setBanners(data.banners);
        }
      })
      .catch(() => {});
  }, []);

  const next = useCallback(() => {
    setCurrent((p) => (p + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((p) => (p - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Auto-rotate
  useEffect(() => {
    if (isHovered || banners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, isHovered, banners.length]);

  const banner = banners[current];

  return (
    <div
      className="relative w-full h-full min-h-[280px] md:min-h-[360px] rounded-lg overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slide */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{ backgroundColor: banner?.bgColor || "#1e3a8a" }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <circle cx="350" cy="350" r="200" fill="white" opacity="0.1" />
            <circle cx="50" cy="50" r="100" fill="white" opacity="0.05" />
          </svg>
        </div>

        <div className="relative h-full flex items-center px-6 md:px-10 z-10">
          <div className="text-white space-y-3 max-w-lg">
            {banner?.badgeText && (
              <span className="inline-block bg-yellow-400 text-yellow-900 text-[10px] md:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                {banner.badgeText}
              </span>
            )}
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-extrabold leading-tight whitespace-pre-line">
              {banner?.title}
            </h2>
            {banner?.subtitle && (
              <p className="text-white/80 font-medium text-sm md:text-lg max-w-md">
                {banner.subtitle}
              </p>
            )}
            {banner?.ctaText && banner.ctaLink && (
              <Link
                href={banner.ctaLink}
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 md:py-3 rounded-lg font-bold text-sm md:text-base mt-2 transition-colors shadow-lg"
              >
                {banner.ctaText}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "bg-orange-400 w-6"
                  : "bg-white/40 hover:bg-white/60 w-2"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
