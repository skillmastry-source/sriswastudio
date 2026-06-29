import { Link } from "wouter";
import { StoreLayout } from "@/components/layout/store-layout";
import {
  useListProducts, getListProductsQueryKey,
  useGetFeaturedProducts, getGetFeaturedProductsQueryKey,
  useListCategories, getListCategoriesQueryKey,
  useAddToCart,
} from "@workspace/api-client-react";
import { useCartContext } from "@/hooks/use-cart-context";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/use-site-settings";
import {
  ShieldCheck, Droplets, Sparkles, Truck, ShoppingBag, Star,
  ChevronLeft, ChevronRight, Clock, Gem, Circle, Heart, Layers,
  Link2, Mail, Instagram, BadgeCheck, ArrowRight,
} from "lucide-react";
import { useState, useRef, useMemo } from "react";

const TICKER_ITEMS = [
  "✦ Anti-Tarnish Jewellery", "✦ Ships in 24 Hours",
  "✦ Free Shipping above ₹999", "✦ 10,000+ Happy Customers",
  "✦ Waterproof & Skin-Friendly", "✦ Handcrafted with Love",
];

function Ticker({ dark, gold }: { dark: string; gold: string }) {
  const repeated = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="w-full overflow-hidden py-2.5" style={{ background: dark }}>
      <div className="flex gap-14 whitespace-nowrap" style={{ animation: "ticker 28s linear infinite" }}>
        {repeated.map((item, i) => (
          <span key={i} className="text-[11px] tracking-[0.22em] font-medium uppercase flex-shrink-0" style={{ color: gold }}>{item}</span>
        ))}
      </div>
      <style>{`@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.33%); } }`}</style>
    </div>
  );
}

type CardProduct = {
  id: number; name: string; slug: string;
  price: number; compareAtPrice?: number | null;
  images?: { url: string }[]; stockQuantity: number;
};

function ProductCard({ product, sessionId, brand, dark }: { product: CardProduct; sessionId: string; brand: string; dark: string }) {
  const addToCart = useAddToCart();
  const { openCart } = useCartContext();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const outOfStock = product.stockQuantity <= 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (outOfStock) return;
    setAdding(true);
    addToCart.mutate(
      { data: { sessionId, productId: product.id, quantity: 1 } },
      {
        onSuccess: () => { toast({ title: "Added to cart!", description: `${product.name} added.` }); openCart(); },
        onError: () => toast({ title: "Error", description: "Could not add to cart.", variant: "destructive" }),
        onSettled: () => setAdding(false),
      }
    );
  };

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div className="relative overflow-hidden mb-3 rounded-sm" style={{ aspectRatio: "3/4", background: "#fdf6f9" }}>
        {product.images?.[0] ? (
          <img src={product.images[0].url} alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles className="h-10 w-10" style={{ color: brand, opacity: 0.2 }} />
          </div>
        )}
        {product.compareAtPrice && !outOfStock && (
          <span className="absolute top-2.5 left-2.5 text-white text-[9px] font-bold px-2 py-0.5 tracking-widest uppercase" style={{ background: brand, borderRadius: "2px" }}>Sale</span>
        )}
        {outOfStock && (
          <span className="absolute top-2.5 left-2.5 text-white text-[9px] font-bold px-2 py-0.5 tracking-widest uppercase" style={{ background: "#888", borderRadius: "2px" }}>Sold Out</span>
        )}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button onClick={handleAdd} disabled={outOfStock || adding}
            className="w-full flex items-center justify-center gap-2 py-3 text-white text-[11px] tracking-[0.18em] uppercase font-semibold disabled:opacity-60"
            style={{ background: outOfStock ? "#888" : brand }}>
            <ShoppingBag className="h-3.5 w-3.5" />
            {adding ? "Adding…" : outOfStock ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
      <h3 className="font-serif font-semibold text-sm leading-snug mb-1" style={{ color: dark }}>{product.name}</h3>
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm" style={{ color: brand }}>₹{product.price}</span>
        {product.compareAtPrice && <span className="text-gray-400 line-through text-xs">₹{product.compareAtPrice}</span>}
      </div>
    </Link>
  );
}

function StarRating({ n, gold }: { n: number; gold: string }) {
  return (
    <div className="flex gap-0.5 mb-2">
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-current" style={{ color: gold }} />
      ))}
    </div>
  );
}

