import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What We Do | Iyosiola Group",
  description: "Discover Iyosiola Group's operations in flour, rice, edible oils, pasta, and agro-allied products.",
};

export default function WhatWeDoPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">What We Do</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Nourishment of the human body is at the heart of what we do
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-lg text-surface-700 leading-relaxed mb-8">
            At Iyosiola Group, we take our inputs and utilise our unique competitive advantages to produce and manufacture 
            high quality food produce and packaged food products, which we sell to the large and growing markets we serve across Nigeria.
          </p>
          <p className="text-lg text-surface-700 leading-relaxed mb-8">
            In addition, we are developing new markets in West Africa, with a longer-term vision to supply our products across Africa. 
            In this process and along our value chain, we create long-term value for all our stakeholders.
          </p>
        </div>
      </section>

      <section className="bg-primary-50 py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-8 text-center">Our Divisions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: "Flour",
                desc: "Premium quality flour for baking, food processing, and household use. Our flour products are trusted by bakeries, food manufacturers, and households across Nigeria.",
                icon: "🌾",
              },
              {
                title: "Rice",
                desc: "We source and distribute premium quality rice, ensuring food security and affordability for Nigerian households. Our rice products undergo rigorous quality checks.",
                icon: "🍚",
              },
              {
                title: "Edible Oils",
                desc: "We specialize in the conversion of raw materials into high-quality cooking oils, providing essential cooking ingredients for households and food businesses.",
                icon: "🫒",
              },
              {
                title: "Pasta",
                desc: "We produce and distribute various pasta products including spaghetti, macaroni, and other pasta varieties for households and food service businesses.",
                icon: "🍝",
              },
              {
                title: "Agro-Allied",
                desc: "Beyond food products, we provide comprehensive agricultural solutions including poultry feeds, farming inputs, and logistics support to farmers across Nigeria.",
                icon: "🌱",
              },
              {
                title: "Logistics",
                desc: "Our extensive distribution network ensures timely delivery to all customers nationwide, leveraging our fleet of delivery vehicles.",
                icon: "🚚",
              },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-surface-100">
                <span className="text-4xl block mb-3">{item.icon}</span>
                <h3 className="text-lg font-bold text-primary-900 mb-2">{item.title}</h3>
                <p className="text-surface-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          <div>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">For Our Customers</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              We provide high quality food produce and products, balancing pricing with affordability, and distribution. 
              Our key inputs are food commodities sourced from agricultural sectors, locally and internationally.
            </p>
            <p className="text-surface-700 leading-relaxed">
              We meet demand from our customers by ensuring continuous production, adequate storage systems, 
              and adding production capacity as required. Our customer delivery system ensures timely delivery 
              to all our customers nationwide.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">For Our Shareholders</h2>
            <p className="text-surface-700 leading-relaxed">
              We are committed to delivering excellent returns on invested capital by making strategic decisions based on sound 
              value-creation principles. Our aim is to continually ensure the sustainability and resilience of the 
              business, with a focus on the creation and execution of growth strategies.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">For Our Communities</h2>
            <p className="text-surface-700 leading-relaxed mb-4">
              In our host communities, taking a holistic view, we implement initiatives that support the communities across several dimensions 
              such as healthcare, education, water, roads, etc.
            </p>
            <p className="text-surface-700 leading-relaxed">
              We impact our host communities through economic empowerment from direct and indirect employment opportunities, 
              provision of scholarships for education, and infrastructure support, all of which improve the overall standard of living.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-primary-900 mb-4">Our People</h2>
            <p className="text-surface-700 leading-relaxed">
              Our people are our most prized assets, therefore attracting and retaining talent is a key priority. 
              Our human resources practices, including recruitment, training, empowerment, retention, succession planning, 
              etc., always revolve around making our employees the best in their various roles.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-primary-50 py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6 text-center">Why Choose Us</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { title: "Quality Guaranteed", desc: "All products NAFDAC certified" },
              { title: "Nationwide Delivery", desc: "Coverage across all 36 states" },
              { title: "Competitive Pricing", desc: "Balancing quality with affordability" },
              { title: "Reliable Supply", desc: "Continuous production & storage" },
              { title: "Customer Focus", desc: "Timely delivery to all customers" },
              { title: "Sustainable Practices", desc: "Environmental responsibility" },
            ].map((item, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm text-center">
                <h3 className="font-bold text-primary-900 text-sm">{item.title}</h3>
                <p className="text-surface-600 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-900 text-white py-12 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Join Our Distribution Network</h2>
        <p className="text-primary-100 mb-6 max-w-xl mx-auto">
          Become a partner and grow your business with Iyosiola Group
        </p>
        <Link href="/contact" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Contact Us
        </Link>
      </section>
    </div>
  );
}