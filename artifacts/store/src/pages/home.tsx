import { Link } from "wouter";
import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import { useGetFeaturedProducts, getGetFeaturedProductsQueryKey } from "@workspace/api-client-react";
import { Droplets, ShieldCheck, Sparkles } from "lucide-react";

export default function Home() {
  const { data: featuredProducts } = useGetFeaturedProducts(
    { limit: 4 },
    { query: { queryKey: getGetFeaturedProductsQueryKey({ limit: 4 }) } }
  );

  return (
    <StoreLayout>
      {/* Hero Section */}
      <section className="relative w-full h-[80vh] bg-muted overflow-hidden flex items-center justify-center">
        <img 
          src="/brand/hero-banner.png" 
          alt="Sriswa Studio Jewellery" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6">Timeless Beauty,<br />Everyday Shine.</h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Discover our collection of premium, anti-tarnish jewellery designed for the modern woman.
          </p>
          <Button size="lg" asChild className="text-lg px-8 bg-primary hover:bg-primary/90 text-primary-foreground border-0">
            <Link href="/shop">Shop the Collection</Link>
          </Button>
        </div>
      </section>

      {/* USP Strip */}
      <section className="bg-card py-12 border-y">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h3 className="font-serif font-bold text-xl">Anti-Tarnish</h3>
            <p className="text-muted-foreground text-sm">Wear it every day without worrying about it losing its shine.</p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Droplets className="h-8 w-8" />
            </div>
            <h3 className="font-serif font-bold text-xl">Waterproof</h3>
            <p className="text-muted-foreground text-sm">Safe for the shower, the pool, and everywhere in between.</p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="font-serif font-bold text-xl">Skin Friendly</h3>
            <p className="text-muted-foreground text-sm">Hypoallergenic materials that won't irritate your skin.</p>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold mb-4">Featured Pieces</h2>
            <p className="text-muted-foreground">Handpicked favorites for your everyday look.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts?.map((product) => (
              <Link key={product.id} href={`/shop/${product.slug}`} className="group block">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-4 relative">
                  {product.images?.[0] ? (
                    <img 
                      src={product.images[0].url} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">No image</div>
                  )}
                </div>
                <h3 className="font-serif font-bold text-lg mb-1">{product.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="font-medium">₹{product.price}</span>
                  {product.compareAtPrice && (
                    <span className="text-muted-foreground line-through text-sm">₹{product.compareAtPrice}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild>
              <Link href="/shop">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}
