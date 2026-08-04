import { StoreLayout } from "@/components/layout/store-layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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

interface Order {
  orderNumber: string;
  paymentMethod: string;
  status: string;
  total: string;
}

export default function OrderConfirmation() {
  const searchParams = new URLSearchParams(window.location.search);
  const orderNumber = searchParams.get("orderNumber");
  const email = searchParams.get("email") ?? "";

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["order-confirmation", orderNumber],
    enabled: !!orderNumber,
    queryFn: async () => {
      // Try track endpoint (public, no auth needed)
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

  return (
    <StoreLayout>
      <div className="container mx-auto px-[30px] py-24 max-w-2xl text-center">
        <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>

        <h1 className="text-4xl font-serif font-bold mb-4">Thank You!</h1>
        <p className="text-xl text-muted-foreground mb-8">Your order has been placed successfully.</p>

        <div className="bg-card border rounded-lg p-8 mb-10 text-left">
          <h2 className="text-lg font-medium mb-4 text-center border-b pb-4">Order Details</h2>

          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Order Number:</span>
            <span className="font-mono font-bold">{orderNumber ?? "—"}</span>
          </div>

          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Payment Method:</span>
            {isLoading
              ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              : <span className="font-medium">{paymentLabel}</span>
            }
          </div>

          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Status:</span>
            {isLoading
              ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              : <span className={`font-medium px-2 py-1 rounded text-xs uppercase tracking-wider ${statusStyle}`}>
                  {statusLabel}
                </span>
            }
          </div>

          <p className="text-sm text-center text-muted-foreground mt-6">
            We've sent a confirmation email with your order details.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/track-order">Track Order</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </StoreLayout>
  );
}
