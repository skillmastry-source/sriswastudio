import { StoreLayout } from "@/components/layout/store-layout";
import { useAddToCart } from "@workspace/api-client-react";
import { useCartContext } from "@/hooks/use-cart-context";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, ShieldCheck, Droplets, Sparkles, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

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

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { sessionId } = useCartContext();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  const { data: product, isLoading, isError } = useQuery<Product>({
    queryKey: ["product-by-slug", slug],
    queryFn: async () => {
      const res = await fetch(`/api/products/slug/${slug}`);
      if (!res.ok) throw new Error("Product not found");
      return res.json() as Promise<Product>;
    },
    enabled: !!slug,
  });

  const addToCartMutation = useAddToCart();

  const selectedVariant = product?.variants.find((v) => v.id === selectedVariantId) ?? null;
  const effectivePrice = product ? product.price + (selectedVariant?.priceModifier ?? 0) : 0;

  const variantsByName = product?.variants.reduce<Record<string, ProductVariant[]>>((acc, v) => {
    acc[v.name] = [...(acc[v.name] ?? []), v];
    return acc;
  }, {}) ?? {};

  const handleAddToCart = () => {
    if (!product) return;
    if (product.variants.length > 0 && !selectedVariantId) {
      toast({ title: "Please select a variant", description: "Choose your preferred option before adding to cart.", variant: "destructive" });
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
        <div className="container mx-auto px-[30px] flex items-center text-sm text-muted-foreground gap-2">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
          {product.categoryName && (
            <>
              <ChevronRight className="h-4 w-4" />
              <Link href={`/shop?category=${encodeURIComponent(product.categoryName.toLowerCase())}`} className="hover:text-primary transition-colors">
                {product.categoryName}
              </Link>
            </>
          )}
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-[30px] py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
              {currentImage ? (
                <img src={currentImage} alt={product.name} fetchPriority="high" decoding="async" width={800} height={800} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img) => (
                  <button
                    key={img.id}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${currentImage === img.url ? "border-primary" : "border-transparent"}`}
                    onClick={() => setSelectedImage(img.url)}
                  >
                    <img src={img.url} alt="Thumbnail" loading="lazy" decoding="async" width={200} height={200} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <h1 className="text-4xl font-serif font-bold text-foreground mb-2">{product.name}</h1>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl font-medium text-[#9B0F5F]">₹{effectivePrice}</span>
              {product.compareAtPrice && (
                <span className="text-muted-foreground line-through text-lg">₹{product.compareAtPrice}</span>
              )}
              {product.compareAtPrice && (
                <span className="text-xs bg-[#9B0F5F] text-white px-2 py-0.5 rounded font-medium">
                  {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF
                </span>
              )}
            </div>

            <p className="text-foreground/80 mb-8 leading-relaxed">{product.description}</p>

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
              <div className="flex flex-col items-center gap-2 text-[#9B0F5F]">
                <ShieldCheck className="h-6 w-6" />
                <span className="text-xs font-medium text-foreground">Anti-Tarnish</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-[#9B0F5F]">
                <Droplets className="h-6 w-6" />
                <span className="text-xs font-medium text-foreground">Waterproof</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-[#9B0F5F]">
                <Sparkles className="h-6 w-6" />
                <span className="text-xs font-medium text-foreground">Skin Friendly</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