const SHOP_CATEGORIES = [
  { label: "New Arrivals", slug: null, Icon: Sparkles, bg: "linear-gradient(135deg,#9B0F5F 0%,#6b0941 100%)" },
  { label: "Watches", slug: "watches", Icon: Clock, bg: "linear-gradient(135deg,#D4AF37 0%,#a0842a 100%)" },
  { label: "Bracelets", slug: "bracelets", Icon: Layers, bg: "linear-gradient(135deg,#b5135f 0%,#9B0F5F 100%)" },
  { label: "Rings", slug: "rings", Icon: Circle, bg: "linear-gradient(135deg,#1a0a0f 0%,#3d1a25 100%)" },
  { label: "Earrings", slug: "earrings", Icon: Gem, bg: "linear-gradient(135deg,#b08820 0%,#D4AF37 100%)" },
  { label: "Mangalsutra", slug: "mangalsutra", Icon: Heart, bg: "linear-gradient(135deg,#6b0941 0%,#1a0a0f 100%)" },
  { label: "Chain Sets", slug: "chain-sets", Icon: Link2, bg: "linear-gradient(135deg,#9B0F5F 30%,#D4AF37 100%)" },
];

const WHY_FEATURES = [
  { Icon: ShieldCheck, title: "Anti-Tarnish Technology", desc: "Our jewellery stays bright & shiny — no colour fading, ever." },
  { Icon: Droplets, title: "100% Waterproof", desc: "Wear it to the gym, beach, or shower without worry." },
  { Icon: Heart, title: "Skin-Friendly", desc: "Nickel-free and hypoallergenic — safe for sensitive skin." },
  { Icon: Truck, title: "Free Shipping ₹999+", desc: "Fast dispatch within 24 hours, delivered pan-India." },
  { Icon: Gem, title: "Handcrafted Quality", desc: "Every piece is hand-finished by skilled artisans." },
  { Icon: BadgeCheck, title: "100% Authentic", desc: "Certified quality with genuine anti-tarnish coating." },
];

const INSTA_GRADIENTS = [
  "linear-gradient(135deg,#9B0F5F,#D4AF37)",
  "linear-gradient(135deg,#1a0a0f,#9B0F5F)",
  "linear-gradient(135deg,#D4AF37,#b5135f)",
  "linear-gradient(135deg,#6b0941,#D4AF37)",
  "linear-gradient(135deg,#9B0F5F,#1a0a0f)",
  "linear-gradient(135deg,#D4AF37,#9B0F5F)",
];

