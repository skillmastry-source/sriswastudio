import { Link, useLocation, useSearch } from "wouter";
import { useCartContext } from "@/hooks/use-cart-context";
import { ShoppingBag, Menu, X, User, Search, Instagram, Facebook } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "@/components/cart-drawer";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { ChatWidget } from "@/components/chat-widget";
import { useQuery } from "@tanstack/react-query";
import { useNavLandingPages } from "@/hooks/use-landing-pages";

interface FlashSaleData {
  enabled?: boolean;
  title?: string;
  subtitle?: string;
  endTime?: string;
  bgColor?: string;
  link?: string;
}

export function FlashSaleCountdown() {
  const { data: design } = useQuery<{ flashSale?: FlashSaleData }>({
    queryKey: ["/api/site-design"],
    queryFn: async () => {
      const res = await fetch("/api/site-design");
      return res.json();
    },
    staleTime: 60_000,
  });

  const fs = design?.flashSale;
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0, expired: false });

  useEffect(() => {
    if (!fs?.enabled || !fs?.endTime) return;
    const tick = () => {
      const diff = new Date(fs.endTime!).getTime() - Date.now();
      if (diff <= 0) { setT({ d: 0, h: 0, m: 0, s: 0, expired: true }); return; }
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [fs?.enabled, fs?.endTime]);

  if (!fs?.enabled || !fs?.endTime || t.expired) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  const bg = fs.bgColor ?? "#9B0F5F";

  const inner = (
    <div className="w-full px-4 py-2.5 flex flex-wrap items-center justify-center gap-3 text-white text-sm"
      style={{ background: bg }}>
      <span className="font-bold tracking-wide">{fs.title ?? "⚡ Flash Sale"}</span>
      <span className="opacity-75 text-xs">{fs.subtitle ?? "Ends in"}</span>
      <div className="flex items-center gap-1 font-mono font-bold text-base">
        {t.d > 0 && <><span className="bg-white/20 rounded px-1.5 py-0.5">{t.d}d</span><span className="opacity-50">:</span></>}
        <span className="bg-white/20 rounded px-1.5 py-0.5">{pad(t.h)}</span>
        <span className="opacity-50 animate-pulse">:</span>
        <span className="bg-white/20 rounded px-1.5 py-0.5">{pad(t.m)}</span>
        <span className="opacity-50 animate-pulse">:</span>
        <span className="bg-white/20 rounded px-1.5 py-0.5">{pad(t.s)}</span>
      </div>
      <span className="text-xs underline opacity-80 hover:opacity-100">Shop Now →</span>
    </div>
  );

  return fs.link ? <a href={fs.link}>{inner}</a> : <div>{inner}</div>;
}

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
  const [location, navigate] = useLocation();
  const search = useSearch();
  const { itemCount, openCart } = useCartContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const settings = useSiteSettings();
  const { header, colors } = settings;
  const { data: navPages = [] } = useNavLandingPages();

  const staticNavLinks = [
    { href: "/shop?category=watches", label: "Watches" },
    { href: "/shop?category=kadas", label: "Kadas" },
    { href: "/shop?category=mangalsutra", label: "Mangalsutra" },
    { href: "/shop?category=chain", label: "Chain" },
    { href: "/shop?category=bracelets", label: "Bracelets" },
    { href: "/shop?category=bangles", label: "Bangles" },
    { href: "/shop?category=rings", label: "Rings" },
    { href: "/shop?category=earrings", label: "Earrings" },
    { href: "/shop?category=chain-sets", label: "Chain Sets" },
    { href: "/shop", label: "New Arrivals" },
  ];

  const navLinks = [
    ...staticNavLinks,
    ...navPages.map((p) => ({ href: `/p/${p.slug}`, label: p.title })),
  ];

  const isLinkActive = (href: string) => {
    const [hrefPath, hrefQuery] = href.split("?");
    if (hrefQuery) {
      return location === hrefPath && search === `?${hrefQuery}`;
    }
    if (hrefPath === "/shop") {
      return location === "/shop" && !search;
    }
    return location === hrefPath;
  };

  const iconStyle = "text-gray-600 hover:text-gray-900";

  const logoImg = (
    <img
      src={header.logoUrl || "/brand/logo-transparent.png"}
      alt="Sriswa Studio"
      className="navbar-logo w-auto block"
      style={{
        paddingLeft: header.logoPaddingX,
        paddingRight: header.logoPaddingX,
        paddingTop: header.logoPaddingY,
        paddingBottom: header.logoPaddingY,
        marginTop: header.logoMarginTop,
        marginBottom: header.logoMarginBottom,
      }}
    />
  );

  const cartIcon = (
    <Button
      variant="ghost"
      size="icon"
      className={`relative ${iconStyle}`}
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
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-white" style={{ borderBottom: `2px solid ${colors.gold}` }}>
      <style>{`.navbar-logo { height: 40px; } @media (min-width: 768px) { .navbar-logo { height: ${header.logoSize}px; } }`}</style>

      {/* ── Desktop: single row — logo | nav | icons ── */}
      <div className="hidden md:grid container mx-auto px-6" style={{ gridTemplateColumns: "auto 1fr auto", height: 72, alignItems: "center", gap: "16px" }}>

        {/* Left — Logo */}
        <Link href="/" className="flex items-center">
          {logoImg}
        </Link>

        {/* Center — Category nav (centered within 1fr column) */}
        <style>{`
          .nav-link { color: #4b5563; transition: color 0.15s; }
          .nav-link:hover,
          .nav-link:active,
          .nav-link.nav-link--active { color: ${colors.brand}; }
          .nav-link.nav-link--active { font-weight: 700; }
        `}</style>
        <nav className="flex items-center justify-center gap-4 text-[11px] font-medium tracking-[0.07em] uppercase overflow-hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link whitespace-nowrap${isLinkActive(link.href) ? " nav-link--active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right — Search, Account, Cart */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className={`inline-flex items-center justify-center h-9 w-9 rounded-md ${iconStyle} hover:bg-accent`}
            onClick={() => {
              setSearchOpen(true);
              setTimeout(() => searchInputRef.current?.focus(), 80);
            }}
          >
            <Search className="h-[18px] w-[18px]" />
          </button>
          <Button variant="ghost" size="icon" className={iconStyle} asChild>
            <Link href="/account">
              <User className="h-[18px] w-[18px]" />
            </Link>
          </Button>
          {cartIcon}
        </div>
      </div>

      {/* ── Search overlay (fixed so it always sits above everything) ── */}
      {searchOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[99] bg-black/20"
            onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
          />
          {/* Panel */}
          <div className="fixed inset-x-0 top-0 z-[100] bg-white shadow-xl">
            <form
              className="container mx-auto px-4 md:px-6 py-4 flex items-center gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const q = searchQuery.trim();
                setSearchOpen(false);
                setSearchQuery("");
                if (q) navigate(`/shop?search=${encodeURIComponent(q)}`);
              }}
            >
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products…"
                className="flex-1 border-0 shadow-none focus-visible:ring-0 text-base"
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
                }}
              />
              <Button type="submit" size="sm" style={{ background: colors.brand, color: "#fff" }}>
                Search
              </Button>
              <button
                type="button"
                className="inline-flex items-center justify-center h-9 w-9 rounded-md text-gray-500 hover:bg-accent"
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          </div>
        </>
      )}

      {/* ── Mobile: hamburger | logo | search + cart ── */}
      <div className="flex md:hidden items-center justify-between px-4" style={{ height: 60 }}>
        <button className="p-2 -ml-2 text-gray-700" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link href="/" className="flex items-center">
          <img
            src={header.logoUrl || "/brand/logo-transparent.png"}
            alt="Sriswa Studio"
            className="navbar-logo w-auto block"
          />
        </Link>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className={`inline-flex items-center justify-center h-9 w-9 rounded-md ${iconStyle}`}
            onClick={() => {
              setSearchOpen(true);
              setTimeout(() => searchInputRef.current?.focus(), 80);
            }}
          >
            <Search className="h-[18px] w-[18px]" />
          </button>
          {cartIcon}
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-5">
          <nav className="flex flex-col gap-5 text-sm font-medium uppercase tracking-widest text-gray-700">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="transition-colors"
                style={{ color: isLinkActive(link.href) ? colors.brand : undefined }}
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

