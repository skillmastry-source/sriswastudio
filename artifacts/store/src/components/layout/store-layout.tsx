import { Link, useLocation } from "wouter";
import { useCartContext } from "@/hooks/use-cart-context";
import { ShoppingBag, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location] = useLocation();
  const { itemCount } = useCartContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
          <Link href="/" className="flex items-center gap-2">
            <img src="/brand/logo-color.png" alt="Sriswa Studio" className="h-8 object-contain" />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/shop" className={`transition-colors hover:text-primary ${location === '/shop' ? 'text-primary' : 'text-foreground/80'}`}>Shop All</Link>
          <Link href="/shop?category=necklaces" className="transition-colors hover:text-primary text-foreground/80">Necklaces</Link>
          <Link href="/shop?category=rings" className="transition-colors hover:text-primary text-foreground/80">Rings</Link>
          <Link href="/shop?category=earrings" className="transition-colors hover:text-primary text-foreground/80">Earrings</Link>
          <Link href="/track-order" className="transition-colors hover:text-primary text-foreground/80">Track Order</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/account">
              <User className="h-5 w-5" />
              <span className="sr-only">Account</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/cart">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                  {itemCount}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </Link>
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t p-4 bg-background">
          <nav className="flex flex-col gap-4 text-sm font-medium">
            <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>Shop All</Link>
            <Link href="/shop?category=necklaces" onClick={() => setMobileMenuOpen(false)}>Necklaces</Link>
            <Link href="/shop?category=rings" onClick={() => setMobileMenuOpen(false)}>Rings</Link>
            <Link href="/shop?category=earrings" onClick={() => setMobileMenuOpen(false)}>Earrings</Link>
            <Link href="/track-order" onClick={() => setMobileMenuOpen(false)}>Track Order</Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-12 mt-20">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="flex flex-col gap-4">
          <img src="/brand/logo-white.png" alt="Sriswa Studio" className="h-8 object-contain self-start" />
          <p className="text-primary-foreground/80 text-sm">
            Timeless Beauty, Everyday Shine.
            <br />Premium anti-tarnish jewellery.
          </p>
        </div>
        <div>
          <h4 className="font-serif font-bold text-lg mb-4">Shop</h4>
          <ul className="flex flex-col gap-2 text-sm text-primary-foreground/80">
            <li><Link href="/shop">All Products</Link></li>
            <li><Link href="/shop?category=necklaces">Necklaces</Link></li>
            <li><Link href="/shop?category=rings">Rings</Link></li>
            <li><Link href="/shop?category=earrings">Earrings</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-serif font-bold text-lg mb-4">Support</h4>
          <ul className="flex flex-col gap-2 text-sm text-primary-foreground/80">
            <li><Link href="/track-order">Track Order</Link></li>
            <li><Link href="/account">My Account</Link></li>
            <li><Link href="/contact">Contact Us</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-serif font-bold text-lg mb-4">Admin</h4>
          <ul className="flex flex-col gap-2 text-sm text-primary-foreground/80">
            <li><Link href="/admin">Dashboard</Link></li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-primary-foreground/20 text-center text-sm text-primary-foreground/60">
        &copy; {new Date().getFullYear()} Sriswa Studio. All rights reserved.
      </div>
    </footer>
  );
}

export function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
