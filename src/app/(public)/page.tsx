import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import HeroSlideshow from "@/components/HeroSlideshow";
import ScrollReveal, {
  StaggerContainer,
  StaggerItem,
  CountUp,
} from "@/components/ui/ScrollReveal";

export const metadata: Metadata = {
  title: "Iyosi Foods | Premium Food Products in Nigeria",
  description:
    "Iyosi Foods is a premier Nigerian food company delivering high-quality flour, sugar, rice, edible oils, and tomato paste. Shop online for the best food products delivered across Nigeria.",
  keywords: [
    "Iyosi Foods",
    "flour Nigeria",
    "baking flour",
    "semolina",
    "sugar Nigeria",
    "rice Nigeria",
    "edible oils",
    "tomato paste",
    "food company Nigeria",
    "buy food online Nigeria",
  ],
  openGraph: {
    title: "Iyosi Foods | Premium Food Products in Nigeria",
    description:
      "Premium flour, sugar, rice, edible oils, and tomato paste. Quality food products delivered across Nigeria.",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Iyosi Foods" }],
  },
};

const productCategories = [
  {
    title: "Sugar",
    description: "Premium refined sugar products for households and industrial use.",
    image: "/uploads/hero-sugar-cubes.jpg",
    href: "/products/sugar",
  },
  {
    title: "Flour",
    description: "High-quality wheat flour, semolina, and baking flour for every need.",
    image: "/uploads/hero-wheat-flour.png",
    href: "/products/flour",
  },
  {
    title: "Rice",
    description: "Locally sourced premium rice, processed to perfection.",
    image: "/uploads/hero-pure-wheat-flour.jpg",
    href: "/products/rice",
  },
  {
    title: "Edible Oils",
    description: "Pure and refined cooking oils for healthy households.",
    image: "/uploads/hero-pure-cane-sugar.jpg",
    href: "/products/oil",
  },
  {
    title: "Tomato Paste",
    description: "Rich, flavourful tomato products for delicious meals.",
    image: "/uploads/hero-all-purpose.png",
    href: "/products/tomato-paste",
  },
  {
    title: "Poultry & Agro",
    description: "Poultry feeds and agro-allied products for farmers.",
    image: "/uploads/hero-semolina.png",
    href: "/products/poultry",
  },
];

const stats: { value: number | string; suffix?: string; label: string }[] = [
  { value: 5, suffix: "+", label: "Years of Excellence" },
  { value: 6, suffix: "", label: "Product Categories" },
  { value: 50, suffix: "+", label: "Dedicated Employees" },
  { value: "Nationwide", label: "Operational Reach" },
];

const highlights = [
  {
    title: "Quality Assured",
    description:
      "All our products meet rigorous quality standards from production to delivery.",
    iconPath:
      "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
  },
  {
    title: "Fast Delivery",
    description:
      "Reliable nationwide delivery so your orders arrive fresh and on time.",
    iconPath:
      "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12",
  },
  {
    title: "Best Prices",
    description:
      "Competitive pricing on all products with special discounts for bulk orders.",
    iconPath:
      "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSlideshow />

      {/* ── STATS BAR ─────────────────────────────────────────────────── */}
      <section className="bg-white py-16 border-b border-surface-200">
        <div className="container mx-auto px-4 md:px-8">
          <StaggerContainer
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:divide-x md:divide-surface-100"
            staggerDelay={0.12}
          >
            {stats.map((stat) => (
              <StaggerItem key={stat.label} direction="up">
                <div className="text-4xl md:text-5xl font-extrabold text-primary-600 mb-2">
                  {typeof stat.value === "number" ? (
                    <CountUp end={stat.value} suffix={stat.suffix ?? ""} />
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="text-surface-600 font-medium uppercase tracking-wider text-sm">
                  {stat.label}
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── PRODUCTS GRID ─────────────────────────────────────────────── */}
      <section className="py-20 px-4 md:px-8 bg-surface-50">
        <div className="container mx-auto">
          <ScrollReveal direction="up" className="text-center mb-14">
            <h2 className="text-lg font-bold text-accent-600 uppercase tracking-widest mb-3">Our Products</h2>
            <h3 className="text-4xl md:text-5xl font-extrabold text-primary-900 leading-tight mb-4">
              Premium Food Categories
            </h3>
            <p className="text-surface-600 text-lg max-w-2xl mx-auto">
              From flour to edible oils, we deliver high-quality food products that nourish families across Nigeria.
            </p>
          </ScrollReveal>

          <StaggerContainer
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            staggerDelay={0.09}
          >
            {productCategories.map((cat) => (
              <StaggerItem key={cat.title} direction="up">
                <Link
                  href={cat.href}
                  className="group relative rounded-2xl overflow-hidden shadow-lg bg-white border border-surface-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 block h-full"
                >
                  <div className="h-56 relative overflow-hidden">
                    <Image
                      src={cat.image}
                      alt={cat.title}
                      fill
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 via-primary-900/20 to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5">
                      <h3 className="text-white font-bold text-2xl drop-shadow-lg">{cat.title}</h3>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-surface-600 leading-relaxed">{cat.description}</p>
                    <span className="inline-flex items-center gap-1 text-primary-600 font-semibold text-sm mt-3 group-hover:gap-2 transition-all">
                      Learn more <span>&rarr;</span>
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────── */}
      <ScrollReveal direction="up" delay={0.05}>
        <section className="bg-primary-900 text-white py-20 px-4 md:px-8">
          <div className="container mx-auto text-center max-w-4xl">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
              Committed to Quality &<br />
              <span className="text-accent-400">Nourishing West Africa</span>
            </h2>
            <p className="text-lg text-surface-300 mb-10 leading-relaxed max-w-2xl mx-auto">
              At Iyosi Foods, we are passionate about delivering high-quality food products that meet the highest standards.
              From our milling facilities to tables across West Africa, quality is our promise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-bold px-8 py-4 rounded-lg shadow-xl transition-all hover:translate-y-[-2px]"
              >
                Shop Online <span>&rarr;</span>
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 bg-transparent border-2 border-white/30 hover:border-white text-white font-bold px-8 py-4 rounded-lg transition-all"
              >
                Learn Our Story
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* ── HIGHLIGHTS ────────────────────────────────────────────────── */}
      <section className="bg-white py-20 px-4 md:px-8">
        <div className="container mx-auto">
          <StaggerContainer
            className="grid grid-cols-1 md:grid-cols-3 gap-10"
            staggerDelay={0.12}
          >
            {highlights.map((item) => (
              <StaggerItem key={item.title} direction="up">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-primary-900 mb-2">{item.title}</h3>
                  <p className="text-surface-600 leading-relaxed">{item.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
      <ScrollReveal direction="up">
        <section className="bg-surface-100 py-20 px-4 md:px-8 border-t border-surface-200">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary-900 mb-6">
              Ready to Experience Quality?
            </h2>
            <p className="text-lg text-surface-600 mb-8 leading-relaxed max-w-2xl mx-auto">
              Browse our online store and discover premium food products delivered straight to your doorstep.
            </p>
            <Link
              href="/shop"
              className="inline-block bg-primary-900 hover:bg-primary-800 text-white font-bold py-4 px-12 rounded-lg shadow-lg transition-all hover:-translate-y-1 text-lg"
            >
              Start Shopping
            </Link>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
