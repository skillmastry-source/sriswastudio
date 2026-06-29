import { Link } from "wouter";
import { useState, useRef, useMemo, useEffect } from "react";
import {
  useListProducts, getListProductsQueryKey,
  useGetFeaturedProducts, getGetFeaturedProductsQueryKey,
  useListCategories, getListCategoriesQueryKey,
  useAddToCart,
} from "@workspace/api-client-react";
import { useCartContext } from "@/hooks/use-cart-context";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingBag, Sparkles, Star, ChevronLeft, ChevronRight,
  ArrowRight, Gem, Circle, Heart, Layers, Link2, Clock, Tag,
} from "lucide-react";

export type SectionColors = { brand: string; gold: string; dark: string };

import type { HomepageSection } from "@/hooks/use-site-settings";
export type { HomepageSection };

type CardProduct = {
  id: number; name: string; slug: string;
  price: number; compareAtPrice?: number | null;
  images?: { url: string }[]; stockQuantity: number;
};

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  watches: Clock, bracelets: Layers, rings: Circle,
  earrings: Gem, mangalsutra: Heart, "chain-sets": Link2,
  necklaces: Sparkles, anklets: Sparkles, pendants: Tag,
};

const CATEGORY_GRADIENTS = [
  "linear-gradient(135deg,#9B0F5F 0%,#6b0941 100%)",
  "linear-gradient(135deg,#D4AF37 0%,#a0842a 100%)",
  "linear-gradient(135deg,#b5135f 0%,#9B0F5F 100%)",
  "linear-gradient(135deg,#1a0a0f 0%,#3d1a25 100%)",
  "linear-gradient(135deg,#b08820 0%,#D4AF37 100%)",
  "linear-gradient(135deg,#6b0941 0%,#1a0a0f 100%)",
  "linear-gradient(135deg,#9B0F5F 30%,#D4AF37 100%)",
];

