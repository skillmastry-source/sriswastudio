import { useLocation } from "wouter";
import { StoreLayout } from "@/components/layout/store-layout";
import { useListProducts, getListProductsQueryKey, useListCategories, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Shop() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const categoryParam = searchParams.get('category');
  
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<any>("newest");
  
  const { data: categories } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() }
  });
  
  const categoryId = useMemo(() => {
    if (!categoryParam || !categories) return null;
    const cat = categories.find(c => c.slug === categoryParam);
    return cat ? cat.id : null;
  }, [categoryParam, categories]);

  const { data: productData, isLoading } = useListProducts(
    { 
      categoryId: categoryId,
      search: search || null,
      sortBy: sortBy,
      limit: 50
    },
    { query: { queryKey: getListProductsQueryKey({ categoryId, search, sortBy, limit: 50 }) } }
  );

  return (
    <StoreLayout>
      <div className="bg-muted py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">Our Collection</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover timeless beauty with our anti-tarnish, waterproof, and skin-friendly jewellery.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-8">
              <div>
                <h3 className="font-serif font-bold text-lg mb-4 border-b pb-2">Search</h3>
                <Input 
                  placeholder="Search products..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-card"
                />
              </div>
              
              <div>
                <h3 className="font-serif font-bold text-lg mb-4 border-b pb-2">Categories</h3>
                <ul className="space-y-2">
                  <li>
                    <Link 
                      href="/shop"
                      className={`block py-1 hover:text-primary transition-colors ${!categoryParam ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                    >
                      All Jewellery
                    </Link>
                  </li>
                  {categories?.map((cat) => (
                    <li key={cat.id}>
                      <Link 
                        href={`/shop?category=${cat.slug}`}
                        className={`block py-1 hover:text-primary transition-colors ${categoryParam === cat.slug ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
          
          {/* Main Content */}
          <main className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
              <p className="text-muted-foreground">
                Showing {productData?.products?.length || 0} products
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] bg-card">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest Arrivals</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-5 w-1/3" />
                  </div>
                ))}
              </div>
            ) : productData?.products?.length === 0 ? (
              <div className="text-center py-24 bg-card rounded-lg border">
                <p className="text-xl text-muted-foreground mb-4">No products found matching your criteria.</p>
                <Link href="/shop" className="text-primary hover:underline font-medium">Clear all filters</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {productData?.products?.map((product) => (
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
                      {!product.isActive && (
                        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">Draft</div>
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
            )}
          </main>
        </div>
      </div>
    </StoreLayout>
  );
}
