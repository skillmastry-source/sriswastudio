import { StoreLayout } from "@/components/layout/store-layout";
import { SignedIn, SignedOut, SignIn, SignUp, useUser, useClerk } from "@/lib/clerk-stub";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Package, User, ChevronDown, ChevronUp, MapPin, Receipt, Loader2, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAddToCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useCartContext } from "@/hooks/use-cart-context";
import { broadcastCartUpdate } from "@/lib/cart-broadcast";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: number;
  productId: number | null;
  variantId: number | null;
  productName: string | null;
  quantity: number;
  price: number;
  imageUrl: string | null;
  variantLabel: string | null;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  couponCode: string | null;
  paymentMethod: string;
  customerName: string;
  shippingAddress: string;
  city: string;
  state: string;
  pincode: string;
  createdAt: string;
  items: OrderItem[];
}

const PAYMENT_LABELS: Record<string, string> = {
  RAZORPAY: "Razorpay (Online)",
  UPI_QR:   "UPI / QR Code",
  PHONEPE:  "PhonePe",
  cod:      "Cash on Delivery",
  COD:      "Cash on Delivery",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2,
  }).format(n);
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const { sessionId, openCart } = useCartContext();
  const addToCartMutation = useAddToCart();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleReorder = async () => {
    if (!order.items?.length || !sessionId) return;
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

  const statusColor: Record<string, string> = {
    pending:    "bg-amber-100 text-amber-700",
    processing: "bg-blue-100 text-blue-700",
    shipped:    "bg-purple-100 text-purple-700",
    delivered:  "bg-green-100 text-green-700",
    cancelled:  "bg-red-100 text-red-700",
  };

  const paymentLabel = PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod;

  return (
    <Card>
      {/* ── Header row – always visible ── */}
      <CardContent className="p-5">
        <button
          type="button"
          className="w-full text-left"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono font-semibold text-sm">{order.orderNumber}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric", month: "short", day: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${
                  statusColor[order.status] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {order.status}
              </span>
              <span className="font-bold text-[#9B0F5F]">{fmt(order.total)}</span>
              {expanded
                ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            </div>
          </div>

          {/* Compact item thumbnails when collapsed */}
          {!expanded && order.items.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.productName ?? "Product"}
                      loading="lazy"
                      decoding="async"
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded object-cover bg-muted"
                    />
                  )}
                  <span>{item.productName} ×{item.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </button>

        {/* ── Expanded detail ── */}
        {expanded && (
          <div className="mt-5 space-y-5 border-t pt-5">

            {/* Order details row */}
            <div className="bg-muted/40 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 mb-3 text-base font-medium">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                Order Details
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number</span>
                <span className="font-mono font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <span className="font-medium">{paymentLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-xs uppercase tracking-wider ${
                    statusColor[order.status] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </div>

            {/* Items */}
            {order.items.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Items Ordered</span>
                </div>
                <div className="divide-y border rounded-lg overflow-hidden">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3">
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
                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{fmt(order.subtotal)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        Discount
                        {order.couponCode && (
                          <span className="ml-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-mono">
                            {order.couponCode}
                          </span>
                        )}
                      </span>
                      <span>−{fmt(order.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{order.shippingCost === 0 ? "Free" : fmt(order.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total</span>
                    <span>{fmt(order.total)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping address */}
            {order.shippingAddress && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Shipping Address</span>
                </div>
                <address className="not-italic text-sm leading-relaxed text-foreground bg-muted/40 rounded-lg p-4">
                  <p className="font-medium">{order.customerName}</p>
                  <p>{order.shippingAddress}</p>
                  <p>{order.city}, {order.state} – {order.pincode}</p>
                </address>
              </div>
            )}

            {/* Re-order button */}
            {order.items.length > 0 && (
              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
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
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AccountDashboard() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [tab, setTab] = useState<"profile" | "orders">("profile");

  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const { data: orderData, isLoading: ordersLoading } = useQuery<{ orders: Order[] }>({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const res = await fetch(`/api/orders/my`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json() as Promise<{ orders: Order[] }>;
    },
    enabled: !!user,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Sidebar */}
      <div className="md:col-span-1 space-y-2">
        <h2 className="font-serif font-bold text-2xl mb-6">My Account</h2>
        <Button
          variant="ghost"
          className={`w-full justify-start ${tab === "profile" ? "bg-[#9B0F5F]/10 text-[#9B0F5F]" : ""}`}
          onClick={() => setTab("profile")}
        >
          <User className="mr-2 h-4 w-4" /> Profile
        </Button>
        <Button
          variant="ghost"
          className={`w-full justify-start ${tab === "orders" ? "bg-[#9B0F5F]/10 text-[#9B0F5F]" : ""}`}
          onClick={() => setTab("orders")}
        >
          <Package className="mr-2 h-4 w-4" /> My Orders
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>

      {/* Content */}
      <div className="md:col-span-3">
        {tab === "profile" && (
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Name</div>
                  <div className="font-medium">
                    {user?.fullName || user?.firstName || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
                  <div className="font-medium">{email || "—"}</div>
                </div>
              </div>
              {user?.imageUrl && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Profile Picture</div>
                  <img
                    src={user.imageUrl}
                    alt="Profile"
                    className="h-16 w-16 rounded-full object-cover border"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "orders" && (
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-xl">My Orders</h3>
            {ordersLoading ? (
              <p className="text-muted-foreground text-sm">Loading orders…</p>
            ) : !orderData?.orders.length ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>You haven't placed any orders yet.</p>
                  <Button className="mt-4 bg-[#9B0F5F] hover:bg-[#7d0c4c]" asChild>
                    <a href="/shop">Start Shopping</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              orderData.orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Account() {
  const [view, setView] = useState<"signin" | "signup">("signin");

  return (
    <StoreLayout>
      <div className="container mx-auto px-[30px] py-12 max-w-4xl">
        <SignedIn>
          <AccountDashboard />
        </SignedIn>

        <SignedOut>
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-serif">Welcome to Sriswa</CardTitle>
                <CardDescription>
                  {view === "signin"
                    ? "Sign in to access your account and track orders"
                    : "Create an account to track orders and save favourites"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {view === "signin" ? <SignIn /> : <SignUp />}
                <div className="mt-6 text-center text-sm">
                  {view === "signin" ? (
                    <p>
                      Don&apos;t have an account?{" "}
                      <button onClick={() => setView("signup")} className="text-[#9B0F5F] hover:underline font-medium">
                        Sign up
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{" "}
                      <button onClick={() => setView("signin")} className="text-[#9B0F5F] hover:underline font-medium">
                        Sign in
                      </button>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </SignedOut>
      </div>
    </StoreLayout>
  );
}
