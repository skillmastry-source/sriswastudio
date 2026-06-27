import { useListInventory, getListInventoryQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminInventory() {
  const { data: inventory, isLoading } = useListInventory({}, {
    query: { queryKey: getListInventoryQueryKey() }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif font-bold">Inventory</h1>
      
      <div className="bg-card border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product ID</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Stock Quantity</TableHead>
              <TableHead>Threshold</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-4">Loading...</TableCell></TableRow>
            ) : inventory?.map((item) => (
              <TableRow key={item.productId} className={item.isLowStock ? "bg-destructive/5" : ""}>
                <TableCell>{item.productId}</TableCell>
                <TableCell className="font-medium">{item.productName}</TableCell>
                <TableCell>{item.stockQuantity}</TableCell>
                <TableCell>{item.lowStockThreshold}</TableCell>
                <TableCell>
                  {item.isLowStock ? (
                    <span className="text-destructive font-medium">Low Stock</span>
                  ) : (
                    <span className="text-green-600">In Stock</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