type CmsPage = { id: number; type: string; slug: string; title: string };

export function Footer() {
  const settings = useSiteSettings();
  const { footer, colors } = settings;
  const { data: navPages = [] } = useNavLandingPages();

  const { data: cmsPages = [] } = useQuery<CmsPage[]>({
    queryKey: ["/api/cms/pages"],
    queryFn: async () => {
      const res = await fetch("/api/cms/pages");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const policyPages = cmsPages.filter((p) => p.type === "policy");

  return (
    <footer style={{ background: colors.dark, color: "white" }}>
      <style>{`.footer-logo { height: 60px; } @media (min-width: 768px) { .footer-logo { height: ${footer.logoSize}px; } }`}</style>

      <div className="container mx-auto px-[30px] pt-12 md:pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-10">

          <div className={`flex flex-col gap-4 text-left ${footer.logoAlign === "center" ? "items-center" : footer.logoAlign === "right" ? "items-end" : "items-start"}`}>
            <img
              src={footer.logoUrl || "/brand/logo-white.png"}
              alt="Sriswa Studio"
              className="footer-logo w-auto block object-contain"
              style={{
                paddingLeft: footer.logoPaddingX,
                paddingRight: footer.logoPaddingX,
                paddingTop: footer.logoPaddingY,
                paddingBottom: footer.logoPaddingY,
                marginTop: footer.logoMarginTop,
                marginBottom: footer.logoMarginBottom,
              }}
            />
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

          <div className="text-left">
            <h4 className="text-xs tracking-[0.25em] uppercase mb-4 md:mb-5 font-medium" style={{ color: colors.gold }}>Shop by Category</h4>
            <ul className="flex flex-col gap-3 text-sm text-white/60">
              {[
                ["/shop?category=watches", "Watches"],
                ["/shop?category=kadas", "Kadas"],
                ["/shop?category=mangalsutra", "Mangalsutra"],
                ["/shop?category=chain", "Chain"],
                ["/shop?category=bracelets", "Bracelets"],
                ["/shop?category=bangles", "Bangles"],
                ["/shop?category=rings", "Rings"],
                ["/shop?category=earrings", "Earrings"],
                ["/shop?category=chain-sets", "Chain Sets"],
                ["/shop", "New Arrivals"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-left">
            <h4 className="text-xs tracking-[0.25em] uppercase mb-4 md:mb-5 font-medium" style={{ color: colors.gold }}>Company</h4>
            <ul className="flex flex-col gap-3 text-sm text-white/60">
              <li><Link href="/pages/about-us" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/track-order" className="hover:text-white transition-colors">Track My Order</Link></li>
              <li><Link href="/account" className="hover:text-white transition-colors">My Account</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Journal</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQs</Link></li>
              <li><Link href="/pages/contact-us" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {navPages.length > 0 && (
            <div className="text-left">
              <h4 className="text-xs tracking-[0.25em] uppercase mb-4 md:mb-5 font-medium" style={{ color: colors.gold }}>Pages</h4>
              <ul className="flex flex-col gap-3 text-sm text-white/60">
                {navPages.map((p) => (
                  <li key={p.id}>
                    <Link href={`/p/${p.slug}`} className="hover:text-white transition-colors">
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {policyPages.length > 0 && (
            <div className="text-left">
              <h4 className="text-xs tracking-[0.25em] uppercase mb-4 md:mb-5 font-medium" style={{ color: colors.gold }}>Policies</h4>
              <ul className="flex flex-col gap-3 text-sm text-white/60">
                {policyPages.map((p) => (
                  <li key={p.id}>
                    <Link href={`/pages/${p.slug}`} className="hover:text-white transition-colors">
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-left">
            <h4 className="text-xs tracking-[0.25em] uppercase mb-4 md:mb-5 font-medium" style={{ color: colors.gold }}>Contact</h4>
            <ul className="flex flex-col gap-3 text-sm text-white/60">
              <li>
                <a href="mailto:contact@sriswastudio.com" className="hover:text-white transition-colors">
                  contact@sriswastudio.com
                </a>
              </li>
              <li>
                <a href="https://wa.me/919618535437" target="_blank" rel="noopener noreferrer"
                  className="hover:text-white transition-colors">+91 96185 35437</a>
              </li>
              <li className="text-white/40 leading-relaxed text-xs">
                Hyderabad, Telangana<br />India – 500001
              </li>
              <li className="text-white/40 text-xs">
                Mon–Sat · 10 AM – 6 PM IST
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

export function InstagramFeedSection() {
  const { data: design } = useQuery<{ instagramSection?: { enabled?: boolean; username?: string; heading?: string; subheading?: string; images?: { url: string; link?: string }[] } }>({
    queryKey: ["/api/site-design"],
    queryFn: async () => { const res = await fetch("/api/site-design"); return res.json(); },
    staleTime: 60_000,
  });
  const ig = design?.instagramSection;
  if (!ig?.enabled || !ig.images?.length) return null;
  return (
    <section className="py-14 bg-white">
      <div className="container mx-auto px-[30px]">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">{ig.heading ?? "Follow Our Journey"}</h2>
          <p className="text-sm text-gray-500 mt-2">
            {ig.subheading ?? "Tag us @sriswa_studio to be featured"}{" "}
            <a href={`https://instagram.com/${ig.username ?? "sriswa_studio"}`} target="_blank" rel="noopener noreferrer"
              className="font-medium" style={{ color: "#9B0F5F" }}>
              @{ig.username ?? "sriswa_studio"}
            </a>
          </p>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {ig.images.slice(0, 6).map((img, i) => (
            <a key={i} href={img.link || `https://instagram.com/${ig.username ?? "sriswa_studio"}`}
              target="_blank" rel="noopener noreferrer"
              className="aspect-square overflow-hidden rounded-lg group relative block">
              <img src={img.url} alt={`Instagram post ${i + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Instagram className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </a>
          ))}
        </div>
        <div className="text-center mt-6">
          <a href={`https://instagram.com/${ig.username ?? "sriswa_studio"}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "#9B0F5F" }}>
            <Instagram className="h-4 w-4" />
            Follow @{ig.username ?? "sriswa_studio"}
          </a>
        </div>
      </div>
    </section>
  );
}

function WhatsAppCommunity() {
  return (
    <section style={{ background: "#9B0F5F" }} className="py-12 md:py-16 text-center">
      <div className="flex flex-col items-center gap-4 px-6">
        {/* WhatsApp icon */}
        <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </div>

        {/* Labels */}
        <p className="text-xs tracking-[0.25em] uppercase font-medium" style={{ color: "#D4AF37" }}>
          Stay Connected
        </p>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-white">
          Join Our WhatsApp Community
        </h2>
        <p className="text-white/70 text-sm md:text-base max-w-md leading-relaxed">
          Get exclusive offers, new launch alerts &amp; jewellery care tips directly on WhatsApp. Be the first to know!
        </p>

        {/* Button */}
        <a
          href="https://chat.whatsapp.com/KJmFZ8AG90z3EbHR2Z4KNg"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-2 px-7 py-3 rounded-md font-semibold text-white text-sm tracking-widest uppercase transition-opacity hover:opacity-90"
          style={{ background: "#25D366" }}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Join Community
        </a>
      </div>
    </section>
  );
}

export function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col font-sans bg-white">
      <FlashSaleCountdown />
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      <WhatsAppCommunity />
      <Footer />
      <CartDrawer />
      <ChatWidget />
    </div>
  );
}
