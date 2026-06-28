import { Link, useLocation } from "wouter";
import { useCartContext } from "@/hooks/use-cart-context";
import { ShoppingBag, Menu, X, User, Search, Instagram, Facebook } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "@/components/cart-drawer";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function AnnouncementBar() {
  const settings = useSiteSettings();
  const { header } = settings;

  if (!header.showAnnouncement) return null;

  return (
    <div
      className="w-full py-2.5 px-4 text-center text-xs tracking-widest font-medium text-white"
      style={{ background: header.announcementBgColor }}
    >
      {header.announcementText}
    </div>
  );
}

export function Navbar() {
  const [location] = useLocation();
  const { itemCount, openCart } = useCartContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const settings = useSiteSettings();
  const { header, colors } = settings;

  const navLinks = [
    { href: "/shop", label: "New Arrivals" },
    { href: "/shop?category=watches", label: "Watches" },
    { href: "/shop?category=bracelets", label: "Bracelets" },
    { href: "/shop?category=rings", label: "Rings" },
    { href: "/shop?category=earrings", label: "Earrings" },
    { href: "/shop?category=mangalsutra", label: "Mangalsutra" },
    { href: "/shop?category=chain-sets", label: "Chain Sets" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white" style={{ borderBottom: `2px solid ${colors.gold}` }}>
      {/* Responsive logo size: cap at 28px on mobile */}
      <style>{`.navbar-logo { height: 28px; } @media (min-width: 768px) { .navbar-logo { height: ${header.logoSize}px; } }`}</style>

      <div className="container mx-auto px-[30px] flex items-center justify-between" style={{ height: 72 }}>
        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 -ml-2 text-gray-700"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <img
            src="/brand/logo-color.png"
            alt="Sriswa Studio"
            className="navbar-logo w-auto block"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7 text-[12.5px] font-medium tracking-[0.08em] uppercase">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: location === link.href ? colors.brand : "#4b5563",
                borderBottom: location === link.href ? `2px solid ${colors.brand}` : "2px solid transparent",
                paddingBottom: "2px",
                transition: "color 0.15s, border-color 0.15s",
              }}
              className="transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="text-gray-600">
            <Search className="h-[18px] w-[18px]" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-600" asChild>
            <Link href="/account">
              <User className="h-[18px] w-[18px]" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative text-gray-600"
            onClick={openCart}
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {itemCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                style={{ background: colors.brand }}
              >
                {itemCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-5">
          <nav className="flex flex-col gap-5 text-sm font-medium uppercase tracking-widest text-gray-700">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="transition-colors"
                style={{ color: location === link.href ? colors.brand : undefined }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  const settings = useSiteSettings();
  const { footer, colors } = settings;

  return (
    <footer style={{ background: colors.dark, color: "white" }}>
      <style>{`@media (min-width: 768px) { .footer-logo { height: ${footer.logoSize}px; } }`}</style>

      <div className="container mx-auto px-[30px] pt-12 md:pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">

          {/* ── Brand column ── */}
          <div className="flex flex-col gap-4 items-start text-left">
            <img src="/brand/logo-white.png" alt="Sriswa Studio"
              className="footer-logo w-auto block" style={{ height: 40 }} />
            <p className="text-white/60 text-sm leading-relaxed">
              {footer.tagline.split("\n").map((line, i) => (
                <span key={i}>{line}{i < footer.tagline.split("\n").length - 1 && <br />}</span>
              ))}
            </p>
            <div className="flex items-center gap-3">
              <a href={footer.instagramUrl} target="_blank" rel="noopener noreferrer"
                className="h-9 w-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ border: `1px solid ${colors.gold}66` }} aria-label="Instagram">
                <Instagram className="h-4 w-4" style={{ color: colors.gold }} />
              </a>
              <a href={footer.facebookUrl} target="_blank" rel="noopener noreferrer"
                className="h-9 w-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ border: `1px solid ${colors.gold}66` }} aria-label="Facebook">
                <Facebook className="h-4 w-4" style={{ color: colors.gold }} />
              </a>
            </div>
          </div>

          {/* ── Block 1: Shop Categories ── */}
          <div className="text-left">
            <h4 className="text-xs tracking-[0.25em] uppercase mb-4 md:mb-5 font-medium" style={{ color: colors.gold }}>Shop</h4>
            <ul className="flex flex-col gap-3 text-sm text-white/60">
              {[
                ["/shop", "New Arrivals"],
                ["/shop?category=watches", "Watches"],
                ["/shop?category=bracelets", "Bracelets"],
                ["/shop?category=rings", "Rings"],
                ["/shop?category=earrings", "Earrings"],
                ["/shop?category=mangalsutra", "Mangalsutra"],
                ["/shop?category=chain-sets", "Chain Sets"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Block 2: Company ── */}
          <div className="text-left">
            <h4 className="text-xs tracking-[0.25em] uppercase mb-4 md:mb-5 font-medium" style={{ color: colors.gold }}>Company</h4>
            <ul className="flex flex-col gap-3 text-sm text-white/60">
              <li><Link href="/track-order" className="hover:text-white transition-colors">Track My Order</Link></li>
              <li><Link href="/account" className="hover:text-white transition-colors">My Account</Link></li>
              <li>
                <a href="mailto:hello@sriswastudio.com" className="hover:text-white transition-colors">
                  hello@sriswastudio.com
                </a>
              </li>
              <li>
                <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer"
                  className="hover:text-white transition-colors">WhatsApp Us</a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      <div className="border-t py-5 text-center text-xs text-white/30 tracking-wide" style={{ borderColor: `${colors.gold}33` }}>
        © {new Date().getFullYear()} Sriswa Studio. All rights reserved.
      </div>
    </footer>
  );
}

export function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col font-sans bg-white">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
