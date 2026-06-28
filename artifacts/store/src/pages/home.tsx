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
import { useSiteSettings } from "@/hooks/use-site-settings";
import { ShieldCheck, Droplets, Sparkles, Truck, ShoppingBag, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo, useRef } from "react";

const USP_ICONS = [ShieldCheck, Droplets, Sparkles, Truck];

/* ─── Ticker ─── */
const TICKER_ITEMS = [
  "✦ Anti-Tarnish Jewellery",
  "✦ Ships in 24 Hours",
  "✦ Free Shipping above ₹999",
  "✦ 10,000+ Happy Customers",
  "✦ Waterproof & Skin-Friendly",
  "✦ Handcrafted with Love",
];

function Ticker({ dark, gold }: { dark: string; gold: string }) {
  const repeated = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="w-full overflow-hidden py-2.5" style={{ background: dark }}>
      <div className="flex gap-14 whitespace-nowrap" style={{ animation: "ticker 28s linear infinite" }}>
        {repeated.map((item, i) => (
          <span key={i} className="text-[11px] tracking-[0.22em] font-medium uppercase flex-shrink-0" style={{ color: gold }}>
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
          <img
            src={product.images[0].url} alt={product.name}
            className="w-full h-full object-cover"
            style={{ transition: "transform 0.65s cubic-bezier(0.25,0.46,0.45,0.94)" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
          />
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
          <button
            onClick={handleAdd} disabled={outOfStock || adding}
            className="w-full flex items-center justify-center gap-2 py-3 text-white text-[11px] tracking-[0.18em] uppercase font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: outOfStock ? "#888" : brand }}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {adding ? "Adding…" : outOfStock ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
      <h3 className="font-serif font-semibold text-sm leading-snug mb-1 transition-colors" style={{ color: dark }}>
        {product.name}
      </h3>
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

export default function Home() {
  const [_loc] = useLocation();
  const { sessionId } = useCartContext();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"new" | "best">("new");
  const sliderRef = useRef<HTMLDivElement>(null);

  const s = useSiteSettings();
  const { colors, hero, usp, collection, tabs, testimonials } = s;
  const { brand, gold, dark } = colors;

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
      <Ticker dark={dark} gold={gold} />

      {/* ── COMPACT HERO ── */}
      <section className="relative w-full overflow-hidden" style={{ height: "52vh", minHeight: 320, maxHeight: 520 }}>
        <img
          src="/brand/hero-banner.png" alt="Sriswa Studio Jewellery"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "right center" }}
        />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${dark} 0%, ${dark} 44%, ${dark}59 68%, ${dark}00 100%)` }} />
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-[30px] md:px-[60px]">
            <div className="max-w-md">
              <p className="text-[11px] tracking-[0.35em] uppercase font-medium mb-3" style={{ color: gold }}>{hero.badge}</p>
              <h1 className="font-serif font-bold text-white leading-[1.05] mb-4" style={{ fontSize: "clamp(28px, 4vw, 52px)" }}>
                {hero.title}<br /><span style={{ color: gold }}>{hero.titleGold}</span>
              </h1>
              <p className="text-white/60 text-sm mb-6">{hero.subtitle}</p>
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" })}
                  className="inline-flex items-center gap-2 px-7 py-3 text-[12px] font-bold tracking-[0.2em] uppercase text-white transition-opacity hover:opacity-85"
                  style={{ background: brand }}
                >
                  <ShoppingBag className="h-3.5 w-3.5" /> {hero.shopButtonText}
                </button>
                <Link href="/shop" className="text-[11px] font-medium tracking-[0.15em] uppercase pb-0.5 transition-opacity hover:opacity-60"
                  style={{ color: "rgba(255,255,255,0.6)", borderBottom: "1px solid rgba(255,255,255,0.3)" }}>
                  {hero.viewAllText}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── USP STRIP ── */}
      <div className="border-b" style={{ background: "#fdf6f9", borderColor: `${brand}18` }}>
        <div className="container mx-auto px-[30px]">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {usp.map(({ text }, i) => {
              const Icon = USP_ICONS[i] ?? ShieldCheck;
              return (
                <div key={i} className="flex items-center justify-center gap-2.5 py-3.5 px-4"
                  style={{ borderRight: i < 3 ? `1px solid ${brand}18` : "none" }}>
                  <Icon className="h-4 w-4 flex-shrink-0" style={{ color: brand }} />
                  <span className="text-[11px] tracking-[0.12em] uppercase font-semibold text-gray-700">{text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── OUR COLLECTION ── */}
      <section id="products-section" className="py-10 bg-white">
        <div className="container mx-auto px-[30px]">

          {/* Header */}
          <div className="text-center mb-6">
            <p className="text-[10px] tracking-[0.35em] uppercase font-medium mb-1.5" style={{ color: brand }}>{collection.label}</p>
            <h2 className="font-serif font-bold text-2xl md:text-3xl text-gray-900">{collection.title}</h2>
            <div className="mt-3 mx-auto h-0.5 w-12" style={{ background: gold }} />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap mb-7">
            <button
              onClick={() => setActiveCategory(null)}
              className="px-4 py-1.5 text-[11px] tracking-[0.15em] uppercase font-semibold rounded-full border transition-all"
              style={{ background: !activeCategory ? brand : "transparent", color: !activeCategory ? "white" : "#555", borderColor: !activeCategory ? brand : "#ddd" }}
            >All</button>
            {categories?.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug ?? null)}
                className="px-4 py-1.5 text-[11px] tracking-[0.15em] uppercase font-semibold rounded-full border transition-all"
                style={{ background: activeCategory === cat.slug ? brand : "transparent", color: activeCategory === cat.slug ? "white" : "#555", borderColor: activeCategory === cat.slug ? brand : "#ddd" }}
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
              {products.map(product => (
                <ProductCard key={product.id} product={product} sessionId={sessionId} brand={brand} dark={dark} />
              ))}
            </div>
          )}

          {!isLoading && products.length === 0 && (
            <div className="flex flex-col items-center py-20 text-center">
              <Sparkles className="h-10 w-10 mb-4" style={{ color: brand, opacity: 0.25 }} />
              <p className="text-gray-400 text-sm">No products found.</p>
            </div>
          )}

          {!isLoading && products.length >= 30 && (
            <div className="text-center mt-12">
              <Link href="/shop" className="inline-flex items-center gap-2 px-8 py-3 text-[12px] font-bold tracking-[0.2em] uppercase text-white transition-opacity hover:opacity-85" style={{ background: brand }}>
                Browse Full Collection →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── NEW ARRIVALS / BEST SELLERS ── */}
      <section className="py-12" style={{ background: "#fdf6f9" }}>
        <div className="container mx-auto px-[30px]">

          {/* Tab header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-end gap-1 justify-center">
              {(["new", "best"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="font-serif font-bold text-2xl md:text-3xl px-2 pb-1 transition-all duration-200"
                  style={{
                    color: activeTab === tab ? dark : "#ccc",
                    borderBottom: activeTab === tab ? `2px solid ${gold}` : "2px solid transparent",
                  }}
                >
                  {tab === "new" ? tabs.newArrivalsLabel : tabs.bestSellersLabel}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <Link href="/shop" className="text-[11px] tracking-[0.18em] uppercase font-medium pb-0.5 hover:opacity-70 transition-opacity"
                style={{ color: brand, borderBottom: `1.5px solid ${brand}` }}>
                {tabs.shopAllText}
              </Link>
            </div>
          </div>

          {/* Horizontal scroll slider */}
          <div className="relative">
            <button
              onClick={() => sliderRef.current?.scrollBy({ left: -320, behavior: "smooth" })}
              className="absolute -left-4 top-1/3 -translate-y-1/2 z-10 h-9 w-9 rounded-full flex items-center justify-center shadow-md bg-white border transition-colors"
              style={{ borderColor: "#e5e7eb" }}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" style={{ color: brand }} />
            </button>
            <button
              onClick={() => sliderRef.current?.scrollBy({ left: 320, behavior: "smooth" })}
              className="absolute -right-4 top-1/3 -translate-y-1/2 z-10 h-9 w-9 rounded-full flex items-center justify-center shadow-md bg-white border transition-colors"
              style={{ borderColor: "#e5e7eb" }}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" style={{ color: brand }} />
            </button>

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
                        brand={brand}
                        dark={dark}
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
        <div className="container mx-auto px-[30px]">
          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-[10px] tracking-[0.35em] uppercase font-medium mb-2" style={{ color: brand }}>
              Happy Customers
            </p>
            <h2 className="font-serif font-bold text-2xl md:text-3xl" style={{ color: dark }}>
              What Our Customers Say
            </h2>
            <div className="mt-3 mx-auto h-0.5 w-12" style={{ background: gold }} />
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map(({ name, city, rating, text }) => (
              <div
                key={name}
                className="flex flex-col p-5 rounded-sm"
                style={{ background: "#fdf6f9", border: `1px solid ${brand}18` }}
              >
                <StarRating n={rating} gold={gold} />
                <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-4 italic">"{text}"</p>
                <div>
                  <p className="font-serif font-bold text-sm" style={{ color: dark }}>{name}</p>
                  <p className="text-[10px] tracking-[0.15em] uppercase mt-0.5" style={{ color: brand }}>{city}</p>
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
                <p className="font-serif font-bold text-2xl" style={{ color: brand }}>{num}</p>
                <p className="text-[10px] tracking-[0.15em] uppercase mt-0.5 text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </StoreLayout>
  );
}
