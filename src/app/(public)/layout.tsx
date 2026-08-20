import Navbar from "@/components/navigation/Navbar";
import WhatsAppButton from "@/components/WhatsAppButton";
import Image from "next/image";
import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />

      <main className="flex-grow flex flex-col" id="main-content" tabIndex={-1}>
        {children}
      </main>

      <footer className="w-full bg-primary-900 text-white py-12 px-4 md:px-8 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo.jpg"
                alt="Iyosi Foods Logo"
                width={40}
                height={40}
                className="rounded-md"
              />
              <h3 className="font-bold text-xl text-accent-500">
                Iyosi Foods
              </h3>
            </div>
            <p className="text-sm text-surface-200 leading-relaxed">
              A premier Nigerian food company delivering quality products
              and agricultural excellence across the nation.
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href="#"
                aria-label="Facebook"
                className="h-8 w-8 rounded-full bg-primary-800 hover:bg-primary-700 flex items-center justify-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="h-8 w-8 rounded-full bg-primary-800 hover:bg-primary-700 flex items-center justify-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="m16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a
                href="#"
                aria-label="Twitter / X"
                className="h-8 w-8 rounded-full bg-primary-800 hover:bg-primary-700 flex items-center justify-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M4 4l16 16M14.828 14.828 20 20M9.172 9.172 4 4M20 4l-4.828 4.828M4 20l4.828-4.828"/></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-surface-50 uppercase text-xs tracking-wider">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-surface-200">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  Our Products
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-white transition-colors text-accent-400">
                  Shop Online
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-surface-50 uppercase text-xs tracking-wider">
              Customer
            </h4>
            <ul className="space-y-2 text-sm text-surface-200">
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/dashboard/orders" className="hover:text-white transition-colors">
                  Track Orders
                </Link>
              </li>
              <li>
                <Link href="/dashboard/address-book" className="hover:text-white transition-colors">
                  Address Book
                </Link>
              </li>
              <li>
                <Link href="/dashboard/saved" className="hover:text-white transition-colors">
                  Saved Items
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-surface-50 uppercase text-xs tracking-wider">
              Legal & Trust
            </h4>
            <ul className="space-y-2 text-sm text-surface-200">
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white transition-colors">
                  Returns Policy
                </Link>
              </li>
            </ul>
            <div className="mt-4 text-xs text-surface-300 bg-primary-800 rounded-md p-3">
              Secure Checkout powered by Paystack
            </div>
          </div>
        </div>

        <div className="border-t border-primary-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-sm text-surface-300 gap-2">
          <span>
            &copy; {new Date().getFullYear()} Iyosi Foods. All rights reserved.
          </span>
          <span className="text-xs">
            Registered in Nigeria &middot; RC: 9454178
          </span>
        </div>
      </footer>

      <WhatsAppButton />
    </>
  );
}
