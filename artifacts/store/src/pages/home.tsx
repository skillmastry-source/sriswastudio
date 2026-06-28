import { Link, useLocation } from "wouter";
import { StoreLayout } from "@/components/layout/store-layout";
import { useListProducts, getListProductsQueryKey, useListCategories, getListCategoriesQueryKey, useAddToCart } from "@workspace/api-client-react";
import { useCartContext } from "@/hooks/use-cart-context";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Droplets, Sparkles, Truck, ShoppingBag } from "lucide-react";
import { useState, useMemo } from "react";

const BRAND = "#9B0F5F";
const GOLD = "#D4AF37";
const DARK = "#1a0a0f";

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

/* ─── Product Card with Add to Cart ─── */
function ProductCard({ product, sessionId }: { product: { id: number; name: string; slug: string; price: number; compareAtPrice?: number | null; images?: { url: string }[]; stockQuantity: number }; sessionId: string }) {
  const addToCart = useAddToCart();
  const { openCart } = useCartContext();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stockQuantity <= 0) return;
    setAdding(true);
    addToCart.mutate(
      { data: { sessionId, productId: product.id, quantity: 1 } },
      {
        onSuccess: () => {
          toast({ title: "Added to cart!", description: `${product.name} added.` });
          openCart();
        },
        onError: () => toast({ title: "Error", description: "Could not add to cart.", variant: "destructive" }),
        onSettled: () => setAdding(false),
      }
    );
  };

  const outOfStock = product.stockQuantity <= 0;

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      {/* Image */}
      <div className="relative overflow-hidden mb-3 rounded-sm" style={{ aspectRatio: "3/4", background: "#fdf6f9" }}>
        {product.images?.[0] ? (
          <img
            src={product.images[0].url}
            alt={product.name}
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

        {/* Badges */}
        {product.compareAtPrice && !outOfStock && (
          <span className="absolute top-2.5 left-2.5 text-white text-[9px] font-bold px-2 py-0.5 tracking-widest uppercase" style={{ background: BRAND, borderRadius: "2px" }}>
            Sale
          </span>
        )}
        {outOfStock && (
          <span className="absolute top-2.5 left-2.5 text-white text-[9px] font-bold px-2 py-0.5 tracking-widest uppercase" style={{ background: "#888", borderRadius: "2px" }}>
            Sold Out
          </span>
        )}

        {/* Add to cart overlay */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAdd}
            disabled={outOfStock || adding}
            className="w-full flex items-center justify-center gap-2 py-3 text-white text-[11px] tracking-[0.18em] uppercase font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
            style={{ background: outOfStock ? "#888" : BRAND }}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {adding ? "Adding…" : outOfStock ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* Info */}
      <h3 className="font-serif font-semibold text-sm leading-snug mb-1 transition-colors group-hover:text-[#9B0F5F]" style={{ color: DARK }}>
        {product.name}
      </h3>
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm" style={{ color: BRAND }}>₹{product.price}</span>
        {product.compareAtPrice && (
          <span className="text-gray-400 line-through text-xs">₹{product.compareAtPrice}</span>
        )}
      </div>
    </Link>
  );
}

