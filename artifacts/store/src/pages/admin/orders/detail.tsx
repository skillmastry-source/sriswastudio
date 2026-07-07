import { useParams, Link } from "wouter";
import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Package, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StoreSettings {
  customerOrderTemplate: string | null;
  statusUpdateTemplate: string | null;
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

function waLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
}

interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  price: number;
  imageUrl: string | null;
  variantLabel: string | null;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  state: string;
  pincode: string;
  notes: string | null;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"];

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  shipped: "bg-purple-100 text-purple-700 border-purple-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const { data: order, isLoading, isError } = useQuery<Order>({
    queryKey: ["admin-order", id],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`/api/orders/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Order not found");
      return res.json() as Promise<Order>;
    },
    enabled: !!id,
  });

  const { data: settings } = useQuery<StoreSettings>({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`/api/admin/settings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to load settings");
      return res.json() as Promise<StoreSettings>;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const token = await getToken();
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json() as Promise<Order>;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin-order", id], updated);
      toast({ title: "Status updated", description: `Order is now ${updated.status}.` });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not update order status.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-32 bg-muted rounded" />
        <div className="h-48 bg-muted rounded" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="text-center py-16">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
        <p className="text-muted-foreground mb-4">Order not found.</p>
        <Button variant="outline" asChild>
          <Link href="/admin/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="h-4 w-4 mr-1" /> Orders
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-serif font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleString("en-IN", {
              year: "numeric", month: "long", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border ${statusColors[order.status] ?? ""}`}>
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Items + Totals */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.productName} className="h-12 w-12 rounded object-cover bg-muted flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.productName}</p>
                      {item.variantLabel && (
                        <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-sm">₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{order.shippingCost === 0 ? "Free" : `₹${order.shippingCost}`}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1 border-t mt-1">
                  <span>Total</span><span className="text-[#9B0F5F]">₹{order.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Update Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Update Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Select
                  defaultValue={order.status}
                  onValueChange={(val) => updateStatus.mutate(val)}
                  disabled={updateStatus.isPending}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {updateStatus.isPending && (
                  <span className="text-sm text-muted-foreground">Updating…</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Changing status will send a WhatsApp notification to the customer.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: Customer + Address */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="font-medium">{order.customerName}</p>
              <p className="text-muted-foreground">{order.customerEmail}</p>
              <p className="text-muted-foreground">{order.customerPhone}</p>
            </CardContent>
          </Card>

          {order.customerPhone && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-600" /> WhatsApp Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-green-200 text-green-700 hover:bg-green-50"
                  asChild
                >
                  <a
                    href={waLink(
                      order.customerPhone,
                      renderTemplate(
                        settings?.customerOrderTemplate ||
                          "Hi {{customerName}}, your order {{orderNumber}} has been placed at Sriswa Studio for ₹{{total}}. We'll keep you updated!",
                        {
                          customerName: order.customerName,
                          orderNumber: order.orderNumber,
                          total: order.total.toFixed(2),
                        }
                      )
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" /> Send Order Confirmation
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-green-200 text-green-700 hover:bg-green-50"
                  asChild
                >
                  <a
                    href={waLink(
                      order.customerPhone,
                      renderTemplate(
                        settings?.statusUpdateTemplate ||
                          "Hi {{customerName}}, your order {{orderNumber}} status is now: {{status}}. — Sriswa Studio",
                        {
                          customerName: order.customerName,
                          orderNumber: order.orderNumber,
                          status: order.status,
                        }
                      )
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" /> Send Status Update
                  </a>
                </Button>
                <p className="text-xs text-muted-foreground pt-1">
                  Opens WhatsApp with the message pre-filled from your templates — review and tap send.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Delivery Address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>{order.shippingAddress}</p>
              <p>{order.city}, {order.state}</p>
              <p>{order.pincode}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="capitalize font-medium">{order.paymentMethod.replace("_", " ")}</p>
              {order.notes && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                  <p className="text-muted-foreground">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
