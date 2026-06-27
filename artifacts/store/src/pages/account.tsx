import { StoreLayout } from "@/components/layout/store-layout";
import { SignedIn, SignedOut, SignIn, SignUp, useUser, useClerk } from "@/lib/clerk-stub";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Package, User } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  price: number;
  imageUrl: string | null;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
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

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

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
                <Card key={order.id}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
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
                        <span className="font-bold text-[#9B0F5F]">₹{order.total}</span>
                      </div>
                    </div>
                    {order.items.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                            {item.imageUrl && (
                              <img src={item.imageUrl} alt={item.productName} className="h-8 w-8 rounded object-cover bg-muted" />
                            )}
                            <span>{item.productName} ×{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
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
      <div className="container mx-auto px-4 py-12 max-w-4xl">
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
