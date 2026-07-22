import { useLocation, useSearch } from "wouter";
import { StoreLayout } from "@/components/layout/store-layout";
import { useListProducts, getListProductsQueryKey, useListCategories, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Sparkles, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const BRAND = "#9B0F5F";
const GOLD = "#D4AF37";

export default function Shop() {
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const searchParams = new URLSearchParams(searchStr);
  const categoryParam = searchParams.get("category");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "name">("newest");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { data: categories } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() },
  });

  const categoryId = useMemo(() => {
    if (!categoryParam || !categories) return null;
    const cat = categories.find((c) => c.slug === categoryParam);
    return cat ? cat.id : null;
  }, [categoryParam, categories]);

  const minPriceNum = minPrice !== "" ? Number(minPrice) : null;
  const maxPriceNum = maxPrice !== "" ? Number(maxPrice) : null;

  const { data: productData, isLoading } = useListProducts(
    {
      categoryId,
      search: search || undefined,
      sortBy: sortBy as "newest" | "price_asc" | "price_desc" | "name",
      minPrice: minPriceNum,
      maxPrice: maxPriceNum,
      limit: 50,
    },
    {
      query: {
        queryKey: getListProductsQueryKey({ categoryId, search, sortBy, minPrice: minPriceNum, maxPrice: maxPriceNum, limit: 50 }),
      },
    }
  );

  const activeCategory = categories?.find((c) => c.slug === categoryParam);
  const hasFilters = search || minPrice || maxPrice || categoryParam;

  const clearAllFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    navigate("/shop");
  };

  const filterPanel = (
    <div className="space-y-7">
      {/* Search */}
      <div>
        <p className="text-[10px] tracking-[0.25em] uppercase font-semibold mb-3 text-gray-500">Search</p>
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-none border-gray-200 focus-visible:ring-0 focus-visible:border-[#9B0F5F] text-sm"
        />
      </div>

      {/* Price */}
      <div>
        <p className="text-[10px] tracking-[0.25em] uppercase font-semibold mb-3 text-gray-500">Price Range (₹)</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="rounded-none border-gray-200 focus-visible:ring-0 focus-visible:border-[#9B0F5F] text-sm"
            min={0}
          />
          <span className="text-gray-400 text-sm shrink-0">—</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="rounded-none border-gray-200 focus-visible:ring-0 focus-visible:border-[#9B0F5F] text-sm"
            min={0}
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <p className="text-[10px] tracking-[0.25em] uppercase font-semibold mb-3 text-gray-500">Categories</p>
        <ul className="space-y-0">
          {[{ id: null, name: "All Jewellery", slug: null }, ...(categories ?? [])].map((cat) => {
            const isActive = cat.slug === categoryParam || (!cat.slug && !categoryParam);
            return (
              <li key={cat.name}>
                <Link
                  href={cat.slug ? `/shop?category=${cat.slug}` : "/shop"}
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex items-center justify-between py-2.5 text-sm border-b transition-colors"
                  style={{
                    borderColor: "#f0e6ec",
                    color: isActive ? BRAND : "#6b7280",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {cat.name}
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: BRAND }} />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={clearAllFilters}
          className="text-[11px] tracking-[0.15em] uppercase font-medium hover:opacity-70 transition-opacity"
          style={{ color: BRAND }}
        >
          × Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <StoreLayout>
      {/* ── Page Header ── */}
      <section className="py-14" style={{ background: "#1a0a0f" }}>
        <div className="container mx-auto px-[30px] text-center">
          <p className="text-[11px] tracking-[0.35em] uppercase font-medium mb-3" style={{ color: GOLD }}>
            {activeCategory ? activeCategory.name : "All Collections"}
          </p>
          <h1 className="font-serif font-bold text-4xl md:text-5xl text-white mb-3">
            Our Collection
          </h1>
          <div className="mx-auto h-0.5 w-14" style={{ background: GOLD }} />
          <p className="text-white/50 text-sm mt-4 max-w-lg mx-auto leading-relaxed">
            Timeless anti-tarnish jewellery — waterproof, skin-friendly, and crafted to shine every day.
          </p>
        </div>
      </section>

      {/* ── Mobile filter bar ── */}
      <div className="md:hidden sticky top-[60px] z-40 bg-white border-b px-4 py-2.5 flex items-center gap-3" style={{ borderColor: "#f0e6ec" }}>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 text-xs rounded-full border-gray-300 h-8 px-3"
          onClick={() => setMobileFiltersOpen((o) => !o)}
          style={hasFilters ? { borderColor: BRAND, color: BRAND } : {}}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {hasFilters && <span className="h-1.5 w-1.5 rounded-full ml-0.5" style={{ background: BRAND }} />}
          <ChevronDown className={`h-3.5 w-3.5 ml-0.5 transition-transform ${mobileFiltersOpen ? "rotate-180" : ""}`} />
        </Button>

        <div className="flex-1" />

        <span className="text-[11px] text-gray-500 uppercase tracking-wide">Sort</span>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as "newest" | "price_asc" | "price_desc" | "name")}>
          <SelectTrigger className="h-8 w-36 rounded-full border-gray-300 text-xs focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price_asc">Price: Low → High</SelectItem>
            <SelectItem value="price_desc">Price: High → Low</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Mobile filter panel (slide-down) ── */}
      {mobileFiltersOpen && (
        <div className="md:hidden bg-white border-b px-5 pt-5 pb-6 shadow-sm" style={{ borderColor: "#f0e6ec" }}>
          <div className="flex items-center justify-between mb-5">
            <span className="font-serif font-bold text-base text-gray-800">Filters</span>
            <button onClick={() => setMobileFiltersOpen(false)}>
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          {filterPanel}
        </div>
      )}

      <div className="container mx-auto px-[30px] py-10 md:py-12">
        <div className="flex flex-col md:flex-row gap-10">

          {/* ── Desktop Sidebar ── */}
          <aside className="hidden md:block w-60 flex-shrink-0">
            <div className="sticky top-28 space-y-8">
              <div className="flex items-center gap-2 pb-3" style={{ borderBottom: `2px solid ${BRAND}` }}>
                <SlidersHorizontal className="h-4 w-4" style={{ color: BRAND }} />
                <span className="font-serif font-bold text-base text-gray-800 tracking-wide">Filters</span>
              </div>
              {filterPanel}
            </div>
          </aside>

          {/* ── Product Grid ── */}
          <main className="flex-1 min-w-0">
            {/* Toolbar (desktop only sort) */}
            <div className="hidden md:flex justify-between items-center mb-8 pb-5 gap-4" style={{ borderBottom: "1px solid #f0e6ec" }}>
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-800">{productData?.products?.length ?? 0}</span> products
              </p>
              <div className="flex items-center gap-3">
                <span className="text-[11px] tracking-[0.15em] uppercase text-gray-500">Sort</span>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as "newest" | "price_asc" | "price_desc" | "name")}>
                  <SelectTrigger className="w-44 rounded-none border-gray-200 text-sm h-9 focus:ring-0 focus:border-[#9B0F5F]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="newest">Newest Arrivals</SelectItem>
                    <SelectItem value="price_asc">Price: Low → High</SelectItem>
                    <SelectItem value="price_desc">Price: High → Low</SelectItem>
                    <SelectItem value="name">Name A–Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mobile product count */}
            <p className="md:hidden text-xs text-gray-500 mb-4">
              {productData?.products?.length ?? 0} products
            </p>

            {/* Loading */}
            {isLoading && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse space-y-3">
                    <div className="w-full rounded-sm" style={{ aspectRatio: "3/4", background: "#f0e6ec" }} />
                    <div className="h-4 rounded w-3/4" style={{ background: "#f0e6ec" }} />
                    <div className="h-4 rounded w-1/3" style={{ background: "#f0e6ec" }} />
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!isLoading && productData?.products?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Sparkles className="h-12 w-12 mb-4" style={{ color: BRAND, opacity: 0.3 }} />
                <p className="text-gray-500 mb-4">No products found matching your criteria.</p>
                <button onClick={clearAllFilters} className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: BRAND }}>
                  Clear all filters
                </button>
              </div>
            )}

            {/* Grid */}
            {!isLoading && (productData?.products?.length ?? 0) > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-7">
                {productData?.products?.map((product) => (
                  <Link key={product.id} href={`/shop/${product.slug}`} className="group block">
                    <div className="relative overflow-hidden mb-3 md:mb-4 rounded-sm" style={{ aspectRatio: "3/4", background: "#fdf6f9" }}>
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                          width={600}
                          height={800}
                          className="w-full h-full object-cover"
                          style={{ transition: "transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
                          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
                          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sparkles className="h-10 w-10" style={{ color: BRAND, opacity: 0.2 }} />
                        </div>
                      )}
                      {product.compareAtPrice && (
                        <span
                          className="absolute top-3 left-3 text-white text-[9px] font-bold px-2.5 py-1 tracking-widest uppercase"
                          style={{ background: BRAND, borderRadius: "2px" }}
                        >
                          Sale
                        </span>
                      )}
                      <div
                        className="absolute inset-x-0 bottom-0 flex items-center justify-center py-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: `${BRAND}ee` }}
                      >
                        <span className="text-white text-[11px] tracking-[0.2em] uppercase font-medium">
                          View Details
                        </span>
                      </div>
                    </div>

                    <h3
                      className="font-serif font-semibold text-sm md:text-base leading-snug mb-1 md:mb-1.5 transition-colors"
                      style={{ color: "#1a0a0f" }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = BRAND)}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#1a0a0f")}
                    >
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm md:text-base" style={{ color: BRAND }}>
                        ₹{product.price}
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-gray-400 line-through text-xs">₹{product.compareAtPrice}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </StoreLayout>
  );
}
