import { StoreLayout } from "@/components/layout/store-layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Package, MapPin, Receipt, ShoppingCart } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAddToCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useCartContext } from "@/hooks/use-cart-context";
import { broadcastCartUpdate } from "@/lib/cart-broadcast";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const PAYMENT_LABELS: Record<string, string> = {
  RAZORPAY:        "Razorpay (Online)",
  UPI_QR:          "UPI / QR Code",
  PHONEPE:         "PhonePe",
  cod:             "Cash on Delivery",
  COD:             "Cash on Delivery",
};

const STATUS_STYLES: Record<string, string> = {
  pending:    "text-amber-600 bg-amber-100",
  processing: "text-blue-600 bg-blue-100",
  confirmed:  "text-green-600 bg-green-100",
  shipped:    "text-purple-600 bg-purple-100",
  delivered:  "text-green-700 bg-green-100",
  cancelled:  "text-red-600 bg-red-100",
};

interface OrderItem {
  id: number;
  productId: number | null;
  variantId: number | null;
  productName: string | null;
  quantity: number;
  price: number;
  variantLabel: string | null;
  imageUrl: string | null;
}

interface Order {
  orderNumber: string;
  paymentMethod: string;
  status: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  couponCode: string | null;
  customerName: string;
  shippingAddress: string;
  city: string;
  state: string;
  pincode: string;
  items: OrderItem[];
}

export default function OrderConfirmation() {
  const searchParams = new URLSearchParams(window.location.search);
  const orderNumber = searchParams.get("orderNumber");
  const email = searchParams.get("email") ?? "";

  const { sessionId, openCart } = useCartContext();
  const addToCartMutation = useAddToCart();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isReordering, setIsReordering] = useState(false);

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["order-confirmation", orderNumber],
    enabled: !!orderNumber,
    queryFn: async () => {
      const res = await fetch(
        `${BASE}/api/orders/track?orderNumber=${encodeURIComponent(orderNumber!)}&email=${encodeURIComponent(email)}`,
      );
      if (!res.ok) throw new Error("not found");
      return res.json() as Promise<Order>;
    },
    retry: false,
  });

  const paymentLabel =
    order?.paymentMethod
      ? (PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod)
      : "—";

  const statusLabel = order?.status ?? "pending";
  const statusStyle = STATUS_STYLES[statusLabel] ?? "text-amber-600 bg-amber-100";

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

  const handleReorder = async () => {
    if (!order?.items?.length || !sessionId) return;
    setIsReordering(true);

    const activeItems = order.items.filter((item) => item.productId !== null);
    let added = 0;
    let skipped = 0;

    for (const item of activeItems) {
      try {
        await new Promise<void>((resolve, reject) => {
          addToCartMutation.mutate(
            { data: { sessionId, productId: item.productId!, quantity: item.quantity, variantId: item.variantId ?? undefined } },
            { onSuccess: () => resolve(), onError: () => reject() },
          );
        });
        added++;
      } catch {
        skipped++;
      }
    }

    // Also count items with no productId as skipped (deleted products)
    skipped += order.items.length - activeItems.length;

    await queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
    broadcastCartUpdate(sessionId);

    if (added > 0) {
      openCart();
      toast({
        title: "Items added to cart",
        description: skipped > 0
          ? `${added} item${added !== 1 ? "s" : ""} added. ${skipped} unavailable item${skipped !== 1 ? "s" : ""} skipped.`
          : `${added} item${added !== 1 ? "s" : ""} added to your cart.`,
      });
    } else {
      toast({
        title: "Nothing to re-order",
        description: "All items from this order are currently unavailable.",
        variant: "destructive",
      });
    }

    setIsReordering(false);
  };

  return (
    <StoreLayout>
      <div className="container mx-auto px-[30px] py-24 max-w-2xl text-center">
        <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>

        <h1 className="text-4xl font-serif font-bold mb-4">Thank You!</h1>
        <p className="text-xl text-muted-foreground mb-8">Your order has been placed successfully.</p>

        {/* ── Order Header Card ── */}
        <div className="bg-card border rounded-lg p-6 mb-6 text-left">
          <div className="flex items-center gap-2 mb-4 border-b pb-4">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-medium">Order Details</h2>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Order Number</span>
            <span className="font-mono font-bold">{orderNumber ?? "—"}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Payment Method</span>
            {isLoading
              ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              : <span className="font-medium">{paymentLabel}</span>
            }
          </div>

          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Status</span>
            {isLoading
              ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              : <span className={`font-medium px-2 py-1 rounded text-xs uppercase tracking-wider ${statusStyle}`}>
                  {statusLabel}
                </span>
            }
          </div>
        </div>

        {/* ── Items Card ── */}
        {(isLoading || (order && order.items && order.items.length > 0)) && (
          <div className="bg-card border rounded-lg p-6 mb-6 text-left">
            <div className="flex items-center gap-2 mb-4 border-b pb-4">
              <Package className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-medium">Items Ordered</h2>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="divide-y">
                  {order!.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 py-3">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.productName ?? "Product"}
                          className="h-14 w-14 object-cover rounded border flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.productName ?? "Item"}</p>
                        {item.variantLabel && (
                          <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                        )}
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-medium">{fmt(item.price * item.quantity)}</p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-muted-foreground">{fmt(item.price)} each</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{fmt(order!.subtotal)}</span>
                  </div>
                  {order!.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>
                        Discount
                        {order!.couponCode && (
                          <span className="ml-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-mono">
                            {order!.couponCode}
                          </span>
                        )}
                      </span>
                      <span>−{fmt(order!.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{order!.shippingCost === 0 ? "Free" : fmt(order!.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t pt-2">
                    <span>Total</span>
                    <span>{fmt(order!.total)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Shipping Address Card ── */}
        {(isLoading || order?.shippingAddress) && (
          <div className="bg-card border rounded-lg p-6 mb-8 text-left">
            <div className="flex items-center gap-2 mb-4 border-b pb-4">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-medium">Shipping Address</h2>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <address className="not-italic text-sm leading-relaxed text-foreground">
                <p className="font-medium">{order!.customerName}</p>
                <p>{order!.shippingAddress}</p>
                <p>{order!.city}, {order!.state} – {order!.pincode}</p>
              </address>
            )}
          </div>
        )}

        <p className="text-sm text-center text-muted-foreground mb-8">
          We've sent a confirmation email with your order details.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/track-order">Track Order</Link>
          </Button>
          {order?.items?.length ? (
            <Button
              variant="outline"
              size="lg"
              onClick={handleReorder}
              disabled={isReordering}
            >
              {isReordering ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ShoppingCart className="h-4 w-4 mr-2" />
              )}
              Re-order
            </Button>
          ) : null}
          <Button asChild size="lg">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </StoreLayout>
  );
}
