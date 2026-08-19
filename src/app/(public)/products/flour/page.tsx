import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Flour Products | Iyosiola Group",
  description: "Premium quality flour for baking, food processing, and household use. State-of-the-art flour milling.",
};

export default function FlourPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Flour Division</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Premium quality flour for every need
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">State-of-the-Art Flour Milling</h2>
          <p className="text-lg text-surface-700 leading-relaxed mb-6">
            Iyosiola Group owns state-of-the-art flour milling facilities with high efficiency specifications for 
            energy saving and waste reduction. Our flour division is involved in the processing, manufacturing, 
            and distribution of flour for large-scale and small-scale use.
          </p>
          <p className="text-lg text-surface-700 leading-relaxed mb-8">
            We produce flour that is one of the staple foods contributing to the development of Nigeria. 
            Our facilities operate with cutting-edge technology to ensure consistent quality and optimal 
            production efficiency.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { value: "500,000+", label: "MT Annual Capacity" },
              { value: "91.3%", label: "Premium Flour" },
              { value: "8.7%", label: "Bran Production" },
              { value: "24/7", label: "Operations" },
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
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6 text-center">Our Flour Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: "Premium Wheat Flour",
                desc: "High-quality all-purpose flour suitable for various baking applications.",
                packaging: "1kg, 2.5kg, 5kg, 10kg, 25kg, 50kg",
              },
              {
                title: "Bread Flour",
                desc: "High-protein flour specifically formulated for bread making.",
                packaging: "5kg, 10kg, 25kg, 50kg",
              },
              {
                title: "Pastry Flour",
                desc: "Low-protein flour ideal for pastries, cookies, and cakes.",
                packaging: "1kg, 2.5kg, 5kg, 10kg",
              },
              {
                title: "Semolina",
                desc: "Coarse wheat flour for pasta, bread, and traditional dishes.",
                packaging: "1kg, 2.5kg, 5kg, 10kg, 25kg",
              },
              {
                title: "Whole Wheat Flour",
                desc: "Fiber-rich flour containing all parts of the grain.",
                packaging: "2.5kg, 5kg, 10kg",
              },
              {
                title: "Cake Flour",
                desc: "Fine-textured, low-protein flour for light cakes and pastries.",
                packaging: "1kg, 2.5kg, 5kg",
              },
            ].map((product, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-surface-100">
                <h3 className="text-lg font-bold text-primary-900 mb-2">{product.title}</h3>
                <p className="text-surface-600 text-sm mb-3">{product.desc}</p>
                <p className="text-xs text-accent-600 font-medium">Available: {product.packaging}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">Quality & Certifications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { title: "NAFDAC Certified", desc: "All products approved" },
              { title: "ISO 9001", desc: "Quality management" },
              { title: "FSSC 22000", desc: "Food safety certification" },
              { title: "HALAL Certified", desc: "Halal compliant" },
              { title: "SON Approved", desc: "Nigerian standards" },
              { title: "Premium Grade", desc: "Export quality" },
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
        <h2 className="text-2xl font-bold mb-4">Order Flour in Bulk?</h2>
        <p className="text-primary-100 mb-6 max-w-xl mx-auto">
          We supply flour to bakeries, food manufacturers, restaurants, and retailers
        </p>
        <Link href="/contact" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Get a Quote
        </Link>
      </section>
    </div>
  );
}