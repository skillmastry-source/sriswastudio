import { StoreLayout } from "@/components/layout/store-layout";
import { ClerkProvider, SignedIn, SignedOut, SignIn, SignUp } from "@/lib/clerk-stub";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Package, Settings, User } from "lucide-react";
import { useState } from "react";

export default function Account() {
  const [view, setView] = useState<"signin" | "signup">("signin");

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <SignedIn>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1 space-y-2">
              <h2 className="font-serif font-bold text-2xl mb-6">My Account</h2>
              <Button variant="ghost" className="w-full justify-start bg-muted">
                <User className="mr-2 h-4 w-4" /> Profile
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Package className="mr-2 h-4 w-4" /> Orders
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" /> Settings
              </Button>
              <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </div>
            
            <div className="md:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Details</CardTitle>
                  <CardDescription>Manage your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Name</div>
                      <div className="font-medium">Admin User</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
                      <div className="font-medium">admin@sriswa.com</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">You haven't placed any orders yet.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-serif">Welcome to Sriswa</CardTitle>
                <CardDescription>
                  {view === "signin" ? "Sign in to access your account" : "Create an account to track orders and save favorites"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {view === "signin" ? <SignIn /> : <SignUp />}
                
                <div className="mt-6 text-center text-sm">
                  {view === "signin" ? (
                    <p>
                      Don't have an account?{" "}
                      <button onClick={() => setView("signup")} className="text-primary hover:underline font-medium">
                        Sign up
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{" "}
                      <button onClick={() => setView("signin")} className="text-primary hover:underline font-medium">
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
