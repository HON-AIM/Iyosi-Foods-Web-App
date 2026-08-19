import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Careers | Iyosiola Group",
  description: "Join Iyosiola Group - Career opportunities, jobs, and distributor partnerships in Nigeria's leading FMCG company.",
};

export default function CareersPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Careers</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Join us in building Nigeria's food industry future
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6 text-center">
            Why Work With Us
          </h2>
          <p className="text-lg text-surface-700 leading-relaxed mb-12 text-center">
            Our people are at the core of our business. We are committed to continuously providing 
            an extraordinary work culture and environment. The ability to attract, retain, reward, 
            and motivate talented individuals is critical for achieving our strategic goals 
            and long-term success.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { title: "Respect", desc: "Give it! Get it!", icon: "🤝" },
              { title: "Innovation", desc: "It's all about impact", icon: "💡" },
              { title: "Commitment", desc: "We take our values seriously", icon: "🎯" },
              { title: "Excellence", desc: "We will always go all the way", icon: "⭐" },
            ].map((value, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-surface-100 text-center">
                <span className="text-4xl block mb-3">{value.icon}</span>
                <h3 className="text-lg font-bold text-primary-900 mb-1">{value.title}</h3>
                <p className="text-surface-600 text-sm">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-50 py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-8 text-center">
            Career Opportunities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Link href="/careers/jobs" className="group bg-white p-6 rounded-xl shadow-sm border border-surface-100 hover:shadow-lg hover:border-accent-300 transition-all">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">💼</span>
              </div>
              <h3 className="text-lg font-bold text-primary-900 mb-2 group-hover:text-accent-600 transition-colors">
                Job Opportunities
              </h3>
              <p className="text-surface-600 text-sm">
                Explore open positions and join our team of professionals
              </p>
            </Link>

            <Link href="/careers/partners" className="group bg-white p-6 rounded-xl shadow-sm border border-surface-100 hover:shadow-lg hover:border-accent-300 transition-all">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-lg font-bold text-primary-900 mb-2 group-hover:text-accent-600 transition-colors">
                Distributor Partnerships
              </h3>
              <p className="text-surface-600 text-sm">
                Become a distribution partner and grow your business
              </p>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-8 text-center">
            What We Offer
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { title: "Competitive Salary", desc: "Market-leading compensation packages" },
              { title: "Health Benefits", desc: "Comprehensive health insurance" },
              { title: "Career Growth", desc: "Clear advancement pathways" },
              { title: "Training", desc: "Continuous learning programs" },
              { title: "Work-Life Balance", desc: "Supportive work environment" },
              { title: "Innovation Culture", desc: "Encouraging new ideas" },
            ].map((benefit, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-accent-500">
                <h3 className="font-bold text-primary-900 text-sm">{benefit.title}</h3>
                <p className="text-surface-600 text-xs">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-900 text-white py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Join Our Team</h2>
        <p className="text-primary-100 mb-6 max-w-xl mx-auto">
          We are always looking for talented individuals to join our team
        </p>
        <Link href="/careers/jobs" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          View Openings
        </Link>
      </section>
    </div>
  );
}