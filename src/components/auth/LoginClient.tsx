"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { LoginSchema } from "@/schemas/auth.schema";

// Type definitions
interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface ValidationErrors {
  email?: string;
  password?: string;
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isAccountLocked, setIsAccountLocked] = useState(false);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);

  useEffect(() => {
    const registered = searchParams.get("registered");
    const emailVerified = searchParams.get("emailVerified");

    if (registered === "true") {
      setSuccessMsg(
        "✅ Account created! Please check your email to verify your account before logging in."
      );
    }

    if (emailVerified === "true") {
      setSuccessMsg("✅ Email verified! You can now log in with your account.");
    }

    if (registered === "true" || emailVerified === "true") {
      submitTimeoutRef.current = setTimeout(() => {
        setSuccessMsg(null);
      }, 8000);
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    };
  }, []);

  const validateForm = useCallback((): boolean => {
    setValidationErrors({});
    setError(null);

    const validation = LoginSchema.safeParse(formData as any);

    if (!validation.success) {
      const fieldErrors: ValidationErrors = {};
      validation.error.issues.forEach((error) => {
        const field = error.path[0] as string;
        fieldErrors[field as keyof ValidationErrors] = error.message;
      });
      setValidationErrors(fieldErrors);
      return false;
    }

    return true;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (isAccountLocked) {
        setError(`Account temporarily locked due to multiple failed attempts. Try again in ${lockoutCountdown}s.`);
        return;
      }
      if (loading) return;
      if (!validateForm()) return;

      setError(null);
      setLoading(true);

      try {
        const res = (await signIn("credentials", {
          redirect: false,
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          rememberMe: formData.rememberMe,
        })) as { error?: string; code?: string; ok: boolean } | undefined;

        if (res?.error) {
          const newAttemptCount = attemptCount + 1;
          setAttemptCount(newAttemptCount);

          if (newAttemptCount >= 5) {
            setIsAccountLocked(true);
            setLockoutCountdown(900);
            setError("Account locked due to multiple failed login attempts. Try again in 15 minutes.");
            return;
          }

          const errCode = res.code || res.error;
          if (errCode === "EmailNotVerified") {
            setError("❌ Email not verified. Please check your inbox for the verification link.");
          } else if (errCode === "InvalidCredentials" || errCode === "CredentialsSignin" || errCode === "credentials") {
            setError(`❌ Invalid email or password. ${5 - newAttemptCount} attempt(s) remaining.`);
          } else {
            setError("❌ Login failed. Please try again.");
          }
        } else if (res?.ok) {
          setSuccessMsg("✅ Login successful! Redirecting...");
          setAttemptCount(0);

          const redirectUrl = searchParams.get("callbackUrl") || "/dashboard";
          if (redirectUrl.startsWith("/")) {
            setTimeout(() => {
              router.push(redirectUrl);
              router.refresh();
            }, 500);
          } else {
            setTimeout(() => {
              router.push("/dashboard");
              router.refresh();
            }, 500);
          }
        }
      } catch (err) {
        console.error("[ERROR] Login failed:", err);
        setError("❌ An unexpected error occurred. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    [formData, loading, validateForm, router, searchParams, attemptCount, isAccountLocked, lockoutCountdown]
  );

  return (
    <div className="max-w-md w-full space-y-8 bg-white dark:bg-surface-800 p-8 md:p-10 rounded-2xl shadow-lg border border-surface-200 dark:border-surface-700">
      <div>
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 dark:bg-primary-700 rounded-lg mx-auto mb-4">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h2 className="text-center text-3xl font-extrabold text-primary-900 dark:text-white">Welcome back</h2>
        <p className="mt-2 text-center text-sm text-surface-600 dark:text-surface-400">Sign in to your Iyosiola account</p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {successMsg && <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-md text-sm text-center">{successMsg}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm text-center">{error}</div>}

        <div className="space-y-4">
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input id="email-address" name="email" type="email" autoComplete="email" required className="appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required className="appearance-none rounded-md block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="Your password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link href="/forgot-password" className="font-medium text-green-600 hover:text-green-500 transition-colors">Forgot your password?</Link>
          </div>
        </div>

        <div>
          <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
