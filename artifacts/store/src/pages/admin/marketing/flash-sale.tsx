import { useState, useEffect } from "react";
import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Zap, Save } from "lucide-react";

const BRAND = "#9B0F5F";

interface FlashSale {
  enabled?: boolean;
  title?: string;
  subtitle?: string;
  endTime?: string;
  bgColor?: string;
  link?: string;
}

interface SiteDesign { flashSale?: FlashSale }

async function getSiteDesign(): Promise<SiteDesign> {
  const res = await fetch("/api/site-design", { credentials: "include" });
  return res.json();
}

async function patchSiteDesign(patch: Partial<SiteDesign>, token?: string | null) {
  const res = await fetch("/api/admin/site-design", {
    method: "PATCH", credentials: "include",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to save");
  return res.json();
}

function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CountdownPreview({ endTime, title, subtitle, bgColor }: { endTime: string; title: string; subtitle: string; bgColor: string }) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) { setT({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="rounded-xl overflow-hidden">
      <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-white text-center" style={{ background: bgColor }}>
        <p className="font-bold text-lg">{title || "⚡ Flash Sale"}</p>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-80">{subtitle || "Ends in"}</span>
          <div className="flex items-center gap-1 font-mono font-bold text-xl">
            {t.d > 0 && <><span className="bg-white/20 rounded px-2 py-0.5">{t.d}d</span><span className="opacity-60">:</span></>}
            <span className="bg-white/20 rounded px-2 py-0.5">{pad(t.h)}</span>
            <span className="opacity-60 animate-pulse">:</span>
            <span className="bg-white/20 rounded px-2 py-0.5">{pad(t.m)}</span>
            <span className="opacity-60 animate-pulse">:</span>
            <span className="bg-white/20 rounded px-2 py-0.5">{pad(t.s)}</span>
          </div>
        </div>
        <a href="#" className="text-sm underline opacity-80 hover:opacity-100">Shop Now →</a>
      </div>
    </div>
  );
}

export default function AdminFlashSale() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { getToken } = useAuth();

  const { data: design, isLoading } = useQuery({ queryKey: ["/api/site-design"], queryFn: getSiteDesign });

  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState("⚡ Flash Sale! 30% Off");
  const [subtitle, setSubtitle] = useState("Hurry! Offer ends in");
  const [endTime, setEndTime] = useState("");
  const [bgColor, setBgColor] = useState(BRAND);
  const [link, setLink] = useState("/shop");

  useEffect(() => {
    if (!design?.flashSale) return;
    const fs = design.flashSale;
    setEnabled(fs.enabled ?? false);
    setTitle(fs.title ?? "⚡ Flash Sale! 30% Off");
    setSubtitle(fs.subtitle ?? "Hurry! Offer ends in");
    setEndTime(toLocalInput(fs.endTime));
    setBgColor(fs.bgColor ?? BRAND);
    setLink(fs.link ?? "/shop");
  }, [design]);

  const save = useMutation({
    mutationFn: async () => patchSiteDesign({
      flashSale: {
        enabled, title, subtitle,
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
        bgColor, link,
      },
    }, await getToken()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/site-design"] });
      toast({ title: "Saved!", description: "Flash sale settings updated." });
    },
    onError: () => toast({ title: "Error", description: "Could not save.", variant: "destructive" }),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND }} />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Flash Sale Timer</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Add a live countdown banner to your storefront</p>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending} style={{ background: BRAND }} className="text-white gap-2">
          <Save className="h-4 w-4" />
          {save.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" style={{ color: BRAND }} />
              <CardTitle className="text-base">Countdown Banner</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{enabled ? "Live" : "Hidden"}</span>
              <Switch checked={enabled} onCheckedChange={setEnabled} style={enabled ? { backgroundColor: BRAND } : {}} />
            </div>
          </div>
          <CardDescription>Appears at the very top of your store above the ticker strip.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Headline</Label>
              <Input className="mt-1" value={title} onChange={e => setTitle(e.target.value)} placeholder="⚡ Flash Sale! 30% Off" />
            </div>
            <div>
              <Label>Countdown Label</Label>
              <Input className="mt-1" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Hurry! Offer ends in" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Sale Ends At</Label>
              <Input type="datetime-local" className="mt-1" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
            <div>
              <Label>Link (optional)</Label>
              <Input className="mt-1" value={link} onChange={e => setLink(e.target.value)} placeholder="/shop" />
            </div>
          </div>
          <div>
            <Label>Banner Color</Label>
            <div className="flex items-center gap-3 mt-1">
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                className="h-9 w-16 rounded border border-gray-200 cursor-pointer p-0.5" />
              <Input value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-32 font-mono text-sm" />
              {["#9B0F5F", "#D4AF37", "#1a0a0f", "#dc2626", "#16a34a"].map(c => (
                <button key={c} onClick={() => setBgColor(c)} className="h-7 w-7 rounded-full border-2 border-white shadow-sm"
                  style={{ background: c, outline: bgColor === c ? `2px solid ${BRAND}` : "none" }} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {endTime && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live Preview</CardTitle>
            <CardDescription>This is how the banner looks on your storefront right now.</CardDescription>
          </CardHeader>
          <CardContent>
            <CountdownPreview endTime={new Date(endTime).toISOString()} title={title} subtitle={subtitle} bgColor={bgColor} />
          </CardContent>
        </Card>
      )}

      <Card className="border-dashed">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Pair your flash sale with a coupon code from the{" "}
            <a href="/admin/marketing/coupons" className="underline" style={{ color: BRAND }}>Coupons</a> page and announce it via{" "}
            <a href="/admin/marketing/broadcasts" className="underline" style={{ color: BRAND }}>Broadcast</a> for maximum impact.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
