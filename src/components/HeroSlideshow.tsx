"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    image: "/uploads/hero-pure-wheat-flour.jpg",
    title: "Premium Wheat Flour",
    subtitle: "High-quality flour for every baking need — from home kitchens to commercial bakeries.",
    cta: "Shop Flour",
    href: "/products/flour",
  },
  {
    image: "/uploads/hero-sugar-cubes.jpg",
    title: "Refined Sugar",
    subtitle: "Pure, crystal-clear sugar for households and industrial use across Nigeria.",
    cta: "Shop Sugar",
    href: "/products/sugar",
  },
  {
    image: "/uploads/hero-semolina.png",
    title: "Premium Semolina",
    subtitle: "Finely milled semolina for delicious pasta, couscous, and traditional meals.",
    cta: "Explore Products",
    href: "/products/flour",
  },
  {
    image: "/uploads/hero-all-purpose.png",
    title: "All-Purpose Flour",
    subtitle: "Versatile flour perfect for bread, cakes, pastries, and everyday cooking.",
    cta: "Shop Now",
    href: "/shop",
  },
  {
    image: "/uploads/hero-baking-flour.png",
    title: "Baking Flour",
    subtitle: "Specially formulated baking flour for consistently perfect results every time.",
    cta: "Shop Baking Flour",
    href: "/shop",
  },
];

export default function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const next = useCallback(() => {
    setCurrent((p) => (p + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((p) => (p - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];

  return (
    <section className="relative h-[85vh] w-full overflow-hidden bg-primary-900 group">
      {slides.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            i === current
              ? "opacity-100 scale-100"
              : "opacity-0 scale-105"
          }`}
        >
          <Image
            src={s.image}
            alt={s.title}
            fill
            className="object-cover"
            priority={i === 0}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-r from-primary-900/85 via-primary-900/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 via-transparent to-primary-900/30" />

      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-2xl">
            {/* key={current} re-triggers the entrance animation on every slide change */}
            <motion.div
              key={current}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="inline-block bg-accent-500 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5 shadow-lg">
                Iyosi Foods — Quality You Can Trust
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-5 leading-tight drop-shadow-lg">
                {slide.title}
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed max-w-xl drop-shadow-md">
                {slide.subtitle}
              </p>
              <Link
                href={slide.href}
                className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-bold px-8 py-4 rounded-lg shadow-xl shadow-accent-500/25 transition-all hover:translate-y-[-2px] text-lg"
              >
                {slide.cta}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 hover:opacity-100 group-hover:opacity-100 focus:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/25 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 hover:opacity-100 group-hover:opacity-100 focus:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2.5 rounded-full transition-all duration-500 ${
              i === current
                ? "bg-accent-500 w-8 shadow-lg shadow-accent-500/50"
                : "bg-white/30 hover:bg-white/50 w-2.5"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
