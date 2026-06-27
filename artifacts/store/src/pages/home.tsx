import { Link } from "wouter";
import { StoreLayout } from "@/components/layout/store-layout";
import { useGetFeaturedProducts, getGetFeaturedProductsQueryKey } from "@workspace/api-client-react";
import { ShieldCheck, Droplets, Sparkles, Truck, RotateCcw } from "lucide-react";

/* ─── scrolling ticker ─── */
const TICKER_ITEMS = [
  "✦ Anti-Tarnish Jewellery",
  "✦ Ships in 24 Hours",
  "✦ Free Shipping above ₹999",
  "✦ 10,000+ Happy Customers",
  "✦ Waterproof & Skin-Friendly",
  "✦ Handcrafted with Love",
];

function Ticker() {
  const repeated = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="w-full bg-[#FAF0F5] py-2 overflow-hidden border-y border-[#9B0F5F]/10">
      <div className="flex gap-12 whitespace-nowrap animate-[ticker_28s_linear_infinite]">
        {repeated.map((item, i) => (
          <span key={i} className="text-xs tracking-widest text-[#9B0F5F] font-medium uppercase flex-shrink-0">
            {item}
          </span>
        ))}
      </div>
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
      {/* ── HERO ── Palmonas-style full-width with left-aligned overlay */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: "90vh" }}>
        {/* Clean lifestyle background — no baked-in text */}
        <img
          src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1800&q=90&auto=format&fit=crop"
          alt="Sriswa Studio Jewellery"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Left-to-right dark gradient — text sits on dark left side */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />

        {/* Text — left side like Palmonas */}
        <div className="relative z-10 flex items-center" style={{ minHeight: "90vh" }}>
          <div className="container mx-auto px-8 md:px-20">
            <div className="max-w-lg text-white">
              <p className="font-serif italic text-xl md:text-2xl text-[#D4AF37] mb-5 tracking-wide">
                Shine Every Day,
              </p>
              <h1 className="font-serif font-bold text-5xl md:text-[72px] leading-[1.0] mb-6 tracking-tight uppercase">
                Anti<br />Tarnish<br />Jewellery
              </h1>
              <p className="text-xs tracking-[0.35em] text-white/70 uppercase mb-3">
                Premium Collection
              </p>
              <p className="text-4xl md:text-5xl font-bold mb-1 tracking-tight">
                Starting ₹399
              </p>
              <p className="text-white/60 text-sm mb-10 tracking-wide">
                Waterproof &nbsp;·&nbsp; Skin-Friendly &nbsp;·&nbsp; Everyday Shine
              </p>
              <Link
                href="/shop"
                className="inline-block text-sm md:text-base font-bold tracking-[0.3em] uppercase text-white border-b-2 border-white pb-1 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all duration-200"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SCROLLING TICKER ── */}
      <Ticker />

      {/* ── USP STRIP ── */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: ShieldCheck, title: "Anti-Tarnish", sub: "Long-lasting shine, guaranteed" },
            { icon: Droplets, title: "Waterproof", sub: "Safe for shower & pool" },
            { icon: Sparkles, title: "Skin Friendly", sub: "Hypoallergenic materials" },
            { icon: Truck, title: "Fast Delivery", sub: "Ships within 24 hours" },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-[#9B0F5F]/10 flex items-center justify-center">
                <Icon className="h-7 w-7 text-[#9B0F5F]" />
              </div>
              <p className="font-serif font-bold text-base text-gray-800">{title}</p>
              <p className="text-xs text-gray-500">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="py-20 bg-[#FAF7F4]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.4em] text-[#9B0F5F] uppercase mb-3 font-medium">Handpicked For You</p>
            <h2 className="font-serif font-bold text-4xl md:text-5xl text-gray-900">Featured Pieces</h2>
            <div className="mt-4 mx-auto h-px w-16 bg-[#D4AF37]" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8">
            {featuredProducts?.map((product) => (
              <Link key={product.id} href={`/shop/${product.slug}`} className="group block">
                <div className="aspect-square bg-gray-100 overflow-hidden rounded-md mb-3 relative">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0].url}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
                  )}
                  {product.compareAtPrice && (
                    <span className="absolute top-2 left-2 bg-[#9B0F5F] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      SALE
                    </span>
                  )}
                </div>
                <p className="font-serif font-semibold text-sm md:text-base text-gray-800 mb-1 group-hover:text-[#9B0F5F] transition-colors">
                  {product.name}
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#9B0F5F] text-sm md:text-base">₹{product.price}</span>
                  {product.compareAtPrice && (
                    <span className="text-gray-400 line-through text-xs">₹{product.compareAtPrice}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/shop"
              className="inline-block px-10 py-3 border-2 border-[#9B0F5F] text-[#9B0F5F] font-semibold text-sm tracking-[0.15em] uppercase hover:bg-[#9B0F5F] hover:text-white transition-colors duration-200"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* ── BANNER STRIP ── */}
      <section className="bg-[#9B0F5F] py-14">
        <div className="container mx-auto px-6 text-center text-white">
          <p className="font-serif italic text-2xl text-[#D4AF37] mb-3">Why Sriswa Studio?</p>
          <h3 className="font-serif font-bold text-3xl md:text-4xl mb-6 uppercase tracking-wide">
            Jewellery That Lasts a Lifetime
          </h3>
          <p className="text-white/80 max-w-xl mx-auto text-sm leading-relaxed mb-8">
            Every piece is crafted with 18k gold-plated anti-tarnish finish — waterproof, skin-friendly,
            and designed to shine through every moment of your life.
          </p>
          <Link
            href="/shop"
            className="inline-block px-10 py-3 bg-[#D4AF37] text-white font-semibold text-sm tracking-[0.15em] uppercase hover:bg-[#c49d2e] transition-colors duration-200"
          >
            Explore Collection
          </Link>
        </div>
      </section>

      {/* ── CATEGORIES GRID ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.4em] text-[#9B0F5F] uppercase mb-3 font-medium">Shop by Category</p>
            <h2 className="font-serif font-bold text-3xl md:text-4xl text-gray-900">Find Your Style</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Necklaces", href: "/shop?category=necklaces", bg: "bg-rose-50" },
              { label: "Earrings",  href: "/shop?category=earrings",  bg: "bg-amber-50" },
              { label: "Rings",     href: "/shop?category=rings",     bg: "bg-pink-50" },
              { label: "Bracelets", href: "/shop?category=bracelets", bg: "bg-purple-50" },
              { label: "Anklets",   href: "/shop?category=anklets",   bg: "bg-orange-50" },
            ].map(({ label, href, bg }) => (
              <Link key={href} href={href}
                className={`${bg} rounded-lg py-8 flex flex-col items-center justify-center gap-2 group hover:shadow-md transition-shadow`}>
                <span className="font-serif font-bold text-base text-gray-800 group-hover:text-[#9B0F5F] transition-colors">
                  {label}
                </span>
                <span className="text-xs text-gray-500 tracking-widest uppercase group-hover:text-[#9B0F5F] transition-colors">
                  Shop →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Ticker CSS */}
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </StoreLayout>
  );
}
