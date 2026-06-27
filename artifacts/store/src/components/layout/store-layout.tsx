import { Link, useLocation } from "wouter";
import { useCartContext } from "@/hooks/use-cart-context";
import { ShoppingBag, Menu, X, User, Instagram, Facebook, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AnnouncementBar() {
  return (
    <div className="w-full bg-[#1a1a1a] text-white text-center text-xs py-2 px-4 tracking-widest font-medium">
      ✨ Anti-Tarnish &nbsp;|&nbsp; Waterproof &nbsp;|&nbsp; Skin-Friendly &nbsp;|&nbsp; Free Shipping on orders above ₹999
    </div>
  );
}

export function Navbar() {
  const [location] = useLocation();
  const { itemCount } = useCartContext();
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
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      {/* Main header row */}
      <div className="container mx-auto px-6 flex items-center justify-between h-[72px]">
        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 -ml-2 text-gray-700"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <img
            src="/brand/logo-color.png"
            alt="Sriswa Studio"
            style={{ height: 56, width: 56, objectFit: "contain" }}
          />
          <div className="flex flex-col leading-tight">
            <span className="font-serif font-bold text-xl tracking-widest text-[#9B0F5F] uppercase">Sriswa</span>
            <span className="text-[10px] tracking-[0.3em] text-gray-500 uppercase">Studio</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium tracking-wide">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors hover:text-[#9B0F5F] pb-1 border-b-2 ${
                location === link.href ? "border-[#9B0F5F] text-[#9B0F5F]" : "border-transparent text-gray-700"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-gray-700 hover:text-[#9B0F5F]">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-700 hover:text-[#9B0F5F]" asChild>
            <Link href="/account">
              <User className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="relative text-gray-700 hover:text-[#9B0F5F]" asChild>
            <Link href="/cart">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#9B0F5F] text-[10px] font-bold text-white flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white px-6 py-4">
          <nav className="flex flex-col gap-4 text-sm font-medium text-gray-700">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="hover:text-[#9B0F5F]">
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
    <footer className="bg-[#9B0F5F] text-white">
      <div className="container mx-auto px-6 pt-14 pb-10 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand column */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <img
              src="/brand/logo-white.png"
              alt="Sriswa Studio"
              style={{ height: 52, width: 52, objectFit: "contain" }}
            />
            <div className="flex flex-col leading-tight">
              <span className="font-serif font-bold text-xl tracking-widest uppercase">Sriswa</span>
              <span className="text-[10px] tracking-[0.3em] text-white/70 uppercase">Studio</span>
            </div>
          </div>
          <p className="text-white/75 text-sm leading-relaxed">
            Timeless Beauty, Everyday Shine.<br />
            Premium anti-tarnish jewellery<br />
            crafted for the modern woman.
          </p>
          {/* Social icons */}
          <div className="flex items-center gap-3 mt-1">
            <a href="https://instagram.com/sriswastudio" target="_blank" rel="noopener noreferrer"
              className="h-9 w-9 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors" aria-label="Instagram">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="https://facebook.com/sriswastudio" target="_blank" rel="noopener noreferrer"
              className="h-9 w-9 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors" aria-label="Facebook">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer"
              className="h-9 w-9 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors" aria-label="WhatsApp">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
          </div>
        </div>

        {/* Shop */}
        <div>
          <h4 className="font-serif font-bold text-base mb-5 tracking-wide uppercase">Shop</h4>
          <ul className="flex flex-col gap-3 text-sm text-white/75">
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
          <h4 className="font-serif font-bold text-base mb-5 tracking-wide uppercase">Support</h4>
          <ul className="flex flex-col gap-3 text-sm text-white/75">
            <li><Link href="/track-order" className="hover:text-white transition-colors">Track My Order</Link></li>
            <li><Link href="/account" className="hover:text-white transition-colors">My Account</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-serif font-bold text-base mb-5 tracking-wide uppercase">Contact</h4>
          <ul className="flex flex-col gap-3 text-sm text-white/75">
            <li><a href="mailto:hello@sriswastudio.com" className="hover:text-white transition-colors">hello@sriswastudio.com</a></li>
            <li><a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp Us</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/20 py-5 text-center text-xs text-white/50 tracking-wide">
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
    </div>
  );
}