export default function Home() {
  const [_loc] = useLocation();
  const { sessionId } = useCartContext();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: categories } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() },
  });

  const categoryId = useMemo(() => {
    if (!activeCategory || !categories) return null;
    return categories.find(c => c.slug === activeCategory)?.id ?? null;
  }, [activeCategory, categories]);

  const { data: productData, isLoading } = useListProducts(
    { categoryId, sortBy: "newest" as const, limit: 30 },
    { query: { queryKey: getListProductsQueryKey({ categoryId, sortBy: "newest", limit: 30 }) } }
  );

  const products = productData?.products ?? [];

  return (
    <StoreLayout>

      {/* ── Dark ticker at very top ── */}
      <Ticker />

      {/* ── COMPACT HERO BANNER ── */}
      <section className="relative w-full overflow-hidden" style={{ height: "52vh", minHeight: 320, maxHeight: 520 }}>
        {/* Background image */}
        <img
          src="/brand/hero-banner.png"
          alt="Sriswa Studio Jewellery"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "right center" }}
        />
        {/* Dark overlay on left */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #1a0a0f 0%, #1a0a0f 44%, rgba(26,10,15,0.35) 68%, rgba(26,10,15,0) 100%)" }} />

        {/* Text content */}
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-6 md:px-12">
            <div className="max-w-md">
              <p className="text-[11px] tracking-[0.35em] uppercase font-medium mb-3" style={{ color: GOLD }}>
                New Arrivals · 2025
              </p>
              <h1 className="font-serif font-bold text-white leading-[1.05] mb-4" style={{ fontSize: "clamp(28px, 4vw, 52px)" }}>
                Jewellery That<br />
                <span style={{ color: GOLD }}>Lasts Forever</span>
              </h1>
              <p className="text-white/60 text-sm mb-6">
                Anti-tarnish · Waterproof · Skin-friendly · Starting ₹399
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" })}
                  className="inline-flex items-center gap-2 px-7 py-3 text-[12px] font-bold tracking-[0.2em] uppercase text-white transition-opacity hover:opacity-85"
                  style={{ background: BRAND }}
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Shop Now
                </button>
                <Link
                  href="/shop"
                  className="text-[11px] font-medium tracking-[0.15em] uppercase pb-0.5 transition-opacity hover:opacity-60"
                  style={{ color: "rgba(255,255,255,0.6)", borderBottom: "1px solid rgba(255,255,255,0.3)" }}
                >
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
              <div key={label} className="flex items-center justify-center gap-2.5 py-3.5 px-4" style={{ borderRight: i < 3 ? `1px solid ${BRAND}18` : "none" }}>
                <Icon className="h-4 w-4 flex-shrink-0" style={{ color: BRAND }} />
                <span className="text-[11px] tracking-[0.12em] uppercase font-semibold text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRODUCT SECTION ── */}
      <section id="products-section" className="py-10 bg-white">
        <div className="container mx-auto px-6">

          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-7 gap-4">
            <div>
              <p className="text-[10px] tracking-[0.35em] uppercase font-medium mb-1.5" style={{ color: BRAND }}>
                Shop All Jewellery
              </p>
              <h2 className="font-serif font-bold text-2xl md:text-3xl text-gray-900">
                Our Collection
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-[11px] tracking-[0.18em] uppercase font-medium pb-0.5 self-start sm:self-auto hover:opacity-70 transition-opacity"
              style={{ color: BRAND, borderBottom: `1.5px solid ${BRAND}` }}
            >
              View All →
            </Link>
          </div>

          {/* Category pill filters */}
          <div className="flex gap-2 flex-wrap mb-8">
            <button
              onClick={() => setActiveCategory(null)}
              className="px-4 py-1.5 text-[11px] tracking-[0.15em] uppercase font-semibold rounded-full border transition-all"
              style={{
                background: !activeCategory ? BRAND : "transparent",
                color: !activeCategory ? "white" : "#555",
                borderColor: !activeCategory ? BRAND : "#ddd",
              }}
            >
              All
            </button>
            {categories?.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug ?? null)}
                className="px-4 py-1.5 text-[11px] tracking-[0.15em] uppercase font-semibold rounded-full border transition-all"
                style={{
                  background: activeCategory === cat.slug ? BRAND : "transparent",
                  color: activeCategory === cat.slug ? "white" : "#555",
                  borderColor: activeCategory === cat.slug ? BRAND : "#ddd",
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Loading skeleton */}
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

          {/* Product grid */}
          {!isLoading && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} sessionId={sessionId} />
              ))}
            </div>
          )}

          {!isLoading && products.length === 0 && (
            <div className="flex flex-col items-center py-20 text-center">
              <Sparkles className="h-10 w-10 mb-4" style={{ color: BRAND, opacity: 0.25 }} />
              <p className="text-gray-400 text-sm">No products found.</p>
            </div>
          )}

          {/* Load more link */}
          {!isLoading && products.length >= 30 && (
            <div className="text-center mt-12">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-8 py-3 text-[12px] font-bold tracking-[0.2em] uppercase text-white transition-opacity hover:opacity-85"
                style={{ background: BRAND }}
              >
                Browse Full Collection →
              </Link>
            </div>
          )}
        </div>
      </section>

    </StoreLayout>
  );
}
