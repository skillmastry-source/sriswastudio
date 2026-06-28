import { Link } from "wouter";
import { StoreLayout } from "@/components/layout/store-layout";
import { useGetFeaturedProducts, getGetFeaturedProductsQueryKey } from "@workspace/api-client-react";
import { ShieldCheck, Droplets, Sparkles, Truck } from "lucide-react";

const BRAND = "#9B0F5F";
const GOLD = "#D4AF37";

/* ─── Scrolling ticker ─── */
const TICKER_ITEMS = [
  "✦ Anti-Tarnish Jewellery",
  "✦ Ships in 24 Hours",
  "✦ Free Shipping above ₹999",
  "✦ 10,000+ Happy Customers",
  "✦ Waterproof & Skin-Friendly",
  "✦ Handcrafted with Love",
];

function Ticker() {
  const repeated = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="w-full overflow-hidden py-3" style={{ background: "#fdf6f9", borderTop: `1px solid ${BRAND}15`, borderBottom: `1px solid ${BRAND}15` }}>
      <div className="flex gap-14 whitespace-nowrap" style={{ animation: "ticker 32s linear infinite" }}>
        {repeated.map((item, i) => (
          <span key={i} className="text-[11px] tracking-[0.22em] font-medium uppercase flex-shrink-0" style={{ color: BRAND }}>
            {item}
          </span>
        ))}
      </div>
      <style>{`@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.33%); } }`}</style>
    </div>
  );
}

