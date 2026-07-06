import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { GitBranch, Plus, Copy, ExternalLink, Percent, IndianRupee, Truck } from "lucide-react";

const BRAND = "#9B0F5F";

type CouponType = "percent" | "flat" | "free-shipping";

interface Coupon {
  id: number;
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  isReferral?: boolean;
}

async function getCoupons(token?: string | null): Promise<Coupon[]> {
  const res = await fetch("/api/admin/coupons", {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

async function createCoupon(data: Partial<Coupon>, token?: string | null) {
  const res = await fetch("/api/admin/coupons", {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? "Failed"); }
  return res.json();
}

async function toggleCoupon(id: number, isActive: boolean, token?: string | null) {
  const res = await fetch(`/api/admin/coupons/${id}`, {
    method: "PATCH", credentials: "include",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

function generateReferralCode(name: string) {
  const clean = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  return `REF-${clean || "FRIEND"}`;
}

export default function AdminReferrals() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { getToken } = useAuth();

  const { data: allCoupons = [], isLoading } = useQuery({ queryKey: ["/api/admin/coupons"], queryFn: async () => getCoupons(await getToken()) });

  const referralCoupons = allCoupons.filter(c => c.code.startsWith("REF-"));

  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<CouponType>("percent");
  const [value, setValue] = useState("10");
  const [minOrder, setMinOrder] = useState("500");

  const generatedCode = name ? generateReferralCode(name) : "REF-FRIEND";

  const create = useMutation({
    mutationFn: async () => createCoupon({
      code: generatedCode,
      type: discountType,
      value: Number(value),
      minOrderAmount: minOrder ? Number(minOrder) : null,
      maxUses: null,
      isActive: true,
    }, await getToken()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({ title: "Referral code created!", description: `Code ${generatedCode} is ready to share.` });
      setName("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => toggleCoupon(id, isActive, await getToken()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/coupons"] }),
  });

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/?coupon=${code}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: "Referral link copied to clipboard." });
  };

  const typeIcon = (type: CouponType) => {
    if (type === "percent") return <Percent className="h-3 w-3" />;
    if (type === "flat") return <IndianRupee className="h-3 w-3" />;
    return <Truck className="h-3 w-3" />;
  };

  const typeLabel = (c: Coupon) => {
    if (c.type === "percent") return `${c.value}% off`;
    if (c.type === "flat") return `₹${c.value} off`;
    return "Free shipping";
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND }} />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-serif font-bold">Referral Codes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Create personal referral links for customers, influencers, or friends</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" style={{ color: BRAND }} />
            <CardTitle className="text-base">Create Referral Code</CardTitle>
          </div>
          <CardDescription>Each code is tied to a person's name — great for influencer partnerships.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Person / Influencer Name</Label>
            <Input className="mt-1" placeholder="e.g. Priya, SriswaFan2024…" value={name} onChange={e => setName(e.target.value)} />
            {name && (
              <p className="text-xs text-muted-foreground mt-1">
                Code will be: <span className="font-mono font-bold" style={{ color: BRAND }}>{generatedCode}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {(["percent", "flat", "free-shipping"] as CouponType[]).map(t => (
              <button
                key={t}
                onClick={() => setDiscountType(t)}
                className={`rounded-lg p-3 text-center border-2 text-sm transition-all ${discountType === t ? "border-[#9B0F5F] bg-[#9B0F5F0A]" : "border-gray-200"}`}
              >
                <div className="flex justify-center mb-1" style={{ color: discountType === t ? BRAND : "#6b7280" }}>
                  {typeIcon(t)}
                </div>
                <span className="text-xs font-medium capitalize">{t === "free-shipping" ? "Free Ship" : t}</span>
              </button>
            ))}
          </div>

          {discountType !== "free-shipping" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount {discountType === "percent" ? "%" : "₹"}</Label>
                <Input type="number" className="mt-1" value={value} onChange={e => setValue(e.target.value)} min="1" />
              </div>
              <div>
                <Label>Min. Order (₹)</Label>
                <Input type="number" className="mt-1" value={minOrder} onChange={e => setMinOrder(e.target.value)} min="0" />
              </div>
            </div>
          )}

          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || !name.trim()}
            className="w-full gap-2 text-white"
            style={{ background: BRAND }}
          >
            <GitBranch className="h-4 w-4" />
            {create.isPending ? "Creating…" : "Create Referral Code"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Referral Codes ({referralCoupons.length})</CardTitle>
          <CardDescription>Share these links with influencers and track usage via Coupons page.</CardDescription>
        </CardHeader>
        <CardContent>
          {referralCoupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No referral codes yet. Create your first one above.
            </div>
          ) : (
            <div className="space-y-3">
              {referralCoupons.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-sm font-bold" style={{ color: BRAND }}>{c.code}</span>
                    <Badge variant="outline" className="text-xs gap-1 flex-shrink-0">
                      {typeIcon(c.type)}{typeLabel(c)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">{c.usedCount} uses</span>
                    <button onClick={() => copyLink(c.code)} className="p-1.5 rounded hover:bg-gray-200 transition-colors">
                      <Copy className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    <button onClick={() => window.open(`/?coupon=${c.code}`, "_blank")} className="p-1.5 rounded hover:bg-gray-200 transition-colors">
                      <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    <button
                      onClick={() => toggle.mutate({ id: c.id, isActive: !c.isActive })}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {c.isActive ? "Active" : "Off"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground">
            💡 All referral codes also appear in the{" "}
            <a href="/admin/marketing/coupons" className="underline" style={{ color: BRAND }}>Coupons</a> page where you can edit limits and expiry dates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
