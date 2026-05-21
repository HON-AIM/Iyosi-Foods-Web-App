"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Subscription failed");
      }

      setSubmitted(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-500/20 border border-green-400/30 rounded-lg px-4 py-3 text-white text-center">
        <p className="font-medium">Thank you for subscribing!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full md:w-auto gap-2">
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="px-4 py-3 rounded-lg bg-white text-gray-900 w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-accent-500"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-accent-500 hover:bg-accent-600 text-white font-bold px-6 py-3 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
      >
        {loading ? "..." : "Subscribe"}
      </button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </form>
  );
}
