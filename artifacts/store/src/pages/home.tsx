import { Link, useLocation } from "wouter";
import { StoreLayout } from "@/components/layout/store-layout";
import {
  useListProducts, getListProductsQueryKey,
  useListCategories, getListCategoriesQueryKey,
  useGetFeaturedProducts, getGetFeaturedProductsQueryKey,
  useAddToCart,
} from "@workspace/api-client-react";
import { useCartContext } from "@/hooks/use-cart-context";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Droplets, Sparkles, Truck, ShoppingBag, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo, useRef } from "react";

const BRAND = "#9B0F5F";
const GOLD = "#D4AF37";
const DARK = "#1a0a0f";

/* ─── Ticker ─── */
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
    <div className="w-full overflow-hidden py-2.5" style={{ background: DARK }}>
      <div className="flex gap-14 whitespace-nowrap" style={{ animation: "ticker 28s linear infinite" }}>
        {repeated.map((item, i) => (
          <span key={i} className="text-[11px] tracking-[0.22em] font-medium uppercase flex-shrink-0" style={{ color: GOLD }}>
            {item}
          </span>
        ))}
      </div>
      <style>{`@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.33%); } }`}</style>
    </div>
  );
}

/* ─── Product Card ─── */
type CardProduct = {
  id: number; name: string; slug: string;
  price: number; compareAtPrice?: number | null;
  images?: { url: string }[]; stockQuantity: number;
};

function ProductCard({ product, sessionId }: { product: CardProduct; sessionId: string }) {
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
          <img
            src={product.images[0].url} alt={product.name}
            className="w-full h-full object-cover"
            style={{ transition: "transform 0.65s cubic-bezier(0.25,0.46,0.45,0.94)" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles className="h-10 w-10" style={{ color: BRAND, opacity: 0.2 }} />
          </div>
        )}
        {product.compareAtPrice && !outOfStock && (
          <span className="absolute top-2.5 left-2.5 text-white text-[9px] font-bold px-2 py-0.5 tracking-widest uppercase" style={{ background: BRAND, borderRadius: "2px" }}>Sale</span>
        )}
        {outOfStock && (
          <span className="absolute top-2.5 left-2.5 text-white text-[9px] font-bold px-2 py-0.5 tracking-widest uppercase" style={{ background: "#888", borderRadius: "2px" }}>Sold Out</span>
        )}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAdd} disabled={outOfStock || adding}
            className="w-full flex items-center justify-center gap-2 py-3 text-white text-[11px] tracking-[0.18em] uppercase font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: outOfStock ? "#888" : BRAND }}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {adding ? "Adding…" : outOfStock ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
      <h3 className="font-serif font-semibold text-sm leading-snug mb-1 transition-colors group-hover:text-[#9B0F5F]" style={{ color: DARK }}>
        {product.name}
      </h3>
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm" style={{ color: BRAND }}>₹{product.price}</span>
        {product.compareAtPrice && <span className="text-gray-400 line-through text-xs">₹{product.compareAtPrice}</span>}
      </div>
    </Link>
  );
}

/* ─── Testimonials ─── */
const TESTIMONIALS = [
  { name: "Priya S.", city: "Mumbai", rating: 5, text: "I've been wearing my anklet for 3 months, even in the shower — not a single tarnish! Absolutely love it. Will definitely order more." },
  { name: "Riya M.", city: "Bangalore", rating: 5, text: "The necklace looks so premium and it's so affordable. I got so many compliments at my friend's wedding. Sriswa Studio is my go-to now!" },
  { name: "Ananya K.", city: "Chennai", rating: 5, text: "Super fast delivery and beautiful packaging. The earrings are lightweight and don't cause any irritation. Perfect for sensitive ears!" },
  { name: "Divya R.", city: "Hyderabad", rating: 5, text: "Was skeptical at first but the quality is amazing. Wore it swimming and it's still shining. 100% worth every rupee!" },
];

function StarRating({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5 mb-2">
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-current" style={{ color: GOLD }} />
      ))}
    </div>
  );
}

