"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { navConfig } from "@/config/navConfig";
import NavItem from "./NavItem";
import NavActions from "./NavActions";
import MobileMenu from "./MobileMenu";

interface NavbarProps {
  showAnnouncement?: boolean;
  announcementText?: string;
}

export default function Navbar({ showAnnouncement = true, announcementText }: NavbarProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [headerAnnouncement, setHeaderAnnouncement] = useState<string>("");

  // Fetch announcement from store settings
  useEffect(() => {
    if (!showAnnouncement) return;

    if (announcementText) {
      setHeaderAnnouncement(announcementText);
      return;
    }

    const controller = new AbortController();
    fetch("/api/admin/settings", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.settings?.announcementText) {
          setHeaderAnnouncement(data.settings.announcementText);
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [showAnnouncement, announcementText]);

  // Track scroll for header shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDropdownOpen = useCallback((label: string) => {
    setActiveDropdown(label);
  }, []);

  const handleDropdownClose = useCallback(() => {
    setActiveDropdown(null);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <header
      className={`bg-white sticky top-0 z-50 transition-shadow duration-300 ${
        scrolled ? "shadow-lg" : "shadow-sm"
      }`}
    >
      {/* Announcement Banner */}
      {headerAnnouncement && (
        <div className="bg-primary-900 text-white text-xs py-1.5 text-center font-medium px-4">
          {headerAnnouncement}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-[80px] gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 mr-4">
            <Image
              src="/logo.jpg"
              alt="Iyosi Foods"
              width={64}
              height={64}
              className="object-contain rounded-md"
              priority
            />
            <span className="hidden sm:block font-extrabold text-primary-900 text-lg leading-tight">
              Iyosi<br />
              <span className="text-accent-500">Foods</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden lg:flex items-center gap-0"
            role="navigation"
            aria-label="Main navigation"
          >
            {navConfig.map((item) => (
              <NavItem
                key={item.label}
                item={item}
                isOpen={activeDropdown === item.label}
                onOpen={handleDropdownOpen}
                onClose={handleDropdownClose}
              />
            ))}
          </nav>

          {/* Right Actions (Search, Account, Cart, Mobile Toggle) */}
          <NavActions
            mobileMenuOpen={mobileMenuOpen}
            onMobileMenuToggle={toggleMobileMenu}
          />
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={closeMobileMenu} />
    </header>
  );
}
