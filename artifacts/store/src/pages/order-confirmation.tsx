import { StoreLayout } from "@/components/layout/store-layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function OrderConfirmation() {
  const searchParams = new URLSearchParams(window.location.search);
  const orderNumber = searchParams.get('orderNumber');

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
            <span className="font-mono font-bold">{orderNumber || 'Unknown'}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Payment Method:</span>
            <span className="font-medium">Cash on Delivery</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Status:</span>
            <span className="font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded text-xs uppercase tracking-wider">Pending</span>
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