export default function Home() {
  const { sessionId } = useCartContext();
  const sliderNewRef = useRef<HTMLDivElement>(null);
  const sliderBestRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const s = useSiteSettings();
  const { colors, hero, testimonials } = s;
  const { brand, gold, dark } = colors;

  const { data: categoriesData } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() },
  });

  const activeCategoryId = useMemo(() => {
    if (!activeTab || !categoriesData) return null;
    const cat = categoriesData.find((c) => c.slug === activeTab);
    return cat ? cat.id : null;
  }, [activeTab, categoriesData]);

  const { data: tabProductData, isLoading: tabLoading } = useListProducts(
    { categoryId: activeCategoryId, sortBy: "newest" as const, limit: 12 },
    { query: { queryKey: getListProductsQueryKey({ categoryId: activeCategoryId, sortBy: "newest", limit: 12 }) } }
  );

  const { data: newArrivalsData, isLoading: newLoading } = useListProducts(
    { sortBy: "newest" as const, limit: 8 },
    { query: { queryKey: getListProductsQueryKey({ sortBy: "newest", limit: 8 }) } }
  );
  const { data: bestSellerData, isLoading: bestLoading } = useGetFeaturedProducts(
    { limit: 8 },
    { query: { queryKey: getGetFeaturedProductsQueryKey({ limit: 8 }) } }
  );

  const tabProducts = (tabProductData?.products ?? []) as CardProduct[];
  const newArrivals = newArrivalsData?.products ?? [];
  const bestSellers = (bestSellerData ?? []) as CardProduct[];

  const scroll = (ref: React.RefObject<HTMLDivElement>, dir: "left" | "right") => {
    ref.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubscribed(true);
  };

  return (
    <StoreLayout>
      <style>{`
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-33.33%)} }
        .insta-card:hover .insta-overlay { opacity: 1; }
        .slider-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── 1. TICKER ── */}
      <Ticker dark={dark} gold={gold} />

      {/* ── 2. HERO BANNER ── */}
      <section className="relative w-full overflow-hidden" style={{ height: "58vh", minHeight: 340, maxHeight: 560 }}>
        <img src="/brand/hero-banner.png" alt="Sriswa Studio"
          className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: "right center" }} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${dark} 0%, ${dark} 42%, ${dark}55 68%, ${dark}00 100%)` }} />
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-[30px] md:px-[60px]">
            <div className="max-w-lg">
              <p className="text-[11px] tracking-[0.35em] uppercase font-medium mb-3" style={{ color: gold }}>{hero.badge}</p>
              <h1 className="font-serif font-bold text-white leading-[1.05] mb-4" style={{ fontSize: "clamp(30px, 4.5vw, 58px)" }}>
                {hero.title}<br /><span style={{ color: gold }}>{hero.titleGold}</span>
              </h1>
              <p className="text-white/60 text-sm mb-7 max-w-sm">{hero.subtitle}</p>
              <div className="flex items-center gap-4 flex-wrap">
                <Link href="/shop"
                  className="inline-flex items-center gap-2 px-7 py-3 text-[12px] font-bold tracking-[0.2em] uppercase text-white transition-opacity hover:opacity-85"
                  style={{ background: brand }}>
                  <ShoppingBag className="h-3.5 w-3.5" /> {hero.shopButtonText}
                </Link>
                <Link href="/shop" className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.15em] uppercase hover:opacity-60 transition-opacity"
                  style={{ color: "rgba(255,255,255,0.6)", borderBottom: "1px solid rgba(255,255,255,0.3)" }}>
                  {hero.viewAllText} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. SHOP BY CATEGORY (tabs) ── */}
      <section className="py-14 bg-white">
        <div className="container mx-auto px-[30px]">
          <div className="text-center mb-10">
            <p className="text-[10px] tracking-[0.35em] uppercase font-medium mb-1.5" style={{ color: brand }}>Browse</p>
            <h2 className="font-serif font-bold text-2xl md:text-3xl text-gray-900">Shop by Category</h2>
            <div className="mt-3 mx-auto h-0.5 w-12" style={{ background: gold }} />
          </div>

          {/* Tab circles */}
          <div className="flex items-start gap-5 md:gap-8 overflow-x-auto pb-3 slider-scroll md:justify-center">
            {SHOP_CATEGORIES.map(({ label, slug }, i) => {
              const isActive = activeTab === slug;
              return (
                <button
                  key={i}
                  onClick={() => setActiveTab(slug)}
                  className="flex flex-col items-center gap-3 flex-shrink-0 cursor-pointer border-none bg-transparent p-0"
                >
                  <div
                    className="h-[90px] w-[90px] rounded-full p-[3px] transition-all duration-300"
                    style={{ background: isActive ? brand : `linear-gradient(135deg, ${gold} 0%, ${brand} 100%)` }}
                  >
                    <div
                      className="h-full w-full rounded-full flex items-center justify-center transition-all duration-300"
                      style={{ background: isActive ? brand : "white" }}
                    >
                      {(() => {
                        const { Icon } = SHOP_CATEGORIES[i];
                        return <Icon className="h-7 w-7" style={{ color: isActive ? "white" : brand }} />;
                      })()}
                    </div>
                  </div>
                  <span
                    className="text-[11px] font-semibold tracking-[0.08em] text-center leading-tight max-w-[76px]"
                    style={{ color: isActive ? brand : "#4b2038" }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}

            {/* View All — navigates to /shop */}
            <Link href="/shop" className="flex flex-col items-center gap-3 flex-shrink-0">
              <div
                className="h-[90px] w-[90px] rounded-full flex items-center justify-center"
                style={{ border: `2.5px dashed ${brand}`, background: "#fdf6f9" }}
              >
                <ArrowRight className="h-7 w-7" style={{ color: brand }} />
              </div>
              <span className="text-[11px] font-semibold tracking-[0.08em] text-center" style={{ color: brand }}>
                View All
              </span>
            </Link>
          </div>

          {/* Inline product grid — only shown when a tab is active */}
          {activeTab !== null && (
            <div className="mt-10">
              <div className="h-px mb-8" style={{ background: `linear-gradient(to right, transparent, ${gold}, transparent)` }} />
              {tabLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-sm animate-pulse" style={{ aspectRatio: "3/4", background: "#f3e8f0" }} />
                  ))}
                </div>
              ) : tabProducts.length === 0 ? (
                <div className="text-center py-16">
                  <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-20" style={{ color: brand }} />
                  <p className="text-sm text-gray-400">No products found in this category yet.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {tabProducts.map((p) => (
                      <ProductCard key={p.id} product={p} sessionId={sessionId} brand={brand} dark={dark} />
                    ))}
                  </div>
                  <div className="text-center mt-8">
                    <Link
                      href={`/shop?category=${activeTab}`}
                      className="inline-flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase font-semibold px-6 py-3 border transition-colors"
                      style={{ color: brand, borderColor: brand }}
                    >
                      View All {SHOP_CATEGORIES.find(c => c.slug === activeTab)?.label}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── 4. NEW ARRIVALS ── */}
      <section className="py-12" style={{ background: "#fdf6f9" }}>
        <div className="container mx-auto px-[30px]">
          <div className="flex items-end justify-between mb-7">
            <div>
              <p className="text-[10px] tracking-[0.35em] uppercase font-medium mb-1" style={{ color: brand }}>Fresh In</p>
              <h2 className="font-serif font-bold text-2xl md:text-3xl text-gray-900">New Arrivals</h2>
            </div>
            <Link href="/shop" className="text-[11px] tracking-[0.18em] uppercase font-medium pb-0.5 hover:opacity-70 flex items-center gap-1"
              style={{ color: brand, borderBottom: `1.5px solid ${brand}` }}>
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="relative">
            <button onClick={() => scroll(sliderNewRef, "left")}
              className="absolute -left-3 top-1/3 -translate-y-1/2 z-10 h-8 w-8 rounded-full flex items-center justify-center shadow-md bg-white border"
              style={{ borderColor: "#e5e7eb" }} aria-label="Previous">
              <ChevronLeft className="h-4 w-4" style={{ color: brand }} />
            </button>
            <button onClick={() => scroll(sliderNewRef, "right")}
              className="absolute -right-3 top-1/3 -translate-y-1/2 z-10 h-8 w-8 rounded-full flex items-center justify-center shadow-md bg-white border"
              style={{ borderColor: "#e5e7eb" }} aria-label="Next">
              <ChevronRight className="h-4 w-4" style={{ color: brand }} />
            </button>
            <div ref={sliderNewRef} className="flex gap-4 overflow-x-auto pb-2 slider-scroll"
              style={{ scrollSnapType: "x mandatory" }}>
              {newLoading
                ? [1,2,3,4,5,6].map(i => (
                    <div key={i} className="flex-shrink-0 animate-pulse space-y-3" style={{ width: 200, scrollSnapAlign: "start" }}>
                      <div className="w-full rounded-sm" style={{ aspectRatio: "3/4", background: "#f0e6ec" }} />
                      <div className="h-3 rounded w-3/4" style={{ background: "#f0e6ec" }} />
                    </div>
                  ))
                : newArrivals.map(p => (
                    <div key={p.id} className="flex-shrink-0" style={{ width: 200, scrollSnapAlign: "start" }}>
                      <ProductCard product={{ ...p, stockQuantity: (p as { stockQuantity?: number }).stockQuantity ?? 1 }}
                        sessionId={sessionId} brand={brand} dark={dark} />
                    </div>
                  ))
              }
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. BEST SELLERS ── */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-[30px]">
          <div className="flex items-end justify-between mb-7">
            <div>
              <p className="text-[10px] tracking-[0.35em] uppercase font-medium mb-1" style={{ color: brand }}>Top Picks</p>
              <h2 className="font-serif font-bold text-2xl md:text-3xl text-gray-900">Best Sellers</h2>
            </div>
            <Link href="/shop" className="text-[11px] tracking-[0.18em] uppercase font-medium pb-0.5 hover:opacity-70 flex items-center gap-1"
              style={{ color: brand, borderBottom: `1.5px solid ${brand}` }}>
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {bestLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[1,2,3,4].map(i => (
                <div key={i} className="animate-pulse space-y-3">
                  <div className="w-full rounded-sm" style={{ aspectRatio: "3/4", background: "#f0e6ec" }} />
                  <div className="h-3 rounded w-3/4" style={{ background: "#f0e6ec" }} />
                </div>
              ))}
            </div>
          ) : bestSellers.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
              {bestSellers.map(p => (
                <ProductCard key={p.id} product={p} sessionId={sessionId} brand={brand} dark={dark} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 text-center">
              <Sparkles className="h-10 w-10 mb-4" style={{ color: brand, opacity: 0.2 }} />
              <p className="text-gray-400 text-sm">Best sellers coming soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* ── 6. WHY CHOOSE SRISWA ── */}
      <section className="py-14" style={{ background: dark }}>
        <div className="container mx-auto px-[30px]">
          <div className="text-center mb-10">
            <p className="text-[10px] tracking-[0.35em] uppercase font-medium mb-2" style={{ color: gold }}>Our Promise</p>
            <h2 className="font-serif font-bold text-2xl md:text-3xl text-white">Why Choose Sriswa Studio</h2>
            <div className="mt-3 mx-auto h-0.5 w-12" style={{ background: gold }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_FEATURES.map(({ Icon, title, desc }, i) => (
              <div key={i} className="flex gap-4 p-5 rounded-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center" style={{ background: `${brand}33` }}>
                  <Icon className="h-5 w-5" style={{ color: gold }} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-white text-sm mb-1">{title}</h3>
                  <p className="text-white/50 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. CUSTOMER REVIEWS ── */}
      <section className="py-14 bg-white">
        <div className="container mx-auto px-[30px]">
          <div className="text-center mb-10">
            <p className="text-[10px] tracking-[0.35em] uppercase font-medium mb-2" style={{ color: brand }}>Testimonials</p>
            <h2 className="font-serif font-bold text-2xl md:text-3xl" style={{ color: dark }}>What Our Customers Say</h2>
            <div className="mt-3 mx-auto h-0.5 w-12" style={{ background: gold }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map(({ name, city, rating, text }) => (
              <div key={name} className="p-5 rounded-sm border" style={{ borderColor: `${brand}18`, background: "#fdf6f9" }}>
                <StarRating n={rating} gold={gold} />
                <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">"{text}"</p>
                <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: `${brand}15` }}>
                  <div className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: brand }}>{name[0]}</div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: dark }}>{name}</p>
                    <p className="text-[10px] text-gray-400">{city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. INSTAGRAM FEED ── */}
      <section className="py-12" style={{ background: "#fdf6f9" }}>
        <div className="container mx-auto px-[30px]">
          <div className="text-center mb-8">
            <p className="text-[10px] tracking-[0.35em] uppercase font-medium mb-1.5" style={{ color: brand }}>Social</p>
            <h2 className="font-serif font-bold text-2xl md:text-3xl text-gray-900 flex items-center justify-center gap-2">
              <Instagram className="h-6 w-6" style={{ color: brand }} /> Follow Us @sriswastudio
            </h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {INSTA_GRADIENTS.map((bg, i) => (
              <a key={i} href="https://instagram.com/sriswastudio" target="_blank" rel="noopener noreferrer"
                className="insta-card relative overflow-hidden rounded-sm" style={{ aspectRatio: "1/1", background: bg }}>
                <div className="insta-overlay absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300"
                  style={{ background: "rgba(0,0,0,0.35)" }}>
                  <Instagram className="h-7 w-7 text-white" />
                </div>
              </a>
            ))}
          </div>
          <div className="text-center mt-6">
            <a href="https://instagram.com/sriswastudio" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[12px] tracking-[0.15em] uppercase font-semibold pb-0.5 hover:opacity-70 transition-opacity"
              style={{ color: brand, borderBottom: `1.5px solid ${brand}` }}>
              <Instagram className="h-3.5 w-3.5" /> View on Instagram
            </a>
          </div>
        </div>
      </section>

      {/* ── 9. NEWSLETTER ── */}
      <section className="py-14" style={{ background: brand }}>
        <div className="container mx-auto px-[30px]">
          <div className="max-w-xl mx-auto text-center">
            <Mail className="h-8 w-8 mx-auto mb-4 text-white/70" />
            <h2 className="font-serif font-bold text-2xl md:text-3xl text-white mb-2">Join Our Inner Circle</h2>
            <p className="text-white/70 text-sm mb-7 leading-relaxed">
              Get exclusive offers, early access to new arrivals &amp; jewellery care tips delivered to your inbox.
            </p>
            {subscribed ? (
              <div className="bg-white/15 rounded-sm py-4 px-6 text-white font-medium tracking-wide">
                ✓ Thank you for subscribing!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-0 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  placeholder="Your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 text-sm bg-white text-gray-800 outline-none placeholder:text-gray-400"
                  style={{ borderRadius: 0 }}
                />
                <button type="submit"
                  className="px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase text-white whitespace-nowrap hover:opacity-90 transition-opacity"
                  style={{ background: dark, borderRadius: 0 }}>
                  Subscribe
                </button>
              </form>
            )}
            <p className="text-white/40 text-[10px] mt-3">No spam, unsubscribe anytime.</p>
          </div>
        </div>
      </section>

    </StoreLayout>
  );
}
