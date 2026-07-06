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
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, CreditCard, Smartphone, CheckCircle2, Tag, X, Loader2, QrCode, Copy, LogIn, UserPlus } from "lucide-react";
import { SignedIn, SignedOut } from "@/lib/clerk-stub";

declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => { open(): void };
  }
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

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

type PaymentMethod = "razorpay" | "phonepe" | "upi_qr";

interface CouponResult {
  discount: number;
  type: string;
  value: number;
  code: string;
}

interface UpiSettings {
  upiId: string;
  upiQrUrl: string;
  enabled: boolean;
}

interface GatewayStatus {
  razorpay: boolean;
  phonepe: boolean;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function GuestBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex-1">
        <p className="font-semibold text-gray-800 text-sm mb-0.5">Have an account?</p>
        <p className="text-gray-600 text-sm">Sign in for faster checkout, order tracking, and saved addresses — or continue as a guest below.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button asChild size="sm" variant="outline" className="gap-2 border-gray-300 bg-white hover:bg-gray-50">
          <Link href="/sign-in?redirect_url=/checkout">
            <LogIn className="h-4 w-4" />
            Sign In
          </Link>
        </Button>
        <Button asChild size="sm" className="gap-2 bg-purple-700 hover:bg-purple-800 text-white">
          <Link href="/sign-up?redirect_url=/checkout">
            <UserPlus className="h-4 w-4" />
            Create Account
          </Link>
        </Button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-xs text-gray-500 underline underline-offset-2 hover:text-gray-700 sm:self-center px-1"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}

export default function Checkout() {
  const { sessionId } = useCartContext();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [utrError, setUtrError] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const { data: cart } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
  );

