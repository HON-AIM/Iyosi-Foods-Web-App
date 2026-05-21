import CartSidebar from "@/components/shop/CartSidebar";
import Link from "next/link";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <CartSidebar />

      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Shop-specific footer */}
      <footer className="bg-white border-t border-gray-200 mt-4">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold text-sm text-gray-900 mb-3 uppercase tracking-wider">
                Need Help?
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/contact" className="hover:text-orange-600 transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/shop" className="hover:text-orange-600 transition-colors">
                    Track Order
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="hover:text-orange-600 transition-colors">
                    Returns & Refunds
                  </Link>
                </li>
                <li>
                  <Link href="/shop" className="hover:text-orange-600 transition-colors">
                    FAQs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 mb-3 uppercase tracking-wider">
                About Iyosi Foods
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/about" className="hover:text-orange-600 transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-orange-600 transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="hover:text-orange-600 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-orange-600 transition-colors">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 mb-3 uppercase tracking-wider">
                Make Money
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/contact" className="hover:text-orange-600 transition-colors">
                    Become a Distributor
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-orange-600 transition-colors">
                    Sell on Iyosi
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 mb-3 uppercase tracking-wider">
                Payment Methods
              </h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {["Visa", "Mastercard", "Paystack", "Transfer"].map((m) => (
                  <span key={m} className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded border border-gray-200 font-medium">
                    {m}
                  </span>
                ))}
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  🔒 Secure payment powered by Paystack
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-100 mt-8 pt-6 text-center">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Iyosi Foods. All rights reserved. 
              Premium flour products delivered across Nigeria.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
