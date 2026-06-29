import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, ShoppingCart, Users, TrendingUp, Package } from "lucide-react";
import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const BRAND = "#9B0F5F";
const GOLD  = "#D4AF37";

const PIE_COLORS: Record<string, string> = {
  pending: "#f59e0b", processing: "#3b82f6", shipped: "#8b5cf6",
  delivered: "#10b981", cancelled: "#ef4444", returned: "#f97316",
};

type Period = "daily" | "weekly" | "monthly";
type TopView = "revenue" | "units";

async function fetchAdmin(path: string) {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string; sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="h-40 flex items-center justify-center text-sm text-muted-foreground text-center px-4">
      {msg}
    </div>
  );
}

export default function AdminAnalytics() {
  const [period, setPeriod]   = useState<Period>("monthly");
  const [topView, setTopView] = useState<TopView>("revenue");

  const { data: dashboard } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    queryFn: () => fetchAdmin("/api/admin/dashboard"),
  });

  const { data: overview } = useQuery({
    queryKey: ["/api/admin/analytics/overview"],
    queryFn: () => fetchAdmin("/api/admin/analytics/overview"),
  });

  const { data: revenue = [] } = useQuery({
    queryKey: ["/api/admin/analytics/revenue", period],
    queryFn: () => fetchAdmin(`/api/admin/analytics/revenue?period=${period}`),
  });

  const { data: topProducts = [] } = useQuery({
    queryKey: ["/api/admin/analytics/top-products", topView],
    queryFn: () => fetchAdmin(`/api/admin/analytics/top-products?sortBy=${topView}`),
  });

  const pieData = (dashboard?.ordersByStatus ?? []).map((s: any) => ({
    name: s.status, value: Number(s.count),
  }));

  const maxRevenue = Math.max(...(topProducts as any[]).map((p: any) => Number(p.revenue)), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Sales performance and store insights</p>
        </div>
        <span className="text-xs text-muted-foreground bg-gray-50 px-3 py-1.5 rounded-full border">
          Live data · refreshes on load
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<IndianRupee className="h-4 w-4" />}
          label="Total Revenue"
          value={`₹${Number(dashboard?.totalRevenue ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          sub="all time"
        />
        <StatCard
          icon={<ShoppingCart className="h-4 w-4" />}
          label="Total Orders"
          value={String(dashboard?.totalOrders ?? 0)}
          sub={`${dashboard?.todayOrders ?? 0} today`}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Unique Customers"
          value={String(overview?.totalCustomers ?? 0)}
          sub="by email"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Avg Order Value"
          value={`₹${Number(overview?.avgOrderValue ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          sub="per order"
        />
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Revenue Over Time</CardTitle>
          <div className="flex gap-1 text-xs">
            {(["daily", "weekly", "monthly"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-2.5 py-1 rounded-md font-medium capitalize transition-colors"
                style={period === p ? { background: BRAND, color: "white" } : { background: "#f3f4f6", color: "#6b7280" }}>
                {p}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {(revenue as any[]).length === 0 ? <Empty msg="Revenue data will appear here as orders come in." /> : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenue} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                  tickFormatter={v => `₹${Number(v) >= 1000 ? `${(Number(v)/1000).toFixed(0)}k` : v}`} width={52} />
                <Tooltip
                  formatter={(v: any, name: string) => [
                    name === "revenue" ? `₹${Number(v).toLocaleString("en-IN")}` : v,
                    name === "revenue" ? "Revenue" : "Orders",
                  ]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                />
                <Line type="monotone" dataKey="revenue" stroke={BRAND} strokeWidth={2.5}
                  dot={{ fill: BRAND, r: 3 }} activeDot={{ r: 5 }} name="revenue" />
                <Line type="monotone" dataKey="orders" stroke={GOLD} strokeWidth={1.5}
                  dot={false} strokeDasharray="4 2" name="orders" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Middle row: Pie + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? <Empty msg="Order breakdown will appear after orders come in." /> : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    paddingAngle={3} dataKey="value">
                    {pieData.map((entry: any) => (
                      <Cell key={entry.name} fill={PIE_COLORS[entry.name] ?? "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Top Products</CardTitle>
            <div className="flex gap-1 text-xs">
              {(["revenue", "units"] as TopView[]).map(v => (
                <button key={v} onClick={() => setTopView(v)}
                  className="px-2.5 py-1 rounded-md font-medium transition-colors"
                  style={topView === v ? { background: BRAND, color: "white" } : { background: "#f3f4f6", color: "#6b7280" }}>
                  {v === "revenue" ? "By Revenue" : "By Units"}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {!(topProducts as any[]).length ? <Empty msg="Top products will appear after orders are placed." /> : (
              <div className="space-y-4">
                {(topProducts as any[]).map((p: any, i: number) => {
                  const barVal = topView === "revenue" ? Number(p.revenue) : Number(p.unitsSold);
                  const maxVal = topView === "revenue" ? maxRevenue : Math.max(...(topProducts as any[]).map((x: any) => Number(x.unitsSold)), 1);
                  const pct = Math.round((barVal / maxVal) * 100);
                  return (
                    <div key={p.productId ?? i}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-bold w-4 flex-shrink-0" style={{ color: GOLD }}>{i + 1}</span>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Package className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                            <p className="text-sm font-medium truncate">{p.productName}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold flex-shrink-0 ml-2" style={{ color: BRAND }}>
                          {topView === "revenue"
                            ? `₹${Number(p.revenue).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                            : `${p.unitsSold} units`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%`, background: BRAND, opacity: 0.7 + (0.3 * (1 - i / 5)) }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today snapshot */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Today's Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-2xl font-bold" style={{ color: BRAND }}>{dashboard?.todayOrders ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Orders Today</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-2xl font-bold" style={{ color: BRAND }}>
                ₹{Number(dashboard?.todayRevenue ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Revenue Today</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-2xl font-bold" style={{ color: GOLD }}>
                {(dashboard?.ordersByStatus ?? []).find((s: any) => s.status === "pending")?.count ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Pending Orders</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50">
              <p className="text-2xl font-bold" style={{ color: GOLD }}>
                {dashboard?.lowStockCount ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Low Stock Items</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
