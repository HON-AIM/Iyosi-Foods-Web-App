import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Environmental Impact | Iyosiola Group",
  description: "Iyosiola Group's commitment to environmental stewardship and sustainability in operations.",
};

export default function EnvironmentPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Environment</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Committed to environmental stewardship in all our operations
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">Our Environmental Commitment</h2>
          <p className="text-lg text-surface-700 leading-relaxed mb-6">
            We are committed to environmental stewardship in our operations. Recognising the responsibility of 
            protecting our environment, we proactively minimise the energy, waste, air, and water 
            pollution that arises from our operations. We endeavour to reduce the environmental effects 
            across the full life cycle of our production sites and corporate operations.
          </p>
          <p className="text-lg text-surface-700 leading-relaxed mb-8">
            We maintain an ISO 14001:2015 certified Environmental Management System and allocate 
            adequate resources to manage our environment and sustainability commitments while making 
            necessary efforts to reduce and abate the environmental impacts associated with our operations.
          </p>
        </div>
      </section>

      <section className="bg-primary-50 py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-8 text-center">Our Environmental Initiatives</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: "Air Quality Management",
                desc: "We minimise soot emission through advanced filtration systems and regular monitoring to ensure clean air quality.",
                icon: "💨",
              },
              {
                title: "Waste Water Treatment",
                desc: "We have a brine recovery system in place to process and treat effluent before discharge.",
                icon: "💧",
              },
              {
                title: "Noise Pollution Control",
                desc: "At our sites, we have installed silencers to manage noise pollution.",
                icon: "🔇",
              },
              {
                title: "Alternative Energy",
                desc: "We use natural gas which is cleaner and reduces greenhouse gas emissions.",
                icon: "🔥",
              },
              {
                title: "Recyclable Packaging",
                desc: "Our packaging materials are designed to be recycled, promoting circular economy.",
                icon: "♻️",
              },
              {
                title: "Waste Recycling",
                desc: "We return operational waste as alternative revenue sources in our divisions.",
                icon: "🔄",
              },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-surface-100">
                <span className="text-3xl block mb-3">{item.icon}</span>
                <h3 className="text-lg font-bold text-primary-900 mb-2">{item.title}</h3>
                <p className="text-surface-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">Certifications & Compliance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[
              { title: "ISO 14001:2015", desc: "Environmental Management System certified" },
              { title: "Regulatory Compliance", desc: "Meets all environmental regulations" },
              { title: "Zero Major Fines", desc: "No material fines for non-compliance" },
              { title: "Continuous Monitoring", desc: "Regular environmental audits" },
              { title: "Sustainable Practices", desc: "Reducing environmental footprint" },
              { title: "Energy Efficiency", desc: "Optimizing energy use" },
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
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-4">Looking Forward</h2>
          <p className="text-surface-600 mb-6 max-w-2xl mx-auto">
            We plan to implement an enhanced environmental management system to ensure that our impact 
            is within regulatory limits. We continue to invest in our business, allowing us to 
            strengthen our value proposition, operate efficiently, and cater to the growing demand.
          </p>
          <Link href="/contact" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
            Learn More
          </Link>
        </div>
      </section>

      <section className="bg-primary-900 text-white py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Partner With Us</h2>
        <p className="text-primary-100 mb-6 max-w-xl mx-auto">
          Join us in our commitment to environmental sustainability
        </p>
        <Link href="/contact" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Contact Us
        </Link>
      </section>
    </div>
  );
}