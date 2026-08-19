import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Impact | Iyosiola Group",
  description: "Explore Iyosiola Group's commitment to Environmental, Social, and Governance (ESG) initiatives.",
};

export default function ImpactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Our Impact</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Building a sustainable future through responsible business practices
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6 text-center">
            Environmental, Social & Governance
          </h2>
          <p className="text-lg text-surface-700 leading-relaxed mb-12 text-center">
            At Iyosi Foods, we believe that our success is intrinsically linked to the well-being of our communities 
            and the environment. We are committed to sustainable business practices that create lasting positive 
            impact on society while protecting our environment for future generations.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/impact/environment" className="group p-6 bg-white rounded-xl shadow-sm border border-surface-100 hover:shadow-lg hover:border-accent-300 transition-all">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🌿</span>
              </div>
              <h3 className="text-xl font-bold text-primary-900 mb-2 group-hover:text-accent-600 transition-colors">
                Environment
              </h3>
              <p className="text-surface-600 text-sm">
                Sustainable operations, waste management, and environmental stewardship
              </p>
            </Link>

            <Link href="/impact/social" className="group p-6 bg-white rounded-xl shadow-sm border border-surface-100 hover:shadow-lg hover:border-accent-300 transition-all">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-xl font-bold text-primary-900 mb-2 group-hover:text-accent-600 transition-colors">
                Social
              </h3>
              <p className="text-surface-600 text-sm">
                Community development, health & safety, and people empowerment
              </p>
            </Link>

            <Link href="/impact/governance" className="group p-6 bg-white rounded-xl shadow-sm border border-surface-100 hover:shadow-lg hover:border-accent-300 transition-all">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">⚖️</span>
              </div>
              <h3 className="text-xl font-bold text-primary-900 mb-2 group-hover:text-accent-600 transition-colors">
                Governance
              </h3>
              <p className="text-surface-600 text-sm">
                Ethical standards, transparency, and corporate leadership
              </p>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-primary-50 py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-8 text-center">Our ESG Commitments</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "ISO 14001", label: "Environmental Mgmt" },
              { value: "ISO 9001", label: "Quality Mgmt" },
              { value: "FSSC 22000", label: "Food Safety" },
              { value: "Zero", label: "Major Fines" },
            ].map((item, i) => (
              <div key={i} className="bg-white p-4 rounded-xl shadow-sm text-center">
                <p className="text-2xl md:text-3xl font-bold text-accent-600">{item.value}</p>
                <p className="text-xs text-surface-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16 text-center">
        <h2 className="text-2xl font-bold text-primary-900 mb-4">Learn More About Our Initiatives</h2>
        <p className="text-surface-600 mb-6 max-w-xl mx-auto">
          Explore our detailed impact reports and sustainability initiatives
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/impact/environment" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
            Environmental Impact
          </Link>
          <Link href="/impact/social" className="inline-block border-2 border-accent-500 text-accent-600 hover:bg-accent-50 font-bold py-3 px-8 rounded-lg transition-colors">
            Social Impact
          </Link>
        </div>
      </section>

      <section className="bg-primary-900 text-white py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Partner With Us</h2>
        <p className="text-primary-100 mb-6 max-w-xl mx-auto">
          Join us in creating sustainable impact across Nigeria
        </p>
        <Link href="/contact" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Contact Us
        </Link>
      </section>
    </div>
  );
}