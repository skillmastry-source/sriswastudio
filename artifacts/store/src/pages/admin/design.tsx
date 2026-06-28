import { useState, useEffect } from "react";
import { useSiteSettings, useUpdateSiteSettings, DEFAULT_SITE_DESIGN, type SiteDesign } from "@/hooks/use-site-settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star } from "lucide-react";

function ColorField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-10 w-14 rounded border cursor-pointer flex-shrink-0"
        style={{ padding: "2px 4px" }}
      />
      <div className="flex-1">
        <Label className="text-xs font-medium">{label}</Label>
        <Input value={value} onChange={e => onChange(e.target.value)} className="mt-0.5 font-mono text-xs h-8" />
        {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, min, max, unit }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string }) {
  return (
    <div>
      <Label className="text-xs font-medium">{label}{unit && <span className="text-muted-foreground ml-1">({unit})</span>}</Label>
      <div className="flex items-center gap-2 mt-1">
        <Input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          min={min}
          max={max}
          className="h-8 w-28"
        />
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        <div className="flex-1 flex items-center gap-1">
          <input
            type="range"
            value={value}
            onChange={e => onChange(Number(e.target.value))}
            min={min ?? 0}
            max={max ?? 200}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, hint }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string }) {
  return (
    <div>
      <Label className="text-xs font-medium">{label}</Label>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="mt-1 h-8 text-sm" />
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

function TextAreaField({ label, value, onChange, rows, hint }: { label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string }) {
  return (
    <div>
      <Label className="text-xs font-medium">{label}</Label>
      <Textarea value={value} onChange={e => onChange(e.target.value)} rows={rows ?? 3} className="mt-1 text-sm resize-none" />
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

function ToggleField({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <Label className="text-xs font-medium">{label}</Label>
        {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
        style={{ background: value ? "#9B0F5F" : "#e5e7eb" }}
      >
        <span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
          style={{ transform: value ? "translateX(24px)" : "translateX(4px)" }}
        />
      </button>
    </div>
  );
}

function StarRatingPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star className="h-4 w-4" fill={n <= value ? "#D4AF37" : "none"} stroke={n <= value ? "#D4AF37" : "#ccc"} />
        </button>
      ))}
    </div>
  );
}

