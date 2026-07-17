import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { CartProvider } from "@/hooks/use-cart-context";
import { ClerkProvider, SignIn, SignUp, useAuth } from "@clerk/react";
import { useEffect, lazy, Suspense } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { ErrorBoundary } from "@/components/error-boundary";

// Critical pages — loaded immediately (needed on first visit)
import Home from "@/pages/home";
import Shop from "@/pages/shop";
import ProductDetail from "@/pages/shop/product";

// Non-critical store pages — lazy loaded
const Cart = lazy(() => import("@/pages/cart"));
const Checkout = lazy(() => import("@/pages/checkout"));
const OrderConfirmation = lazy(() => import("@/pages/order-confirmation"));
const TrackOrder = lazy(() => import("@/pages/track-order"));
const Account = lazy(() => import("@/pages/account"));
const BlogList = lazy(() => import("@/pages/blog"));
const BlogPost = lazy(() => import("@/pages/blog/post"));
const FAQ = lazy(() => import("@/pages/faq"));
const PolicyPage = lazy(() => import("@/pages/policy"));
const LandingPage = lazy(() => import("@/pages/landing-page"));

// Admin pages — all lazy loaded (never needed by regular customers)
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/products"));
const AdminProductForm = lazy(() => import("@/pages/admin/products/form"));
const AdminCategories = lazy(() => import("@/pages/admin/categories"));
const AdminOrders = lazy(() => import("@/pages/admin/orders"));
const AdminOrderDetail = lazy(() => import("@/pages/admin/orders/detail"));
const AdminInventory = lazy(() => import("@/pages/admin/inventory"));
const AdminSettings = lazy(() => import("@/pages/admin/settings"));
const AdminDesign = lazy(() => import("@/pages/admin/design"));
const AdminCMS = lazy(() => import("@/pages/admin/cms"));
const AdminCmsForm = lazy(() => import("@/pages/admin/cms/form"));
const AdminCustomers = lazy(() => import("@/pages/admin/customers"));
const AdminCustomerDetail = lazy(() => import("@/pages/admin/customers/detail"));
const AdminCoupons = lazy(() => import("@/pages/admin/marketing/coupons"));
const AdminMedia = lazy(() => import("@/pages/admin/media"));
const AdminBuilder = lazy(() => import("@/pages/admin/builder"));
const AdminAnalytics = lazy(() => import("@/pages/admin/analytics"));
const AdminAnnouncements = lazy(() => import("@/pages/admin/marketing/announcements"));
const AdminBroadcasts = lazy(() => import("@/pages/admin/marketing/broadcasts"));
const AdminFlashSale = lazy(() => import("@/pages/admin/marketing/flash-sale"));
const AdminReferrals = lazy(() => import("@/pages/admin/marketing/referrals"));
const AdminEmailSettings = lazy(() => import("@/pages/admin/marketing/email-settings"));
const AdminInstagram = lazy(() => import("@/pages/admin/marketing/instagram"));
import { AdminLayout } from "@/components/layout/admin-layout";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function AuthTokenSync() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => { setAuthTokenGetter(null); };
  }, [getToken]);
  return null;
}

function FaviconUpdater() {
  const settings = useSiteSettings();
  const faviconUrl = settings.brand?.faviconUrl;
  useEffect(() => {
    if (!faviconUrl) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  }, [faviconUrl]);
  return null;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-[#9B0F5F] border-t-transparent animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
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
        <Route path="/p/:slug" component={LandingPage} />

        {/* Clerk auth routes */}
        <Route path="/sign-in/*?">
          {() => {
            const params = new URLSearchParams(window.location.search);
            const redirectUrl = params.get("redirect_url") ?? "/";
            return (
              <div className="min-h-screen flex items-center justify-center bg-background">
                <SignIn routing="path" path={`${basePath}/sign-in`} fallbackRedirectUrl={redirectUrl} />
              </div>
            );
          }}
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
        <Route path="/admin/customers">
          {() => <AdminRoute component={AdminCustomers} />}
        </Route>
        <Route path="/admin/customers/:email">
          {() => <AdminRoute component={AdminCustomerDetail} />}
        </Route>
        <Route path="/admin/marketing/coupons">
          {() => <AdminRoute component={AdminCoupons} />}
        </Route>
        <Route path="/admin/analytics">
          {() => <AdminRoute component={AdminAnalytics} />}
        </Route>
        <Route path="/admin/marketing/announcements">
          {() => <AdminRoute component={AdminAnnouncements} />}
        </Route>
        <Route path="/admin/marketing/broadcasts">
          {() => <AdminRoute component={AdminBroadcasts} />}
        </Route>
        <Route path="/admin/marketing/flash-sale">
          {() => <AdminRoute component={AdminFlashSale} />}
        </Route>
        <Route path="/admin/marketing/referrals">
          {() => <AdminRoute component={AdminReferrals} />}
        </Route>
        <Route path="/admin/marketing/email-settings">
          {() => <AdminRoute component={AdminEmailSettings} />}
        </Route>
        <Route path="/admin/marketing/instagram">
          {() => <AdminRoute component={AdminInstagram} />}
        </Route>

        <Route path="/admin/media">
          {() => <AdminRoute component={AdminMedia} />}
        </Route>

        <Route path="/admin/builder">
          {() => <AdminRoute component={AdminBuilder} />}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      localization={{
        signIn: {
          start: {
            title: "Sign in to Sriswa Studio",
            subtitle: "Welcome back! Please sign in to continue",
          },
        },
        signUp: {
          start: {
            title: "Create your Sriswa Studio account",
            subtitle: "Sign up to get started",
          },
        },
      }}
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
        <AuthTokenSync />
        <FaviconUpdater />
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
    </ErrorBoundary>
  );
}

export default App;
