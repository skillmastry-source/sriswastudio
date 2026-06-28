import { StoreLayout } from "@/components/layout/store-layout";
import { useCartContext } from "@/hooks/use-cart-context";
import { useGetCart, getGetCartQueryKey, useCreateOrder } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().min(10, "Valid phone number is required"),
  shippingAddress: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().min(6, "Valid pincode is required"),
  notes: z.string().optional(),
});

export default function Checkout() {
  const { sessionId } = useCartContext();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  
  const { data: cart } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
  );

  const createOrder = useCreateOrder();

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      shippingAddress: "",
      city: "",
      state: "",
      pincode: "",
      notes: "",
    },
  });

  const onSubmit = (data: z.infer<typeof checkoutSchema>) => {
    setError("");
    createOrder.mutate({
      data: {
        ...data,
        sessionId,
        paymentMethod: "COD" // Hardcoded for this implementation
      }
    }, {
      onSuccess: (order) => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
        setLocation(`/order-confirmation?orderNumber=${order.orderNumber}`);
      },
      onError: () => {
        setError("Failed to create order. Please try again.");
      }
    });
  };

  if (!cart || cart.items.length === 0) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-[30px] py-24 text-center">
          <h1 className="text-3xl font-serif font-bold mb-4">Checkout</h1>
          <p className="text-muted-foreground mb-8">Your cart is empty. You cannot proceed to checkout.</p>
          <Button asChild><Link href="/shop">Back to Shop</Link></Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container mx-auto px-[30px] py-12 max-w-6xl">
        <h1 className="text-3xl font-serif font-bold mb-8">Checkout</h1>
        
        <div className="flex flex-col lg:flex-row gap-12 lg:items-start">
          <div className="flex-1 order-2 lg:order-1">
            <div className="bg-card border rounded-lg p-6 lg:p-8">
              <h2 className="text-xl font-serif font-bold mb-6 border-b pb-4">Shipping Information</h2>
              
              {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center gap-2 mb-6">
                  <AlertTriangle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+91 9876543210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="jane@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shippingAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="123 Main St, Apt 4B" className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Mumbai" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="Maharashtra" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PIN Code</FormLabel>
                          <FormControl>
                            <Input placeholder="400001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Special instructions for delivery" className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-6 border-t">
                    <h3 className="font-serif font-bold text-lg mb-4">Payment Method</h3>
                    <div className="p-4 border border-primary bg-primary/5 rounded-lg flex items-center justify-between">
                      <div className="font-medium">Cash on Delivery (COD)</div>
                      <div className="text-primary font-bold">Standard</div>
                    </div>
                  </div>

                  <Button type="submit" size="lg" className="w-full h-14 text-lg" disabled={createOrder.isPending}>
                    {createOrder.isPending ? "Processing..." : "Place Order • ₹" + cart.total}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
          
          <div className="w-full lg:w-96 flex-shrink-0 order-1 lg:order-2">
            <div className="bg-muted/50 border rounded-lg p-6 sticky top-24">
              <h2 className="text-xl font-serif font-bold mb-6 border-b pb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-16 w-16 bg-card rounded overflow-hidden flex-shrink-0 border">
                      {item.imageUrl && <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1 text-sm">
                      <div className="font-medium line-clamp-2">{item.productName}</div>
                      <div className="text-muted-foreground mt-1">Qty: {item.quantity}</div>
                      <div className="font-medium mt-1">₹{item.price * item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-3 text-sm mb-6 border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{cart.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
              </div>
              
              <div className="flex justify-between text-xl font-serif font-bold border-t pt-4">
                <span>Total</span>
                <span>₹{cart.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