const WA_SVG = (
  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
);

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
            <Sparkles className="h-10 w-10 opacity-20" style={{ color: brand }} />
          </div>
        )}
        {product.compareAtPrice && !outOfStock && (
          <span className="absolute top-2.5 left-2.5 text-white text-[9px] font-bold px-2 py-0.5 tracking-widest uppercase" style={{ background: brand, borderRadius: 2 }}>Sale</span>
        )}
        {outOfStock && (
          <span className="absolute top-2.5 left-2.5 text-white text-[9px] font-bold px-2 py-0.5 tracking-widest uppercase" style={{ background: "#888", borderRadius: 2 }}>Sold Out</span>
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

// ── STRIP ──────────────────────────────────────────────────────────────────
function StripSection({ config }: { config: Record<string, unknown> }) {
  const items = (config.items as string[] | undefined) ?? ["✦ Anti-Tarnish Jewellery", "✦ Ships in 24 Hours", "✦ Free Shipping above ₹999"];
  const bgColor = (config.bgColor as string | undefined) ?? "#1a0a0f";
  const textColor = (config.textColor as string | undefined) ?? "#D4AF37";
  const repeated = [...items, ...items, ...items];
  return (
    <div className="w-full overflow-hidden py-2.5" style={{ background: bgColor }}>
      <style>{`@keyframes sr-ticker{0%{transform:translateX(0)}100%{transform:translateX(-33.33%)}}`}</style>
      <div className="flex gap-14 whitespace-nowrap" style={{ animation: "sr-ticker 28s linear infinite" }}>
        {repeated.map((item, i) => (
          <span key={i} className="text-[11px] tracking-[0.22em] font-medium uppercase flex-shrink-0" style={{ color: textColor }}>{item}</span>
        ))}
      </div>
    </div>
  );
}

// ── HERO ───────────────────────────────────────────────────────────────────
function HeroSection({ config, colors }: { config: Record<string, unknown>; colors: SectionColors }) {
  const { brand, gold, dark } = colors;
  const badge = (config.badge as string | undefined) ?? "New Arrivals · 2025";
  const title = (config.title as string | undefined) ?? "Jewellery That";
  const titleGold = (config.titleGold as string | undefined) ?? "Lasts Forever";
  const subtitle = (config.subtitle as string | undefined) ?? "Anti-tarnish · Waterproof · Skin-friendly";
  const shopButtonText = (config.shopButtonText as string | undefined) ?? "Shop Now";
  const imageUrl = (config.imageUrl as string | undefined) ?? "/brand/hero-banner.png";

  return (
    <section className="relative w-full overflow-hidden" style={{ height: "58vh", minHeight: 340, maxHeight: 560 }}>
      <img src={imageUrl} alt="Hero" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: "right center" }} />
      <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${dark} 0%, ${dark} 42%, ${dark}55 68%, ${dark}00 100%)` }} />
      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-[30px] md:px-[60px]">
          <div className="max-w-lg">
            <p className="text-[11px] tracking-[0.35em] uppercase font-medium mb-3" style={{ color: gold }}>{badge}</p>
            <h1 className="font-serif font-bold text-white leading-[1.05] mb-4" style={{ fontSize: "clamp(30px, 4.5vw, 58px)" }}>
              {title}<br /><span style={{ color: gold }}>{titleGold}</span>
            </h1>
            <p className="text-white/60 text-sm mb-7 max-w-sm">{subtitle}</p>
            <Link href="/shop"
              className="inline-flex items-center gap-2 px-7 py-3 text-[12px] font-bold tracking-[0.2em] uppercase text-white transition-opacity hover:opacity-85"
              style={{ background: brand }}>
              <ShoppingBag className="h-3.5 w-3.5" /> {shopButtonText}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── CATEGORY GRID ──────────────────────────────────────────────────────────
function CategoryGridSection({ config, colors }: { config: Record<string, unknown>; colors: SectionColors }) {
  const { brand, gold, dark } = colors;
  const title = (config.title as string | undefined) ?? "Shop by Category";
  const subtitle = (config.subtitle as string | undefined) ?? "Browse";

  const { data: categoriesData } = useListCategories({ query: { queryKey: getListCategoriesQueryKey() } });
  const categories = categoriesData ?? [];

  const [activeTab, setActiveTab] = useState<string>(() => categories[0]?.slug ?? "");

  const activeCategoryId = useMemo(() => {
    if (!activeTab || !categoriesData) return null;
    return categoriesData.find((c) => c.slug === activeTab)?.id ?? null;
  }, [activeTab, categoriesData]);

  // auto-select first tab once categories load
  useEffect(() => {
    if (!activeTab && categories.length > 0) setActiveTab(categories[0].slug);
  }, [categories.length]);

  const { data: tabProductData, isLoading: tabLoading } = useListProducts(
    { categoryId: activeCategoryId, sortBy: "newest" as const, limit: 12 },
    { query: { enabled: !!activeCategoryId, queryKey: getListProductsQueryKey({ categoryId: activeCategoryId, sortBy: "newest", limit: 12 }) } }
  );

  const { sessionId } = useCartContext();

  return (
    <section className="py-14 bg-white">
      <div className="container mx-auto px-[30px]">

        {/* Heading */}
        <div className="text-center mb-8">
          <p className="text-[10px] tracking-[0.35em] uppercase font-medium mb-1.5" style={{ color: brand }}>{subtitle}</p>
          <h2 className="font-serif font-bold text-2xl md:text-3xl text-gray-900">{title}</h2>
          <div className="mt-3 mx-auto h-0.5 w-12" style={{ background: gold }} />
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-1 md:justify-center mb-8" style={{ scrollbarWidth: "none" }}>
          {categories.map(({ name, slug }) => {
            const isActive = activeTab === slug;
            return (
              <button
                key={slug}
                onClick={() => setActiveTab(slug)}
                className="flex-shrink-0 px-5 py-2 text-[11px] font-bold tracking-[0.18em] uppercase transition-all duration-200 rounded-none cursor-pointer"
                style={isActive
                  ? { background: brand, color: "white", border: `1.5px solid ${brand}` }
                  : { background: "transparent", color: dark, border: `1.5px solid ${brand}40` }
                }
              >
                {name}
              </button>
            );
          })}
          <Link
            href="/shop"
            className="flex-shrink-0 px-5 py-2 text-[11px] font-bold tracking-[0.18em] uppercase transition-all duration-200 flex items-center gap-1.5"
            style={{ background: "transparent", color: brand, border: `1.5px dashed ${brand}` }}
          >
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Gold divider */}
        <div className="h-px mb-8" style={{ background: `linear-gradient(to right, transparent, ${gold}, transparent)` }} />

        {/* Products grid */}
        {tabLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-sm" style={{ aspectRatio: "3/4", background: "#f3e8f0" }} />
            ))}
          </div>
        ) : (tabProductData?.products ?? []).length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No products in this category yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {(tabProductData?.products ?? []).map((p) => (
              <ProductCard
                key={p.id}
                product={{ ...p, stockQuantity: (p as { stockQuantity?: number }).stockQuantity ?? 1 }}
                sessionId={sessionId} brand={brand} dark={dark}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}

// ── PRODUCT GRID ───────────────────────────────────────────────────────────
function ProductGridSection({ config, colors }: { config: Record<string, unknown>; colors: SectionColors }) {
  const { brand, gold, dark } = colors;
  const { sessionId } = useCartContext();
  const title = (config.title as string | undefined) ?? "Products";
  const subtitle = (config.subtitle as string | undefined) ?? "";
  const filter = (config.filter as string | undefined) ?? "newest";
  const limit = (config.limit as number | undefined) ?? 8;
  const layout = (config.layout as string | undefined) ?? "grid";
  const bgColor = (config.bgColor as string | undefined) ?? "#ffffff";

  const sliderRef = useRef<HTMLDivElement>(null);

  const { data: newestData, isLoading: newestLoading } = useListProducts(
    { sortBy: "newest" as const, limit },
    { query: { enabled: filter === "newest", queryKey: getListProductsQueryKey({ sortBy: "newest", limit }) } }
  );
  const { data: featuredData, isLoading: featuredLoading } = useGetFeaturedProducts(
    { limit },
    { query: { enabled: filter === "featured", queryKey: getGetFeaturedProductsQueryKey({ limit }) } }
  );
  const { data: allData, isLoading: allLoading } = useListProducts(
    { limit },
    { query: { enabled: filter === "all", queryKey: getListProductsQueryKey({ limit }) } }
  );

  let products: CardProduct[] = [];
  let isLoading = false;
  if (filter === "newest") { products = (newestData?.products ?? []) as CardProduct[]; isLoading = newestLoading; }
  else if (filter === "featured") { products = (featuredData ?? []) as CardProduct[]; isLoading = featuredLoading; }
  else { products = (allData?.products ?? []) as CardProduct[]; isLoading = allLoading; }

  const scroll = (dir: "left" | "right") => {
    sliderRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  return (
    <section className="py-12" style={{ background: bgColor }}>
      <div className="container mx-auto px-[30px]">
        <div className="flex items-end justify-between mb-7">
          <div>
            {subtitle && <p className="text-[10px] tracking-[0.35em] uppercase font-medium mb-1" style={{ color: brand }}>{subtitle}</p>}
            <h2 className="font-serif font-bold text-2xl md:text-3xl text-gray-900">{title}</h2>
          </div>
          <Link href="/shop" className="text-[11px] tracking-[0.18em] uppercase font-medium pb-0.5 hover:opacity-70 flex items-center gap-1"
            style={{ color: brand, borderBottom: `1.5px solid ${brand}` }}>
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isLoading ? (
          layout === "slider" ? (
            <div className="flex gap-4">
              {[1,2,3,4,5].map(i => <div key={i} className="flex-shrink-0 animate-pulse" style={{ width: 200, aspectRatio: "3/4", background: "#f0e6ec" }} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[1,2,3,4].map(i => <div key={i} className="animate-pulse" style={{ aspectRatio: "3/4", background: "#f0e6ec" }} />)}
            </div>
          )
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Sparkles className="h-10 w-10 mb-4 opacity-20" style={{ color: brand }} />
            <p className="text-gray-400 text-sm">No products yet.</p>
          </div>
        ) : layout === "slider" ? (
          <div className="relative">
            <button onClick={() => scroll("left")}
              className="absolute -left-3 top-1/3 -translate-y-1/2 z-10 h-8 w-8 rounded-full flex items-center justify-center shadow-md bg-white border border-gray-200">
              <ChevronLeft className="h-4 w-4" style={{ color: brand }} />
            </button>
            <button onClick={() => scroll("right")}
              className="absolute -right-3 top-1/3 -translate-y-1/2 z-10 h-8 w-8 rounded-full flex items-center justify-center shadow-md bg-white border border-gray-200">
              <ChevronRight className="h-4 w-4" style={{ color: brand }} />
            </button>
            <div ref={sliderRef} className="flex gap-4 overflow-x-auto pb-2" style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}>
              {products.map(p => (
                <div key={p.id} className="flex-shrink-0" style={{ width: 200, scrollSnapAlign: "start" }}>
                  <ProductCard product={p} sessionId={sessionId} brand={brand} dark={dark} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
            {products.map(p => <ProductCard key={p.id} product={p} sessionId={sessionId} brand={brand} dark={dark} />)}
          </div>
        )}
      </div>
    </section>
  );
}

// ── TESTIMONIALS ───────────────────────────────────────────────────────────
type ReviewEntry = { name: string; city: string; rating: number; text: string };

function TestimonialsSection({ config, colors }: { config: Record<string, unknown>; colors: SectionColors }) {
  const { brand, gold, dark } = colors;
  const title = (config.title as string | undefined) ?? "What Our Customers Say";
  const subtitle = (config.subtitle as string | undefined) ?? "Testimonials";
  const reviews = (config.reviews as ReviewEntry[] | undefined) ?? [];

  return (
    <section className="py-14 bg-white">
      <div className="container mx-auto px-[30px]">
        <div className="text-center mb-10">
          <p className="text-[10px] tracking-[0.35em] uppercase font-medium mb-2" style={{ color: brand }}>{subtitle}</p>
          <h2 className="font-serif font-bold text-2xl md:text-3xl" style={{ color: dark }}>{title}</h2>
          <div className="mt-3 mx-auto h-0.5 w-12" style={{ background: gold }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {reviews.map(({ name, city, rating, text }, i) => (
            <div key={i} className="p-5 rounded-sm border" style={{ borderColor: `${brand}18`, background: "#fdf6f9" }}>
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
  );
}

// ── TEXT + IMAGE ───────────────────────────────────────────────────────────
function TextImageSection({ config, colors }: { config: Record<string, unknown>; colors: SectionColors }) {
  const { brand } = colors;
  const title = (config.title as string | undefined) ?? "Our Story";
  const body = (config.body as string | undefined) ?? "";
  const imageUrl = (config.imageUrl as string | undefined) ?? "";
  const imagePosition = (config.imagePosition as string | undefined) ?? "right";
  const bgColor = (config.bgColor as string | undefined) ?? "#ffffff";
  const buttonText = (config.buttonText as string | undefined) ?? "";
  const buttonUrl = (config.buttonUrl as string | undefined) ?? "/shop";

  const textCol = (
    <div className="flex flex-col justify-center py-8 md:py-0">
      <h2 className="font-serif font-bold text-2xl md:text-3xl text-gray-900 mb-4">{title}</h2>
      <p className="text-gray-600 leading-relaxed mb-6 text-sm">{body}</p>
      {buttonText && (
        <Link href={buttonUrl}
          className="inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.15em] uppercase px-6 py-3 self-start text-white"
          style={{ background: brand }}>
          {buttonText} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );

  const imageCol = imageUrl ? (
    <div className="aspect-[4/3] md:aspect-auto overflow-hidden rounded-sm">
      <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
    </div>
  ) : (
    <div className="aspect-[4/3] rounded-sm flex items-center justify-center" style={{ background: "#fdf6f9" }}>
      <Sparkles className="h-12 w-12 opacity-20" style={{ color: brand }} />
    </div>
  );

  return (
    <section className="py-14" style={{ background: bgColor }}>
      <div className="container mx-auto px-[30px]">
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center ${imagePosition === "left" ? "md:[&>*:first-child]:order-2" : ""}`}>
          {imagePosition === "left" ? <>{imageCol}{textCol}</> : <>{textCol}{imageCol}</>}
        </div>
      </div>
    </section>
  );
}

