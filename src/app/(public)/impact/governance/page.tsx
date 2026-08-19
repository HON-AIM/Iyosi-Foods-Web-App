import { type Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Governance | Iyosiola Group",
  description: "Iyosiola Group's corporate governance practices, ethical standards, and leadership commitment.",
};

export default function GovernancePage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Governance</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Strong leadership and high accountability culture
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">Our Governance Commitment</h2>
          <p className="text-lg text-surface-700 leading-relaxed mb-6">
            As part of our commitment to sustainability, we remain focused on maintaining a sound corporate 
            governance culture. We have strong leadership and a high accountability culture which helps us achieve this.
          </p>
          <p className="text-lg text-surface-700 leading-relaxed mb-8">
            The Board is responsible for setting the long-term strategy of the Company, while the Senior 
            Management is required to manage the Company day-to-day whilst providing reports to the Board 
            on implementation of agreed strategies.
          </p>
        </div>
      </section>

      <section className="bg-primary-50 py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-8 text-center">Board Committees</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: "Statutory Audit Committee",
                desc: "Carries out oversight role regarding financial reporting, internal control processes, and external audit. Reviews going concern status and consists of directors and shareholders.",
                icon: "📊",
              },
              {
                title: "Risk Management Committee",
                desc: "Reviews and provides recommendations on internal control, enterprise risk management, and health, safety, security, and environment matters.",
                icon: "⚠️",
              },
              {
                title: "Governance & Remuneration Committee",
                desc: "Responsible for nomination and appointment of Directors, review of staff remuneration, and appointment of senior management staff.",
                icon: "👔",
              },
              {
                title: "Finance Committee",
                desc: "Reviews financial performance, vets budgets, reviews capital structure, and evaluates contracts for capital projects.",
                icon: "💹",
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
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">Governance Principles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[
              { title: "Transparency", desc: "Open and honest communication with stakeholders" },
              { title: "Accountability", desc: "Clear responsibility and answerability" },
              { title: "Fairness", desc: "Equitable treatment of all stakeholders" },
              { title: "Integrity", desc: "Highest ethical standards in all operations" },
              { title: "Compliance", desc: "Adherence to laws and regulations" },
              { title: "Sustainability", desc: "Long-term thinking in decisions" },
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
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">Policies & Framework</h2>
          <div className="space-y-4">
            {[
              {
                title: "Whistleblowing Policy",
                desc: "We encourage reporting of any instances of suspected unethical, illegal, corrupt, fraudulent, or undesirable conduct. We provide protections to individuals who disclose without fear of victimisation.",
              },
              {
                title: "Insider Trading Policy",
                desc: "We maintain strict guidelines on insider information and securities trading to ensure fair market practices.",
              },
              {
                title: "Code of Conduct",
                desc: "Our code of conduct outlines expected behaviors for all employees and stakeholders.",
              },
              {
                title: "Anti-Corruption Policy",
                desc: "Zero tolerance for corruption and bribery in any form.",
              },
            ].map((policy, i) => (
              <div key={i} className="bg-white p-5 rounded-xl shadow-sm">
                <h3 className="text-lg font-bold text-primary-900 mb-2">{policy.title}</h3>
                <p className="text-surface-600 text-sm">{policy.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6">Certifications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { title: "ISO 9001", desc: "Quality Management" },
              { title: "ISO 14001", desc: "Environmental Management" },
              { title: "FSSC 22000", desc: "Food Safety" },
              { title: "ISO 45001", desc: "Occupational Health" },
            ].map((item, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-accent-500 text-center">
                <h3 className="font-bold text-primary-900 text-sm">{item.title}</h3>
                <p className="text-surface-600 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-900 text-white py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Corporate Governance</h2>
        <p className="text-primary-100 mb-6 max-w-xl mx-auto">
          We are committed to maintaining the highest standards of corporate governance
        </p>
        <Link href="/contact" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Contact Us
        </Link>
      </section>
    </div>
  );
}