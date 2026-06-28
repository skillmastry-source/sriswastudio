import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Package, Truck, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const trackSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  email: z.string().email("Valid email is required"),
});

interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  price: number;
  imageUrl: string | null;
}

interface TrackingResult {
  id: number;
  orderNumber: string;
  status: string;
  customerName: string;
  createdAt: string;
  total: number;
  items: OrderItem[];
  shippingAddress: string;
  city: string;
  state: string;
  pincode: string;
}

export default function TrackOrder() {
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof trackSchema>>({
    resolver: zodResolver(trackSchema),
    defaultValues: { orderNumber: "", email: "" },
  });

  const onSubmit = async (data: z.infer<typeof trackSchema>) => {
    setIsSearching(true);
    setError(null);
    setTrackingResult(null);
    try {
      const params = new URLSearchParams({
        orderNumber: data.orderNumber,
        email: data.email,
      });
      const res = await fetch(`/api/orders/track?${params}`);
      if (res.status === 404) {
        setError("No order found with that order number and email. Please check your details and try again.");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch order");
      const order = (await res.json()) as TrackingResult;
      setTrackingResult(order);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const statusSteps = ["pending", "processing", "shipped", "delivered"];
  const currentStepIdx = trackingResult ? statusSteps.indexOf(trackingResult.status) : -1;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-6 w-6 text-amber-500" />;
      case "processing": return <Package className="h-6 w-6 text-blue-500" />;
      case "shipped": return <Truck className="h-6 w-6 text-purple-500" />;
      case "delivered": return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      default: return <Clock className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <StoreLayout>
      <div className="bg-muted py-12">
        <div className="container mx-auto px-[30px] text-center max-w-2xl">
          <h1 className="text-4xl font-serif font-bold mb-4">Track Your Order</h1>
          <p className="text-muted-foreground">
            Enter your order number and email address to check the current status of your shipment.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-[30px] py-12 max-w-xl">
        <div className="bg-card border rounded-lg p-8 shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="orderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. SS1A2B3C4D" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Email used during checkout" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 bg-[#9B0F5F] hover:bg-[#7d0c4c]" disabled={isSearching}>
                {isSearching ? "Searching..." : "Track Order"}
              </Button>
            </form>
          </Form>
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-3 bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {trackingResult && (
          <div className="mt-8 bg-card border rounded-lg overflow-hidden">
            <div className="bg-primary/5 p-6 border-b">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {new Date(trackingResult.createdAt).toLocaleDateString("en-IN", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </span>
                <span className="font-mono font-medium text-sm">{trackingResult.orderNumber}</span>
              </div>
              <div className="flex items-center gap-3">
                {getStatusIcon(trackingResult.status)}
                <h3 className="text-xl font-serif font-bold capitalize">{trackingResult.status}</h3>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                For {trackingResult.customerName} · ₹{trackingResult.total}
              </p>
            </div>

            {/* Progress tracker */}
            <div className="p-6">
              <div className="relative pt-8 pb-4">
                <div className="absolute top-10 left-[10%] right-[10%] h-1 bg-muted rounded-full">
                  <div
                    className="absolute h-full bg-[#9B0F5F] rounded-full transition-all duration-700"
                    style={{
                      width:
                        currentStepIdx < 0 ? "0%" :
                        currentStepIdx === 0 ? "0%" :
                        currentStepIdx === 1 ? "33%" :
                        currentStepIdx === 2 ? "66%" : "100%",
                    }}
                  />
                </div>
                <div className="flex justify-between relative z-10">
                  {[
                    { label: "Placed", icon: CheckCircle2 },
                    { label: "Processing", icon: Package },
                    { label: "Shipped", icon: Truck },
                    { label: "Delivered", icon: CheckCircle2 },
                  ].map(({ label, icon: Icon }, i) => {
                    const active = i <= currentStepIdx;
                    return (
                      <div key={label} className="flex flex-col items-center gap-2">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center border-4 border-card ${
                          active ? "bg-[#9B0F5F] text-white" : "bg-muted text-muted-foreground"
                        }`}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <span className="text-xs font-medium">{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shipping address */}
              <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Delivery Address</p>
                <p>{trackingResult.shippingAddress}, {trackingResult.city}, {trackingResult.state} – {trackingResult.pincode}</p>
              </div>

              {/* Items */}
              {trackingResult.items.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="font-medium text-sm mb-3">Order Items</p>
                  <div className="space-y-2">
                    {trackingResult.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.productName} className="h-10 w-10 rounded object-cover bg-muted" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium">₹{item.price * item.quantity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
