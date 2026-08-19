import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Rice Products | Iyosiola Group",
  description: "Premium quality locally sourced and processed rice. One of the largest rice mills in Nigeria.",
};

export default function RicePage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Rice Division</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Premium quality rice for Nigerian households
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">Rice Milling Operations</h2>
          <p className="text-lg text-surface-700 leading-relaxed mb-6">
            Iyosiola Group operates state-of-the-art rice milling facilities with substantial milling capacity, 
            making us one of the largest rice processors in Nigeria. Our rice mills are equipped with 
            modern technology for parboiling, milling, and packaging to deliver premium quality rice.
          </p>
          <p className="text-lg text-surface-700 leading-relaxed mb-8">
            We have adopted a highly mechanised approach to our rice farming and milling, which includes 
            increased yields, higher labour productivity, reduction of post-harvest losses, and increased 
            value-add to farm output.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { value: "200,000+", label: "MT Annual Capacity" },
              { value: "100,000+", label: "Farmers Supported" },
              { value: "Premium", label: "Quality Grade" },
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
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6 text-center">Our Rice Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: "Premium Parboiled Rice",
                desc: "Quality parboiled rice with excellent grain integrity and nutritional value.",
                features: "Long grain, pre-boiled, nutrient-rich",
              },
              {
                title: "White Rice",
                desc: "Premium polished white rice for everyday cooking.",
                features: "Clean, uniform grains, easy to cook",
              },
              {
                title: "Ofada Rice",
                desc: "Locally sourced traditional rice variety.",
                features: "Organic, locally sourced, authentic taste",
              },
              {
                title: "Basmati Rice",
                desc: "Premium long-grain aromatic rice.",
                features: "Aromatic, premium quality, export grade",
              },
            ].map((product, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-surface-100">
                <h3 className="text-lg font-bold text-primary-900 mb-2">{product.title}</h3>
                <p className="text-surface-600 text-sm mb-3">{product.desc}</p>
                <p className="text-xs text-accent-600 font-medium">{product.features}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">Out-Grower Scheme</h2>
          <p className="text-lg text-surface-700 leading-relaxed mb-6">
            We operate a robust Out-Growers Scheme targeting rice farmers to offtake their harvest, 
            minimise wastage, and get good value for their harvest. This initiative supports local 
            farmers and ensures a steady supply of quality paddy for our mills.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: "100,000+", desc: "Farmers Engaged" },
              { title: "Local Sourcing", desc: "Supporting local farmers" },
              { title: "Quality Input", desc: "Best paddy selection" },
            ].map((item, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-accent-500">
                <p className="text-xl font-bold text-primary-900">{item.title}</p>
                <p className="text-xs text-surface-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-900 text-white py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Order Rice in Bulk?</h2>
        <p className="text-primary-100 mb-6 max-w-xl mx-auto">
          We supply rice to distributors, retailers, and businesses across Nigeria
        </p>
        <Link href="/contact" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Contact Us
        </Link>
      </section>
    </div>
  );
}