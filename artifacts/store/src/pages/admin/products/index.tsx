import { useDeleteProduct, useListCategories } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";

interface AdminProduct {
  id: number; name: string; slug: string; price: number; compareAtPrice: number | null;
  categoryName: string | null; isActive: boolean; isFeatured: boolean;
  stockQuantity: number; lowStockThreshold: number;
  images: { url: string; isPrimary: boolean }[];
}

const PAGE_SIZES = [20, 50, 100];

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState("all");
  const [stock, setStock] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const { data: categoriesData } = useListCategories();
  const categories = categoriesData ?? [];

  const offset = (page - 1) * pageSize;

  const { data: productData, isLoading, isError } = useQuery({
    queryKey: ["admin-products", search, categoryId, status, stock, page, pageSize],
    queryFn: async () => {
      const token = await getToken();
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(offset),
      });
      if (search) params.set("search", search);
      if (categoryId !== "all") params.set("categoryId", categoryId);
      if (status !== "all") params.set("status", status);
      if (stock !== "all") params.set("stock", stock);
      const res = await fetch(`/api/admin/products?${params}`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json() as Promise<{ products: AdminProduct[]; total: number }>;
    },
    retry: 1,
  });

  const deleteProduct = useDeleteProduct();

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProduct.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["admin-products"] });
        },
      });
    }
  };

  const resetFilters = useCallback(() => {
    setSearch("");
    setCategoryId("all");
    setStatus("all");
    setStock("all");
    setPage(1);
  }, []);

  const handleFilterChange = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const total = productData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + pageSize, total);

  const hasActiveFilters =
    search !== "" || categoryId !== "all" || status !== "all" || stock !== "all";

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
        {/* Filter bar */}
        <div className="p-4 border-b space-y-3">
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8"
                value={search}
                onChange={(e) => handleFilterChange(() => setSearch(e.target.value))}
              />
            </div>

            {/* Category filter */}
            <Select
              value={categoryId}
              onValueChange={(v) => handleFilterChange(() => setCategoryId(v))}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat: { id: number; name: string }) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select
              value={status}
              onValueChange={(v) => handleFilterChange(() => setStatus(v))}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            {/* Stock filter */}
            <Select
              value={stock}
              onValueChange={(v) => handleFilterChange(() => setStock(v))}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={resetFilters} className="text-muted-foreground">
                Clear Filters
              </Button>
            )}
          </div>

          {/* Results summary */}
          {!isLoading && (
            <p className="text-sm text-muted-foreground">
              {total === 0
                ? "No products found"
                : `Showing ${from}–${to} of ${total} product${total !== 1 ? "s" : ""}`}
            </p>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Image</TableHead>
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
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-destructive">
                  Failed to load products — please refresh the page.
                </TableCell>
              </TableRow>
            ) : productData?.products?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  {hasActiveFilters ? "No products match your filters." : "No products yet."}
                </TableCell>
              </TableRow>
            ) : (
              productData?.products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="h-12 w-12 rounded bg-muted overflow-hidden">
                      {product.images?.[0] && (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {product.name}
                    {product.isFeatured && (
                      <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                        Featured
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{product.categoryName || "—"}</TableCell>
                  <TableCell>
                    <span className="font-medium">₹{product.price}</span>
                    {product.compareAtPrice && (
                      <span className="ml-2 text-xs text-muted-foreground line-through">
                        ₹{product.compareAtPrice}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "Active" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        product.stockQuantity === 0
                          ? "text-destructive font-semibold"
                          : product.stockQuantity <= (product.lowStockThreshold || 5)
                          ? "text-amber-600 font-medium"
                          : ""
                      }
                    >
                      {product.stockQuantity === 0 ? "Out of stock" : product.stockQuantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(product.id)}
                      disabled={deleteProduct.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((s) => (
                    <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page number buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground text-sm">…</span>
                  ) : (
                    <Button
                      key={p}
                      variant={page === p ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8 text-sm"
                      onClick={() => setPage(p as number)}
                    >
                      {p}
                    </Button>
                  )
                )}

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
