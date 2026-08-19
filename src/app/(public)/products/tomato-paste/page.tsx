import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tomato Paste Products | Iyosiola Group",
  description: "Premium quality tomato paste and tomato-based products for household and industrial use.",
};

export default function TomatoPastePage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Tomato Paste</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Rich, flavourful tomato products for every kitchen
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">Our Tomato Products</h2>
          <p className="text-lg text-surface-700 leading-relaxed mb-6">
            Iyosiola Group offers premium quality tomato paste and tomato-based products that add 
            authentic rich flavor to your dishes. Our tomato products are carefully processed 
            to retain the natural taste, color, and nutritional value of fresh tomatoes.
          </p>
          <p className="text-lg text-surface-700 leading-relaxed mb-8">
            We source high-quality tomatoes from local farmers and process them using modern 
            technology to deliver products that meet the highest quality standards.
          </p>
        </div>
      </section>

      <section className="bg-primary-50 py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6 text-center">Our Tomato Products Range</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: "Premium Tomato Paste",
                desc: "Rich, double-concentrated tomato paste for intense flavor. Perfect for soups, stews, and sauces.",
                uses: "Stews, soups, jollof rice, sauces",
                packaging: "70g, 100g, 200g, 400g, 800g",
              },
              {
                title: "Tomato Ketchup",
                desc: "Smooth, tangy ketchup perfect for fries, burgers, and sandwiches.",
                uses: "Fast food, sandwiches, grilling",
                packaging: "200g, 350g, 650g, 1L",
              },
              {
                title: "Tomato Puree",
                desc: "Single-strength tomato puree for everyday cooking.",
                uses: "Everyday cooking, pizza base",
                packaging: "200g, 400g, 800g",
              },
              {
                title: "Fresh Tomato Crush",
                desc: "Crushed tomatoes with bits for authentic texture.",
                uses: "Pasta sauces, chowing, salads",
                packaging: "400g, 800g, 1kg",
              },
              {
                title: "Bulk Tomato Paste",
                desc: "Industrial quantities for food manufacturers and restaurants.",
                uses: "Food manufacturing, hospitality",
                packaging: "5kg, 10kg, 20kg",
              },
              {
                title: "Seasoned Tomato Sauce",
                desc: "Pre-seasoned sauce ready for immediate use.",
                uses: "Quick cooking, ready meals",
                packaging: "200g, 400g",
              },
            ].map((product, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-surface-100">
                  <h3 className="text-lg font-bold text-primary-900 mb-2">{product.title}</h3>
                  <p className="text-surface-600 text-sm mb-3">{product.desc}</p>
                  <p className="text-xs text-accent-600 font-medium mb-2">Best for: {product.uses}</p>
                  <p className="text-xs text-surface-500">Packaging: {product.packaging}</p>
                </div>
              ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">Quality & Sourcing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {[
              { title: "Local Sourcing", desc: "Tomatoes sourced from local farmers" },
              { title: "Fresh Processing", desc: "Processed within hours of harvest" },
              { title: "No Preservatives", desc: "Natural ingredients only" },
              { title: "Rich Lycopene", desc: "High nutritional value" },
            ].map((item, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-accent-500">
                <h3 className="font-bold text-primary-900 text-sm">{item.title}</h3>
                <p className="text-surface-600 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-50 py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6 text-center">Certifications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { title: "NAFDAC Certified", desc: "All products approved" },
              { title: "SON Approved", desc: "Meets Nigerian standards" },
              { title: "HACCP", desc: "Food safety compliant" },
              { title: "HALAL Certified", desc: "Halal compliant" },
              { title: "Quality Control", desc: "Every batch tested" },
              { title: "Fresh Processing", desc: "Modern facilities" },
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
        <h2 className="text-2xl font-bold mb-4">Order Tomato Products in Bulk?</h2>
        <p className="text-primary-100 mb-6 max-w-xl mx-auto">
          We supply restaurants, food manufacturers, and retailers across Nigeria
        </p>
        <Link href="/contact" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Contact Us
        </Link>
      </section>
    </div>
  );
}