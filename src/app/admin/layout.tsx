import { redirect } from "next/navigation";
import { type Metadata } from "next";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import AdminLayoutClient from "./AdminLayoutClient";

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
    console.error("[ERROR] Auth session error:", error instanceof Error ? error.message : String(error));
    authError = true;
  }

  // Protect Admin Routes. Only users with role ADMIN can access.
  if (authError || !session?.user?.role || session.user.role !== "ADMIN") {
    // Include callback so user is returned to /admin after successful login
    redirect(`/login?callbackUrl=${encodeURIComponent("/admin")}`);
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
