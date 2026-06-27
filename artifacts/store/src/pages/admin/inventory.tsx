import { useListInventory, getListInventoryQueryKey, useUpdateProduct, getListProductsQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Check, X, RefreshCw } from "lucide-react";

interface EditState {
  productId: number;
  stockQuantity: number;
  lowStockThreshold: number;
}

type BulkEdits = Record<number, { stockQuantity: number; lowStockThreshold: number }>;

export default function AdminInventory() {
  const { data: inventory, isLoading } = useListInventory({
    query: { queryKey: getListInventoryQueryKey() },
  });
  const updateProduct = useUpdateProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<EditState | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkEdits, setBulkEdits] = useState<BulkEdits>({});
  const [bulkSaving, setBulkSaving] = useState(false);

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

  const enterBulkMode = () => {
    const initial: BulkEdits = {};
    inventory?.forEach((item) => {
      initial[item.productId] = { stockQuantity: item.stockQuantity, lowStockThreshold: item.lowStockThreshold };
    });
    setBulkEdits(initial);
    setBulkMode(true);
    setEditing(null);
  };

  const cancelBulkMode = () => {
    setBulkMode(false);
    setBulkEdits({});
  };

  const saveBulkEdits = async () => {
    if (!inventory) return;
    setBulkSaving(true);
    try {
      await Promise.all(
        inventory.map((item) => {
          const edit = bulkEdits[item.productId];
          if (!edit) return Promise.resolve();
          const changed = edit.stockQuantity !== item.stockQuantity || edit.lowStockThreshold !== item.lowStockThreshold;
          if (!changed) return Promise.resolve();
          return new Promise<void>((resolve, reject) => {
            updateProduct.mutate(
              { id: item.productId, data: { stockQuantity: edit.stockQuantity, lowStockThreshold: edit.lowStockThreshold } },
              { onSuccess: () => resolve(), onError: reject }
            );
          });
        })
      );
      queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      setBulkMode(false);
      setBulkEdits({});
      toast({ title: "Bulk inventory update saved" });
    } catch {
      toast({ title: "Some updates failed", variant: "destructive" });
    } finally {
      setBulkSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold">Inventory</h1>
        {!bulkMode ? (
          <Button variant="outline" size="sm" onClick={enterBulkMode} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" /> Bulk Edit Stock
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={cancelBulkMode} disabled={bulkSaving}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" className="bg-[#9B0F5F] hover:bg-[#7d0c4c]" onClick={saveBulkEdits} disabled={bulkSaving}>
              <Check className="h-4 w-4 mr-1" />
              {bulkSaving ? "Saving…" : "Save All Changes"}
            </Button>
          </div>
        )}
      </div>

      {bulkMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-3 text-sm text-blue-800">
          Edit stock quantities and thresholds inline, then click <strong>Save All Changes</strong> to apply in bulk.
        </div>
      )}

      <div className="bg-card border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Stock Qty</TableHead>
              <TableHead>Low-Stock Threshold</TableHead>
              <TableHead>Status</TableHead>
              {!bulkMode && <TableHead className="w-24">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">Loading…</TableCell>
              </TableRow>
            ) : inventory?.map((item) => {
              const isEditingThis = !bulkMode && editing?.productId === item.productId;
              const bulkEdit = bulkEdits[item.productId];
              const displayQty = bulkMode ? (bulkEdit?.stockQuantity ?? item.stockQuantity) : item.stockQuantity;
              const displayThreshold = bulkMode ? (bulkEdit?.lowStockThreshold ?? item.lowStockThreshold) : item.lowStockThreshold;
              const isLowStock = bulkMode
                ? displayQty <= displayThreshold
                : item.isLowStock;
              return (
                <TableRow key={item.productId} className={isLowStock ? "bg-destructive/5" : ""}>
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
                    ) : bulkMode ? (
                      <Input
                        type="number"
                        min={0}
                        value={displayQty}
                        onChange={(e) =>
                          setBulkEdits((prev) => ({
                            ...prev,
                            [item.productId]: { ...prev[item.productId]!, stockQuantity: Number(e.target.value) },
                          }))
                        }
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
                    ) : bulkMode ? (
                      <Input
                        type="number"
                        min={0}
                        value={displayThreshold}
                        onChange={(e) =>
                          setBulkEdits((prev) => ({
                            ...prev,
                            [item.productId]: { ...prev[item.productId]!, lowStockThreshold: Number(e.target.value) },
                          }))
                        }
                        className="w-24 h-8 text-sm"
                      />
                    ) : item.lowStockThreshold}
                  </TableCell>
                  <TableCell>
                    {isLowStock ? (
                      <span className="text-destructive font-medium text-sm">Low Stock</span>
                    ) : (
                      <span className="text-green-600 text-sm">In Stock</span>
                    )}
                  </TableCell>
                  {!bulkMode && (
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
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
