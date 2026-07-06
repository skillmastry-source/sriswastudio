import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";

const BRAND = "#9B0F5F";
const GOLD  = "#D4AF37";

type Segment = "all" | "vip" | "returning" | "new";
type Tab = "customers" | "leads";

const SEGMENT_COLORS = {
  vip:       "bg-yellow-100 text-yellow-800",
  returning: "bg-blue-100 text-blue-800",
  new:       "bg-green-100 text-green-800",
};

const LEAD_STATUS_COLORS: Record<string, string> = {
  new:       "bg-gray-100 text-gray-700",
  contacted: "bg-blue-100 text-blue-800",
  converted: "bg-green-100 text-green-800",
};

type Customer = {
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  orderCount: number;
  totalSpend: number;
  lastOrderAt: string;
  segment: "vip" | "returning" | "new";
};

type Lead = {
  id: number;
  name: string;
  mobile: string;
  product: string | null;
  qty: string | null;
  city: string | null;
  pin: string | null;
  status: string;
  createdAt: string;
};

async function fetchCustomers(search: string, segment: Segment, page: number, token?: string | null) {
  const params = new URLSearchParams({ search, segment, page: String(page), limit: "20" });
  const res = await fetch(`/api/admin/customers?${params}`, {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed");
  return res.json() as Promise<{ customers: Customer[]; total: number; page: number; limit: number }>;
}

async function fetchLeads(token?: string | null) {
  const res = await fetch("/api/admin/leads", {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed");
  return res.json() as Promise<Lead[]>;
}

async function updateLeadStatus(id: number, status: string, token?: string | null) {
  const res = await fetch(`/api/admin/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

export default function AdminCustomers() {
  const [tab, setTab]         = useState<Tab>("customers");
  const [search, setSearch]   = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const [page, setPage]       = useState(1);
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/customers", search, segment, page],
    queryFn: async () => fetchCustomers(search, segment, page, await getToken()),
    enabled: tab === "customers",
  });

  const { data: leadsData = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["/api/admin/leads"],
    queryFn: async () => fetchLeads(await getToken()),
    enabled: tab === "leads",
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => updateLeadStatus(id, status, await getToken()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] }),
  });

  const customers  = data?.customers ?? [];
  const total      = data?.total ?? 0;
  const totalPages = Math.ceil(total / (data?.limit ?? 20));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold">Customers</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {([
          { key: "customers" as Tab, label: "Customers", icon: Users },
          { key: "leads"     as Tab, label: "Leads",     icon: MessageSquare },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key
                ? "border-[#9B0F5F] text-[#9B0F5F]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Customers tab ── */}
      {tab === "customers" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or phone…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={segment} onValueChange={(v) => { setSegment(v as Segment); setPage(1); }}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="returning">Returning</SelectItem>
                <SelectItem value="new">New</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{total} customer{total !== 1 ? "s" : ""}</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2" style={{ borderColor: BRAND }} />
            </div>
          ) : customers.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground text-sm">
                {search || segment !== "all"
                  ? "No customers match your filters."
                  : "No customers yet — they'll appear here once orders are placed."}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Segment</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Total Spend</TableHead>
                      <TableHead>Last Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((c) => (
                      <TableRow key={c.customerEmail} className="cursor-pointer hover:bg-muted/40">
                        <TableCell>
                          <Link href={`/admin/customers/${encodeURIComponent(c.customerEmail)}`}>
                            <div>
                              <p className="font-medium text-sm hover:underline" style={{ color: BRAND }}>
                                {c.customerName}
                              </p>
                              <p className="text-xs text-muted-foreground">{c.customerEmail}</p>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">{c.customerPhone}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] capitalize ${SEGMENT_COLORS[c.segment]}`}>
                            {c.segment}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">{c.orderCount}</TableCell>
                        <TableCell className="text-right text-sm font-semibold">
                          ₹{c.totalSpend.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(c.lastOrderAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Leads tab ── */}
      {tab === "leads" && (
        <div className="space-y-4">
          {leadsLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2" style={{ borderColor: BRAND }} />
            </div>
          ) : leadsData.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground text-sm">
                No leads yet — they'll appear here when customers use the chat widget.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Interest</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadsData.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium text-sm">{lead.name}</TableCell>
                        <TableCell className="text-sm">
                          <a href={`tel:${lead.mobile}`} style={{ color: BRAND }} className="hover:underline">
                            {lead.mobile}
                          </a>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {lead.product ?? "—"}{lead.qty ? ` × ${lead.qty}` : ""}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {[lead.city, lead.pin].filter(Boolean).join(", ") || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={lead.status}
                            onValueChange={(v) => updateLead.mutate({ id: lead.id, status: v })}
                          >
                            <SelectTrigger className="h-7 text-xs w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="converted">Converted</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
