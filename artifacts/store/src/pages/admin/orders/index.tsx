import { useListOrders, getListOrdersQueryKey, ListOrdersStatus } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const STATUS_OPTIONS = Object.values(ListOrdersStatus).filter(Boolean) as string[];

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const params = {
    status: (statusFilter as ListOrdersStatus) || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    limit: 100,
  };

  const { data: orderData, isLoading, isError } = useListOrders(params, {
    query: { queryKey: getListOrdersQueryKey(params) }
  });

  const clearFilters = () => {
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const hasFilters = statusFilter || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif font-bold">Orders</h1>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-4 flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 h-9">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">From Date</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 w-44"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">To Date</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 w-44"
          />
        </div>
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters} className="self-end">
            Clear Filters
          </Button>
        )}
        <div className="self-end ml-auto text-sm text-muted-foreground">
          {orderData ? `${orderData.orders?.length ?? 0} orders` : ""}
        </div>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-4">Loading...</TableCell></TableRow>
            ) : isError ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-destructive">Failed to load orders. Please refresh the page.</TableCell></TableRow>
            ) : orderData?.orders?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No orders match the current filters.</TableCell></TableRow>
            ) : orderData?.orders?.map((order) => {
              const o = order as typeof order & { paymentMethod?: string; paymentReference?: string };
              const isUpi = o.paymentMethod?.toUpperCase() === "UPI_QR";
              return (
              <TableRow key={order.id}>
                <TableCell>
                  <Link href={`/admin/orders/${order.id}`} className="font-medium text-primary hover:underline">
                    {order.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {o.paymentMethod ?? "COD"}
                    </span>
                    {isUpi && o.paymentReference && (
                      <p className="text-[10px] font-mono text-orange-600 font-semibold">
                        UTR: {o.paymentReference}
                      </p>
                    )}
                    {isUpi && !o.paymentReference && (
                      <p className="text-[10px] text-red-500 font-medium">No UTR</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColor[order.status] ?? "bg-gray-100 text-gray-800"}`}>
                    {order.status}
                  </span>
                </TableCell>
                <TableCell>₹{order.total}</TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
