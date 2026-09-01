"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

export default function PartnersPage() {
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    },
    [errors]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setGeneralError(null);

      const newErrors: Record<string, string> = {};
      if (!formData.companyName.trim() || formData.companyName.trim().length < 2) newErrors.companyName = "Company name is required";
      if (!formData.contactPerson.trim() || formData.contactPerson.trim().length < 2) newErrors.contactPerson = "Contact person is required";
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Valid email is required";
      if (!formData.phone.trim()) newErrors.phone = "Phone is required";
      if (!formData.address.trim() || formData.address.trim().length < 5) newErrors.address = "Address is required (min 5 characters)";
      if (!formData.description.trim() || formData.description.trim().length < 10) newErrors.description = "Please describe your business (min 10 characters)";

      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return;

      setLoading(true);

      try {
        const res = await fetch("/api/partners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: formData.companyName.trim(),
            contactPerson: formData.contactPerson.trim(),
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone.trim(),
            address: formData.address.trim(),
            description: formData.description.trim(),
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Submission failed");

        setSubmitted(true);
      } catch (err) {
        setGeneralError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [formData]
  );

  const benefits = [
    { title: "Competitive Margins", desc: "Attractive profit margins on all products", icon: "💰" },
    { title: "Training Support", desc: "Comprehensive product and sales training", icon: "📚" },
    { title: "Marketing Materials", desc: "Free point-of-sale and promotional materials", icon: "📢" },
    { title: "Priority Supply", desc: "Guaranteed product availability for partners", icon: "✅" },
    { title: "Business Growth", desc: "Support for business expansion", icon: "📈" },
    { title: "Dedicated Support", desc: "Account manager for personalized service", icon: "👤" },
  ];

  const requirements = [
    "Valid business registration (CAC)",
    "Existing distribution network",
    "Reliable transportation",
    "Storage facilities",
    "Track record in FMCG distribution",
    "Financial stability",
  ];

  const process = [
    { step: "1", title: "Submit Application", desc: "Fill out the application form" },
    { step: "2", title: "Document Review", desc: "We review your business documents" },
    { step: "3", title: "Site Visit", desc: "Our team visits your facility" },
    { step: "4", title: "Agreement", desc: "Sign partnership contract" },
    { step: "5", title: "Onboarding", desc: "Training and initial stock" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-primary-900 text-white py-16 md:py-20 px-4 md:px-8 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Distributor Partnerships</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Grow your business with Nigeria&apos;s leading FMCG company
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-6 text-center">
            Why Become a Distributor
          </h2>
          <p className="text-lg text-surface-700 leading-relaxed mb-12 text-center">
            Partner with Iyosi Foods LTD and distribute our premium products across Nigeria. 
            We offer attractive margins, comprehensive support, and a mutually beneficial partnership.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {benefits.map((benefit, i) => (
              <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-surface-100 text-center">
                <span className="text-3xl block mb-3">{benefit.icon}</span>
                <h3 className="text-base font-bold text-primary-900 mb-1">{benefit.title}</h3>
                <p className="text-surface-600 text-sm">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-50 py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-8 text-center">
            Partnership Requirements
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            {requirements.map((req, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm flex items-center gap-3">
                <span className="w-8 h-8 bg-accent-100 rounded-full flex items-center justify-center text-accent-600 font-bold">
                  {i + 1}
                </span>
                <span className="text-surface-700 text-sm">{req}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-900 mb-8 text-center">
            How to Become a Partner
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {process.map((p, i) => (
              <div key={i} className="flex flex-col items-center max-w-[180px]">
                <div className="w-16 h-16 bg-primary-900 rounded-full flex items-center justify-center text-white font-bold text-xl mb-3">
                  {p.step}
                </div>
                <h3 className="text-sm font-bold text-primary-900 mb-1">{p.title}</h3>
                <p className="text-xs text-surface-600 text-center">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-50 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <h2 className="text-2xl font-bold text-primary-900 mb-6 text-center">
              Apply Now
            </h2>

            {submitted && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-green-700 font-semibold">Application submitted successfully! Our team will contact you within 3-5 business days.</p>
              </div>
            )}

            {generalError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                <p className="text-red-700 text-sm">{generalError}</p>
              </div>
            )}

            {!submitted && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-surface-700 mb-1">Company Name *</label>
                    <input type="text" id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-accent-500 ${errors.companyName ? "border-red-400" : "border-surface-200"}`} disabled={loading} required />
                    {errors.companyName && <p className="text-red-600 text-xs mt-1">{errors.companyName}</p>}
                  </div>
                  <div>
                    <label htmlFor="contactPerson" className="block text-sm font-medium text-surface-700 mb-1">Contact Person *</label>
                    <input type="text" id="contactPerson" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-accent-500 ${errors.contactPerson ? "border-red-400" : "border-surface-200"}`} disabled={loading} required />
                    {errors.contactPerson && <p className="text-red-600 text-xs mt-1">{errors.contactPerson}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-surface-700 mb-1">Email *</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-accent-500 ${errors.email ? "border-red-400" : "border-surface-200"}`} disabled={loading} required />
                    {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-surface-700 mb-1">Phone *</label>
                    <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-accent-500 ${errors.phone ? "border-red-400" : "border-surface-200"}`} disabled={loading} required />
                    {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-surface-700 mb-1">Business Address *</label>
                  <textarea id="address" name="address" value={formData.address} onChange={handleChange} rows={3} className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-accent-500 ${errors.address ? "border-red-400" : "border-surface-200"}`} disabled={loading} required />
                  {errors.address && <p className="text-red-600 text-xs mt-1">{errors.address}</p>}
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-surface-700 mb-1">Describe Your Business *</label>
                  <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Tell us about your distribution experience, coverage area, and why you want to partner with us..." className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-accent-500 ${errors.description ? "border-red-400" : "border-surface-200"}`} disabled={loading} required />
                  {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description}</p>}
                </div>
                <button type="submit" disabled={loading} className="w-full bg-accent-500 hover:bg-accent-600 disabled:bg-surface-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors">
                  {loading ? "Submitting..." : "Submit Application"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="bg-primary-900 text-white py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Questions?</h2>
        <p className="text-primary-100 mb-6">
          Contact our business development team
        </p>
        <Link href="/contact" className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          Contact Us
        </Link>
      </section>
    </div>
  );
}