export default function Home() {
  const [_loc] = useLocation();
  const { sessionId } = useCartContext();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"new" | "best">("new");
  const sliderRef = useRef<HTMLDivElement>(null);

  const { data: categories } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });

  const categoryId = useMemo(() => {
    if (!activeCategory || !categories) return null;
    return categories.find(c => c.slug === activeCategory)?.id ?? null;
  }, [activeCategory, categories]);

  const { data: productData, isLoading } = useListProducts(
    { categoryId, sortBy: "newest" as const, limit: 30 },
    { query: { queryKey: getListProductsQueryKey({ categoryId, sortBy: "newest", limit: 30 }) } }
  );

  const { data: newArrivals } = useListProducts(
    { sortBy: "newest" as const, limit: 6 },
    { query: { queryKey: getListProductsQueryKey({ sortBy: "newest", limit: 6 }) } }
  );

  const { data: bestSellers } = useGetFeaturedProducts(
    { limit: 6 },
    { query: { queryKey: getGetFeaturedProductsQueryKey({ limit: 6 }) } }
  );

  const products = productData?.products ?? [];
  const spotlightProducts = activeTab === "new"
    ? (newArrivals?.products ?? [])
    : (bestSellers ?? []);

  return (
    <StoreLayout>

      {/* ── Ticker ── */}
      <Ticker />

      {/* ── COMPACT HERO ── */}
      <section className="relative w-full overflow-hidden" style={{ height: "52vh", minHeight: 320, maxHeight: 520 }}>
        <img
          src="/brand/hero-banner.png" alt="Sriswa Studio Jewellery"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "right center" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #1a0a0f 0%, #1a0a0f 44%, rgba(26,10,15,0.35) 68%, rgba(26,10,15,0) 100%)" }} />
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-6 md:px-12">
            <div className="max-w-md">
              <p className="text-[11px] tracking-[0.35em] uppercase font-medium mb-3" style={{ color: GOLD }}>New Arrivals · 2025</p>
              <h1 className="font-serif font-bold text-white leading-[1.05] mb-4" style={{ fontSize: "clamp(28px, 4vw, 52px)" }}>
                Jewellery That<br /><span style={{ color: GOLD }}>Lasts Forever</span>
              </h1>
              <p className="text-white/60 text-sm mb-6">Anti-tarnish · Waterproof · Skin-friendly · Starting ₹399</p>
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" })}
                  className="inline-flex items-center gap-2 px-7 py-3 text-[12px] font-bold tracking-[0.2em] uppercase text-white transition-opacity hover:opacity-85"
                  style={{ background: BRAND }}
                >
                  <ShoppingBag className="h-3.5 w-3.5" /> Shop Now
                </button>
                <Link href="/shop" className="text-[11px] font-medium tracking-[0.15em] uppercase pb-0.5 transition-opacity hover:opacity-60"
                  style={{ color: "rgba(255,255,255,0.6)", borderBottom: "1px solid rgba(255,255,255,0.3)" }}>
                  View All →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── USP STRIP ── */}
      <div className="border-b" style={{ background: "#fdf6f9", borderColor: `${BRAND}18` }}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              { icon: ShieldCheck, label: "Anti-Tarnish" },
              { icon: Droplets, label: "Waterproof" },
              { icon: Sparkles, label: "Skin-Friendly" },
              { icon: Truck, label: "Free Shipping ₹999+" },
            ].map(({ icon: Icon, label }, i) => (
              <div key={label} className="flex items-center justify-center gap-2.5 py-3.5 px-4"
                style={{ borderRight: i < 3 ? `1px solid ${BRAND}18` : "none" }}>
                <Icon className="h-4 w-4 flex-shrink-0" style={{ color: BRAND }} />
                <span className="text-[11px] tracking-[0.12em] uppercase font-semibold text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── OUR COLLECTION ── */}
      <section id="products-section" className="py-10 bg-white">
        <div className="container mx-auto px-6">

          {/* Header */}
          <div className="text-center mb-6">
            <p className="text-[10px] tracking-[0.35em] uppercase font-medium mb-1.5" style={{ color: BRAND }}>Shop All Jewellery</p>
            <h2 className="font-serif font-bold text-2xl md:text-3xl text-gray-900">Our Collection</h2>
            <div className="mt-3 mx-auto h-0.5 w-12" style={{ background: GOLD }} />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap mb-7">
            <button
              onClick={() => setActiveCategory(null)}
              className="px-4 py-1.5 text-[11px] tracking-[0.15em] uppercase font-semibold rounded-full border transition-all"
              style={{ background: !activeCategory ? BRAND : "transparent", color: !activeCategory ? "white" : "#555", borderColor: !activeCategory ? BRAND : "#ddd" }}
            >All</button>
            {categories?.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug ?? null)}
                className="px-4 py-1.5 text-[11px] tracking-[0.15em] uppercase font-semibold rounded-full border transition-all"
                style={{ background: activeCategory === cat.slug ? BRAND : "transparent", color: activeCategory === cat.slug ? "white" : "#555", borderColor: activeCategory === cat.slug ? BRAND : "#ddd" }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Skeletons */}
          {isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="animate-pulse space-y-3">
                  <div className="w-full rounded-sm" style={{ aspectRatio: "3/4", background: "#f0e6ec" }} />
                  <div className="h-3 rounded w-3/4" style={{ background: "#f0e6ec" }} />
                  <div className="h-3 rounded w-1/3" style={{ background: "#f0e6ec" }} />
                </div>
              ))}
            </div>
          )}

          {/* Grid */}
          {!isLoading && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
              {products.map(product => <ProductCard key={product.id} product={product} sessionId={sessionId} />)}
            </div>
          )}

          {!isLoading && products.length === 0 && (
            <div className="flex flex-col items-center py-20 text-center">
              <Sparkles className="h-10 w-10 mb-4" style={{ color: BRAND, opacity: 0.25 }} />
              <p className="text-gray-400 text-sm">No products found.</p>
            </div>
          )}

          {!isLoading && products.length >= 30 && (
            <div className="text-center mt-12">
              <Link href="/shop" className="inline-flex items-center gap-2 px-8 py-3 text-[12px] font-bold tracking-[0.2em] uppercase text-white transition-opacity hover:opacity-85" style={{ background: BRAND }}>
                Browse Full Collection →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── NEW ARRIVALS / BEST SELLERS ── */}
      <section className="py-12" style={{ background: "#fdf6f9" }}>
        <div className="container mx-auto px-6">

          {/* Tab header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-end gap-1 justify-center">
              {(["new", "best"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="font-serif font-bold text-2xl md:text-3xl px-2 pb-1 transition-all duration-200"
                  style={{
                    color: activeTab === tab ? DARK : "#ccc",
                    borderBottom: activeTab === tab ? `2px solid ${GOLD}` : "2px solid transparent",
                  }}
                >
                  {tab === "new" ? "New Arrivals" : "Best Sellers"}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <Link href="/shop" className="text-[11px] tracking-[0.18em] uppercase font-medium pb-0.5 hover:opacity-70 transition-opacity"
                style={{ color: BRAND, borderBottom: `1.5px solid ${BRAND}` }}>
                Shop All →
              </Link>
            </div>
          </div>

          {/* Horizontal scroll slider */}
          <div className="relative">
            {/* Prev arrow */}
            <button
              onClick={() => sliderRef.current?.scrollBy({ left: -320, behavior: "smooth" })}
              className="absolute -left-4 top-1/3 -translate-y-1/2 z-10 h-9 w-9 rounded-full flex items-center justify-center shadow-md bg-white border transition-colors hover:border-[#9B0F5F]"
              style={{ borderColor: "#e5e7eb" }}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" style={{ color: BRAND }} />
            </button>
            {/* Next arrow */}
            <button
              onClick={() => sliderRef.current?.scrollBy({ left: 320, behavior: "smooth" })}
              className="absolute -right-4 top-1/3 -translate-y-1/2 z-10 h-9 w-9 rounded-full flex items-center justify-center shadow-md bg-white border transition-colors hover:border-[#9B0F5F]"
              style={{ borderColor: "#e5e7eb" }}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" style={{ color: BRAND }} />
            </button>

            {/* Scrollable track */}
            <div
              ref={sliderRef}
              className="flex gap-4 overflow-x-auto pb-2"
              style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <style>{`.slider-hide-scroll::-webkit-scrollbar { display: none; }`}</style>
              {spotlightProducts.length > 0
                ? spotlightProducts.map(product => (
                    <div
                      key={product.id}
                      className="flex-shrink-0 slider-hide-scroll"
                      style={{ width: 220, scrollSnapAlign: "start" }}
                    >
                      <ProductCard
                        product={{ ...product, stockQuantity: (product as { stockQuantity?: number }).stockQuantity ?? 1 }}
                        sessionId={sessionId}
                      />
                    </div>
                  ))
                : [1,2,3,4,5,6].map(i => (
                    <div key={i} className="flex-shrink-0 animate-pulse space-y-3" style={{ width: 220 }}>
                      <div className="w-full rounded-sm" style={{ aspectRatio: "3/4", background: "#f0e6ec" }} />
                      <div className="h-3 rounded w-3/4" style={{ background: "#f0e6ec" }} />
                    </div>
                  ))
              }
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-14" style={{ background: "#fff" }}>
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-[10px] tracking-[0.35em] uppercase font-medium mb-2" style={{ color: BRAND }}>
              Happy Customers
            </p>
            <h2 className="font-serif font-bold text-2xl md:text-3xl" style={{ color: DARK }}>
              What Our Customers Say
            </h2>
            <div className="mt-3 mx-auto h-0.5 w-12" style={{ background: GOLD }} />
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TESTIMONIALS.map(({ name, city, rating, text }) => (
              <div
                key={name}
                className="flex flex-col p-5 rounded-sm"
                style={{ background: "#fdf6f9", border: `1px solid ${BRAND}18` }}
              >
                <StarRating n={rating} />
                <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-4 italic">"{text}"</p>
                <div>
                  <p className="font-serif font-bold text-sm" style={{ color: DARK }}>{name}</p>
                  <p className="text-[10px] tracking-[0.15em] uppercase mt-0.5" style={{ color: BRAND }}>{city}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust badge row */}
          <div className="mt-10 flex flex-wrap justify-center gap-8 text-center">
            {[
              { num: "10,000+", label: "Happy Customers" },
              { num: "4.9★", label: "Avg. Rating" },
              { num: "500+", label: "Designs" },
              { num: "24hr", label: "Dispatch" },
            ].map(({ num, label }) => (
              <div key={label}>
                <p className="font-serif font-bold text-2xl" style={{ color: BRAND }}>{num}</p>
                <p className="text-[10px] tracking-[0.15em] uppercase mt-0.5 text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </StoreLayout>
  );
}
