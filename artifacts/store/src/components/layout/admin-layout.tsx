import { Link, useLocation } from "wouter";
import { LayoutDashboard, ShoppingBag, Package, ListTree, Settings, Users, LogOut, Tags } from "lucide-react";
import { useUser } from "@/lib/clerk-stub";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/products", icon: Package, label: "Products" },
    { href: "/admin/categories", icon: Tags, label: "Categories" },
    { href: "/admin/orders", icon: ShoppingBag, label: "Orders" },
    { href: "/admin/inventory", icon: ListTree, label: "Inventory" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r bg-card flex-shrink-0">
        <div className="p-6 border-b flex items-center gap-2">
          <img src="/brand/logo-icon.png" alt="Icon" className="h-6 w-6" />
          <span className="font-serif font-bold text-xl text-primary">Admin</span>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : "hover:bg-muted text-foreground/80"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 mt-auto border-t">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-foreground/80">
            <Users className="h-5 w-5" />
            <span className="truncate">{user?.primaryEmailAddress?.emailAddress}</span>
          </div>
          <Link href="/">
            <div className="flex items-center gap-3 px-3 py-2 mt-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer">
              <LogOut className="h-5 w-5" />
              Exit to Store
            </div>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
