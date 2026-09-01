"use client";

import { useState, useCallback, useRef } from "react";
import { z } from "zod";

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  category: string;
  message: string;
  honeypot?: string;
}

interface SubmissionResponse {
  success: boolean;
  message: string;
  ticketId?: string;
}

const ContactFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50).trim(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50).trim(),
  email: z.string().email("Invalid email address").max(100).trim().toLowerCase(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number").optional().or(z.literal("")),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(100).trim(),
  category: z.enum(["BUSINESS_INQUIRY", "INVESTMENT", "PRODUCT_SUPPORT", "COMPLAINT", "OTHER"]),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000).trim(),
  honeypot: z.string().optional(),
});

const CONTACT_CATEGORIES = [
  { value: "BUSINESS_INQUIRY", label: "Business Inquiry" },
  { value: "INVESTMENT", label: "Investment Opportunity" },
  { value: "PRODUCT_SUPPORT", label: "Product Support" },
  { value: "COMPLAINT", label: "Complaint/Feedback" },
  { value: "OTHER", label: "Other" },
];

const CONTACT_INFO = {
  headquarters: {
    title: "Corporate Headquarters",
    lines: ["Iyosi Foods LTD Towers", "Central Business District", "Lagos, Nigeria"],
  },
  phone: {
    title: "Phone",
    primary: "+234 814 310 2609",
    secondary: "+234 814 310 2609",
  },
  email: {
    title: "Email",
    address: "iyosi_foods@gmail.com",
  },
  hours: {
    title: "Business Hours",
    lines: ["Monday - Friday: 9:00 AM - 6:00 PM", "Saturday: 10:00 AM - 3:00 PM", "Sunday: Closed"],
  },
};

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    category: "BUSINESS_INQUIRY",
    message: "",
    honeypot: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionResponse, setSubmissionResponse] = useState<SubmissionResponse | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const submitTimeoutRef = useRef<NodeJS.Timeout>(undefined);
  const formRef = useRef<HTMLFormElement>(null);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setErrors({});
      setGeneralError(null);

      if (formData.honeypot && formData.honeypot.length > 0) {
        console.warn("[SECURITY] Honeypot field filled");
        setSubmissionResponse({ success: true, message: "Thank you! Your message has been sent." });
        return;
      }

      const validation = ContactFormSchema.safeParse(formData);

      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.errors.forEach((error) => {
          fieldErrors[error.path.join(".")] = error.message;
        });
        setErrors(fieldErrors);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone || undefined,
            subject: formData.subject,
            category: formData.category,
            message: formData.message,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to send message. Please try again.");
        }

        const data: SubmissionResponse = await response.json();
        setSubmissionResponse(data);
        setSubmitted(true);
        setFormData({ firstName: "", lastName: "", email: "", phone: "", subject: "", category: "BUSINESS_INQUIRY", message: "", honeypot: "" });

        submitTimeoutRef.current = setTimeout(() => {
          setSubmitted(false);
          setSubmissionResponse(null);
        }, 5000);

        formRef.current?.scrollIntoView({ behavior: "smooth" });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        setGeneralError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [formData]
  );

  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-gradient-to-r from-primary-900 to-primary-800 text-white py-16 md:py-24 px-4 md:px-8 text-center border-b-4 border-accent-500">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4">Get In Touch</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-3xl mx-auto font-light">
          Have questions about our products or interested in partnerships? We&apos;d love to hear from you.
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="bg-white rounded-2xl shadow-sm border border-surface-100 p-6 text-center hover:shadow-md transition-shadow">
              <div className="text-4xl mb-3">📍</div>
              <h3 className="text-lg font-bold text-primary-900 mb-2">{CONTACT_INFO.headquarters.title}</h3>
              <p className="text-sm text-surface-600">{CONTACT_INFO.headquarters.lines.join(", ")}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-surface-100 p-6 text-center hover:shadow-md transition-shadow">
              <div className="text-4xl mb-3">📞</div>
              <h3 className="text-lg font-bold text-primary-900 mb-2">{CONTACT_INFO.phone.title}</h3>
              <div className="space-y-2">
                <a href={`tel:${CONTACT_INFO.phone.primary.replace(/\s/g, "")}`} className="block text-sm text-primary-600 hover:text-primary-700 font-medium">{CONTACT_INFO.phone.primary}</a>
                <a href={`tel:${CONTACT_INFO.phone.secondary.replace(/\s/g, "")}`} className="block text-sm text-primary-600 hover:text-primary-700 font-medium">{CONTACT_INFO.phone.secondary}</a>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-surface-100 p-6 text-center hover:shadow-md transition-shadow">
              <div className="text-4xl mb-3">✉️</div>
              <h3 className="text-lg font-bold text-primary-900 mb-2">{CONTACT_INFO.email.title}</h3>
              <a href={`mailto:${CONTACT_INFO.email.address}`} className="text-sm text-primary-600 hover:text-primary-700 font-medium break-all">{CONTACT_INFO.email.address}</a>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-surface-100 p-6 text-center hover:shadow-md transition-shadow">
              <div className="text-4xl mb-3">🕐</div>
              <h3 className="text-lg font-bold text-primary-900 mb-2">{CONTACT_INFO.hours.title}</h3>
              <p className="text-xs text-surface-600">{CONTACT_INFO.hours.lines.join("\n")}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-surface-200 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="bg-gradient-to-br from-primary-900 to-primary-800 text-white p-8 md:p-12 flex flex-col justify-center">
                <h2 className="text-3xl font-bold text-accent-500 mb-8">Send us a Message</h2>
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="text-2xl">⚡</div>
                    <div>
                      <h4 className="font-bold text-lg text-white mb-1">Quick Response</h4>
                      <p className="text-primary-100 text-sm">We typically respond within 24 business hours</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-2xl">🔒</div>
                    <div>
                      <h4 className="font-bold text-lg text-white mb-1">Secure & Confidential</h4>
                      <p className="text-primary-100 text-sm">Your information is encrypted and protected</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-2xl">👥</div>
                    <div>
                      <h4 className="font-bold text-lg text-white mb-1">Expert Support</h4>
                      <p className="text-primary-100 text-sm">Our team is ready to assist with any inquiries</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-12">
                {submitted && submissionResponse?.success && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 font-semibold flex items-center gap-2">
                      <span className="text-lg">✓</span>
                      {submissionResponse.message}
                    </p>
                  </div>
                )}

                {generalError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 font-semibold flex items-center gap-2">
                      <span className="text-lg">⚠️</span>
                      {generalError}
                    </p>
                  </div>
                )}

                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                  <input type="text" name="honeypot" value={formData.honeypot} onChange={handleInputChange} style={{ display: "none" }} tabIndex={-1} autoComplete="off" aria-hidden="true" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-semibold text-surface-700 mb-2">First Name *</label>
                      <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="John" className={`w-full px-4 py-2.5 bg-surface-50 border rounded-lg focus:outline-none focus:ring-2 ${errors.firstName ? "border-red-400 focus:ring-red-500" : "border-surface-300 focus:ring-primary-500"}`} disabled={loading} required />
                      {errors.firstName && <p className="text-red-600 text-xs font-medium mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-semibold text-surface-700 mb-2">Last Name *</label>
                      <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Doe" className={`w-full px-4 py-2.5 bg-surface-50 border rounded-lg focus:outline-none focus:ring-2 ${errors.lastName ? "border-red-400 focus:ring-red-500" : "border-surface-300 focus:ring-primary-500"}`} disabled={loading} required />
                      {errors.lastName && <p className="text-red-600 text-xs font-medium mt-1">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-surface-700 mb-2">Email Address *</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" className={`w-full px-4 py-2.5 bg-surface-50 border rounded-lg focus:outline-none focus:ring-2 ${errors.email ? "border-red-400 focus:ring-red-500" : "border-surface-300 focus:ring-primary-500"}`} disabled={loading} required />
                    {errors.email && <p className="text-red-600 text-xs font-medium mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-surface-700 mb-2">Phone Number (Optional)</label>
                    <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+234 801 234 5678" className={`w-full px-4 py-2.5 bg-surface-50 border rounded-lg focus:outline-none focus:ring-2 ${errors.phone ? "border-red-400 focus:ring-red-500" : "border-surface-300 focus:ring-primary-500"}`} disabled={loading} />
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-semibold text-surface-700 mb-2">Inquiry Category *</label>
                    <select id="category" name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" disabled={loading} required>
                      {CONTACT_CATEGORIES.map((cat) => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-semibold text-surface-700 mb-2">Subject *</label>
                    <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleInputChange} placeholder="What is this about?" className={`w-full px-4 py-2.5 bg-surface-50 border rounded-lg focus:outline-none focus:ring-2 ${errors.subject ? "border-red-400 focus:ring-red-500" : "border-surface-300 focus:ring-primary-500"}`} disabled={loading} required />
                    {errors.subject && <p className="text-red-600 text-xs font-medium mt-1">{errors.subject}</p>}
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-surface-700 mb-2">Message * ({formData.message.length}/5000)</label>
                    <textarea id="message" name="message" value={formData.message} onChange={handleInputChange} placeholder="Tell us more about your inquiry..." rows={5} maxLength={5000} className={`w-full px-4 py-2.5 bg-surface-50 border rounded-lg focus:outline-none focus:ring-2 resize-none ${errors.message ? "border-red-400 focus:ring-red-500" : "border-surface-300 focus:ring-primary-500"}`} disabled={loading} required />
                    {errors.message && <p className="text-red-600 text-xs font-medium mt-1">{errors.message}</p>}
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 disabled:from-surface-300 disabled:to-surface-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all shadow-md hover:shadow-lg">
                    {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</span> : "Send Message"}
                  </button>

                  <p className="text-xs text-surface-600 text-center">We respect your privacy. Your information will not be shared.</p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
