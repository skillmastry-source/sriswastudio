import { useGetAdminDashboard, getGetAdminDashboardQueryKey } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, IndianRupee, AlertTriangle, Users, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const BRAND = "#9B0F5F";
const GOLD  = "#D4AF37";

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped:    "bg-purple-100 text-purple-800",
  delivered:  "bg-green-100 text-green-800",
  cancelled:  "bg-red-100 text-red-800",
  returned:   "bg-orange-100 text-orange-800",
};

const PIE_COLORS: Record<string, string> = {
  pending: "#f59e0b", processing: "#3b82f6", shipped: "#8b5cf6",
  delivered: "#10b981", cancelled: "#ef4444", returned: "#f97316",
};

type Period = "daily" | "weekly" | "monthly";
type TopView = "revenue" | "units";

async function fetchAnalytics(path: string) {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export default function AdminDashboard() {
  const [period, setPeriod]   = useState<Period>("monthly");
  const [topView, setTopView] = useState<TopView>("revenue");

  const { data: dashboard, isLoading: dashLoading } = useGetAdminDashboard({
    query: { queryKey: getGetAdminDashboardQueryKey() }
  });

  const { data: revenue, isLoading: revLoading } = useQuery({
    queryKey: ["/api/admin/analytics/revenue", period],
    queryFn: () => fetchAnalytics(`/api/admin/analytics/revenue?period=${period}`),
  });

  const { data: topProducts } = useQuery({
    queryKey: ["/api/admin/analytics/top-products", topView],
    queryFn: () => fetchAnalytics(`/api/admin/analytics/top-products?sortBy=${topView}`),
  });

  const { data: overview } = useQuery({
    queryKey: ["/api/admin/analytics/overview"],
    queryFn: () => fetchAnalytics("/api/admin/analytics/overview"),
  });

  if (dashLoading || revLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND }} />
      </div>
    );
  }

  const revenueData: { date: string; revenue: number; orders: number }[] = revenue ?? [];
  const pieData = (dashboard?.ordersByStatus ?? []).map((s: any) => ({
    name: s.status, value: s.count,
  }));
  const avgOrderValue  = overview?.avgOrderValue  ?? 0;
  const newCustomers   = overview?.totalCustomers ?? 0;

  const displayProducts: any[] = topProducts ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold">Dashboard</h1>
        <span className="text-xs text-muted-foreground">Live data · refreshes on load</span>
      </div>

      {/* ── 4 Required Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<IndianRupee className="h-4 w-4" />}
          label="Total Revenue"
          value={`₹${Number(dashboard?.totalRevenue ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          sub="all time"
        />
        <StatCard
          icon={<ShoppingCart className="h-4 w-4" />}
          label="Orders Today"
          value={String(dashboard?.todayOrders ?? 0)}
          sub={`₹${Number(dashboard?.todayRevenue ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })} today`}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="New Customers"
          value={String(newCustomers)}
          sub="unique buyers"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Avg Order Value"
          value={`₹${Number(avgOrderValue).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          sub="per order"
        />
      </div>

      {/* Low Stock alert strip (below cards so it doesn't displace required KPIs) */}
      {Number(dashboard?.lowStockCount) > 0 && (
        <Link href="/admin/inventory">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{dashboard?.lowStockCount} product{Number(dashboard?.lowStockCount) !== 1 ? "s" : ""} running low on stock — view inventory</span>
          </div>
        </Link>
      )}

      {/* ── Revenue Chart ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Revenue Over Time</CardTitle>
          <div className="flex gap-1 text-xs">
            {(["daily", "weekly", "monthly"] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-2.5 py-1 rounded-md font-medium capitalize transition-colors"
                style={period === p
                  ? { background: BRAND, color: "white" }
                  : { background: "#f3f4f6", color: "#6b7280" }
                }
              >
                {p}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {revenueData.length === 0 ? (
            <EmptyChart message="Revenue data will appear here as orders come in." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={revenueData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} width={60} />
                <Tooltip
                  formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                />
                <Line type="monotone" dataKey="revenue" stroke={BRAND} strokeWidth={2.5} dot={{ fill: BRAND, r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Middle Row: Pie + Top Products ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <EmptyChart message="Order status breakdown will appear here." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {pieData.map((entry: any) => (
                      <Cell key={entry.name} fill={PIE_COLORS[entry.name] ?? "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any, name: any) => [v, name]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Products — toggle by revenue / by units */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Top 5 Products</CardTitle>
            <div className="flex gap-1 text-xs">
              {(["revenue", "units"] as TopView[]).map(v => (
                <button
                  key={v}
                  onClick={() => setTopView(v)}
                  className="px-2.5 py-1 rounded-md font-medium transition-colors"
                  style={topView === v
                    ? { background: BRAND, color: "white" }
                    : { background: "#f3f4f6", color: "#6b7280" }
                  }
                >
                  {v === "revenue" ? "By Revenue" : "By Units"}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {!displayProducts?.length ? (
              <EmptyChart message="Top products will appear after orders are placed." />
            ) : (
              <div className="space-y-3">
                {displayProducts.map((p: any, i: number) => (
                  <div key={`${p.productId ?? i}-${topView}`} className="flex items-center gap-3">
                    <span className="text-sm font-bold w-5 text-center flex-shrink-0" style={{ color: GOLD }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {topView === "revenue"
                          ? `${p.unitsSold} units sold`
                          : `₹${Number(p.revenue).toLocaleString("en-IN", { maximumFractionDigits: 0 })} revenue`
                        }
                      </p>
                    </div>
                    <div className="text-sm font-semibold flex-shrink-0" style={{ color: BRAND }}>
                      {topView === "revenue"
                        ? `₹${Number(p.revenue).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                        : `${p.unitsSold} units`
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Orders ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
          <Link href="/admin/orders" className="text-sm hover:underline" style={{ color: BRAND }}>View all →</Link>
        </CardHeader>
        <CardContent>
          {dashboard?.recentOrders?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.recentOrders.map((order: any) => (
                  <TableRow key={order.id} className="cursor-pointer hover:bg-muted/40">
                    <TableCell>
                      <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs hover:underline" style={{ color: BRAND }}>
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium max-w-[120px] truncate">{order.customerName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? "s" : ""}</TableCell>
                    <TableCell className="font-semibold">₹{Number(order.total).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-800"}`}>
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No orders yet. They'll appear here when customers start ordering!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string; sub: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground text-center px-4">
      {message}
    </div>
  );
}
