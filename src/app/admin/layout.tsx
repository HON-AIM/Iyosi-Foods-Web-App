import { redirect } from "next/navigation";
import { type Metadata } from "next";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard | IYOSIOLA GROUP",
  description: "Manage products, orders, customers, and site content",
  robots: {
    index: false, // Don't index admin pages
    follow: false,
  },
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({
  children,
}: AdminLayoutProps) {
  let session: Session | null = null;
  let authError = false;

  try {
    session = await auth();
  } catch (error) {
    console.error("Auth session error:", error);
    authError = true;
  }

  // Protect Admin Routes. Only users with role ADMIN can access.
  if (authError || !session?.user?.role || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-green-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-medium"
      >
        Skip to main content
      </a>

      {/* Sidebar - Hidden on mobile by default */}
      <div className="hidden md:flex md:flex-col md:w-64 flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Overlay - Only visible on mobile */}
      <div className="md:hidden fixed inset-0 z-40 bg-black/50 opacity-0 pointer-events-none transition-opacity duration-300" />

      {/* Main Content */}
      <main
        id="main-content"
        className="flex-1 overflow-y-auto overflow-x-hidden w-full"
        role="main"
        aria-label="Admin dashboard content"
      >
        <div className="p-4 md:p-8 max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
