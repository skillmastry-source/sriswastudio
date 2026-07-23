import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAddToCart } from "@workspace/api-client-react";
import { useCartContext } from "@/hooks/use-cart-context";
import { useToast } from "@/hooks/use-toast";
import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Minus, Plus, ShieldCheck, Droplets, Sparkles, ChevronRight } from "lucide-react";

const BRAND = "#9B0F5F";

interface ProductImage {
  id: number;
  url: string;
  isPrimary: boolean;
  displayOrder: number;
  productId: number;
}

interface ProductVariant {
  id: number;
  name: string;
  value: string;
  priceModifier: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  categoryId: number | null;
  categoryName: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  isActive: boolean;
  isFeatured: boolean;
}

interface SimilarProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  images: { url: string }[];
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { sessionId } = useCartContext();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  const { data: product, isLoading, isError } = useQuery<Product>({
    queryKey: ["product-by-slug", slug],
    queryFn: async () => {
      const res = await fetch(`/api/products/slug/${slug}`);
      if (!res.ok) throw new Error("Product not found");
      return res.json() as Promise<Product>;
    },
    enabled: !!slug,
  });

  const { data: similarData } = useQuery<{ products: SimilarProduct[] }>({
    queryKey: ["similar-products", product?.categoryId, product?.id],
    queryFn: async () => {
      const res = await fetch(`/api/products?categoryId=${product!.categoryId}&limit=7`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!product?.categoryId,
  });

  const similarProducts = (similarData?.products ?? [])
    .filter((p) => p.id !== product?.id)
    .slice(0, 6);

  const addToCartMutation = useAddToCart();

  const selectedVariant = product?.variants.find((v) => v.id === selectedVariantId) ?? null;
  const effectivePrice = product ? product.price + (selectedVariant?.priceModifier ?? 0) : 0;

  const variantsByName =
    product?.variants.reduce<Record<string, ProductVariant[]>>((acc, v) => {
      acc[v.name] = [...(acc[v.name] ?? []), v];
      return acc;
    }, {}) ?? {};

  const handleAddToCart = () => {
    if (!product) return;
    if (product.variants.length > 0 && !selectedVariantId) {
      toast({
        title: "Please select a variant",
        description: "Choose your preferred option before adding to cart.",
        variant: "destructive",
      });
      return;
    }
    addToCartMutation.mutate(
      {
        data: {
          sessionId,
          productId: product.id,
          quantity,
          variantId: selectedVariantId ?? undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Added to cart", description: `${quantity}× ${product.name} added to your cart.` });
        },
        onError: () => {
          toast({ title: "Error", description: "Could not add item to cart.", variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-[30px] py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (isError || !product) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-[30px] py-24 text-center">
          <h1 className="text-3xl font-serif font-bold mb-4">Product Not Found</h1>
          <Button asChild>
            <Link href="/shop">Back to Shop</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  const currentImage = selectedImage || product.images?.[0]?.url;

  return (
    <StoreLayout>
      {/* Breadcrumbs */}
      <div className="bg-card border-b py-4">
        <div className="container mx-auto px-[30px] flex items-center text-sm text-muted-foreground gap-2 overflow-hidden">
          <Link href="/" className="hover:text-primary transition-colors shrink-0">Home</Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <Link href="/shop" className="hover:text-primary transition-colors shrink-0">Shop</Link>
          {product.categoryName && (
            <>
              <ChevronRight className="h-4 w-4 shrink-0" />
              <Link
                href={`/shop?category=${encodeURIComponent(product.categoryName.toLowerCase())}`}
                className="hover:text-primary transition-colors shrink-0"
              >
                {product.categoryName}
              </Link>
            </>
          )}
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span className="text-foreground truncate" title={product.name}>{product.name}</span>
        </div>
      </div>

      {/* Product detail */}
      <div className="container mx-auto px-[30px] py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">

          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.name}
                  fetchPriority="high"
                  decoding="async"
                  width={800}
                  height={800}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No Image
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img) => (
                  <button
                    key={img.id}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                      currentImage === img.url ? "border-primary" : "border-transparent"
                    }`}
                    onClick={() => setSelectedImage(img.url)}
                  >
                    <img
                      src={img.url}
                      alt="Thumbnail"
                      loading="lazy"
                      decoding="async"
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <h1 className="text-4xl font-serif font-bold text-foreground mb-2">{product.name}</h1>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl font-medium" style={{ color: BRAND }}>₹{effectivePrice}</span>
              {product.compareAtPrice && (
                <span className="text-muted-foreground line-through text-lg">₹{product.compareAtPrice}</span>
              )}
              {product.compareAtPrice && (
                <span className="text-xs text-white px-2 py-0.5 rounded font-medium" style={{ background: BRAND }}>
                  {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF
                </span>
              )}
            </div>

            {/* Description with Read more */}
            <div className="mb-8">
              <p className={`text-foreground/80 leading-relaxed ${descExpanded ? "" : "line-clamp-3"}`}>
                {product.description}
              </p>
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="mt-1 text-sm font-medium hover:underline"
                style={{ color: BRAND }}
              >
                {descExpanded ? "Read less" : "Read more"}
              </button>
            </div>

            {/* Variant selection */}
            {Object.entries(variantsByName).map(([variantName, options]) => (
              <div key={variantName} className="mb-6">
                <h3 className="font-medium mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                  {variantName}
                  {selectedVariantId && options.some((o) => o.id === selectedVariantId) && (
                    <span className="ml-2 normal-case font-normal text-foreground">
                      — {options.find((o) => o.id === selectedVariantId)?.value}
                    </span>
                  )}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {options.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id === selectedVariantId ? null : v.id)}
                      className={`px-4 py-2 text-sm rounded-md border-2 transition-all font-medium ${
                        selectedVariantId === v.id
                          ? "border-[#9B0F5F] bg-[#9B0F5F]/10 text-[#9B0F5F]"
                          : "border-border hover:border-[#9B0F5F]/50"
                      }`}
                    >
                      {v.value}
                      {v.priceModifier !== 0 && (
                        <span className="ml-1 text-xs opacity-70">
                          {v.priceModifier > 0 ? `+₹${v.priceModifier}` : `-₹${Math.abs(v.priceModifier)}`}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Quantity */}
            <div className="space-y-6 mb-8 flex-1">
              <div>
                <h3 className="font-medium mb-3">Quantity</h3>
                <div className="flex items-center border w-fit rounded-md bg-card">
                  <button
                    className="p-3 hover:bg-muted transition-colors disabled:opacity-50"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    className="p-3 hover:bg-muted transition-colors disabled:opacity-50"
                    onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                    disabled={quantity >= product.stockQuantity}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Out of stock"}
                </p>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full text-lg h-14 bg-[#9B0F5F] hover:bg-[#7d0c4c]"
              onClick={handleAddToCart}
              disabled={product.stockQuantity <= 0 || addToCartMutation.isPending}
            >
              {addToCartMutation.isPending
                ? "Adding…"
                : product.stockQuantity > 0
                  ? product.variants.length > 0 && !selectedVariantId
                    ? "Select an option"
                    : "Add to Cart"
                  : "Out of Stock"}
            </Button>

            {/* USPs */}
            <div className="mt-8 pt-8 border-t grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center gap-2" style={{ color: BRAND }}>
                <ShieldCheck className="h-6 w-6" />
                <span className="text-xs font-medium text-foreground">Anti-Tarnish</span>
              </div>
              <div className="flex flex-col items-center gap-2" style={{ color: BRAND }}>
                <Droplets className="h-6 w-6" />
                <span className="text-xs font-medium text-foreground">Waterproof</span>
              </div>
              <div className="flex flex-col items-center gap-2" style={{ color: BRAND }}>
                <Sparkles className="h-6 w-6" />
                <span className="text-xs font-medium text-foreground">Skin Friendly</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className="border-t py-12 bg-[#fdf6f9]">
          <div className="container mx-auto px-[30px]">
            <p className="text-xs tracking-[0.25em] uppercase text-center mb-1" style={{ color: BRAND }}>
              You May Also Like
            </p>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-center text-[#1a0a0f] mb-8">
              Similar Products
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
              {similarProducts.map((p) => (
                <Link key={p.id} href={`/shop/${p.slug}`} className="group block">
                  <div
                    className="relative overflow-hidden mb-3 rounded-sm"
                    style={{ aspectRatio: "3/4", background: "#fff" }}
                  >
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0].url}
                        alt={p.name}
                        loading="lazy"
                        decoding="async"
                        width={400}
                        height={533}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="h-8 w-8 opacity-20" style={{ color: BRAND }} />
                      </div>
                    )}
                    {p.compareAtPrice && (
                      <span
                        className="absolute top-2 left-2 text-white text-[9px] font-bold px-2 py-0.5 tracking-widest uppercase rounded-sm"
                        style={{ background: BRAND }}
                      >
                        Sale
                      </span>
                    )}
                    <div
                      className="absolute inset-x-0 bottom-0 flex items-center justify-center py-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `${BRAND}ee` }}
                    >
                      <span className="text-white text-[10px] tracking-[0.2em] uppercase font-medium">
                        View Details
                      </span>
                    </div>
                  </div>
                  <h3 className="font-serif text-xs md:text-sm font-semibold leading-snug mb-1 text-[#1a0a0f] line-clamp-2 group-hover:text-[#9B0F5F] transition-colors">
                    {p.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs md:text-sm" style={{ color: BRAND }}>
                      ₹{p.price}
                    </span>
                    {p.compareAtPrice && (
                      <span className="text-gray-400 line-through text-xs">₹{p.compareAtPrice}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </StoreLayout>
  );
}
