import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sugar Products | Iyosiola Group",
  description: "Premium quality refined sugar products for industrial and household use. Leading sugar producer in Nigeria.",
};

export default function SugarPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Sugar Division</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Leading producer of premium refined sugar in West Africa
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">Sugar Refining</h2>
          <p className="text-lg text-surface-700 leading-relaxed mb-6">
            The Sugar Division of Iyosiola Group is a leading producer of sugar in West Africa, through the processing 
            and refining of raw sugar. Our operations comprise the plantation and refinery segments operating across 
            the value chain of the sugar industry, including the production, milling, processing, and refining of sugar 
            and its by-products.
          </p>
          <p className="text-lg text-surface-700 leading-relaxed mb-8">
            We have ultramodern and automated sugar refineries that utilise state-of-the-art equipment to refine 
            high-quality products for industrial and household use. Our refineries have a total combined installed 
            refining capacity, making us one of the largest refiners in West Africa.
          </p>
        </div>
      </section>

      <section className="bg-primary-50 py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6 text-center">Our Sugar Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: "Premium Refined Sugar",
                desc: "High-quality crystalline white granulated sugar for industrial and household consumption.",
                uses: "Pharmaceuticals, bakeries, confectioneries, food & beverage, dairy",
              },
              {
                title: "Fortified Sugar",
                desc: "Sugar fortified with Vitamin A for enhanced nutritional value.",
                uses: "Domestic consumption, approved by NAFDAC",
              },
              {
                title: "Non-Fortified Sugar",
                desc: "Standard refined sugar for industrial applications.",
                uses: "Food manufacturing, beverage production",
              },
              {
                title: "Industrial Sugar",
                desc: "Bulk sugar for large-scale industrial users.",
                uses: "Manufacturing, food processing",
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
              { title: "SON Approved", desc: "Meets Nigerian standards" },
              { title: "High Purity", desc: "45-60 ICUMSA" },
              { title: "Quality Control", desc: "Rigorous testing" },
              { title: "Safe & Clean", desc: "Food safety compliant" },
              { title: "Consistent Quality", desc: "Every batch tested" },
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
        <h2 className="text-2xl font-bold mb-4">Need Bulk Sugar Supply?</h2>
        <p className="text-primary-100 mb-6 max-w-xl mx-auto">
          We supply sugar to bakeries, food manufacturers, and businesses across Nigeria
        </p>
        <Link href="/contact" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Contact Us
        </Link>
      </section>
    </div>
  );
}