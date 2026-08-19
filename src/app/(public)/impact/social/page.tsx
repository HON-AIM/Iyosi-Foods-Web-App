import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Social Impact | Iyosiola Group",
  description: "Iyosiola Group's community development initiatives, health & safety programs, and social responsibility.",
};

export default function SocialPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Social Impact</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Empowering communities and creating lasting positive change
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">Our Social Commitment</h2>
          <p className="text-lg text-surface-700 leading-relaxed mb-6">
            A profound obligation to social responsibility is central to who we are as a business. 
            We also understand that our success depends on the success of others.
          </p>
          <p className="text-lg text-surface-700 leading-relaxed mb-8">
            By being socially engaged through community-enriching initiatives, we not only empower 
            individuals and communities through diverse programmes, trainings, and projects but 
            also ensure we have a pathway to consistently pursue our mission of promoting economic 
            development across Nigeria.
          </p>
        </div>
      </section>

      <section className="bg-primary-50 py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-8 text-center">Our Social Initiatives</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: "Health & Safety",
                desc: "We provide a safe and healthy working environment, following site and regulatory guidelines for occupational health and safety. We operate in line with global best practice to safeguard the health, safety, and welfare of our workers, visitors, and consumers.",
                icon: "🏥",
              },
              {
                title: "Diversity & Inclusion",
                desc: "Equality of opportunities, non-discrimination, and inclusion in the workplace are vital to us. We continually promote a collaborative, supportive, and respectful environment.",
                icon: "👥",
              },
              {
                title: "Host Communities",
                desc: "We implement initiatives that contribute to our host communities including employment opportunities, capacity building programmes, grants, and infrastructure support.",
                icon: "🏘️",
              },
              {
                title: "Compensation & Benefits",
                desc: "We aim to encourage and bring out the best in employees by paying competitive wages as well as providing additional benefits based on performance.",
                icon: "💰",
              },
              {
                title: "Youth Empowerment",
                desc: "We invest in training and development programmes for young people, creating pathways to employment and entrepreneurship.",
                icon: "🌟",
              },
              {
                title: "Local Sourcing",
                desc: "We support local farmers and suppliers through our out-grower schemes, creating sustainable livelihoods in agricultural communities.",
                icon: "🌾",
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
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">Our Impact Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { value: "10,000+", label: "Jobs Created" },
              { value: "100,000+", label: "Farmers Supported" },
              { value: "36", label: "States Covered" },
              { value: "500+", label: "Community Projects" },
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
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">Certifications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { title: "ISO 9001", desc: "Quality Management" },
              { title: "ISO 14001", desc: "Environmental Management" },
              { title: "FSSC 22000", desc: "Food Safety" },
              { title: "Low Incident Rate", desc: "<0.1% staff attrition" },
              { title: "HACCP", desc: "Food Safety Standards" },
              { title: "HALAL", desc: "Product Certification" },
            ].map((item, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-accent-500">
                <h3 className="font-bold text-primary-900 text-sm">{item.title}</h3>
                <p className="text-surface-600 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16 text-center">
        <h2 className="text-2xl font-bold text-primary-900 mb-4">Community Support</h2>
        <p className="text-surface-600 mb-6 max-w-2xl mx-auto">
          We believe in giving back to the communities that support us. Our initiatives include:
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {["Employment Opportunities", "Scholarships", "Healthcare", "Clean Water", "Infrastructure", "Sports Development"].map((item, i) => (
            <span key={i} className="bg-accent-100 text-accent-700 px-4 py-2 rounded-full text-sm font-medium">
              {item}
            </span>
          ))}
        </div>
        <Link href="/contact" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Partner With Us
        </Link>
      </section>

      <section className="bg-primary-900 text-white py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Get Involved</h2>
        <p className="text-primary-100 mb-6 max-w-xl mx-auto">
          Join us in making a positive difference in communities across Nigeria
        </p>
        <Link href="/contact" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Contact Us
        </Link>
      </section>
    </div>
  );
}