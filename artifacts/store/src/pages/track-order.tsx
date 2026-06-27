import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Package, Truck, CheckCircle2, Clock } from "lucide-react";

const trackSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  email: z.string().email("Valid email is required"),
});

export default function TrackOrder() {
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const form = useForm<z.infer<typeof trackSchema>>({
    resolver: zodResolver(trackSchema),
    defaultValues: {
      orderNumber: "",
      email: "",
    },
  });

  const onSubmit = (data: z.infer<typeof trackSchema>) => {
    setIsSearching(true);
    // Mock tracking lookup
    setTimeout(() => {
      setIsSearching(false);
      setTrackingResult({
        orderNumber: data.orderNumber,
        status: "processing", // pending, processing, shipped, delivered
        date: new Date().toLocaleDateString(),
        items: 2,
        total: 2998
      });
    }, 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-6 w-6 text-amber-500" />;
      case 'processing': return <Package className="h-6 w-6 text-blue-500" />;
      case 'shipped': return <Truck className="h-6 w-6 text-purple-500" />;
      case 'delivered': return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      default: return <Clock className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <StoreLayout>
      <div className="bg-muted py-12">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h1 className="text-4xl font-serif font-bold mb-4">Track Your Order</h1>
          <p className="text-muted-foreground">
            Enter your order number and email address to check the current status of your shipment.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-xl">
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
                      <Input placeholder="e.g. ORD-12345" {...field} />
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
              <Button type="submit" className="w-full h-12" disabled={isSearching}>
                {isSearching ? "Searching..." : "Track Order"}
              </Button>
            </form>
          </Form>
        </div>

        {trackingResult && (
          <div className="mt-8 bg-card border rounded-lg overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="bg-primary/5 p-6 border-b">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Order Date: {trackingResult.date}</span>
                <span className="font-mono font-medium">{trackingResult.orderNumber}</span>
              </div>
              <div className="flex items-center gap-3">
                {getStatusIcon(trackingResult.status)}
                <h3 className="text-xl font-serif font-bold capitalize">{trackingResult.status}</h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="relative pt-8 pb-4">
                {/* Progress Bar Line */}
                <div className="absolute top-10 left-[10%] right-[10%] h-1 bg-muted rounded-full">
                  <div className={`absolute h-full bg-primary rounded-full transition-all duration-1000 ${
                    trackingResult.status === 'pending' ? 'w-0' :
                    trackingResult.status === 'processing' ? 'w-[33%]' :
                    trackingResult.status === 'shipped' ? 'w-[66%]' : 'w-full'
                  }`}></div>
                </div>
                
                {/* Steps */}
                <div className="flex justify-between relative z-10">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center border-4 border-card"><CheckCircle2 className="h-4 w-4" /></div>
                    <span className="text-xs font-medium">Placed</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center border-4 border-card ${['processing', 'shipped', 'delivered'].includes(trackingResult.status) ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}><Package className="h-3 w-3" /></div>
                    <span className="text-xs font-medium">Processing</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center border-4 border-card ${['shipped', 'delivered'].includes(trackingResult.status) ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}><Truck className="h-3 w-3" /></div>
                    <span className="text-xs font-medium">Shipped</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center border-4 border-card ${trackingResult.status === 'delivered' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}><CheckCircle2 className="h-3 w-3" /></div>
                    <span className="text-xs font-medium">Delivered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
