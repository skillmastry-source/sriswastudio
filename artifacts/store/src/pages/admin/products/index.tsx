import { useDeleteProduct } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useQueryClient, useQuery } from "@tanstack/react-query";

interface AdminProduct {
  id: number; name: string; slug: string; price: number; compareAtPrice: number | null;
  categoryName: string | null; isActive: boolean; isFeatured: boolean;
  stockQuantity: number; lowStockThreshold: number;
  images: { url: string; isPrimary: boolean }[];
}

async function fetchAdminProducts(search: string): Promise<{ products: AdminProduct[]; total: number }> {
  const params = new URLSearchParams({ limit: "100" });
  if (search) params.set("search", search);
  const res = await fetch(`/api/admin/products?${params}`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: productData, isLoading } = useQuery({
    queryKey: ["admin-products", search],
    queryFn: () => fetchAdminProducts(search),
  });

  const deleteProduct = useDeleteProduct();

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProduct.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["admin-products"] });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-serif font-bold text-foreground">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Link>
        </Button>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Loading products...</TableCell>
              </TableRow>
            ) : productData?.products?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No products found</TableCell>
              </TableRow>
            ) : (
              productData?.products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="h-12 w-12 rounded bg-muted overflow-hidden">
                      {product.images?.[0] && (
                        <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.categoryName || '-'}</TableCell>
                  <TableCell>₹{product.price}</TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "Active" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={product.stockQuantity <= (product.lowStockThreshold || 5) ? "text-destructive font-medium" : ""}>
                      {product.stockQuantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(product.id)} disabled={deleteProduct.isPending}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