export default function Home() {
  const { data: featuredProducts } = useGetFeaturedProducts(
    { limit: 4 },
    { query: { queryKey: getGetFeaturedProductsQueryKey({ limit: 4 }) } }
  );

  return (
    <StoreLayout>

      {/* ── HERO: Split panel — dark text left | jewellery image right ── */}
      <section className="w-full flex flex-col md:flex-row" style={{ minHeight: "90vh" }}>
        {/* Left: brand dark panel with all text */}
        <div className="flex flex-col justify-center px-10 md:px-16 py-16 md:py-0 md:w-[46%] flex-shrink-0" style={{ background: "#1a0a0f" }}>
          <div className="max-w-md">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-7">
              <div className="h-px w-10" style={{ background: GOLD }} />
              <span className="text-[11px] tracking-[0.35em] uppercase font-medium" style={{ color: GOLD }}>
                Premium Collection · 2025
              </span>
            </div>

            <h1 className="font-serif font-bold text-white leading-[1.0] mb-6" style={{ fontSize: "clamp(42px, 5.5vw, 76px)", letterSpacing: "-0.01em" }}>
              Jewellery<br />
              <span style={{ color: GOLD }}>That Lasts</span><br />
              Forever
            </h1>

            <p className="mb-2 max-w-xs" style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", letterSpacing: "0.05em" }}>
              Anti-tarnish · Waterproof · Skin-friendly
            </p>
            <p className="font-bold text-white mb-10" style={{ fontSize: "clamp(20px, 3vw, 30px)" }}>
              Starting ₹399
            </p>

            <div className="flex items-center gap-5 flex-wrap">
              <Link
                href="/shop"
                className="inline-flex items-center px-8 py-3.5 text-[13px] font-bold tracking-[0.2em] uppercase text-white transition-all duration-200 hover:opacity-85"
                style={{ background: BRAND }}
              >
                Shop Now
              </Link>
              <Link
                href="/shop"
                className="text-[12px] font-medium tracking-[0.18em] uppercase pb-0.5 transition-colors hover:opacity-70"
                style={{ color: "rgba(255,255,255,0.65)", borderBottom: "1px solid rgba(255,255,255,0.35)" }}
              >
                View All
              </Link>
            </div>

            {/* Stats row */}
            <div className="mt-14 grid grid-cols-3 gap-0 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              {[
                { num: "10K+", label: "Customers" },
                { num: "500+", label: "Designs" },
                { num: "24hr", label: "Dispatch" },
              ].map(({ num, label }) => (
                <div key={label} className="flex flex-col items-start pt-5 pr-4">
                  <span className="font-serif font-bold text-2xl" style={{ color: GOLD }}>{num}</span>
                  <span className="text-[10px] tracking-[0.15em] uppercase mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: jewellery image — positioned to right side to skip embedded text */}
        <div className="flex-1 relative overflow-hidden" style={{ minHeight: "55vw" }}>
          <img
            src="/brand/hero-banner.png"
            alt="Sriswa Studio Jewellery Collection"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "right center" }}
          />
          {/* Subtle left edge fade into the dark panel */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(26,10,15,0.4) 0%, transparent 30%)" }} />
        </div>
      </section>

      {/* ── TICKER ── */}
      <Ticker />

      {/* ── FEATURED PRODUCTS ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          {/* Section header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <p className="text-[11px] tracking-[0.35em] uppercase font-medium mb-3" style={{ color: BRAND }}>
                Handpicked For You
              </p>
              <h2 className="font-serif font-bold text-4xl md:text-5xl text-gray-900 leading-tight">
                Featured Pieces
              </h2>
              <div className="mt-4 h-0.5 w-14" style={{ background: GOLD }} />
            </div>
            <Link
              href="/shop"
              className="text-[12px] tracking-[0.2em] uppercase font-medium pb-0.5 self-start md:self-auto hover:opacity-70 transition-opacity"
              style={{ color: BRAND, borderBottom: `1.5px solid ${BRAND}` }}
            >
              View All Collection →
            </Link>
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-7">
            {featuredProducts?.map((product) => (
              <Link key={product.id} href={`/shop/${product.slug}`} className="group block">
                <div className="relative overflow-hidden mb-4" style={{ aspectRatio: "3/4", background: "#f9f0f5", borderRadius: "4px" }}>
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                      style={{ transition: "transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: BRAND, opacity: 0.3 }}>
                      <Sparkles className="h-10 w-10" />
                    </div>
                  )}
                  {product.compareAtPrice && (
                    <span className="absolute top-3 left-3 text-white text-[10px] font-bold px-2.5 py-1 tracking-widest uppercase" style={{ background: BRAND, borderRadius: "2px" }}>
                      Sale
                    </span>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-end justify-center pb-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: "linear-gradient(to top, rgba(26,10,15,0.6) 0%, transparent 60%)" }}>
                    <span className="text-white text-[11px] tracking-[0.2em] uppercase font-medium px-5 py-2.5" style={{ background: BRAND, borderRadius: "2px" }}>
                      Quick View
                    </span>
                  </div>
                </div>
                <p className="font-serif font-semibold text-sm md:text-base text-gray-800 mb-1.5 group-hover:text-[#9B0F5F] transition-colors leading-snug">
                  {product.name}
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm md:text-base" style={{ color: BRAND }}>₹{product.price}</span>
                  {product.compareAtPrice && (
                    <span className="text-gray-400 line-through text-xs">₹{product.compareAtPrice}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── BRAND STRIP ── */}
      <section className="py-20" style={{ background: BRAND }}>
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-1">
            <p className="font-serif italic text-xl mb-3" style={{ color: GOLD }}>
              Why Sriswa Studio?
            </p>
            <h3 className="font-serif font-bold text-3xl md:text-4xl text-white leading-snug mb-6">
              Jewellery That Lasts<br />a Lifetime
            </h3>
            <p className="text-white/70 text-sm leading-relaxed max-w-md mb-8">
              Every piece is crafted with 18k gold-plated anti-tarnish finish —
              waterproof, skin-friendly, and designed to shine through every moment of your life.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-[13px] font-bold tracking-[0.18em] uppercase transition-all duration-200 hover:opacity-90"
              style={{ background: GOLD, color: "#fff" }}
            >
              Explore Collection
            </Link>
          </div>
          {/* USP grid */}
          <div className="flex-1 grid grid-cols-2 gap-5">
            {[
              { icon: ShieldCheck, title: "Anti-Tarnish", sub: "Long-lasting shine, guaranteed" },
              { icon: Droplets, title: "Waterproof", sub: "Safe for shower & pool" },
              { icon: Sparkles, title: "Skin Friendly", sub: "Hypoallergenic materials" },
              { icon: Truck, title: "Fast Delivery", sub: "Ships within 24 hours" },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-start gap-3 p-4 rounded-sm" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: GOLD + "25" }}>
                  <Icon className="h-5 w-5" style={{ color: GOLD }} />
                </div>
                <div>
                  <p className="font-serif font-bold text-sm text-white mb-0.5">{title}</p>
                  <p className="text-white/55 text-xs leading-snug">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES GRID ── */}
      <section className="py-20" style={{ background: "#faf7f4" }}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[11px] tracking-[0.35em] uppercase font-medium mb-3" style={{ color: BRAND }}>
              Shop by Category
            </p>
            <h2 className="font-serif font-bold text-3xl md:text-4xl text-gray-900">
              Find Your Style
            </h2>
            <div className="mt-4 mx-auto h-0.5 w-14" style={{ background: GOLD }} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Necklaces", href: "/shop?category=necklaces" },
              { label: "Earrings",  href: "/shop?category=earrings" },
              { label: "Rings",     href: "/shop?category=rings" },
              { label: "Bracelets", href: "/shop?category=bracelets" },
              { label: "Anklets",   href: "/shop?category=anklets" },
            ].map(({ label, href }) => (
              <Link key={href} href={href}
                className="group flex flex-col items-center justify-center py-9 rounded-sm transition-all duration-200 hover:shadow-lg"
                style={{ background: "white", border: `1.5px solid #eee` }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = BRAND; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#eee"; }}
              >
                <span className="font-serif font-bold text-base text-gray-800 mb-1 group-hover:text-[#9B0F5F] transition-colors">
                  {label}
                </span>
                <span className="text-[11px] tracking-[0.2em] uppercase text-gray-400 group-hover:text-[#9B0F5F] transition-colors">
                  Shop →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </StoreLayout>
  );
}
