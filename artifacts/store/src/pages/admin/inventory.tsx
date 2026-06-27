import { useListInventory, getListInventoryQueryKey, useUpdateProduct, getListProductsQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Check, X } from "lucide-react";

interface EditState {
  productId: number;
  stockQuantity: number;
  lowStockThreshold: number;
}

export default function AdminInventory() {
  const { data: inventory, isLoading } = useListInventory({
    query: { queryKey: getListInventoryQueryKey() },
  });
  const updateProduct = useUpdateProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<EditState | null>(null);

  const startEdit = (item: { productId: number; stockQuantity: number; lowStockThreshold: number }) => {
    setEditing({ productId: item.productId, stockQuantity: item.stockQuantity, lowStockThreshold: item.lowStockThreshold });
  };

  const cancelEdit = () => setEditing(null);

  const saveEdit = () => {
    if (!editing) return;
    updateProduct.mutate(
      { id: editing.productId, data: { stockQuantity: editing.stockQuantity, lowStockThreshold: editing.lowStockThreshold } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          setEditing(null);
          toast({ title: "Inventory updated" });
        },
        onError: () => toast({ title: "Error updating inventory", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif font-bold">Inventory</h1>

      <div className="bg-card border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Stock Qty</TableHead>
              <TableHead>Low-Stock Threshold</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">Loading…</TableCell>
              </TableRow>
            ) : inventory?.map((item) => {
              const isEditingThis = editing?.productId === item.productId;
              return (
                <TableRow key={item.productId} className={item.isLowStock ? "bg-destructive/5" : ""}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell>
                    {isEditingThis ? (
                      <Input
                        type="number"
                        min={0}
                        value={editing.stockQuantity}
                        onChange={(e) => setEditing((prev) => prev ? { ...prev, stockQuantity: Number(e.target.value) } : prev)}
                        className="w-24 h-8 text-sm"
                      />
                    ) : item.stockQuantity}
                  </TableCell>
                  <TableCell>
                    {isEditingThis ? (
                      <Input
                        type="number"
                        min={0}
                        value={editing.lowStockThreshold}
                        onChange={(e) => setEditing((prev) => prev ? { ...prev, lowStockThreshold: Number(e.target.value) } : prev)}
                        className="w-24 h-8 text-sm"
                      />
                    ) : item.lowStockThreshold}
                  </TableCell>
                  <TableCell>
                    {item.isLowStock ? (
                      <span className="text-destructive font-medium text-sm">Low Stock</span>
                    ) : (
                      <span className="text-green-600 text-sm">In Stock</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditingThis ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={saveEdit} disabled={updateProduct.isPending}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEdit}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
