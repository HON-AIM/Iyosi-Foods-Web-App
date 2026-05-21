"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Header() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/products", label: "Our Products" },
    { href: "/shop", label: "Online Store", highlight: true },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50 h-20 flex items-center justify-between px-4 md:px-8 border-b border-surface-200">
      {/* Logo */}
      <Link href="/" className="flex items-center shrink-0">
        <Image src="/logo.jpg" alt="Iyosi Foods Logo" width={55} height={55} className="object-contain" />
      </Link>

      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-6 font-semibold text-primary-900">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`hover:text-accent-600 transition-colors ${
              link.highlight ? "bg-primary-50 px-3 py-1 rounded-md" : ""
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Desktop Auth Buttons */}
      <div className="hidden md:flex items-center gap-3">
        {session ? (
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-primary-700 font-semibold hover:text-primary-900 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold uppercase">
                {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || "U"}
              </div>
              <span className="hidden lg:block max-w-[120px] truncate">
                {session.user?.name || "My Account"}
              </span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors px-3 py-1.5 rounded-md hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <>
            <Link
              href="/login"
              className="text-primary-700 font-semibold hover:text-primary-800 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-full font-semibold transition-all duration-200 shadow hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>

      {/* Mobile Hamburger */}
      <button
        className="md:hidden p-2 rounded-md text-primary-900 hover:bg-gray-100 transition-colors"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle mobile menu"
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 animate-in slide-in-from-top-2">
          <nav className="flex flex-col p-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg font-semibold text-primary-900 hover:bg-gray-50 transition-colors ${
                  link.highlight ? "text-primary-600" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 mt-2 pt-2">
              {session ? (
                <div className="space-y-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-primary-900 hover:bg-gray-50"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold uppercase">
                      {session.user?.name?.charAt(0) || "U"}
                    </div>
                    <span>{session.user?.name || "My Account"}</span>
                  </Link>
                  <button
                    onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                    className="w-full text-left px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2 px-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-4 rounded-lg text-center font-semibold text-primary-700 border border-primary-200 hover:bg-primary-50 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-4 rounded-lg text-center font-bold bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                  >
                    Sign Up Free
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
