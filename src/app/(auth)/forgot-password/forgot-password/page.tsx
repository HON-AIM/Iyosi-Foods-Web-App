"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";

// ✅ Validation schema
const EmailSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(100, "Email must be less than 100 characters")
    .trim()
    .toLowerCase(),
});

// ✅ Type definitions
interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

// ✅ Loading skeleton
function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 bg-surface-200 rounded-lg" />
      <div className="h-10 bg-surface-200 rounded-lg" />
      <div className="h-10 bg-surface-200 rounded-lg" />
    </div>
  );
}

// ✅ Success message component
interface SuccessMessageProps {
  email: string;
  onReset: () => void;
}

function SuccessMessage({ email, onReset }: SuccessMessageProps) {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  return (
    <div className="mt-8 space-y-6">
      {/* Success Card */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-8 shadow-sm">
        {/* Checkmark Icon */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Message */}
        <h3 className="text-center text-xl font-bold text-primary-900 mb-2">
          Reset Link Sent!
        </h3>

        <p className="text-center text-surface-700 mb-4">
          We've sent a password reset link to your email. The link will expire in
          <span className="font-bold text-primary-600"> 24 hours</span>.
        </p>

        {/* Important note */}
        <div className="bg-white rounded-lg p-4 mb-4 border border-surface-200">
          <p className="text-sm text-surface-700">
            <strong>💡 Tip:</strong> If you don't receive the email within a few
            minutes, check your spam or junk folder. Add{" "}
            <code className="bg-surface-100 px-2 py-1 rounded text-xs">
              israelmiracle12@gmail.com
            </code>{" "}
            to your contacts to prevent future emails from going to spam.
          </p>
        </div>

        {/* Next steps */}
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-lg">1️⃣</span>
            <div>
              <p className="font-semibold text-surface-900">Check your email</p>
              <p className="text-surface-600">
                Look for an email from{" "}
                <span className="font-mono text-xs bg-surface-100 px-2 py-1 rounded">
                  israelmiracle12@gmail.com
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">2️⃣</span>
            <div>
              <p className="font-semibold text-surface-900">Click the link</p>
              <p className="text-surface-600">
                Click the "Reset Password" button in the email
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">3️⃣</span>
            <div>
              <p className="font-semibold text-surface-900">Create new password</p>
              <p className="text-surface-600">
                Enter a strong password that you haven't used before
              </p>
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>🔒 Security:</strong> Never share your reset link with anyone.
            IYOSIOLA GROUP will never ask for your password via email.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={onReset}
          className="w-full py-2.5 px-4 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-bold rounded-lg transition-colors"
        >
          ← Try a different email
        </button>

        <Link
          href="/login"
          className="block w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-colors text-center"
        >
          Back to Login
        </Link>
      </div>

      {/* Countdown timer */}
      {countdown > 0 && (
        <p className="text-center text-xs text-surface-500">
          Auto-redirect in {countdown}s
        </p>
      )}
    </div>
  );
}

// ✅ Main forgot password component
export default function ForgotPasswordPage() {
  const router = useRouter();
  const submitTimeoutRef = useRef<NodeJS.Timeout>(null);

  // ✅ State management
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          // User is logged in, redirect to dashboard
          router.push("/dashboard");
        }
      } catch (err) {
        // Not logged in, continue
        console.debug("[DEBUG] User not authenticated");
      }
    };

    checkAuth();
  }, [router]);

  // ✅ Handle email input change
  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
      // Clear validation error when user starts typing
      if (validationError) {
        setValidationError(null);
      }
    },
    [validationError]
  );

  // ✅ Validate email format
  const validateEmail = useCallback((): boolean => {
    const validation = EmailSchema.safeParse({ email });

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      setValidationError(firstError.message);
      return false;
    }

    setValidationError(null);
    return true;
  }, [email]);

  // ✅ Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // ✅ Prevent double submission
      if (loading) return;

      // ✅ Validate email
      if (!validateEmail()) {
        return;
      }

      setError(null);
      setLoading(true);

      try {
        const response = await fetch("/api/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });

        // ✅ Don't reveal account existence - show success regardless
        if (response.ok) {
          const data: ForgotPasswordResponse = await response.json();
          setSuccess(true);

          // ✅ Auto-redirect to login after 60 seconds
          submitTimeoutRef.current = setTimeout(() => {
            router.push("/login");
          }, 60000);
        } else {
          // Generic error message to prevent account enumeration
          const data = await response.json().catch(() => ({}));

          if (response.status === 429) {
            setError(
              "Too many requests. Please try again in a few minutes."
            );
          } else if (response.status === 400) {
            setError(data.message || "Invalid email format.");
          } else {
            setError(
              "Unable to process your request. Please try again later."
            );
          }
        }
      } catch (err) {
        console.error("[ERROR] Forgot password request failed:", err);
        setError(
          "Network error. Please check your connection and try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [email, loading, validateEmail, router]
  );

  // ✅ Handle reset (try different email)
  const handleReset = useCallback(() => {
    setSuccess(false);
    setEmail("");
    setError(null);
    setValidationError(null);

    // Clear timeout if exists
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }
  }, []);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-lg mb-4">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-primary-900 dark:text-white">
            Reset Password
          </h1>
          <p className="mt-2 text-surface-600 dark:text-surface-400">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-lg border border-surface-200 dark:border-surface-700 p-8">
          {!success ? (
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              {/* Error Message */}
              {error && (
                <div
                  role="alert"
                  className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium flex items-start gap-3"
                >
                  <span className="text-lg mt-0.5">⚠️</span>
                  <p>{error}</p>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-primary-900 dark:text-white mb-2"
                >
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="you@example.com"
                  disabled={loading}
                  required
                  aria-label="Email address"
                  aria-describedby={
                    validationError ? "email-error" : undefined
                  }
                  className={`w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border rounded-lg focus:outline-none focus:ring-2 transition-all text-primary-900 dark:text-white placeholder-surface-500 dark:placeholder-surface-400 ${
                    validationError
                      ? "border-red-400 dark:border-red-600 focus:ring-red-500"
                      : "border-surface-300 dark:border-surface-600 focus:ring-primary-500"
                  }`}
                />
                {validationError && (
                  <p
                    id="email-error"
                    className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium"
                  >
                    {validationError}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-surface-300 disabled:to-surface-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>

              {/* Back to Login Link */}
              <div className="flex items-center justify-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition-colors"
                >
                  <span>←</span> Back to Login
                </Link>
              </div>

              {/* Additional Help */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-400">
                  <strong>Need help?</strong> If you don't recognize your email or
                  account, please{" "}
                  <Link
                    href="/contact"
                    className="underline hover:no-underline font-semibold"
                  >
                    contact our support team
                  </Link>
                  .
                </p>
              </div>
            </form>
          ) : (
            <SuccessMessage email={email} onReset={handleReset} />
          )}
        </div>

        {/* Security Notice */}
        <p className="text-center text-xs text-surface-500 dark:text-surface-400">
          🔒 This page is secure and encrypted. Your password information is
          protected.
        </p>
      </div>
    </div>
  );
}
