import { Link, useLocation } from "wouter";
import { useCartContext } from "@/hooks/use-cart-context";
import { ShoppingBag, Menu, X, User, Search, Instagram, Facebook } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "@/components/cart-drawer";

export function AnnouncementBar() {
  return (
    <div className="w-full py-2.5 px-4 text-center text-xs tracking-widest font-medium text-white" style={{ background: "#9B0F5F" }}>
      ✦ Anti-Tarnish &nbsp;&nbsp;|&nbsp;&nbsp; Waterproof &nbsp;&nbsp;|&nbsp;&nbsp; Skin-Friendly &nbsp;&nbsp;|&nbsp;&nbsp;
      <span style={{ color: "#D4AF37" }}>Free Shipping above ₹999</span>
    </div>
  );
}

export function Navbar() {
  const [location] = useLocation();
  const { itemCount, openCart } = useCartContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/shop", label: "New Arrivals" },
    { href: "/shop?category=necklaces", label: "Necklaces" },
    { href: "/shop?category=rings", label: "Rings" },
    { href: "/shop?category=earrings", label: "Earrings" },
    { href: "/shop?category=bracelets", label: "Bracelets" },
    { href: "/shop?category=anklets", label: "Anklets" },
    { href: "/track-order", label: "Track Order" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white" style={{ borderBottom: "2px solid #D4AF37" }}>
      <div className="container mx-auto px-6 flex items-center justify-between h-[76px]">
        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 -ml-2 text-gray-700"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <img
            src="/brand/logo-color.png"
            alt="Sriswa Studio"
            style={{ height: 120, width: "auto", objectFit: "contain", display: "block" }}
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7 text-[12.5px] font-medium tracking-[0.08em] uppercase">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: location === link.href ? "#9B0F5F" : "#4b5563",
                borderBottom: location === link.href ? "2px solid #9B0F5F" : "2px solid transparent",
                paddingBottom: "2px",
                transition: "color 0.15s, border-color 0.15s",
              }}
              className="hover:text-[#9B0F5F] hover:border-[#9B0F5F] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-[#9B0F5F]">
            <Search className="h-[18px] w-[18px]" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-[#9B0F5F]" asChild>
            <Link href="/account">
              <User className="h-[18px] w-[18px]" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative text-gray-600 hover:text-[#9B0F5F]"
            onClick={openCart}
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                style={{ background: "#9B0F5F" }}>
                {itemCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white px-6 py-5">
          <nav className="flex flex-col gap-5 text-sm font-medium uppercase tracking-widest text-gray-700">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-[#9B0F5F] transition-colors"
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
  return (
    <footer className="bg-[#1a0a0f] text-white">
      <div className="container mx-auto px-6 pt-16 pb-10 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand column */}
        <div className="flex flex-col gap-5">
          <img
            src="/brand/logo-white.png"
            alt="Sriswa Studio"
            style={{ height: 120, width: "auto", objectFit: "contain", objectPosition: "left" }}
          />
          <p className="text-white/60 text-sm leading-relaxed">
            Timeless Beauty, Everyday Shine.<br />
            Premium anti-tarnish jewellery<br />
            crafted for the modern woman.
          </p>
          <div className="flex items-center gap-3 mt-1">
            <a href="https://instagram.com/sriswastudio" target="_blank" rel="noopener noreferrer"
              className="h-9 w-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ border: "1px solid rgba(212,175,55,0.4)" }} aria-label="Instagram">
              <Instagram className="h-4 w-4" style={{ color: "#D4AF37" }} />
            </a>
            <a href="https://facebook.com/sriswastudio" target="_blank" rel="noopener noreferrer"
              className="h-9 w-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ border: "1px solid rgba(212,175,55,0.4)" }} aria-label="Facebook">
              <Facebook className="h-4 w-4" style={{ color: "#D4AF37" }} />
            </a>
          </div>
        </div>

        {/* Shop */}
        <div>
          <h4 className="text-xs tracking-[0.25em] uppercase mb-5 font-medium" style={{ color: "#D4AF37" }}>Shop</h4>
          <ul className="flex flex-col gap-3 text-sm text-white/60">
            {[
              ["/shop", "All Jewellery"],
              ["/shop?category=necklaces", "Necklaces"],
              ["/shop?category=rings", "Rings"],
              ["/shop?category=earrings", "Earrings"],
              ["/shop?category=bracelets", "Bracelets"],
              ["/shop?category=anklets", "Anklets"],
            ].map(([href, label]) => (
              <li key={href}><Link href={href} className="hover:text-white transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-xs tracking-[0.25em] uppercase mb-5 font-medium" style={{ color: "#D4AF37" }}>Support</h4>
          <ul className="flex flex-col gap-3 text-sm text-white/60">
            <li><Link href="/track-order" className="hover:text-white transition-colors">Track My Order</Link></li>
            <li><Link href="/account" className="hover:text-white transition-colors">My Account</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-xs tracking-[0.25em] uppercase mb-5 font-medium" style={{ color: "#D4AF37" }}>Contact</h4>
          <ul className="flex flex-col gap-3 text-sm text-white/60">
            <li><a href="mailto:hello@sriswastudio.com" className="hover:text-white transition-colors">hello@sriswastudio.com</a></li>
            <li><a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp Us</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t py-5 text-center text-xs text-white/30 tracking-wide" style={{ borderColor: "rgba(212,175,55,0.2)" }}>
        © {new Date().getFullYear()} Sriswa Studio. All rights reserved.
      </div>
    </footer>
  );
}

export function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col font-sans">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
