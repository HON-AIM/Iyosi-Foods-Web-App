import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Products | Iyosiola Group",
  description: "Explore Iyosiola Group's premium food products including flour, sugar, rice, edible oils, and agro-allied products.",
};

export default function ProductsPage() {
  const products = [
    {
      title: "Sugar",
      description: "Premium quality refined sugar for industrial and household use. Leading sugar producer in Nigeria with state-of-the-art refining facilities.",
      icon: "🧂",
      href: "/products/sugar",
      color: "bg-amber-50",
    },
    {
      title: "Flour",
      description: "High-quality flour for baking, food processing, and household use. State-of-the-art flour milling with premium grade products.",
      icon: "🌾",
      href: "/products/flour",
      color: "bg-orange-50",
    },
    {
      title: "Rice",
      description: "Premium quality locally sourced and processed rice. One of the largest rice mills in Nigeria.",
      icon: "🍚",
      href: "/products/rice",
      color: "bg-gray-50",
    },
    {
      title: "Edible Oils",
      description: "Pure and refined cooking oils for household and industrial use. Premium quality edible oils.",
      icon: "🫒",
      href: "/products/oil",
      color: "bg-yellow-50",
    },
    {
      title: "Poultry & Agro-Allied",
      description: "Comprehensive agricultural solutions including feeds, fertilizers, and farming inputs for Nigerian farmers.",
      icon: "🐔",
      href: "/products/poultry",
      color: "bg-green-50",
    },
  ];

  const features = [
    { title: "NAFDAC Certified", desc: "All products approved by National Agency for Food and Drug Administration" },
    { title: "SON Approved", desc: "Meets Standards Organization of Nigeria requirements" },
    { title: "Quality First", desc: "Rigorous quality control on every batch" },
    { title: "Nationwide Delivery", desc: "Distribution across all 36 states" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Our Products</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Premium quality food products for every need
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6 text-center">
            Food Divisions
          </h2>
          <p className="text-lg text-surface-700 leading-relaxed mb-12 text-center">
            Iyosiola Group is a leading Food and Fast-moving Consumer Goods (FMCG) business which processes, 
            manufactures, and distributes food produce across Nigeria. Our product portfolio spans multiple 
            divisions to meet the diverse needs of our customers.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <Link
                key={index}
                href={product.href}
                className={`group p-6 rounded-xl shadow-sm border border-surface-100 hover:shadow-lg hover:border-accent-300 transition-all ${product.color}`}
              >
                <span className="text-5xl block mb-4">{product.icon}</span>
                <h3 className="text-xl font-bold text-primary-900 mb-2 group-hover:text-accent-600 transition-colors">
                  {product.title}
                </h3>
                <p className="text-surface-600 text-sm">{product.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-50 py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-8 text-center">
            Why Choose Our Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-5 rounded-xl shadow-sm text-center">
                <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">✓</span>
                </div>
                <h3 className="font-bold text-primary-900 text-sm">{feature.title}</h3>
                <p className="text-surface-600 text-xs">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6 text-center">
            Bulk Orders & Distribution
          </h2>
          <p className="text-lg text-surface-700 leading-relaxed mb-8 text-center">
            We supply businesses, distributors, and retailers across Nigeria. Contact us for bulk orders and 
            partnership opportunities.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/careers"
              className="inline-block border-2 border-accent-500 text-accent-600 hover:bg-accent-50 font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Become a Distributor
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-primary-900 text-white py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Need Custom Packaging?</h2>
        <p className="text-primary-100 mb-6 max-w-xl mx-auto">
          We offer custom packaging solutions for businesses and corporate customers
        </p>
        <Link
          href="/contact"
          className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
        >
          Request Quote
        </Link>
      </section>
    </div>
  );
}