export default function AdminDesign() {
  const settings = useSiteSettings();
  const update = useUpdateSiteSettings();
  const { toast } = useToast();

  const [draft, setDraft] = useState<SiteDesign>(DEFAULT_SITE_DESIGN);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const set = <K extends keyof SiteDesign>(section: K, updates: Partial<SiteDesign[K]>) => {
    setDraft(prev => ({
      ...prev,
      [section]: { ...(prev[section] as object), ...updates },
    }));
  };

  const setUsp = (idx: number, text: string) => {
    const usp = [...draft.usp];
    usp[idx] = { ...usp[idx], text };
    setDraft(prev => ({ ...prev, usp }));
  };

  const setTestimonial = (idx: number, updates: Partial<SiteDesign["testimonials"][number]>) => {
    const testimonials = [...draft.testimonials];
    testimonials[idx] = { ...testimonials[idx], ...updates };
    setDraft(prev => ({ ...prev, testimonials }));
  };

  const addTestimonial = () => {
    setDraft(prev => ({
      ...prev,
      testimonials: [...prev.testimonials, { name: "", city: "", rating: 5, text: "" }],
    }));
  };

  const removeTestimonial = (idx: number) => {
    setDraft(prev => ({
      ...prev,
      testimonials: prev.testimonials.filter((_, i) => i !== idx),
    }));
  };

  const onSave = () => {
    update.mutate(draft, {
      onSuccess: () => toast({ title: "✓ Design saved", description: "Changes are live on the store." }),
      onError: () => toast({ title: "Failed to save", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Site Design</h1>
          <p className="text-sm text-muted-foreground mt-1">Customise every section of your storefront</p>
        </div>
        <Button onClick={onSave} disabled={update.isPending} className="bg-[#9B0F5F] hover:bg-[#7d0c4c] min-w-[120px]">
          {update.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="colors">
        <TabsList className="flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="usp">USP Strip</TabsTrigger>
          <TabsTrigger value="collection">Collection</TabsTrigger>
          <TabsTrigger value="arrivals">New Arrivals</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
        </TabsList>

        {/* ── COLORS ── */}
        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>Core palette used throughout the entire store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <ColorField
                label="Primary / Brand"
                value={draft.colors.brand}
                onChange={v => set("colors", { brand: v })}
                hint="Used for buttons, links, accents — currently berry/magenta"
              />
              <ColorField
                label="Gold"
                value={draft.colors.gold}
                onChange={v => set("colors", { gold: v })}
                hint="Used for price highlights, dividers, stars"
              />
              <ColorField
                label="Dark / Background"
                value={draft.colors.dark}
                onChange={v => set("colors", { dark: v })}
                hint="Hero overlay, footer, ticker background"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── HEADER ── */}
        <TabsContent value="header">
          <Card>
            <CardHeader>
              <CardTitle>Header & Announcement Bar</CardTitle>
              <CardDescription>Sticky navbar and the top announcement strip</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <NumberField
                label="Logo Size"
                value={draft.header.logoSize}
                onChange={v => set("header", { logoSize: v })}
                min={24}
                max={120}
                unit="px"
              />
              <ToggleField
                label="Show Announcement Bar"
                value={draft.header.showAnnouncement}
                onChange={v => set("header", { showAnnouncement: v })}
              />
              <TextAreaField
                label="Announcement Text"
                value={draft.header.announcementText}
                onChange={v => set("header", { announcementText: v })}
                rows={2}
                hint="Shown in the top bar above the navbar"
              />
              <ColorField
                label="Announcement Bar Color"
                value={draft.header.announcementBgColor}
                onChange={v => set("header", { announcementBgColor: v })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── HERO ── */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>The large banner at the top of the homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextField
                label="Badge Text"
                value={draft.hero.badge}
                onChange={v => set("hero", { badge: v })}
                placeholder="New Arrivals · 2025"
                hint="Small uppercase text above the title"
              />
              <TextField
                label="Title Line 1"
                value={draft.hero.title}
                onChange={v => set("hero", { title: v })}
                placeholder="Jewellery That"
              />
              <TextField
                label="Title Line 2 (Gold color)"
                value={draft.hero.titleGold}
                onChange={v => set("hero", { titleGold: v })}
                placeholder="Lasts Forever"
                hint="Displayed in gold below the main title"
              />
              <TextField
                label="Subtitle"
                value={draft.hero.subtitle}
                onChange={v => set("hero", { subtitle: v })}
                placeholder="Anti-tarnish · Waterproof · Skin-friendly · Starting ₹399"
              />
              <TextField
                label="Shop Button Text"
                value={draft.hero.shopButtonText}
                onChange={v => set("hero", { shopButtonText: v })}
                placeholder="Shop Now"
              />
              <TextField
                label="View All Link Text"
                value={draft.hero.viewAllText}
                onChange={v => set("hero", { viewAllText: v })}
                placeholder="View All →"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── USP ── */}
        <TabsContent value="usp">
          <Card>
            <CardHeader>
              <CardTitle>USP Strip</CardTitle>
              <CardDescription>4 trust badges shown below the hero banner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {draft.usp.map((item, i) => (
                <TextField
                  key={i}
                  label={`Badge ${i + 1}`}
                  value={item.text}
                  onChange={v => setUsp(i, v)}
                  placeholder={DEFAULT_SITE_DESIGN.usp[i]?.text ?? ""}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── COLLECTION ── */}
        <TabsContent value="collection">
          <Card>
            <CardHeader>
              <CardTitle>Our Collection Section</CardTitle>
              <CardDescription>The main product grid section heading</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextField
                label="Section Label (small uppercase)"
                value={draft.collection.label}
                onChange={v => set("collection", { label: v })}
                placeholder="Shop All Jewellery"
              />
              <TextField
                label="Section Title"
                value={draft.collection.title}
                onChange={v => set("collection", { title: v })}
                placeholder="Our Collection"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ARRIVALS ── */}
        <TabsContent value="arrivals">
          <Card>
            <CardHeader>
              <CardTitle>New Arrivals / Best Sellers</CardTitle>
              <CardDescription>The horizontal slider section with tabs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextField
                label="New Arrivals Tab Label"
                value={draft.tabs.newArrivalsLabel}
                onChange={v => set("tabs", { newArrivalsLabel: v })}
                placeholder="New Arrivals"
              />
              <TextField
                label="Best Sellers Tab Label"
                value={draft.tabs.bestSellersLabel}
                onChange={v => set("tabs", { bestSellersLabel: v })}
                placeholder="Best Sellers"
              />
              <TextField
                label="Shop All Link Text"
                value={draft.tabs.shopAllText}
                onChange={v => set("tabs", { shopAllText: v })}
                placeholder="Shop All →"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TESTIMONIALS ── */}
        <TabsContent value="testimonials">
          <Card>
            <CardHeader>
              <CardTitle>Customer Testimonials</CardTitle>
              <CardDescription>Reviews shown at the bottom of the homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {draft.testimonials.map((t, i) => (
                <div key={i} className="border rounded-md p-4 space-y-3 relative">
                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={() => removeTestimonial(i)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <TextField label="Name" value={t.name} onChange={v => setTestimonial(i, { name: v })} placeholder="Customer Name" />
                    <TextField label="City" value={t.city} onChange={v => setTestimonial(i, { city: v })} placeholder="City" />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Rating</Label>
                    <div className="mt-1"><StarRatingPicker value={t.rating} onChange={v => setTestimonial(i, { rating: v })} /></div>
                  </div>
                  <TextAreaField
                    label="Review Text"
                    value={t.text}
                    onChange={v => setTestimonial(i, { text: v })}
                    rows={2}
                  />
                </div>
              ))}
              <Button type="button" variant="outline" className="w-full" onClick={addTestimonial}>
                + Add Testimonial
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── FOOTER ── */}
        <TabsContent value="footer">
          <Card>
            <CardHeader>
              <CardTitle>Footer</CardTitle>
              <CardDescription>Logo size, tagline, and social links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <NumberField
                label="Footer Logo Size"
                value={draft.footer.logoSize}
                onChange={v => set("footer", { logoSize: v })}
                min={24}
                max={150}
                unit="px"
              />
              <TextAreaField
                label="Brand Tagline"
                value={draft.footer.tagline}
                onChange={v => set("footer", { tagline: v })}
                rows={3}
                hint="Use newlines to control line breaks"
              />
              <TextField
                label="Instagram URL"
                value={draft.footer.instagramUrl}
                onChange={v => set("footer", { instagramUrl: v })}
                placeholder="https://instagram.com/yourhandle"
              />
              <TextField
                label="Facebook URL"
                value={draft.footer.facebookUrl}
                onChange={v => set("footer", { facebookUrl: v })}
                placeholder="https://facebook.com/yourpage"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-2">
        <Button onClick={onSave} disabled={update.isPending} className="bg-[#9B0F5F] hover:bg-[#7d0c4c] min-w-[140px]">
          {update.isPending ? "Saving…" : "Save All Changes"}
        </Button>
      </div>
    </div>
  );
}
