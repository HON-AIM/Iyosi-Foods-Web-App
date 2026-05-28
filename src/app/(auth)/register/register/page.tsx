"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";

// ✅ Validation schema - strict requirements
const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters")
      .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
      .trim(),
    email: z
      .string()
      .email("Invalid email address")
      .max(100, "Email must be less than 100 characters")
      .trim()
      .toLowerCase(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number")
      .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
    confirmPassword: z.string(),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the Terms of Service and Privacy Policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordStrength = "too-short" | "weak" | "medium" | "strong";

// ✅ Password strength calculator
function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) return "too-short";
  let score = 0;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  if (score <= 1) return "weak";
  if (score <= 3) return "medium";
  return "strong";
}

// ✅ Strength configuration
const strengthConfig = {
  "too-short": {
    label: "Too short",
    color: "bg-surface-300 dark:bg-surface-600",
    textColor: "text-surface-500 dark:text-surface-400",
    width: "w-0",
  },
  weak: {
    label: "Weak",
    color: "bg-red-500",
    textColor: "text-red-600 dark:text-red-400",
    width: "w-1/4",
  },
  medium: {
    label: "Medium",
    color: "bg-yellow-500",
    textColor: "text-yellow-600 dark:text-yellow-400",
    width: "w-1/2",
  },
  strong: {
    label: "Strong",
    color: "bg-green-500",
    textColor: "text-green-600 dark:text-green-400",
    width: "w-full",
  },
};

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreeTerms?: string;
  general?: string;
}

// ✅ Loading skeleton
function RegisterSkeleton() {
  return (
    <div className="w-full max-w-md space-y-6 animate-pulse">
      <div className="space-y-2 text-center">
        <div className="h-8 bg-surface-200 dark:bg-surface-700 rounded w-3/4 mx-auto" />
        <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/2 mx-auto" />
      </div>
      <div className="space-y-4">
        <div className="h-10 bg-surface-200 dark:bg-surface-700 rounded" />
        <div className="h-10 bg-surface-200 dark:bg-surface-700 rounded" />
        <div className="h-10 bg-surface-200 dark:bg-surface-700 rounded" />
        <div className="h-10 bg-surface-200 dark:bg-surface-700 rounded" />
      </div>
      <div className="h-10 bg-surface-200 dark:bg-surface-700 rounded" />
    </div>
  );
}

// ✅ Success message component
interface SuccessProps {
  email: string;
  onResend: () => void;
}