  const { data: upiSettings } = useQuery<UpiSettings>({
    queryKey: ["upi-settings"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/payments/upi/settings`);
      return res.json();
    },
  });

  const { data: gatewayStatus } = useQuery<GatewayStatus>({
    queryKey: ["gateway-status"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/payments/status`);
      return res.json();
    },
  });

  const createOrder = useCreateOrder();

  const cartTotal = Number(cart?.total ?? 0);
  const discountAmount = couponResult?.discount ?? 0;
  const finalTotal = Math.max(0, cartTotal - discountAmount);

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponError("Enter a coupon code first"); return; }
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch(`${BASE}/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, orderTotal: cartTotal }),
      });
      const data = await res.json() as { error?: string; discount?: number; type?: string; value?: number; code?: string };
      if (!res.ok) {
        setCouponError(data.error ?? "Invalid coupon");
        setCouponResult(null);
      } else {
        setCouponResult({ discount: data.discount!, type: data.type!, value: data.value!, code: data.code! });
        setCouponError("");
      }
    } catch {
      setCouponError("Could not validate coupon. Try again.");
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setCouponResult(null);
    setCouponInput("");
    setCouponError("");
  }

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "", customerEmail: "", customerPhone: "",
      shippingAddress: "", city: "", state: "", pincode: "", notes: "",
    },
  });

  const placeOrder = (data: z.infer<typeof checkoutSchema>, paymentId?: string, paymentRef?: string) => {
    const pm = paymentId ? "RAZORPAY" : effectiveMethod === "phonepe" ? "PHONEPE" : "UPI_QR";
    createOrder.mutate({
      data: {
        ...data,
        sessionId,
        paymentMethod: pm,
        ...(paymentId ? { paymentId } : {}),
        ...(paymentRef ? { paymentReference: paymentRef } : {}),
        ...(couponResult ? { couponCode: couponResult.code } : {}),
      },
    }, {
      onSuccess: (order) => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
        setLocation(`/order-confirmation?orderNumber=${order.orderNumber}`);
      },
      onError: () => {
        setError("Failed to create order. Please try again.");
        setProcessing(false);
      },
    });
  };

  const handleRazorpay = async (data: z.infer<typeof checkoutSchema>) => {
    setProcessing(true);
    setError("");

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError("Could not load payment gateway. Please check your connection.");
      setProcessing(false);
      return;
    }

    const keyRes = await fetch(`${BASE}/api/payments/razorpay/key`);
    if (!keyRes.ok) {
      setError("Razorpay is not configured yet. Please use UPI.");
      setProcessing(false);
      return;
    }
    const { key } = await keyRes.json() as { key: string };

    const orderRes = await fetch(`${BASE}/api/payments/razorpay/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: finalTotal }),
    });
    if (!orderRes.ok) {
      setError("Could not initiate payment. Please try again.");
      setProcessing(false);
      return;
    }
    const rzpOrder = await orderRes.json() as { id: string; amount: number };

    const rzp = new window.Razorpay({
      key,
      amount: rzpOrder.amount,
      currency: "INR",
      name: "Sriswa Studio",
      description: "Jewellery Order",
      order_id: rzpOrder.id,
      prefill: {
        name: data.customerName,
        email: data.customerEmail,
        contact: data.customerPhone,
      },
      theme: { color: "#9B0F5F" },
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const verifyRes = await fetch(`${BASE}/api/payments/razorpay/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response),
        });
        const { verified } = await verifyRes.json() as { verified: boolean };
        if (verified) {
          placeOrder(data, response.razorpay_payment_id);
        } else {
          setError("Payment verification failed. Contact support.");
          setProcessing(false);
        }
      },
      modal: { ondismiss: () => setProcessing(false) },
    });
    rzp.open();
  };

  const handlePhonePe = async (data: z.infer<typeof checkoutSchema>) => {
    setProcessing(true);
    setError("");

    const transactionId = `TXN_${Date.now()}`;
    const redirectUrl = `${window.location.origin}${BASE}/order-confirmation?phonepe=1&txnId=${transactionId}`;

    const res = await fetch(`${BASE}/api/payments/phonepe/initiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: finalTotal, transactionId, redirectUrl }),
    });

    if (!res.ok) {
      const err = await res.json() as { error?: string };
      setError(err.error ?? "PhonePe is not configured yet. Please use UPI.");
      setProcessing(false);
      return;
    }

    const { redirectUrl: phonePeUrl } = await res.json() as { redirectUrl?: string };
    if (phonePeUrl) {
      window.location.href = phonePeUrl;
    } else {
      setError("Could not get PhonePe payment link. Please try another method.");
      setProcessing(false);
    }
  };

  const handleUpiQr = (data: z.infer<typeof checkoutSchema>) => {
    if (!utrNumber.trim()) {
      setUtrError("Please enter the UTR / Transaction ID after payment.");
      return;
    }
    setUtrError("");
    setProcessing(true);
    placeOrder(data, undefined, utrNumber.trim());
  };

  const onSubmit = (data: z.infer<typeof checkoutSchema>) => {
    setError("");
    if (effectiveMethod === "razorpay") {
      handleRazorpay(data);
    } else if (effectiveMethod === "phonepe") {
      handlePhonePe(data);
    } else if (effectiveMethod === "upi_qr") {
      handleUpiQr(data);
    } else {
      setProcessing(true);
      placeOrder(data);
    }
  };

  function copyUpiId() {
    if (upiSettings?.upiId) {
      navigator.clipboard.writeText(upiSettings.upiId).then(() => {
        setCopiedUpi(true);
        setTimeout(() => setCopiedUpi(false), 2000);
      });
    }
  }

  if (!cart || cart.items.length === 0) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-[30px] py-24 text-center">
          <h1 className="text-3xl font-serif font-bold mb-4">Checkout</h1>
          <p className="text-muted-foreground mb-8">Your cart is empty.</p>
          <Button asChild><Link href="/shop">Back to Shop</Link></Button>
        </div>
      </StoreLayout>
    );
  }

  const upiEnabled = upiSettings?.enabled && upiSettings?.upiId;

  type PaymentOption = { id: PaymentMethod; label: string; sub: string; Icon: React.ElementType };
  const ALL_PAYMENT_OPTIONS: (PaymentOption & { show: boolean })[] = [
    { id: "upi_qr", label: "UPI / Scanner", sub: "Scan QR code & pay instantly", Icon: QrCode, show: !!upiEnabled },
    { id: "razorpay", label: "Razorpay", sub: "Cards, UPI, Net Banking, Wallets", Icon: CreditCard, show: !!gatewayStatus?.razorpay },
    { id: "phonepe", label: "PhonePe", sub: "UPI & PhonePe Wallet", Icon: Smartphone, show: !!gatewayStatus?.phonepe },
  ];
  const PAYMENT_OPTIONS: PaymentOption[] = ALL_PAYMENT_OPTIONS.filter((o) => o.show);

  const effectiveMethod = paymentMethod ?? PAYMENT_OPTIONS[0]?.id;

  return (
    <StoreLayout>
      <div className="container mx-auto px-[30px] py-12 max-w-6xl">
        <h1 className="text-3xl font-serif font-bold mb-8">Checkout</h1>

        {/* Sign in / Guest banner — only shown to signed-out users */}
        <SignedOut>
          <GuestBanner />
        </SignedOut>

        <div className="flex flex-col lg:flex-row gap-12 lg:items-start">
          {/* Left: Form */}
          <div className="flex-1 order-2 lg:order-1 space-y-6">
            <div className="bg-white border rounded-lg p-6 lg:p-8">
              <h2 className="text-xl font-serif font-bold mb-6 pb-4 border-b">Shipping Information</h2>

              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-center gap-2 mb-6">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField control={form.control} name="customerName" render={({ field }) => (
                      <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="customerPhone" render={({ field }) => (
                      <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+91 9876543210" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="customerEmail" render={({ field }) => (
                    <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="jane@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="shippingAddress" render={({ field }) => (
                    <FormItem><FormLabel>Street Address</FormLabel><FormControl><Textarea placeholder="123 Main St, Apt 4B" className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Mumbai" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="state" render={({ field }) => (
                      <FormItem><FormLabel>State</FormLabel><FormControl><Input placeholder="Maharashtra" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="pincode" render={({ field }) => (
                      <FormItem><FormLabel>PIN Code</FormLabel><FormControl><Input placeholder="400001" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem><FormLabel>Order Notes (Optional)</FormLabel><FormControl><Textarea placeholder="Special delivery instructions" className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />

                  {/* Payment Method Selection */}
                  <div className="pt-2">
                    <h3 className="font-serif font-bold text-lg mb-4">Payment Method</h3>
                    <div className="space-y-3">
                      {PAYMENT_OPTIONS.map(({ id, label, sub, Icon }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => { setPaymentMethod(id); setUtrError(""); }}
                          className="w-full flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all"
                          style={{
                            borderColor: effectiveMethod === id ? "#9B0F5F" : "#e5e7eb",
                            background: effectiveMethod === id ? "#fdf6f9" : "white",
                          }}
                        >
                          <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: effectiveMethod === id ? "#9B0F5F" : "#f3f4f6" }}>
                            <Icon className="h-5 w-5" style={{ color: effectiveMethod === id ? "white" : "#6b7280" }} />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-900">{label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                          </div>
                          <div className="h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                            style={{ borderColor: effectiveMethod === id ? "#9B0F5F" : "#d1d5db" }}>
                            {effectiveMethod === id && (
                              <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#9B0F5F" }} />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* UPI QR Panel — shown when UPI QR is selected */}
                  {effectiveMethod === "upi_qr" && upiSettings && (
                    <div className="rounded-xl border-2 p-5 space-y-4" style={{ borderColor: "#f0c4dc", background: "#fdf6f9" }}>
                      <p className="font-semibold text-sm" style={{ color: "#9B0F5F" }}>
                        Step 1 — Scan the QR code or copy the UPI ID below and pay ₹{finalTotal.toFixed(2)}
                      </p>

                      <div className="flex flex-col sm:flex-row gap-5 items-center">
                        {upiSettings.upiQrUrl ? (
                          <div className="border-4 rounded-xl overflow-hidden flex-shrink-0" style={{ borderColor: "#9B0F5F" }}>
                            <img
                              src={upiSettings.upiQrUrl}
                              alt="UPI QR Code"
                              className="h-44 w-44 object-contain bg-white"
                            />
                          </div>
                        ) : (
                          <div className="h-44 w-44 flex items-center justify-center rounded-xl border-2 border-dashed flex-shrink-0"
                            style={{ borderColor: "#f0c4dc" }}>
                            <QrCode className="h-16 w-16" style={{ color: "#f0c4dc" }} />
                          </div>
                        )}

                        <div className="flex-1 space-y-3 w-full">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">UPI ID</p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 text-sm font-mono font-bold px-3 py-2 rounded-lg bg-white border" style={{ color: "#9B0F5F" }}>
                                {upiSettings.upiId}
                              </code>
                              <button
                                type="button"
                                onClick={copyUpiId}
                                className="flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-colors"
                                style={{ background: copiedUpi ? "#d1fae5" : "#fff", border: "1px solid #e5e7eb", color: copiedUpi ? "#059669" : "#6b7280" }}
                              >
                                <Copy className="h-3.5 w-3.5" />
                                {copiedUpi ? "Copied!" : "Copy"}
                              </button>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg text-xs space-y-1" style={{ background: "#fff3cd", color: "#856404" }}>
                            <p className="font-semibold">Amount to pay: ₹{finalTotal.toFixed(2)}</p>
                            <p>Open any UPI app (GPay, PhonePe, Paytm…), scan or enter the UPI ID above, and complete the payment.</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-1">
                        <p className="font-semibold text-sm mb-2" style={{ color: "#9B0F5F" }}>
                          Step 2 — Enter the UTR / Transaction ID from your payment app
                        </p>
                        <Input
                          placeholder="e.g. 123456789012 (12-digit UTR)"
                          value={utrNumber}
                          onChange={(e) => { setUtrNumber(e.target.value); setUtrError(""); }}
                          className="font-mono"
                        />
                        {utrError && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 flex-shrink-0" /> {utrError}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Find the UTR in your UPI app under "Payment History" or in the SMS/notification you received.
                        </p>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-14 text-base font-bold tracking-wide"
                    disabled={processing || createOrder.isPending}
                    style={{ background: "#9B0F5F" }}
                  >
                    {processing || createOrder.isPending
                      ? "Processing…"
                      : effectiveMethod === "phonepe"
                        ? `Pay with PhonePe • ₹${finalTotal.toFixed(2)}`
                        : effectiveMethod === "upi_qr"
                          ? `Confirm UPI Payment • ₹${finalTotal.toFixed(2)}`
                          : `Pay with Razorpay • ₹${finalTotal.toFixed(2)}`
                    }
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="w-full lg:w-96 flex-shrink-0 order-1 lg:order-2">
            <div className="bg-white border rounded-lg p-6 sticky top-24">
              <h2 className="text-xl font-serif font-bold mb-5 pb-4 border-b">Order Summary</h2>

              <div className="space-y-4 mb-5 max-h-[40vh] overflow-y-auto pr-1">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="h-16 w-16 rounded overflow-hidden flex-shrink-0 border bg-gray-50">
                      {item.imageUrl && <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium line-clamp-2 text-gray-900">{item.productName}</p>
                      <p className="text-gray-400 text-xs mt-0.5">Qty: {item.quantity}</p>
                      <p className="font-bold mt-0.5" style={{ color: "#9B0F5F" }}>₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon input */}
              <div className="border-t pt-4 mb-4">
                {couponResult ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-green-700 font-mono">{couponResult.code}</p>
                        <p className="text-xs text-green-600">
                          {couponResult.type === "free-shipping"
                            ? "Free shipping applied"
                            : `-₹${couponResult.discount.toFixed(2)} discount`}
                        </p>
                      </div>
                    </div>
                    <button onClick={removeCoupon} className="text-green-500 hover:text-green-700 p-1">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" /> Have a coupon code?
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code"
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void applyCoupon(); } }}
                        className="font-mono text-sm h-9"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 px-3 text-sm flex-shrink-0"
                        disabled={couponLoading}
                        onClick={applyCoupon}
                      >
                        {couponLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 flex-shrink-0" /> {couponError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm border-t pt-4 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span><span className="font-medium text-gray-900">₹{cartTotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({couponResult?.code})</span>
                    <span className="font-medium">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span><span className="font-medium text-green-600">Free</span>
                </div>
              </div>

              <div className="flex justify-between font-serif font-bold text-xl border-t pt-4">
                <span>Total</span><span>₹{finalTotal.toFixed(2)}</span>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                Secure checkout — your data is protected
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
