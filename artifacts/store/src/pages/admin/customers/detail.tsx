import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Pencil, Trash2, Plus, Phone, Mail, MapPin, ShoppingBag, IndianRupee, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BRAND = "#9B0F5F";
const GOLD  = "#D4AF37";

const SEGMENT_COLORS = {
  vip:       "bg-yellow-100 text-yellow-800",
  returning: "bg-blue-100 text-blue-800",
  new:       "bg-green-100 text-green-800",
};

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped:    "bg-purple-100 text-purple-800",
  delivered:  "bg-green-100 text-green-800",
  cancelled:  "bg-red-100 text-red-800",
};

type CustomerDetail = {
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  orderCount: number;
  totalSpend: number;
  lastOrderAt: string;
  segment: "vip" | "returning" | "new";
  orders: {
    id: number;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    shippingAddress: string;
    city: string;
    state: string;
  }[];
  notes: {
    id: number;
    note: string;
    createdBy: string;
    createdAt: string;
  }[];
};

async function fetchCustomer(email: string): Promise<CustomerDetail> {
  const res = await fetch(`/api/admin/customers/${encodeURIComponent(email)}`, { credentials: "include" });
  if (!res.ok) throw new Error("Customer not found");
  return res.json();
}

async function addNote(email: string, note: string) {
  const res = await fetch(`/api/admin/customers/${encodeURIComponent(email)}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ note }),
  });
  if (!res.ok) throw new Error("Failed to add note");
  return res.json();
}

async function deleteNote(email: string, noteId: number) {
  const res = await fetch(`/api/admin/customers/${encodeURIComponent(email)}/notes/${noteId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete note");
}

async function updateNote(email: string, noteId: number, note: string) {
  const res = await fetch(`/api/admin/customers/${encodeURIComponent(email)}/notes/${noteId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ note }),
  });
  if (!res.ok) throw new Error("Failed to update note");
  return res.json();
}

export default function CustomerDetail() {
  const { email: encodedEmail } = useParams<{ email: string }>();
  const email = decodeURIComponent(encodedEmail ?? "");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [newNote,    setNewNote]    = useState("");
  const [editId,     setEditId]     = useState<number | null>(null);
  const [editText,   setEditText]   = useState("");
  const [confirmDel, setConfirmDel] = useState<number | null>(null);

  const { data: customer, isLoading, isError } = useQuery<CustomerDetail>({
    queryKey: ["/api/admin/customers", email],
    queryFn: () => fetchCustomer(email),
    enabled: Boolean(email),
  });

  const qk = ["/api/admin/customers", email];

  const addMutation = useMutation({
    mutationFn: () => addNote(email, newNote),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: qk }); setNewNote(""); },
    onError: () => toast({ title: "Failed to add note", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId: number) => deleteNote(email, noteId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: qk }); setConfirmDel(null); },
    onError: () => toast({ title: "Failed to delete note", variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: (noteId: number) => updateNote(email, noteId, editText),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: qk }); setEditId(null); },
    onError: () => toast({ title: "Failed to update note", variant: "destructive" }),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-7 w-7 border-b-2" style={{ borderColor: BRAND }} />
    </div>
  );

  if (isError || !customer) return (
    <div className="text-center py-24">
      <p className="text-muted-foreground">Customer not found.</p>
      <Link href="/admin/customers" className="text-sm mt-3 inline-block" style={{ color: BRAND }}>← Back</Link>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/customers">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-serif font-bold">{customer.customerName}</h1>
            <Badge className={`text-xs capitalize ${SEGMENT_COLORS[customer.segment]}`}>
              {customer.segment === "vip" && <Star className="h-2.5 w-2.5 mr-1" />}
              {customer.segment}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats + Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <a href={`mailto:${customer.customerEmail}`} className="hover:underline" style={{ color: BRAND }}>
                {customer.customerEmail}
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <a href={`tel:${customer.customerPhone}`} className="hover:underline" style={{ color: BRAND }}>
                {customer.customerPhone}
              </a>
            </div>
            {customer.orders[0] && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  {customer.orders[0].shippingAddress}, {customer.orders[0].city}, {customer.orders[0].state}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 pb-4 px-4 text-center">
              <ShoppingBag className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{customer.orderCount}</p>
              <p className="text-xs text-muted-foreground">Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 px-4 text-center">
              <IndianRupee className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">
                {customer.totalSpend.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground">Spent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 px-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Last Order</p>
              <p className="text-sm font-semibold">
                {new Date(customer.lastOrderAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order history */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Order History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs hover:underline" style={{ color: BRAND }}>
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] capitalize ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-sm">
                    ₹{order.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Support Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Support Notes <span className="text-[10px] font-normal normal-case">(internal only)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add note */}
          <div className="flex gap-2">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add an internal note about this customer…"
              className="min-h-[72px] resize-none text-sm"
            />
            <Button
              onClick={() => addMutation.mutate()}
              disabled={!newNote.trim() || addMutation.isPending}
              className="flex-shrink-0 gap-1 text-white self-end"
              style={{ background: BRAND }}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {/* Existing notes */}
          {customer.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No notes yet.</p>
          ) : (
            <div className="space-y-2">
              {customer.notes.map((note) => (
                <div key={note.id} className="group rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  {editId === note.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="min-h-[60px] resize-none text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="text-white text-xs h-7" style={{ background: BRAND }}
                          onClick={() => editMutation.mutate(note.id)} disabled={editMutation.isPending}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setEditId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.note}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {note.createdBy} · {new Date(note.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6"
                          onClick={() => { setEditId(note.id); setEditText(note.note); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        {confirmDel === note.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="destructive" className="h-6 text-[10px] px-2"
                              onClick={() => deleteMutation.mutate(note.id)} disabled={deleteMutation.isPending}>
                              Delete
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2"
                              onClick={() => setConfirmDel(null)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setConfirmDel(note.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
