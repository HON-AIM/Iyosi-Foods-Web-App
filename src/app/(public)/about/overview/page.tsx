import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Overview | Iyosiola Group",
  description: "Iyosiola Group - A leading Food and FMCG company processing, manufacturing, and distributing food produce across Nigeria.",
};

export default function OverviewPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Overview</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Leading Nigeria&apos;s food industry with premium quality products
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">Who We Are</h2>
          <p className="text-lg text-surface-700 leading-relaxed mb-6">
            Iyosiola Group is a leading Food and Fast-moving Consumer Goods (FMCG) business which processes, 
            manufactures, and distributes food produce as well as packaged food. Our business operations comprise of multiple divisions, 
            including Flour, Rice, Edible Oils, and Agro-Allied products.
          </p>
          <p className="text-lg text-surface-700 leading-relaxed mb-8">
            As a member of Nigeria&apos;s business community, we are committed to delivering excellent returns on invested 
            capital while maintaining the highest standards of quality and sustainability. Our products are trusted 
            by households and businesses across Nigeria.
          </p>
        </div>
      </section>

      <section className="bg-primary-50 py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { icon: "🌾", title: "Flour", desc: "Premium quality flour for baking and food processing" },
              { icon: "🍚", title: "Rice", desc: "Locally sourced premium rice products" },
              { icon: "🫒", title: "Edible Oils", desc: "Pure and refined cooking oils" },
              { icon: "🏭", title: "Agro-Allied", desc: "Comprehensive agricultural solutions" },
              { icon: "📦", title: "Bulk Orders", desc: "Wholesale for businesses" },
              { icon: "🚚", title: "Logistics", desc: "Nationwide delivery network" },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-surface-100 text-center">
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
            <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-4">Our Vision</h2>
            <p className="text-lg text-surface-700 leading-relaxed">
              To be the leading food manufacturing company, fulfilling Africa&apos;s food demand.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-4">Our Mission</h2>
            <p className="text-lg text-surface-700 leading-relaxed">
              To deliver high-quality foods that nourish lives, promote food security, and create sustainable value for all.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-4">Our Core Values</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: "Respect", desc: "Give it! Get it!" },
                { title: "Innovation", desc: "It's all about impact" },
                { title: "Commitment", desc: "We take our values seriously" },
                { title: "Excellence", desc: "We will always go all the way" },
              ].map((item, i) => (
                <div key={i} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-accent-500">
                  <h3 className="font-bold text-primary-900">{item.title}</h3>
                  <p className="text-surface-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary-50 py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6 text-center">Awards & Certifications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { title: "NAFDAC Certified", desc: "All our products are NAFDAC certified" },
              { title: "Quality Excellence", desc: "ISO 9001:2015 certified" },
              { title: "Food Safety", desc: "FSSC 22000 certified" },
              { title: "Halal Certified", desc: "Halal certification for all products" },
              { title: "Industry Leader", desc: "Best FMCG Brand Award" },
              { title: "Trusted Partner", desc: "Preferred by businesses" },
            ].map((item, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm text-center">
                <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">🏆</span>
                </div>
                <h3 className="font-bold text-primary-900 text-sm">{item.title}</h3>
                <p className="text-surface-600 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-900 text-white py-12 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Partner With Us</h2>
        <p className="text-primary-100 mb-6 max-w-xl mx-auto">
          Join our network of distributors and retailers across Nigeria
        </p>
        <Link href="/contact" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Get In Touch
        </Link>
      </section>
    </div>
  );
}