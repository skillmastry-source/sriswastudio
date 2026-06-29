import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Tag, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface Coupon {
  id: number;
  code: string;
  type: "percent" | "flat" | "free-shipping";
  value: number;
  minOrderAmount: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface CouponForm {
  code: string;
  type: "percent" | "flat" | "free-shipping";
  value: string;
  minOrderAmount: string;
  maxUses: string;
  expiresAt: string;
  isActive: boolean;
}

const emptyForm: CouponForm = {
  code: "", type: "percent", value: "", minOrderAmount: "", maxUses: "", expiresAt: "", isActive: true,
};

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}/api${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

function typeLabel(type: string) {
  if (type === "percent") return "% Off";
  if (type === "flat") return "₹ Off";
  return "Free Shipping";
}

function valueDisplay(c: Coupon) {
  if (c.type === "percent") return `${c.value}% off`;
  if (c.type === "flat") return `₹${c.value} off`;
  return "Free Shipping";
}

function isExpired(c: Coupon) {
  return c.expiresAt ? new Date(c.expiresAt) < new Date() : false;
}

export default function AdminCoupons() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ["admin-coupons"],
    queryFn: () => apiFetch("/admin/coupons"),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
        isActive: form.isActive,
      };
      if (editingId) {
        return apiFetch(`/admin/coupons/${editingId}`, { method: "PATCH", body: JSON.stringify(body) });
      }
      return apiFetch("/admin/coupons", { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      setFormOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      setFormError("");
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/admin/coupons/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      setDeleteId(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiFetch(`/admin/coupons/${id}`, { method: "PATCH", body: JSON.stringify({ isActive }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(c: Coupon) {
    setEditingId(c.id);
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      minOrderAmount: c.minOrderAmount ? String(c.minOrderAmount) : "",
      maxUses: c.maxUses !== null ? String(c.maxUses) : "",
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "",
      isActive: c.isActive,
    });
    setFormError("");
    setFormOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.code) { setFormError("Coupon code is required"); return; }
    if (form.type !== "free-shipping" && (!form.value || isNaN(Number(form.value)))) {
      setFormError("Value is required for this coupon type");
      return;
    }
    saveMutation.mutate();
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage discount codes for promotions</p>
        </div>
        <Button onClick={openCreate} className="gap-2" style={{ background: "#9B0F5F" }}>
          <Plus className="h-4 w-4" /> New Coupon
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="h-6 w-6 border-2 border-[#9B0F5F] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <Tag className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium text-gray-600">No coupons yet</p>
          <p className="text-sm mt-1">Create your first discount code to start running promotions.</p>
          <Button onClick={openCreate} className="mt-6 gap-2" style={{ background: "#9B0F5F" }}>
            <Plus className="h-4 w-4" /> Create Coupon
          </Button>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Code</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Discount</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Min Order</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Usage</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Expires</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map((c) => {
                const expired = isExpired(c);
                const limitReached = c.maxUses !== null && c.usedCount >= c.maxUses;
                const effective = c.isActive && !expired && !limitReached;
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <code className="font-mono font-bold text-[#9B0F5F] bg-pink-50 px-2 py-0.5 rounded text-xs">
                        {c.code}
                      </code>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-gray-900">{valueDisplay(c)}</span>
                      <span className="ml-2 text-xs text-gray-400">{typeLabel(c.type)}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {c.minOrderAmount > 0 ? `₹${c.minOrderAmount}` : "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {c.usedCount}{c.maxUses !== null ? ` / ${c.maxUses}` : ""}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {c.expiresAt
                        ? <span className={expired ? "text-red-500" : ""}>{new Date(c.expiresAt).toLocaleDateString("en-IN")}</span>
                        : "Never"}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleMutation.mutate({ id: c.id, isActive: !c.isActive })}
                        className="flex items-center gap-1.5"
                      >
                        <Badge
                          variant={effective ? "default" : "secondary"}
                          className="text-xs"
                          style={effective ? { background: "#16a34a" } : {}}
                        >
                          {effective ? "Active" : expired ? "Expired" : limitReached ? "Limit Reached" : "Inactive"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)} className="h-8 w-8 text-gray-500">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)} className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setFormError(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{editingId ? "Edit Coupon" : "New Coupon"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {formError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Coupon Code *</label>
              <Input
                placeholder="SUMMER20"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">Customers enter this at checkout (auto-uppercased)</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Discount Type *</label>
              <div className="grid grid-cols-3 gap-2">
                {(["percent", "flat", "free-shipping"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className="p-2.5 rounded-md border-2 text-xs font-medium transition-all text-center"
                    style={{
                      borderColor: form.type === t ? "#9B0F5F" : "#e5e7eb",
                      background: form.type === t ? "#fdf6f9" : "white",
                      color: form.type === t ? "#9B0F5F" : "#374151",
                    }}
                  >
                    {t === "percent" ? "% Percent" : t === "flat" ? "₹ Flat" : "Free Ship"}
                  </button>
                ))}
              </div>
            </div>

            {form.type !== "free-shipping" && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  {form.type === "percent" ? "Discount Percentage *" : "Discount Amount (₹) *"}
                </label>
                <Input
                  type="number"
                  min="0"
                  max={form.type === "percent" ? "100" : undefined}
                  placeholder={form.type === "percent" ? "20" : "100"}
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Min. Order (₹)</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Max Uses</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={form.maxUses}
                  onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Expiry Date</label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                className="relative h-5 w-9 rounded-full transition-colors flex-shrink-0"
                style={{ background: form.isActive ? "#9B0F5F" : "#d1d5db" }}
              >
                <span
                  className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                  style={{ transform: form.isActive ? "translateX(16px)" : "translateX(0)" }}
                />
              </button>
              <span className="text-sm text-gray-700">Active (customers can use this coupon)</span>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending} style={{ background: "#9B0F5F" }}>
                {saveMutation.isPending ? "Saving…" : editingId ? "Save Changes" : "Create Coupon"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Delete Coupon?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">This will permanently delete the coupon. Orders already using this code will keep their discount.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
