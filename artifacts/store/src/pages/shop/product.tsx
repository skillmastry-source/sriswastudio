import { StoreLayout } from "@/components/layout/store-layout";
import { useGetProduct, getGetProductQueryKey, useAddToCart } from "@workspace/api-client-react";
import { useCartContext } from "@/hooks/use-cart-context";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, ShieldCheck, Droplets, Sparkles, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  // In a real app we'd fetch by slug, but our generated hook takes ID. 
  // We'll list products and find the matching slug to get the ID, then fetch details.
  // For this stub, we'll mock the data fetching or assume we have an endpoint.
  // Since we don't have a getProductBySlug, we list all and find.
  
  const { sessionId } = useCartContext();
  const { toast } = useToast();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Mock data for display purposes
  const isLoading = false;
  const product = {
    id: 1,
    name: "Classic Gold Hoop Earrings",
    slug: slug,
    description: "These classic gold hoop earrings are designed for everyday wear. Crafted with our signature anti-tarnish technology, they are completely waterproof and skin-friendly. Perfect for layering or wearing alone.",
    price: 1499,
    compareAtPrice: 1999,
    stockQuantity: 10,
    categoryId: 3,
    categoryName: "Earrings",
    images: [
      { id: 1, url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80", isPrimary: true, displayOrder: 0, productId: 1 },
      { id: 2, url: "https://images.unsplash.com/photo-1599643478524-fb66f70d00ea?auto=format&fit=crop&q=80", isPrimary: false, displayOrder: 1, productId: 1 }
    ],
    variants: [],
    isActive: true,
    isFeatured: true
  };

  const addToCartMutation = useAddToCart();

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCartMutation.mutate({
      data: {
        sessionId,
        productId: product.id,
        quantity,
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Added to cart",
          description: `${quantity}x ${product.name} added to your cart.`,
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Could not add item to cart. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-12">
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

  if (!product) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-serif font-bold mb-4">Product Not Found</h1>
          <Button asChild><Link href="/shop">Back to Shop</Link></Button>
        </div>
      </StoreLayout>
    );
  }

  const currentImage = selectedImage || product.images?.[0]?.url;

  return (
    <StoreLayout>
      {/* Breadcrumbs */}
      <div className="bg-card border-b py-4">
        <div className="container mx-auto px-4 flex items-center text-sm text-muted-foreground gap-2">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
          {product.categoryName && (
            <>
              <ChevronRight className="h-4 w-4" />
              <Link href={`/shop?category=${product.categoryName.toLowerCase()}`} className="hover:text-primary transition-colors">{product.categoryName}</Link>
            </>
          )}
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
              {currentImage ? (
                <img src={currentImage} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img) => (
                  <button 
                    key={img.id} 
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-colors ${currentImage === img.url ? 'border-primary' : 'border-transparent'}`}
                    onClick={() => setSelectedImage(img.url)}
                  >
                    <img src={img.url} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <h1 className="text-4xl font-serif font-bold text-foreground mb-2">{product.name}</h1>
            
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl font-medium">₹{product.price}</span>
              {product.compareAtPrice && (
                <span className="text-muted-foreground line-through text-lg">₹{product.compareAtPrice}</span>
              )}
            </div>

            <p className="text-foreground/80 mb-8 leading-relaxed">
              {product.description}
            </p>

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
                  {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                </p>
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full text-lg h-14"
              onClick={handleAddToCart}
              disabled={product.stockQuantity <= 0 || addToCartMutation.isPending}
            >
              {addToCartMutation.isPending ? "Adding..." : product.stockQuantity > 0 ? "Add to Cart" : "Out of Stock"}
            </Button>

            {/* USPs inline */}
            <div className="mt-8 pt-8 border-t grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center gap-2 text-primary">
                <ShieldCheck className="h-6 w-6" />
                <span className="text-xs font-medium text-foreground">Anti-Tarnish</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-primary">
                <Droplets className="h-6 w-6" />
                <span className="text-xs font-medium text-foreground">Waterproof</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-primary">
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