function SuccessMessage({ email, onResend }: SuccessProps) {
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // ✅ Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // ✅ Handle resend verification email
  const handleResend = async () => {
    setResendLoading(true);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setResendSuccess(true);
        setCountdown(60);
        setTimeout(() => setResendSuccess(false), 3000);
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100 p-8 rounded-2xl shadow-sm text-center space-y-4">
        {/* Success Icon */}
        <div className="text-5xl">✉️</div>

        {/* Title */}
        <h3 className="text-2xl font-bold">Check your inbox!</h3>

        {/* Message */}
        <p className="text-sm">
          We sent a verification link to{" "}
          <span className="font-semibold text-green-700 dark:text-green-200 break-all">
            {email}
          </span>
          .
        </p>

        {/* Instructions */}
        <div className="bg-white dark:bg-surface-800 rounded-lg p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase">
            What to do next:
          </p>
          <ol className="text-sm text-surface-600 dark:text-surface-400 space-y-2">
            <li className="flex gap-2">
              <span className="font-bold text-green-600 dark:text-green-400 flex-shrink-0">1.</span>
              <span>Check your email inbox for our verification message</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-green-600 dark:text-green-400 flex-shrink-0">2.</span>
              <span>Click the "Verify Email" button in the email</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-green-600 dark:text-green-400 flex-shrink-0">3.</span>
              <span>You'll be able to log in to your account</span>
            </li>
          </ol>

          {/* Spam warning */}
          <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              💡 <strong>Tip:</strong> If you don't see our email, check your spam or junk folder.
            </p>
          </div>
        </div>

        {/* Security notice */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            🔒 Your account is secure. The verification link expires in 24 hours.
          </p>
        </div>
      </div>

      {/* Resend button */}
      <div className="space-y-2">
        {resendSuccess && (
          <p className="text-xs text-green-600 dark:text-green-400 text-center font-medium">
            ✓ Verification email resent successfully!
          </p>
        )}
        <button
          onClick={handleResend}
          disabled={resendLoading || countdown < 60}
          className="w-full py-2.5 px-4 border-2 border-green-600 dark:border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed font-bold rounded-lg transition-colors"
        >
          {resendLoading ? "Sending..." : countdown < 60 ? `Resend in ${countdown}s` : "Resend verification email"}
        </button>
      </div>

      {/* Go to login */}
      <Link
        href="/login?registered=true"
        className="block w-full py-2.5 px-4 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 text-white font-bold rounded-lg transition-colors text-center"
      >
        Go to Login
      </Link>
    </div>
  );
}

// ✅ Registration form component
function RegisterForm() {
  const router = useRouter();

  // ✅ State management
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const submitTimeoutRef = useRef<NodeJS.Timeout>(null);

  // ✅ Get password strength
  const strength = formData.password
    ? getPasswordStrength(formData.password)
    : null;

  // ✅ Handle form input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, type, value, checked } = e.target;

      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));

      // Clear field error on change
      if (errors[name as keyof FormErrors]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name as keyof FormErrors];
          return newErrors;
        });
      }

      // Clear general error
      if (errors.general) {
        setErrors((prev) => ({ ...prev, general: undefined }));
      }
    },
    [errors]
  );

  // ✅ Validate form
  const validateForm = useCallback((): boolean => {
    setErrors({});

    const validation = RegisterSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      validation.error.issues.forEach((err) => {
        fieldErrors[err.path[0] as keyof FormErrors] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }

    return true;
  }, [formData]);

  // ✅ Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Prevent double submission
      if (loading || submitTimeoutRef.current) return;

      // Validate form
      if (!validateForm()) {
        return;
      }

      setLoading(true);

      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 409) {
            setErrors({
              email: data.message || "This email is already registered.",
            });
          } else if (res.status === 429) {
            setErrors({
              general: "Too many registration attempts. Please try again later.",
            });
          } else {
            setErrors({
              general:
                data.message || "Registration failed. Please try again.",
            });
          }
          setLoading(false);
          return;
        }

        // ✅ Success
        setSuccessEmail(formData.email);
        setSuccess(true);

        // ✅ Log audit event
        console.info("[AUDIT] User registered:", {
          email: formData.email,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error("[ERROR] Registration failed:", err);
        setErrors({
          general:
            err instanceof Error
              ? err.message
              : "An unexpected error occurred. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    },
    [formData, loading, validateForm]
  );

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  if (success) {
    return <SuccessMessage email={successEmail} onResend={() => {}} />;
  }

  return (
    <form
      className="w-full max-w-md space-y-6 bg-white dark:bg-surface-800 p-8 rounded-2xl shadow-lg border border-surface-200 dark:border-surface-700"
      onSubmit={handleSubmit}
      noValidate
    >
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 dark:bg-primary-700 rounded-lg mb-4">
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
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold text-primary-900 dark:text-white">
          Create account
        </h2>
        <p className="mt-2 text-sm text-surface-600 dark:text-surface-400">
          Join IYOSIOLA GROUP today
        </p>
      </div>

      {/* General Error */}
      {errors.general && (
        <div
          role="alert"
          className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium flex items-start gap-3"
        >
          <span className="text-lg mt-0.5">⚠️</span>
          <p>{errors.general}</p>
        </div>
      )}

      {/* Full Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-semibold text-primary-900 dark:text-white mb-2"
        >
          Full Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="John Doe"
          disabled={loading}
          required
          aria-describedby={errors.name ? "name-error" : undefined}
          className={`w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border rounded-lg focus:outline-none focus:ring-2 transition-all text-primary-900 dark:text-white placeholder-surface-500 dark:placeholder-surface-400 ${
            errors.name
              ? "border-red-400 dark:border-red-600 focus:ring-red-500"
              : "border-surface-300 dark:border-surface-600 focus:ring-primary-500"
          }`}
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email */}
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
          value={formData.email}
          onChange={handleInputChange}
          placeholder="you@example.com"
          disabled={loading}
          required
          aria-describedby={errors.email ? "email-error" : undefined}
          className={`w-full px-4 py-3 bg-surface-50 dark:bg-surface-700 border rounded-lg focus:outline-none focus:ring-2 transition-all text-primary-900 dark:text-white placeholder-surface-500 dark:placeholder-surface-400 ${
            errors.email
              ? "border-red-400 dark:border-red-600 focus:ring-red-500"
              : "border-surface-300 dark:border-surface-600 focus:ring-primary-500"
          }`}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-primary-900 dark:text-white mb-2"
        >
          Password *
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••"
            disabled={loading}
            required
            aria-describedby={errors.password ? "password-error" : "password-strength"}
            className={`w-full px-4 py-3 pr-12 bg-surface-50 dark:bg-surface-700 border rounded-lg focus:outline-none focus:ring-2 transition-all text-primary-900 dark:text-white placeholder-surface-500 dark:placeholder-surface-400 ${
              errors.password
                ? "border-red-400 dark:border-red-600 focus:ring-red-500"
                : "border-surface-300 dark:border-surface-600 focus:ring-primary-500"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.084 14.158a3 3 0 0 1-4.242-4.242"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m2 2 20 20"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
                />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {strength && (
          <div id="password-strength" className="mt-3 space-y-2">
            <div className="flex gap-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i <
                    (strength === "weak"
                      ? 1
                      : strength === "medium"
                        ? 2
                        : strength === "strong"
                          ? 4
                          : 0)
                      ? strengthConfig[strength].color
                      : "bg-surface-200 dark:bg-surface-600"
                  }`}
                />
              ))}
            </div>
            <p className={`text-xs font-medium ${strengthConfig[strength].textColor}`}>
              {strengthConfig[strength].label} password
              {strength !== "strong" && (
                <span className="block text-surface-500 dark:text-surface-400 font-normal">
                  {!formData.password.match(/[A-Z]/) && "• Add uppercase letter "}
                  {!formData.password.match(/[a-z]/) && "• Add lowercase letter "}
                  {!formData.password.match(/[0-9]/) && "• Add number "}
                  {!formData.password.match(/[^A-Za-z0-9]/) && "• Add special character"}
                </span>
              )}
            </p>
          </div>
        )}

        {errors.password && (
          <p id="password-error" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
            {errors.password}
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-semibold text-primary-900 dark:text-white mb-2"
        >
          Confirm Password *
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="••••••••"
            disabled={loading}
            required
            aria-describedby={
              errors.confirmPassword ? "confirm-error" : undefined
            }
            className={`w-full px-4 py-3 pr-12 bg-surface-50 dark:bg-surface-700 border rounded-lg focus:outline-none focus:ring-2 transition-all text-primary-900 dark:text-white placeholder-surface-500 dark:placeholder-surface-400 ${
              errors.confirmPassword
                ? "border-red-400 dark:border-red-600 focus:ring-red-500"
                : "border-surface-300 dark:border-surface-600 focus:ring-primary-500"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
            aria-label={
              showConfirmPassword ? "Hide password" : "Show password"
            }
            tabIndex={-1}
          >
            {showConfirmPassword ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.084 14.158a3 3 0 0 1-4.242-4.242"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m2 2 20 20"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
                />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {formData.password &&
          formData.confirmPassword &&
          formData.password === formData.confirmPassword && (
            <p className="mt-1 text-xs text-green-600 dark:text-green-400 font-medium">
              ✓ Passwords match
            </p>
          )}

        {errors.confirmPassword && (
          <p id="confirm-error" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      {/* Terms & Conditions */}
      <div>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="agreeTerms"
            checked={formData.agreeTerms}
            onChange={handleInputChange}
            disabled={loading}
            className="w-4 h-4 mt-1 rounded border-surface-300 dark:border-surface-600 text-primary-600 focus:ring-primary-500 cursor-pointer"
            required
            aria-describedby={
              errors.agreeTerms ? "terms-error" : undefined
            }
          />
          <span className="text-xs text-surface-700 dark:text-surface-300">
            I agree to the{" "}
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              Privacy Policy
            </Link>
            *
          </span>
        </label>

        {errors.agreeTerms && (
          <p id="terms-error" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
            {errors.agreeTerms}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={
          loading ||
          !formData.name ||
          !formData.email ||
          !formData.password ||
          !formData.confirmPassword ||
          !formData.agreeTerms ||
          strength === "too-short"
        }
        className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-surface-300 disabled:to-surface-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Creating account...
          </>
        ) : (
          "Create Account"
        )}
      </button>

      {/* Security notice */}
      <p className="text-center text-xs text-surface-500 dark:text-surface-400">
        🔒 Your information is encrypted and secure
      </p>
    </form>
  );
}

// ✅ Main page component
export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<RegisterSkeleton />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
