import { useState } from "react";
import { Link } from "wouter";
import { ShoppingBag, Sparkles } from "lucide-react";
import { useAddToCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCartContext } from "@/hooks/use-cart-context";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_BRAND = "#9B0F5F";
const DEFAULT_DARK = "#1a0a0f";

export type CardProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  images?: { url: string }[];
  stockQuantity: number;
};

interface ProductCardProps {
  product: CardProduct;
  sessionId?: string;
  brand?: string;
  dark?: string;
}

/**
 * Shared product card used across the shop listing page, section renderer,
 * and any other surface that renders product grids. All add-to-cart actions
 * invalidate `getGetCartQueryKey({ sessionId })` so the navbar count and cart
 * drawer stay in sync without a page refresh.
 */
export function ProductCard({ product, sessionId: sessionIdProp, brand = DEFAULT_BRAND, dark = DEFAULT_DARK }: ProductCardProps) {
  const { sessionId: ctxSessionId } = useCartContext();
  const sessionId = sessionIdProp ?? ctxSessionId;
  const addToCart = useAddToCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const outOfStock = product.stockQuantity <= 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    setAdding(true);
    addToCart.mutate(
      { data: { sessionId, productId: product.id, quantity: 1 } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
          toast({ title: "Added to cart ✓", description: `${product.name} added.` });
        },
        onError: () =>
          toast({ title: "Error", description: "Could not add to cart.", variant: "destructive" }),
        onSettled: () => setAdding(false),
      }
    );
  };

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div
        className="relative overflow-hidden mb-3 md:mb-4 rounded-sm"
        style={{ aspectRatio: "3/4", background: "#fdf6f9" }}
      >
        {product.images?.[0] ? (
          <img
            src={product.images[0].url}
            alt={product.name}
            loading="lazy"
            decoding="async"
            width={600}
            height={800}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles className="h-10 w-10 opacity-20" style={{ color: brand }} />
          </div>
        )}

        {product.compareAtPrice && !outOfStock && (
          <span
            className="absolute top-2.5 left-2.5 text-white text-[9px] font-bold px-2 py-0.5 tracking-widest uppercase"
            style={{ background: brand, borderRadius: 2 }}
          >
            Sale
          </span>
        )}
        {outOfStock && (
          <span
            className="absolute top-2.5 left-2.5 text-white text-[9px] font-bold px-2 py-0.5 tracking-widest uppercase"
            style={{ background: "#888", borderRadius: 2 }}
          >
            Sold Out
          </span>
        )}

        {/* Add to Cart — slides up on hover */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAdd}
            disabled={outOfStock || adding}
            className="w-full flex items-center justify-center gap-2 py-3 text-white text-[11px] tracking-[0.18em] uppercase font-semibold disabled:opacity-60"
            style={{ background: outOfStock ? "#888" : brand }}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {adding ? "Adding…" : outOfStock ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>

      <h3
        className="font-serif font-semibold text-sm md:text-base leading-snug mb-1 md:mb-1.5 transition-colors"
        style={{ color: dark }}
      >
        {product.name}
      </h3>
      <div className="flex items-center gap-2">
        <span className="font-bold text-sm md:text-base" style={{ color: brand }}>
          ₹{product.price}
        </span>
        {product.compareAtPrice && (
          <span className="text-gray-400 line-through text-xs">₹{product.compareAtPrice}</span>
        )}
      </div>
    </Link>
  );
}
