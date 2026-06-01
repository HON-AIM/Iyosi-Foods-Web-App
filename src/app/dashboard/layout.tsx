import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarLink } from "@/components/dashboard/SidebarLink";
import { 
  User, 
  Package, 
  Mail, 
  Heart, 
  MapPin, 
  Settings, 
  LogOut,
  Clock,
  ShoppingBag
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    // Redirect to login and preserve callback to dashboard so user returns here after sign-in
    redirect(`/login?callbackUrl=${encodeURIComponent("/dashboard")}`);
  }

  const user = session.user;

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row gap-6">
        
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white shadow rounded-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
               <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-lg">
                  {user.name?.charAt(0) || "U"}
               </div>
               <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-gray-800 truncate">{user.name || "User"}</span>
                  <span className="text-xs text-gray-500 truncate">{user.email}</span>
               </div>
            </div>
            
            <nav className="flex-1 py-2">
              <SidebarLink href="/dashboard" icon={<User size={18} />} label="My Account" />
              <SidebarLink href="/products" icon={<ShoppingBag size={18} />} label="Visit Store" />
              <SidebarLink href="/dashboard/orders" icon={<Package size={18} />} label="Orders" />
              <SidebarLink href="/dashboard/inbox" icon={<Mail size={18} />} label="Inbox" />
              <SidebarLink href="/dashboard/reviews" icon={<Heart size={18} />} label="Pending Reviews" />
              <SidebarLink href="/dashboard/saved" icon={<Heart size={18} />} label="Saved Items" />
              <SidebarLink href="/dashboard/recently-viewed" icon={<Clock size={18} />} label="Recently Viewed" />
              
              <div className="border-t border-gray-100 my-2"></div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Settings</div>
  
              <SidebarLink href="/dashboard/address-book" icon={<MapPin size={18} />} label="Address Book" />
              <SidebarLink href="/dashboard/settings" icon={<Settings size={18} />} label="Account Management" />
            </nav>
            
            <div className="border-t border-gray-100 p-2">
               <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/login" });
                  }}
               >
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded transition-colors"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
               </form>
            </div>
          </div>
        </aside>
  
        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