// ── WHATSAPP CTA ────────────────────────────────────────────────────────────
function WhatsAppCTASection({ config, colors }: { config: Record<string, unknown>; colors: SectionColors }) {
  const { brand, gold } = colors;
  const title = (config.title as string | undefined) ?? "Join Our WhatsApp Community";
  const subtitle = (config.subtitle as string | undefined) ?? "Get exclusive offers, new launch alerts & jewellery care tips directly on WhatsApp.";
  const waNumber = (config.waNumber as string | undefined) ?? "919618535437";
  const bgColor = (config.bgColor as string | undefined) ?? brand;
  const communityMsg = encodeURIComponent("Hi, I want to join your WhatsApp community!");
  const waLink = `https://wa.me/${waNumber}?text=${communityMsg}`;

  return (
    <section className="py-16" style={{ background: bgColor }}>
      <div className="container mx-auto px-[30px]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mx-auto mb-5 h-16 w-16 rounded-full flex items-center justify-center" style={{ background: "#25D366" }}>
            <svg viewBox="0 0 24 24" className="h-9 w-9 fill-white" xmlns="http://www.w3.org/2000/svg">{WA_SVG}</svg>
          </div>
          <p className="text-[10px] tracking-[0.35em] uppercase font-medium mb-2" style={{ color: gold }}>Stay Connected</p>
          <h2 className="font-serif font-bold text-2xl md:text-3xl text-white mb-3">{title}</h2>
          <p className="text-white/70 text-sm mb-8 leading-relaxed max-w-md mx-auto">{subtitle}</p>
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 font-bold text-[12px] tracking-[0.18em] uppercase text-white transition-opacity hover:opacity-90"
            style={{ background: "#25D366", borderRadius: 2 }}>
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white flex-shrink-0" xmlns="http://www.w3.org/2000/svg">{WA_SVG}</svg>
            Join Community
          </a>
        </div>
      </div>
    </section>
  );
}

