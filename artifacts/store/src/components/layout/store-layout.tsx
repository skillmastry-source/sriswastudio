import { Link, useLocation } from "wouter";
import { useCartContext } from "@/hooks/use-cart-context";
import { ShoppingBag, Menu, X, User, Instagram, Facebook } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location] = useLocation();
  const { itemCount } = useCartContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white shadow-sm">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
          <Link href="/" className="flex items-center">
            <img
              src="/brand/logo-color.png"
              alt="Sriswa Studio"
              className="h-16 w-auto max-w-[180px] object-contain"
            />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/shop" className={`transition-colors hover:text-primary ${location === '/shop' ? 'text-primary font-semibold' : 'text-foreground/80'}`}>Shop All</Link>
          <Link href="/shop?category=necklaces" className="transition-colors hover:text-primary text-foreground/80">Necklaces</Link>
          <Link href="/shop?category=rings" className="transition-colors hover:text-primary text-foreground/80">Rings</Link>
          <Link href="/shop?category=earrings" className="transition-colors hover:text-primary text-foreground/80">Earrings</Link>
          <Link href="/shop?category=bracelets" className="transition-colors hover:text-primary text-foreground/80">Bracelets</Link>
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
        <div className="md:hidden border-t p-4 bg-white">
          <nav className="flex flex-col gap-4 text-sm font-medium">
            <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>Shop All</Link>
            <Link href="/shop?category=necklaces" onClick={() => setMobileMenuOpen(false)}>Necklaces</Link>
            <Link href="/shop?category=rings" onClick={() => setMobileMenuOpen(false)}>Rings</Link>
            <Link href="/shop?category=earrings" onClick={() => setMobileMenuOpen(false)}>Earrings</Link>
            <Link href="/shop?category=bracelets" onClick={() => setMobileMenuOpen(false)}>Bracelets</Link>
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
        {/* Brand */}
        <div className="flex flex-col gap-4">
          <img src="/brand/logo-white.png" alt="Sriswa Studio" className="h-10 w-auto object-contain self-start" />
          <p className="text-primary-foreground/80 text-sm leading-relaxed">
            Timeless Beauty, Everyday Shine.<br />
            Premium anti-tarnish jewellery crafted for the modern woman.
          </p>
          {/* Social icons */}
          <div className="flex items-center gap-3 mt-2">
            <a
              href="https://instagram.com/sriswastudio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-9 w-9 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://facebook.com/sriswastudio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-9 w-9 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            {/* WhatsApp */}
            <a
              href="https://wa.me/919999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-9 w-9 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
              aria-label="WhatsApp"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Shop */}
        <div>
          <h4 className="font-serif font-bold text-lg mb-4">Shop</h4>
          <ul className="flex flex-col gap-2 text-sm text-primary-foreground/80">
            <li><Link href="/shop" className="hover:text-primary-foreground transition-colors">All Products</Link></li>
            <li><Link href="/shop?category=necklaces" className="hover:text-primary-foreground transition-colors">Necklaces</Link></li>
            <li><Link href="/shop?category=rings" className="hover:text-primary-foreground transition-colors">Rings</Link></li>
            <li><Link href="/shop?category=earrings" className="hover:text-primary-foreground transition-colors">Earrings</Link></li>
            <li><Link href="/shop?category=bracelets" className="hover:text-primary-foreground transition-colors">Bracelets</Link></li>
            <li><Link href="/shop?category=anklets" className="hover:text-primary-foreground transition-colors">Anklets</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-serif font-bold text-lg mb-4">Support</h4>
          <ul className="flex flex-col gap-2 text-sm text-primary-foreground/80">
            <li><Link href="/track-order" className="hover:text-primary-foreground transition-colors">Track Order</Link></li>
            <li><Link href="/account" className="hover:text-primary-foreground transition-colors">My Account</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-serif font-bold text-lg mb-4">Contact</h4>
          <ul className="flex flex-col gap-2 text-sm text-primary-foreground/80">
            <li>
              <a href="mailto:hello@sriswastudio.com" className="hover:text-primary-foreground transition-colors">
                hello@sriswastudio.com
              </a>
            </li>
            <li>
              <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" className="hover:text-primary-foreground transition-colors">
                WhatsApp Us
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-primary-foreground/20 text-center text-sm text-primary-foreground/60">
        &copy; {new Date().getFullYear()} Sriswa Studio. All rights reserved. | Anti-tarnish jewellery for the modern woman.
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
