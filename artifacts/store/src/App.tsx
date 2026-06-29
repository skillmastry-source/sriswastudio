import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { CartProvider } from "@/hooks/use-cart-context";
import { ClerkProvider, SignIn, SignUp } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";

// Pages
import Home from "@/pages/home";
import Shop from "@/pages/shop";
import ProductDetail from "@/pages/shop/product";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import OrderConfirmation from "@/pages/order-confirmation";
import TrackOrder from "@/pages/track-order";
import Account from "@/pages/account";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminProducts from "@/pages/admin/products";
import AdminProductForm from "@/pages/admin/products/form";
import AdminCategories from "@/pages/admin/categories";
import AdminOrders from "@/pages/admin/orders";
import AdminOrderDetail from "@/pages/admin/orders/detail";
import AdminInventory from "@/pages/admin/inventory";
import AdminSettings from "@/pages/admin/settings";
import AdminDesign from "@/pages/admin/design";
import AdminCMS from "@/pages/admin/cms";
import AdminCmsForm from "@/pages/admin/cms/form";
import { AdminLayout } from "@/components/layout/admin-layout";

// Storefront CMS pages
import BlogList from "@/pages/blog";
import BlogPost from "@/pages/blog/post";
import FAQ from "@/pages/faq";
import PolicyPage from "@/pages/policy";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function AdminRoute({ component: Component }: { component: any }) {
  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/shop" component={Shop} />
      <Route path="/shop/:slug" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-confirmation" component={OrderConfirmation} />
      <Route path="/track-order" component={TrackOrder} />
      <Route path="/account" component={Account} />

      {/* CMS / Content routes */}
      <Route path="/blog" component={BlogList} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/faq" component={FAQ} />
      <Route path="/pages/:slug" component={PolicyPage} />

      {/* Clerk auth routes */}
      <Route path="/sign-in/*?">
        {() => (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <SignIn routing="path" path={`${basePath}/sign-in`} />
          </div>
        )}
      </Route>
      <Route path="/sign-up/*?">
        {() => (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <SignUp routing="path" path={`${basePath}/sign-up`} />
          </div>
        )}
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        {() => <AdminRoute component={AdminDashboard} />}
      </Route>
      <Route path="/admin/products">
        {() => <AdminRoute component={AdminProducts} />}
      </Route>
      <Route path="/admin/products/:id/edit">
        {() => <AdminRoute component={AdminProductForm} />}
      </Route>
      <Route path="/admin/products/new">
        {() => <AdminRoute component={AdminProductForm} />}
      </Route>
      <Route path="/admin/categories">
        {() => <AdminRoute component={AdminCategories} />}
      </Route>
      <Route path="/admin/orders">
        {() => <AdminRoute component={AdminOrders} />}
      </Route>
      <Route path="/admin/orders/:id">
        {() => <AdminRoute component={AdminOrderDetail} />}
      </Route>
      <Route path="/admin/inventory">
        {() => <AdminRoute component={AdminInventory} />}
      </Route>
      <Route path="/admin/settings">
        {() => <AdminRoute component={AdminSettings} />}
      </Route>
      <Route path="/admin/design">
        {() => <AdminRoute component={AdminDesign} />}
      </Route>
      <Route path="/admin/cms">
        {() => <AdminRoute component={AdminCMS} />}
      </Route>
      <Route path="/admin/cms/new">
        {() => <AdminRoute component={AdminCmsForm} />}
      </Route>
      <Route path="/admin/cms/:id/edit">
        {() => <AdminRoute component={AdminCmsForm} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={{
        variables: {
          colorPrimary: "#9B0F5F",
          colorBackground: "#FAF7F4",
          colorForeground: "#2C1810",
          fontFamily: "'Lato', sans-serif",
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <CartProvider>
            <WouterRouter base={basePath}>
              <Router />
            </WouterRouter>
            <Toaster />
          </CartProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
