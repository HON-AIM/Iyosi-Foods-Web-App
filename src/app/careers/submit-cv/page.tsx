"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  coverLetter: string;
  cv: File | null;
}

export default function SubmitCVPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    coverLetter: "",
    cv: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"];
      if (!allowed.includes(file.type)) {
        setErrors((prev) => ({ ...prev, cv: "Invalid file type. Accepted: PDF, DOC, DOCX, JPEG, PNG" }));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, cv: "File size must be under 10MB" }));
        return;
      }
    }
    setFormData((prev) => ({ ...prev, cv: file }));
    if (errors.cv) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.cv;
        return next;
      });
    }
  }, [errors]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim() || formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }
    if (!formData.lastName.trim() || formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Valid email is required";
    }
    if (!formData.cv) {
      newErrors.cv = "Please upload your CV";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setGeneralError(null);

      if (!validate()) return;

      setLoading(true);

      try {
        const fd = new FormData();
        fd.append("firstName", formData.firstName.trim());
        fd.append("lastName", formData.lastName.trim());
        fd.append("email", formData.email.trim().toLowerCase());
        fd.append("phone", formData.phone.trim());
        fd.append("position", formData.position.trim());
        fd.append("coverLetter", formData.coverLetter.trim());
        if (formData.cv) fd.append("cv", formData.cv);

        const res = await fetch("/api/cv", {
          method: "POST",
          body: fd,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Submission failed");
        }

        setSubmitted(true);
      } catch (err) {
        setGeneralError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [formData, validate]
  );

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-primary-900 mb-2">CV Submitted!</h2>
          <p className="text-surface-600 mb-6">
            Thank you for your application. Our HR team will review your CV and reach out if your profile matches our needs.
          </p>
          <div className="space-y-3">
            <Link href="/careers" className="block w-full py-2.5 px-4 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors">
              Browse More Careers
            </Link>
            <Link href="/" className="block w-full py-2.5 px-4 border-2 border-primary-600 text-primary-600 font-bold rounded-lg hover:bg-primary-50 transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <section className="bg-gradient-to-r from-primary-900 to-primary-800 text-white py-16 md:py-20 px-4 text-center border-b-8 border-accent-500">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Submit Your CV</h1>
        <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto font-light">
          Send us your resume and we will keep you in mind for suitable opportunities
        </p>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-surface-200 p-8">
            {generalError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium">{generalError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-surface-700 mb-1">First Name *</label>
                  <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} className={`w-full px-4 py-2.5 bg-surface-50 border rounded-lg focus:outline-none focus:ring-2 ${errors.firstName ? "border-red-400 focus:ring-red-500" : "border-surface-300 focus:ring-primary-500"}`} disabled={loading} required />
                  {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-surface-700 mb-1">Last Name *</label>
                  <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} className={`w-full px-4 py-2.5 bg-surface-50 border rounded-lg focus:outline-none focus:ring-2 ${errors.lastName ? "border-red-400 focus:ring-red-500" : "border-surface-300 focus:ring-primary-500"}`} disabled={loading} required />
                  {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-surface-700 mb-1">Email Address *</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="you@example.com" className={`w-full px-4 py-2.5 bg-surface-50 border rounded-lg focus:outline-none focus:ring-2 ${errors.email ? "border-red-400 focus:ring-red-500" : "border-surface-300 focus:ring-primary-500"}`} disabled={loading} required />
                {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-surface-700 mb-1">Phone Number</label>
                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+234 800 000 0000" className="w-full px-4 py-2.5 bg-surface-50 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" disabled={loading} />
              </div>

              <div>
                <label htmlFor="position" className="block text-sm font-semibold text-surface-700 mb-1">Position of Interest</label>
                <input type="text" id="position" name="position" value={formData.position} onChange={handleInputChange} placeholder="e.g. Production Manager, Sales Executive" className="w-full px-4 py-2.5 bg-surface-50 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" disabled={loading} />
              </div>

              <div>
                <label htmlFor="cv" className="block text-sm font-semibold text-surface-700 mb-1">Upload CV * (PDF, DOC, DOCX, JPEG, PNG - max 10MB)</label>
                <input type="file" id="cv" name="cv" accept=".pdf,.doc,.docx,image/jpeg,image/png" onChange={handleFileChange} className={`w-full px-4 py-2.5 bg-surface-50 border rounded-lg focus:outline-none focus:ring-2 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-primary-600 file:text-white file:text-sm file:font-semibold hover:file:bg-primary-700 ${errors.cv ? "border-red-400 focus:ring-red-500" : "border-surface-300 focus:ring-primary-500"}`} disabled={loading} required />
                {errors.cv && <p className="text-red-600 text-xs mt-1">{errors.cv}</p>}
                {formData.cv && (
                  <p className="text-green-600 text-xs mt-1">Selected: {formData.cv.name} ({(formData.cv.size / 1024 / 1024).toFixed(1)} MB)</p>
                )}
              </div>

              <div>
                <label htmlFor="coverLetter" className="block text-sm font-semibold text-surface-700 mb-1">Cover Letter / Notes</label>
                <textarea id="coverLetter" name="coverLetter" value={formData.coverLetter} onChange={handleInputChange} rows={5} placeholder="Tell us about yourself, your experience, and why you'd like to join Iyosiola Group..." maxLength={3000} className="w-full px-4 py-2.5 bg-surface-50 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" disabled={loading} />
                <p className="text-xs text-surface-400 text-right">{formData.coverLetter.length}/3000</p>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-accent-600 to-accent-700 hover:from-accent-700 hover:to-accent-800 disabled:from-surface-300 disabled:to-surface-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all shadow-md hover:shadow-lg">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  "Submit CV"
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
