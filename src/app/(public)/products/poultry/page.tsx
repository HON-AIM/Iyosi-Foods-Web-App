import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Poultry & Agro-Allied Products | Iyosiola Group",
  description: "Premium poultry feeds, agricultural products, and farming solutions. Complete agro-allied services.",
};

export default function PoultryPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Poultry & Agro-Allied</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Comprehensive agricultural solutions for Nigerian farmers
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">Agro-Allied Operations</h2>
          <p className="text-lg text-surface-700 leading-relaxed mb-6">
            Iyosiola Group&apos;s Agro-Allied division provides comprehensive agricultural solutions to farmers 
            across Nigeria. We are committed to supporting Nigeria&apos;s agricultural sector through the 
            provision of high-quality feeds, inputs, and technical support.
          </p>
          <p className="text-lg text-surface-700 leading-relaxed mb-8">
            Our operations span the entire agricultural value chain, from input supply to product 
            offtake, ensuring that Nigerian farmers have access to everything they need for 
            successful farming operations.
          </p>
        </div>
      </section>

      <section className="bg-primary-50 py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6 text-center">Our Products & Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: "Poultry Feeds",
                desc: "High-quality balanced feed for broilers, layers, and growers. Formulated for optimal growth and egg production.",
                icon: "🐔",
              },
              {
                title: "Animal Feeds",
                desc: "Complete feed solutions for cattle, goats, sheep, and fish. Scientifically formulated for maximum nutrition.",
                icon: "🐄",
              },
              {
                title: "Fertilizers",
                desc: "Organic and inorganic fertilizers for crop production. Supporting soil health and crop yields.",
                icon: "🌱",
              },
              {
                title: "Seeds & Seedlings",
                desc: "Quality seeds for various crops including maize, rice, wheat, and vegetables.",
                icon: "🌾",
              },
              {
                title: "Crop Protection",
                desc: "Herbicides, pesticides, and fungicides for effective pest and disease management.",
                icon: "🛡️",
              },
              {
                title: "Farm Equipment",
                desc: "Access to modern farming equipment and machinery for efficient farm operations.",
                icon: "🚜",
              },
              {
                title: "Technical Support",
                desc: "Expert guidance on modern farming techniques, best practices, and disease management.",
                icon: "📊",
              },
              {
                title: "Out-Grower Scheme",
                desc: "Partnership programs linking farmers to markets with guaranteed offtake.",
                icon: "🤝",
              },
            ].map((product, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-surface-100">
                <span className="text-4xl block mb-3">{product.icon}</span>
                <h3 className="text-lg font-bold text-primary-900 mb-2">{product.title}</h3>
                <p className="text-surface-600 text-sm">{product.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">Our Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { value: "10,000+", label: "Farmers Supported" },
              { value: "50+", label: "Distributors" },
              { value: "36", label: "States Covered" },
              { value: "100+", label: "Products" },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-4 rounded-xl shadow-sm text-center">
                <p className="text-2xl md:text-3xl font-bold text-accent-600">{stat.value}</p>
                <p className="text-xs text-surface-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-50 py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6 text-center">Why Partner With Us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { title: "Quality Products", desc: "Certified feeds and inputs" },
              { title: "Technical Support", desc: "Expert farming guidance" },
              { title: "Market Access", desc: "Guaranteed offtake" },
              { title: "Competitive Pricing", desc: "Affordable rates" },
              { title: "Reliable Supply", desc: "Consistent availability" },
              { title: "Nationwide Delivery", desc: "Across all 36 states" },
            ].map((item, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-accent-500">
                <h3 className="font-bold text-primary-900 text-sm">{item.title}</h3>
                <p className="text-surface-600 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-900 text-white py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Become a Distributor or Farmer?</h2>
        <p className="text-primary-100 mb-6 max-w-xl mx-auto">
          Join our network of agro-allied partners across Nigeria
        </p>
        <Link href="/contact" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Contact Us
        </Link>
      </section>
    </div>
  );
}