// ── CUSTOM HTML ─────────────────────────────────────────────────────────────
function CustomHTMLSection({ config }: { config: Record<string, unknown> }) {
  const html = (config.html as string | undefined) ?? "";
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

// ── MAIN RENDERER ───────────────────────────────────────────────────────────
export function SectionRenderer({ sections, colors }: { sections: HomepageSection[]; colors: SectionColors }) {
  return (
    <>
      {sections.map((section) => {
        switch (section.type) {
          case "strip":
            return <StripSection key={section.id} config={section.config} />;
          case "hero":
            return <HeroSection key={section.id} config={section.config} colors={colors} />;
          case "category_grid":
            return <CategoryGridSection key={section.id} config={section.config} colors={colors} />;
          case "product_grid":
            return <ProductGridSection key={section.id} config={section.config} colors={colors} />;
          case "testimonials":
            return <TestimonialsSection key={section.id} config={section.config} colors={colors} />;
          case "text_image":
            return <TextImageSection key={section.id} config={section.config} colors={colors} />;
          case "whatsapp_cta":
            return <WhatsAppCTASection key={section.id} config={section.config} colors={colors} />;
          case "custom_html":
            return <CustomHTMLSection key={section.id} config={section.config} />;
          default:
            return null;
        }
      })}
    </>
  );
}
