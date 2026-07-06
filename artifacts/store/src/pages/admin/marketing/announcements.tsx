import { useState, useEffect } from "react";
import { useAuth } from "@clerk/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, GripVertical, Save, Megaphone, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BRAND = "#9B0F5F";

interface TickerItem { text: string; emoji?: string; }
interface SiteDesign {
  tickerItems?: TickerItem[];
  tickerEnabled?: boolean;
  announcementBanner?: { text: string; enabled: boolean; link?: string };
}

async function getSiteDesign(): Promise<SiteDesign> {
  const res = await fetch("/api/site-design", { credentials: "include" });
  return res.json();
}

async function patchSiteDesign(patch: Partial<SiteDesign>, token?: string | null) {
  const res = await fetch("/api/admin/site-design", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to save");
  return res.json();
}

export default function AdminAnnouncements() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { getToken } = useAuth();

  const { data: design, isLoading } = useQuery({
    queryKey: ["/api/site-design"],
    queryFn: getSiteDesign,
  });

  const [tickerEnabled, setTickerEnabled] = useState(true);
  const [tickerItems, setTickerItems]     = useState<TickerItem[]>([]);
  const [banner, setBanner]               = useState({ text: "", enabled: false, link: "" });

  useEffect(() => {
    if (!design) return;
    setTickerEnabled(design.tickerEnabled ?? true);
    setTickerItems(design.tickerItems ?? [
      { text: "Anti-Tarnish Jewellery", emoji: "✦" },
      { text: "Ships in 24 Hours", emoji: "✦" },
      { text: "Free Shipping above ₹999", emoji: "✦" },
      { text: "10,000+ Happy Customers", emoji: "✦" },
      { text: "Waterproof & Skin-Friendly", emoji: "✦" },
    ]);
    setBanner({
      text:    design.announcementBanner?.text    ?? "",
      enabled: design.announcementBanner?.enabled ?? false,
      link:    design.announcementBanner?.link    ?? "",
    });
  }, [design]);

  const save = useMutation({
    mutationFn: async () => patchSiteDesign({
      tickerEnabled,
      tickerItems,
      announcementBanner: { text: banner.text, enabled: banner.enabled, link: banner.link },
    }, await getToken()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/site-design"] });
      toast({ title: "Saved!", description: "Announcements updated successfully." });
    },
    onError: () => toast({ title: "Error", description: "Could not save changes.", variant: "destructive" }),
  });

  const addItem = () => setTickerItems(prev => [...prev, { text: "", emoji: "✦" }]);
  const removeItem = (i: number) => setTickerItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof TickerItem, value: string) =>
    setTickerItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage the ticker strip and site banners</p>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending}
          style={{ background: BRAND }} className="text-white gap-2">
          <Save className="h-4 w-4" />
          {save.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      {/* Ticker Strip */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" style={{ color: BRAND }} />
              <CardTitle className="text-base">Ticker Strip</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{tickerEnabled ? "Visible" : "Hidden"}</span>
              <Switch checked={tickerEnabled} onCheckedChange={setTickerEnabled}
                style={tickerEnabled ? { backgroundColor: BRAND } : {}} />
            </div>
          </div>
          <CardDescription>
            The scrolling banner at the top of the store. Each item loops continuously.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tickerItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0 cursor-grab" />
              <div className="w-12 flex-shrink-0">
                <Input
                  value={item.emoji ?? ""}
                  onChange={e => updateItem(i, "emoji", e.target.value)}
                  placeholder="✦"
                  className="text-center text-base px-2"
                />
              </div>
              <Input
                value={item.text}
                onChange={e => updateItem(i, "text", e.target.value)}
                placeholder="Announcement text…"
                className="flex-1"
              />
              <button onClick={() => removeItem(i)}
                className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5 w-full mt-1">
            <Plus className="h-3.5 w-3.5" />
            Add Item
          </Button>
        </CardContent>
      </Card>

      {/* Announcement Banner */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" style={{ color: BRAND }} />
              <CardTitle className="text-base">Announcement Banner</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{banner.enabled ? "Visible" : "Hidden"}</span>
              <Switch checked={banner.enabled} onCheckedChange={v => setBanner(b => ({ ...b, enabled: v }))}
                style={banner.enabled ? { backgroundColor: BRAND } : {}} />
            </div>
          </div>
          <CardDescription>
            A full-width banner above the header — great for sales, shipping offers, or limited-time deals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Banner Text</Label>
            <Input
              value={banner.text}
              onChange={e => setBanner(b => ({ ...b, text: e.target.value }))}
              placeholder="e.g. 🎉 Use code SRISWA10 for 10% off your first order!"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Link (optional)</Label>
            <Input
              value={banner.link}
              onChange={e => setBanner(b => ({ ...b, link: e.target.value }))}
              placeholder="/shop or https://..."
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">If set, clicking the banner takes customers to this URL.</p>
          </div>
          {banner.enabled && banner.text && (
            <div className="rounded-lg px-4 py-2 text-sm text-white text-center" style={{ background: BRAND }}>
              {banner.text}
            </div>
          )}
        </CardContent>
      </Card>

      {/* WhatsApp reminder */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 bg-green-100">
              <span className="text-base">📱</span>
            </div>
            <div>
              <p className="text-sm font-medium">WhatsApp Notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Order alerts and customer messages are configured in{" "}
                <a href="/admin/settings" className="underline" style={{ color: BRAND }}>Settings → WhatsApp</a>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
