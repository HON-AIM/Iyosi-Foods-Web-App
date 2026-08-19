import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Edible Oil Products | Iyosiola Group",
  description: "Pure and refined cooking oils for household and industrial use. Premium quality edible oils.",
};

export default function OilPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Edible Oils Division</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Pure and refined cooking oils for every need
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">Our Edible Oils</h2>
          <p className="text-lg text-surface-700 leading-relaxed mb-6">
            The Edible Oils division of Iyosiola Group specializes in the conversion of crude oil 
            into high quality oil products including palm olein, stearin, and other refined 
            oils for direct and industrial uses.
          </p>
          <p className="text-lg text-surface-700 leading-relaxed mb-8">
            Our oil processing facilities utilize state-of-the-art technology to ensure the highest 
            purity levels and nutritional value. We supply both retail and bulk customers across Nigeria.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { value: "250,000+", label: "MT Annual Capacity" },
              { value: "Pure", label: "Quality Oil" },
              { value: "Multiple", label: "Product Types" },
              { value: "Nationwide", label: "Distribution" },
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
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6 text-center">Our Oil Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: "Vegetable Oil",
                desc: "Premium cooking oil for household use.",
                uses: "Frying, cooking, baking",
              },
              {
                title: "Palm Olein",
                desc: "Refined palm oil fraction for cooking.",
                uses: "Deep frying, cooking",
              },
              {
                title: "Palm Stearin",
                desc: "Solid fat fraction for industrial use.",
                uses: "Soap making, candles",
              },
              {
                title: "Bulk Cooking Oil",
                desc: "Industrial quantities for food businesses.",
                uses: "Restaurants, food production",
              },
              {
                title: "Pure Coconut Oil",
                desc: "Natural coconut oil for cooking.",
                uses: "Cooking, beauty",
              },
              {
                title: "Blended Oil",
                desc: "Premium blended vegetable oil.",
                uses: "Household cooking",
              },
            ].map((product, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-surface-100">
                <h3 className="text-lg font-bold text-primary-900 mb-2">{product.title}</h3>
                <p className="text-surface-600 text-sm mb-3">{product.desc}</p>
                <p className="text-xs text-accent-600 font-medium">Uses: {product.uses}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">Quality Standards</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { title: "NAFDAC Certified", desc: "All products approved" },
              { title: "SON Approved", desc: "Nigerian standards" },
              { title: "High Purity", desc: "Refined quality" },
              { title: "Food Safe", desc: "Industry compliant" },
              { title: "HACCP", desc: "Food safety" },
              { title: "Export Ready", desc: "International quality" },
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
        <h2 className="text-2xl font-bold mb-4">Order Edible Oil in Bulk?</h2>
        <p className="text-primary-100 mb-6 max-w-xl mx-auto">
          We supply edible oils to manufacturers, restaurants, and retailers across Nigeria
        </p>
        <Link href="/contact" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Contact Us
        </Link>
      </section>
    </div>
  );
}