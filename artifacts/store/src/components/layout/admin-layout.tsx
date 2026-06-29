import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, ShoppingBag, Package, ListTree,
  Settings, Users, LogOut, Tags, Palette, ExternalLink,
  ChevronRight, FileText, Tag, Image, LayoutTemplate,
  BarChart2, Megaphone,
} from "lucide-react";
import { useUser, useAuth } from "@/lib/clerk-stub";
import { useEffect } from "react";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
      { href: "/admin/analytics", icon: BarChart2, label: "Analytics", exact: false },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", icon: Package, label: "Products", exact: false },
      { href: "/admin/categories", icon: Tags, label: "Categories", exact: false },
      { href: "/admin/inventory", icon: ListTree, label: "Inventory", exact: false },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/orders", icon: ShoppingBag, label: "Orders", exact: false },
      { href: "/admin/customers", icon: Users, label: "Customers", exact: false },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/admin/marketing/announcements", icon: Megaphone, label: "Announcements", exact: false },
      { href: "/admin/marketing/coupons", icon: Tag, label: "Coupons", exact: false },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/cms", icon: FileText, label: "CMS", exact: false },
      { href: "/admin/media", icon: Image, label: "Media Library", exact: false },
    ],
  },
  {
    label: "Store",
    items: [
      { href: "/admin/builder", icon: LayoutTemplate, label: "Page Builder", exact: false },
      { href: "/admin/design", icon: Palette, label: "Design", exact: false },
      { href: "/admin/settings", icon: Settings, label: "Settings", exact: false },
    ],
  },
];

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();

  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "";
  const isAdmin = ADMIN_EMAILS.length > 0
    ? ADMIN_EMAILS.includes(userEmail)
    : (user?.publicMetadata as Record<string, unknown> | undefined)?.role === "admin";

  useEffect(() => {
    if (authLoaded && userLoaded) {
      if (!isSignedIn) setLocation("/sign-in?redirect_url=/admin");
      else if (!isAdmin) setLocation("/");
    }
  }, [authLoaded, userLoaded, isSignedIn, isAdmin, setLocation]);

  if (!authLoaded || !userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#9B0F5F] border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn || !isAdmin) return null;

  const isActive = (href: string, exact: boolean) =>
    exact ? location === href : location === href || location.startsWith(href + "/");

  return (
    <div className="min-h-[100dvh] flex bg-gray-50">
      {/* ── Sidebar ── */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col fixed top-0 left-0 h-full z-30 hidden md:flex">
        {/* Brand header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-100">
          <div className="h-8 w-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: "#9B0F5F" }}>
            <img src="/brand/logo-icon.png" alt="" className="h-5 w-5 object-contain" onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-gray-900 leading-tight">Sriswa Studio</p>
            <p className="text-[10px] text-gray-400 tracking-wide uppercase">Admin</p>
          </div>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-[0.12em] uppercase text-gray-400">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ href, icon: Icon, label, exact }) => {
                  const active = isActive(href, exact);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        active
                          ? "text-white font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                      style={active ? { background: "#9B0F5F" } : {}}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {label}
                      {active && <ChevronRight className="h-3 w-3 ml-auto opacity-60" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: user + exit */}
        <div className="border-t border-gray-100 p-3 space-y-0.5">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-gray-50">
            <div className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: "#9B0F5F" }}>
              {user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {user?.fullName ?? "Admin"}
              </p>
              <p className="text-[10px] text-gray-400 truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
          <Link href="/">
            <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors cursor-pointer">
              <ExternalLink className="h-4 w-4" />
              View Store
            </div>
          </Link>
          <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
            <LogOut className="h-4 w-4" />
            Sign Out
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-white border-b border-gray-200 flex items-center gap-3 px-4">
        <div className="h-7 w-7 rounded flex items-center justify-center flex-shrink-0" style={{ background: "#9B0F5F" }}>
          <img src="/brand/logo-icon.png" alt="" className="h-4 w-4 object-contain" onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        </div>
        <span className="font-bold text-gray-900 text-sm">Sriswa Admin</span>
        <div className="ml-auto flex items-center gap-1">
          {NAV_GROUPS.flatMap(g => g.items).map(({ href, icon: Icon, label, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link key={href} href={href}
                className={`p-2 rounded-md transition-colors ${active ? "text-white" : "text-gray-500"}`}
                style={active ? { background: "#9B0F5F" } : {}}>
                <Icon className="h-4 w-4" />
                <span className="sr-only">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-64 min-h-[100dvh]">
        <div className="md:p-8 p-4 pt-20 md:pt-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
