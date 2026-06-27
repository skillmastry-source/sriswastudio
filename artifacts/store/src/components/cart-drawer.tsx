import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCartContext } from "@/hooks/use-cart-context";
import { useGetCart, getGetCartQueryKey, useUpdateCartItem } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export function CartDrawer() {
  const { sessionId, isDrawerOpen, closeCart } = useCartContext();
  const overlayRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: cart } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
  );

  const updateItem = useUpdateCartItem();

  const handleQuantity = (itemId: number, newQty: number) => {
    if (newQty < 1) return;
    updateItem.mutate(
      { itemId, data: { quantity: newQty, sessionId } as { quantity: number; sessionId: string } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) }) }
    );
  };

  const handleRemove = async (itemId: number) => {
    await fetch(`/api/cart/items/${itemId}?sessionId=${encodeURIComponent(sessionId)}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
    queryClient.invalidateQueries({ queryKey: ["cart", sessionId] });
  };

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isDrawerOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={closeCart}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#9B0F5F]" />
            <h2 className="font-serif font-bold text-xl">Your Cart</h2>
            {(cart?.itemCount ?? 0) > 0 && (
              <span className="ml-1 text-sm text-muted-foreground">({cart?.itemCount} items)</span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={closeCart}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">Your cart is empty.</p>
              <Button variant="outline" onClick={closeCart} asChild>
                <Link href="/shop">Browse Collection</Link>
              </Button>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.id} className="flex gap-3 py-3 border-b last:border-b-0">
                <div className="h-20 w-20 flex-shrink-0 rounded-md overflow-hidden border bg-muted">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-tight line-clamp-2">{item.productName}</p>
                  {item.variantLabel && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.variantLabel}</p>
                  )}
                  <p className="font-semibold text-sm mt-1 text-[#9B0F5F]">₹{item.price}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleQuantity(item.id, item.quantity - 1)}
                      className="h-7 w-7 rounded border flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantity(item.id, item.quantity + 1)}
                      className="h-7 w-7 rounded border flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="ml-auto h-7 w-7 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart && cart.items.length > 0 && (
          <div className="border-t px-6 py-5 space-y-3 bg-white">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-serif font-bold text-lg">₹{cart.total}</span>
            </div>
            <p className="text-xs text-muted-foreground">Shipping &amp; taxes calculated at checkout.</p>
            <Button
              className="w-full h-12 bg-[#9B0F5F] hover:bg-[#7d0c4c] text-white font-medium"
              onClick={closeCart}
              asChild
            >
              <Link href="/checkout">Proceed to Checkout</Link>
            </Button>
            <Button variant="outline" className="w-full" onClick={closeCart} asChild>
              <Link href="/cart">View Full Cart</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
