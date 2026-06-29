import { Link, useLocation } from "wouter";
import { useCartContext } from "@/hooks/use-cart-context";
import { ShoppingBag, Menu, X, User, Search, Instagram, Facebook } from "lucide-react";
import { useState } from "react";

const WA_NUM = "919618535437";
const WA_ICON = (
  <svg viewBox="0 0 24 24" className="fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const WA_OPTIONS = [
  { emoji: "🛍️", label: "Place an Order", msg: "Hi Sriswa Studio! I'd like to place an order." },
  { emoji: "📦", label: "Track my Order", msg: "Hi! I'd like to track my recent order." },
  { emoji: "💎", label: "Ask about a Product", msg: "Hi! I have a question about one of your products." },
  { emoji: "🔄", label: "Return / Exchange", msg: "Hi! I'd like to return or exchange an item." },
  { emoji: "💬", label: "Other Query", msg: "Hi Sriswa Studio! I have a query for you." },
];

function WhatsAppWidget() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Chat popup */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[320px] rounded-2xl shadow-2xl overflow-hidden"
          style={{ fontFamily: "inherit" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ background: "#075e54" }}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
                style={{ background: "#25D366" }}>
                <span className="h-6 w-6">{WA_ICON}</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Sriswa Studio</p>
                <p className="text-white/60 text-[11px]">Typically replies in minutes</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition-colors text-xl leading-none">×</button>
          </div>

          {/* Chat body */}
          <div className="px-4 py-4" style={{ background: "#e5ddd5" }}>
            {/* Greeting bubble */}
            <div className="bg-white rounded-lg rounded-tl-none px-4 py-3 text-sm text-gray-700 shadow-sm mb-4 max-w-[85%]">
              👋 <span className="font-semibold">Hello!</span> How can we help you today?
              <p className="text-xs text-gray-400 mt-1">Choose an option below</p>
            </div>

            {/* Quick reply options */}
            <div className="flex flex-col gap-2">
              {WA_OPTIONS.map(({ emoji, label, msg }) => (
                <a
                  key={label}
                  href={`https://wa.me/${WA_NUM}?text=${encodeURIComponent(msg)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 bg-white text-gray-800 text-sm px-4 py-2.5 rounded-full shadow-sm hover:bg-gray-50 transition-colors font-medium"
                  onClick={() => setOpen(false)}
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Powered by footer */}
          <div className="px-4 py-2 text-center text-[10px] text-white/60" style={{ background: "#075e54" }}>
            Powered by WhatsApp · +91 96185 35437
          </div>
        </div>
      )}

      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-5 z-50 flex items-center gap-2 shadow-xl transition-transform hover:scale-105 active:scale-95"
        style={{ background: "#25D366", borderRadius: 50, padding: "13px 20px" }}
        aria-label="Chat with us on WhatsApp"
      >
        <span className="h-5 w-5 text-white">{WA_ICON}</span>
        <span className="text-white text-[11px] font-bold tracking-[0.15em] uppercase">
          {open ? "Close" : "Chat with us"}
        </span>
      </button>
    </>
  );
}
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
      <WhatsAppWidget />
    </div>
  );
}
