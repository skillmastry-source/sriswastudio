import { StoreLayout } from "@/components/layout/store-layout";
import { useCartContext } from "@/hooks/use-cart-context";
import { useGetCart, getGetCartQueryKey, useUpdateCartItem, useRemoveCartItem } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function Cart() {
  const { sessionId } = useCartContext();
  const queryClient = useQueryClient();
  
  const { data: cart, isLoading } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
  );

  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateItem.mutate({
      sessionId,
      itemId,
      data: { quantity: newQuantity }
    }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) })
    });
  };

  const handleRemove = (itemId: number) => {
    removeItem.mutate({ sessionId, itemId }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) })
    });
  };

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="text-3xl font-serif font-bold mb-8">Shopping Cart</h1>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </StoreLayout>
    );
  }

  const isEmpty = !cart?.items || cart.items.length === 0;

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <h1 className="text-3xl font-serif font-bold mb-8">Your Cart</h1>
        
        {isEmpty ? (
          <div className="bg-card rounded-lg border p-12 text-center">
            <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="h-10 w-10 text-muted-foreground opacity-20" />
            </div>
            <h2 className="text-2xl font-serif font-medium mb-4">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Looks like you haven't added anything to your cart yet.</p>
            <Button size="lg" asChild>
              <Link href="/shop">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="flex-1 space-y-6">
              <div className="border-b pb-4 hidden sm:grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                <div className="col-span-6">Product</div>
                <div className="col-span-3 text-center">Quantity</div>
                <div className="col-span-3 text-right">Total</div>
              </div>
              
              {cart.items.map((item) => (
                <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center border-b pb-6">
                  <div className="col-span-1 sm:col-span-6 flex gap-4">
                    <div className="h-24 w-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center">
                      <Link href={`/shop/product`} className="font-medium hover:text-primary transition-colors line-clamp-2">
                        {item.productName}
                      </Link>
                      <div className="text-sm text-muted-foreground mt-1">₹{item.price}</div>
                      <button 
                        onClick={() => handleRemove(item.id)}
                        className="text-sm text-destructive hover:underline mt-2 self-start flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                    </div>
                  </div>
                  
                  <div className="col-span-1 sm:col-span-3 flex sm:justify-center">
                    <div className="flex items-center border rounded-md bg-card">
                      <button 
                        className="p-2 hover:bg-muted transition-colors disabled:opacity-50"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || updateItem.isPending}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                      <button 
                        className="p-2 hover:bg-muted transition-colors disabled:opacity-50"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={updateItem.isPending}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="col-span-1 sm:col-span-3 text-left sm:text-right font-medium">
                    <span className="sm:hidden text-muted-foreground font-normal mr-2">Total:</span>
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="bg-card border rounded-lg p-6 sticky top-24">
                <h2 className="text-xl font-serif font-bold mb-6">Order Summary</h2>
                <div className="space-y-4 text-sm mb-6 border-b pb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{cart.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                </div>
                <div className="flex justify-between text-lg font-bold mb-8">
                  <span>Total</span>
                  <span>₹{cart.total}</span>
                </div>
                <Button className="w-full h-12 text-base" asChild>
                  <Link href="/checkout">
                    Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
