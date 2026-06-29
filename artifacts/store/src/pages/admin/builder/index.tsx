import { useState, useEffect } from "react";
import { useSiteSettings, useUpdateSiteSettings } from "@/hooks/use-site-settings";
import type { HomepageSection } from "@/components/section-renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MediaPicker } from "@/components/media-picker";
import {
  Eye, EyeOff, ChevronUp, ChevronDown, Trash2, Plus, ExternalLink,
  LayoutTemplate, Megaphone, Image as ImageIcon, Grid3X3, Users,
  AlignLeft, MessageSquare, Code, Sparkles, X, Star,
} from "lucide-react";

const BRAND = "#9B0F5F";

type SectionTypeMeta = {
  type: HomepageSection["type"];
  label: string;
  description: string;
  icon: React.ElementType;
  defaultConfig: Record<string, unknown>;
};

const SECTION_TYPES: SectionTypeMeta[] = [
  {
    type: "hero",
    label: "Hero Banner",
    description: "Full-width banner with headline and CTA button",
    icon: ImageIcon,
    defaultConfig: {
      badge: "New Arrivals · 2025",
      title: "Jewellery That",
      titleGold: "Lasts Forever",
      subtitle: "Anti-tarnish · Waterproof · Skin-friendly",
      shopButtonText: "Shop Now",
      imageUrl: "/brand/hero-banner.png",
    },
  },
  {
    type: "product_grid",
    label: "Product Grid",
    description: "Showcase products in a grid or slider",
    icon: Grid3X3,
    defaultConfig: {
      title: "Featured Products",
      subtitle: "",
      filter: "newest",
      limit: 8,
      layout: "grid",
      bgColor: "#ffffff",
    },
  },
  {
    type: "category_grid",
    label: "Category Grid",
    description: "Browsable category circles from your catalog",
    icon: LayoutTemplate,
    defaultConfig: { title: "Shop by Category", subtitle: "Browse" },
  },
  {
    type: "testimonials",
    label: "Testimonials",
    description: "Customer review cards",
    icon: Users,
    defaultConfig: {
      title: "What Our Customers Say",
      subtitle: "Testimonials",
      reviews: [
        { name: "Happy Customer", city: "India", rating: 5, text: "Amazing quality! Highly recommend." },
      ],
    },
  },
  {
    type: "text_image",
    label: "Text + Image",
    description: "Side-by-side text content with an image",
    icon: AlignLeft,
    defaultConfig: {
      title: "Our Story",
      body: "Tell your brand story here.",
      imageUrl: "",
      imagePosition: "right",
      bgColor: "#ffffff",
      buttonText: "Learn More",
      buttonUrl: "/shop",
    },
  },
  {
    type: "strip",
    label: "Announcement Strip",
    description: "Scrolling ticker with custom messages",
    icon: Megaphone,
    defaultConfig: {
      items: ["✦ Free Shipping above ₹999", "✦ Anti-Tarnish Jewellery", "✦ Ships in 24 Hours"],
      bgColor: "#1a0a0f",
      textColor: "#D4AF37",
    },
  },
  {
    type: "whatsapp_cta",
    label: "WhatsApp CTA",
    description: "WhatsApp community join button",
    icon: MessageSquare,
    defaultConfig: {
      title: "Join Our WhatsApp Community",
      subtitle: "Get exclusive offers, new launch alerts & care tips directly on WhatsApp.",
      waNumber: "919618535437",
      bgColor: BRAND,
    },
  },
  {
    type: "custom_html",
    label: "Custom HTML",
    description: "Embed any custom HTML or embed code",
    icon: Code,
    defaultConfig: { html: "<!-- Your custom HTML here -->" },
  },
];

type ReviewEntry = { name: string; city: string; rating: number; text: string };

function generateId() {
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function SectionIcon({ type }: { type: HomepageSection["type"] }) {
  const meta = SECTION_TYPES.find((t) => t.type === type);
  const Icon = meta?.icon ?? Sparkles;
  return <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />;
}

function SectionLabel({ type }: { type: HomepageSection["type"] }) {
  return <>{SECTION_TYPES.find((t) => t.type === type)?.label ?? type}</>;
}

// ── Section editor fields ──────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or /path/to/image" className="h-8 text-sm flex-1" />
        <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setPickerOpen(true)}>
          <ImageIcon className="h-3.5 w-3.5 mr-1" /> Library
        </Button>
      </div>
      {value && (
        <img src={value} alt="preview" className="mt-2 h-20 w-full object-cover rounded border" />
      )}
      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={(url) => { onChange(url); setPickerOpen(false); }} />
    </Field>
  );
}

function SectionEditor({
  section,
  onChange,
}: {
  section: HomepageSection;
  onChange: (config: Record<string, unknown>) => void;
}) {
  const cfg = section.config;
  const set = (key: string, val: unknown) => onChange({ ...cfg, [key]: val });

  switch (section.type) {
    case "hero":
      return (
        <div className="space-y-4">
          <Field label="Badge Text">
            <Input value={(cfg.badge as string) ?? ""} onChange={(e) => set("badge", e.target.value)} className="h-8 text-sm" />
          </Field>
          <Field label="Title Line 1">
            <Input value={(cfg.title as string) ?? ""} onChange={(e) => set("title", e.target.value)} className="h-8 text-sm" />
          </Field>
          <Field label="Title Line 2 (gold)">
            <Input value={(cfg.titleGold as string) ?? ""} onChange={(e) => set("titleGold", e.target.value)} className="h-8 text-sm" />
          </Field>
          <Field label="Subtitle">
            <Input value={(cfg.subtitle as string) ?? ""} onChange={(e) => set("subtitle", e.target.value)} className="h-8 text-sm" />
          </Field>
          <Field label="Button Text">
            <Input value={(cfg.shopButtonText as string) ?? ""} onChange={(e) => set("shopButtonText", e.target.value)} className="h-8 text-sm" />
          </Field>
          <ImageField label="Background Image" value={(cfg.imageUrl as string) ?? ""} onChange={(v) => set("imageUrl", v)} />
        </div>
      );

    case "strip":
      return (
        <div className="space-y-4">
          <Field label="Items (one per line)">
            <Textarea
              value={((cfg.items as string[] | undefined) ?? []).join("\n")}
              onChange={(e) => set("items", e.target.value.split("\n").filter(Boolean))}
              className="text-sm font-mono h-28 resize-none"
              placeholder="✦ Free Shipping above ₹999"
            />
          </Field>
          <Field label="Background Color">
            <div className="flex items-center gap-2">
              <input type="color" value={(cfg.bgColor as string) ?? "#1a0a0f"} onChange={(e) => set("bgColor", e.target.value)} className="h-8 w-12 rounded border cursor-pointer p-0.5" />
              <Input value={(cfg.bgColor as string) ?? "#1a0a0f"} onChange={(e) => set("bgColor", e.target.value)} className="h-8 text-sm font-mono flex-1" />
            </div>
          </Field>
          <Field label="Text Color">
            <div className="flex items-center gap-2">
              <input type="color" value={(cfg.textColor as string) ?? "#D4AF37"} onChange={(e) => set("textColor", e.target.value)} className="h-8 w-12 rounded border cursor-pointer p-0.5" />
              <Input value={(cfg.textColor as string) ?? "#D4AF37"} onChange={(e) => set("textColor", e.target.value)} className="h-8 text-sm font-mono flex-1" />
            </div>
          </Field>
        </div>
      );

    case "product_grid":
      return (
        <div className="space-y-4">
          <Field label="Title">
            <Input value={(cfg.title as string) ?? ""} onChange={(e) => set("title", e.target.value)} className="h-8 text-sm" />
          </Field>
          <Field label="Subtitle (small text above title)">
            <Input value={(cfg.subtitle as string) ?? ""} onChange={(e) => set("subtitle", e.target.value)} className="h-8 text-sm" />
          </Field>
          <Field label="Filter">
            <select value={(cfg.filter as string) ?? "newest"} onChange={(e) => set("filter", e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm">
              <option value="newest">Newest</option>
              <option value="featured">Featured / Best Sellers</option>
              <option value="all">All Products</option>
            </select>
          </Field>
          <Field label="Number of Products">
            <Input type="number" min={2} max={24} value={(cfg.limit as number) ?? 8} onChange={(e) => set("limit", Number(e.target.value))} className="h-8 text-sm" />
          </Field>
          <Field label="Layout">
            <select value={(cfg.layout as string) ?? "grid"} onChange={(e) => set("layout", e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm">
              <option value="grid">Grid</option>
              <option value="slider">Horizontal Slider</option>
            </select>
          </Field>
          <Field label="Background Color">
            <div className="flex items-center gap-2">
              <input type="color" value={(cfg.bgColor as string) ?? "#ffffff"} onChange={(e) => set("bgColor", e.target.value)} className="h-8 w-12 rounded border cursor-pointer p-0.5" />
              <Input value={(cfg.bgColor as string) ?? "#ffffff"} onChange={(e) => set("bgColor", e.target.value)} className="h-8 text-sm font-mono flex-1" />
            </div>
          </Field>
        </div>
      );

    case "category_grid":
      return (
        <div className="space-y-4">
          <Field label="Section Title">
            <Input value={(cfg.title as string) ?? ""} onChange={(e) => set("title", e.target.value)} className="h-8 text-sm" />
          </Field>
          <Field label="Subtitle (small text above title)">
            <Input value={(cfg.subtitle as string) ?? ""} onChange={(e) => set("subtitle", e.target.value)} className="h-8 text-sm" />
          </Field>
          <p className="text-xs text-muted-foreground bg-muted rounded p-3">
            Categories are loaded automatically from your catalog. Manage them in the <strong>Categories</strong> section.
          </p>
        </div>
      );

    case "testimonials": {
      const reviews = (cfg.reviews as ReviewEntry[] | undefined) ?? [];
      const setReviews = (r: ReviewEntry[]) => set("reviews", r);
      const updateReview = (i: number, upd: Partial<ReviewEntry>) => {
        const r = [...reviews];
        r[i] = { ...r[i], ...upd };
        setReviews(r);
      };
      const addReview = () => setReviews([...reviews, { name: "", city: "", rating: 5, text: "" }]);
      const removeReview = (i: number) => setReviews(reviews.filter((_, idx) => idx !== i));

      return (
        <div className="space-y-4">
          <Field label="Section Title">
            <Input value={(cfg.title as string) ?? ""} onChange={(e) => set("title", e.target.value)} className="h-8 text-sm" />
          </Field>
          <Field label="Subtitle">
            <Input value={(cfg.subtitle as string) ?? ""} onChange={(e) => set("subtitle", e.target.value)} className="h-8 text-sm" />
          </Field>
          <div className="space-y-3">
            <Label className="text-xs font-medium">Reviews</Label>
            {reviews.map((review, i) => (
              <div key={i} className="border rounded-md p-3 space-y-2 relative">
                <button type="button" className="absolute top-2 right-2 text-red-400 hover:text-red-600" onClick={() => removeReview(i)}>
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px]">Name</Label>
                    <Input value={review.name} onChange={(e) => updateReview(i, { name: e.target.value })} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[10px]">City</Label>
                    <Input value={review.city} onChange={(e) => updateReview(i, { city: e.target.value })} className="h-7 text-xs" />
                  </div>
                </div>
                <div>
                  <Label className="text-[10px]">Rating</Label>
                  <div className="flex gap-1 mt-1">
                    {[1,2,3,4,5].map((n) => (
                      <button key={n} type="button" onClick={() => updateReview(i, { rating: n })}>
                        <Star className="h-4 w-4" fill={n <= review.rating ? "#D4AF37" : "none"} stroke={n <= review.rating ? "#D4AF37" : "#ccc"} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-[10px]">Review Text</Label>
                  <Textarea value={review.text} onChange={(e) => updateReview(i, { text: e.target.value })} className="h-16 text-xs resize-none mt-1" />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="w-full text-xs" onClick={addReview}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Review
            </Button>
          </div>
        </div>
      );
    }

    case "text_image":
      return (
        <div className="space-y-4">
          <Field label="Title">
            <Input value={(cfg.title as string) ?? ""} onChange={(e) => set("title", e.target.value)} className="h-8 text-sm" />
          </Field>
          <Field label="Body Text">
            <Textarea value={(cfg.body as string) ?? ""} onChange={(e) => set("body", e.target.value)} className="h-24 text-sm resize-none" />
          </Field>
          <ImageField label="Image" value={(cfg.imageUrl as string) ?? ""} onChange={(v) => set("imageUrl", v)} />
          <Field label="Image Position">
            <select value={(cfg.imagePosition as string) ?? "right"} onChange={(e) => set("imagePosition", e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm">
              <option value="right">Image on Right</option>
              <option value="left">Image on Left</option>
            </select>
          </Field>
          <Field label="Button Text (optional)">
            <Input value={(cfg.buttonText as string) ?? ""} onChange={(e) => set("buttonText", e.target.value)} className="h-8 text-sm" placeholder="Learn More" />
          </Field>
          <Field label="Button URL">
            <Input value={(cfg.buttonUrl as string) ?? "/shop"} onChange={(e) => set("buttonUrl", e.target.value)} className="h-8 text-sm" />
          </Field>
          <Field label="Background Color">
            <div className="flex items-center gap-2">
              <input type="color" value={(cfg.bgColor as string) ?? "#ffffff"} onChange={(e) => set("bgColor", e.target.value)} className="h-8 w-12 rounded border cursor-pointer p-0.5" />
              <Input value={(cfg.bgColor as string) ?? "#ffffff"} onChange={(e) => set("bgColor", e.target.value)} className="h-8 text-sm font-mono flex-1" />
            </div>
          </Field>
        </div>
      );

    case "whatsapp_cta":
      return (
        <div className="space-y-4">
          <Field label="Title">
            <Input value={(cfg.title as string) ?? ""} onChange={(e) => set("title", e.target.value)} className="h-8 text-sm" />
          </Field>
          <Field label="Subtitle">
            <Textarea value={(cfg.subtitle as string) ?? ""} onChange={(e) => set("subtitle", e.target.value)} className="h-20 text-sm resize-none" />
          </Field>
          <Field label="WhatsApp Number (with country code)">
            <Input value={(cfg.waNumber as string) ?? ""} onChange={(e) => set("waNumber", e.target.value)} className="h-8 text-sm font-mono" placeholder="919618535437" />
          </Field>
          <Field label="Background Color">
            <div className="flex items-center gap-2">
              <input type="color" value={(cfg.bgColor as string) ?? BRAND} onChange={(e) => set("bgColor", e.target.value)} className="h-8 w-12 rounded border cursor-pointer p-0.5" />
              <Input value={(cfg.bgColor as string) ?? BRAND} onChange={(e) => set("bgColor", e.target.value)} className="h-8 text-sm font-mono flex-1" />
            </div>
          </Field>
        </div>
      );

    case "custom_html":
      return (
        <div className="space-y-4">
          <Field label="Custom HTML">
            <Textarea value={(cfg.html as string) ?? ""} onChange={(e) => set("html", e.target.value)}
              className="h-48 text-xs font-mono resize-y" placeholder="<!-- Your HTML here -->" />
          </Field>
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
            ⚠️ Custom HTML is injected as-is. Make sure it is safe before saving.
          </p>
        </div>
      );

    default:
      return <p className="text-sm text-muted-foreground">No editor for this section type.</p>;
  }
}

// ── Main builder page ──────────────────────────────────────────────────────
export default function AdminBuilder() {
  const settings = useSiteSettings();
  const update = useUpdateSiteSettings();
  const { toast } = useToast();

  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState(false);

  useEffect(() => {
    if (settings.homepageSections && settings.homepageSections.length > 0) {
      setSections(
        [...settings.homepageSections].sort((a, b) => a.order - b.order)
      );
    }
  }, [settings.homepageSections]);

  const selectedSection = sections.find((s) => s.id === selectedId) ?? null;

  const move = (id: string, dir: "up" | "down") => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (dir === "up" && idx === 0) return prev;
      if (dir === "down" && idx === prev.length - 1) return prev;
      const newSections = [...prev];
      const swap = dir === "up" ? idx - 1 : idx + 1;
      [newSections[idx], newSections[swap]] = [newSections[swap], newSections[idx]];
      return newSections.map((s, i) => ({ ...s, order: i }));
    });
  };

  const toggleVisible = (id: string) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, isVisible: !s.isVisible } : s));
  };

  const deleteSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })));
    if (selectedId === id) setSelectedId(null);
  };

  const addSection = (meta: SectionTypeMeta) => {
    const newSection: HomepageSection = {
      id: generateId(),
      type: meta.type,
      isVisible: true,
      order: sections.length,
      config: { ...meta.defaultConfig },
    };
    setSections((prev) => [...prev, newSection]);
    setSelectedId(newSection.id);
    setAddingSection(false);
  };

  const updateConfig = (id: string, config: Record<string, unknown>) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, config } : s));
  };

  const handleSave = () => {
    update.mutate(
      { homepageSections: sections } as Parameters<typeof update.mutate>[0],
      {
        onSuccess: () => toast({ title: "✓ Homepage saved", description: "Changes are live on the store." }),
        onError: () => toast({ title: "Failed to save", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Page Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">Drag sections to reorder — changes go live when you save</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" /> Preview Store
            </Button>
          </a>
          <Button onClick={handleSave} disabled={update.isPending} style={{ background: BRAND }} className="text-white hover:opacity-90 min-w-[120px]">
            {update.isPending ? "Saving…" : "Save & Publish"}
          </Button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left: section list */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-3">
          <Button variant="outline" className="w-full gap-2" onClick={() => setAddingSection(true)}>
            <Plus className="h-4 w-4" /> Add Section
          </Button>

          <div className="space-y-2 overflow-y-auto">
            {sections.map((section, idx) => {
              const isSelected = selectedId === section.id;
              return (
                <div
                  key={section.id}
                  className={`border rounded-lg p-3 transition-all cursor-pointer ${
                    isSelected ? "border-[#9B0F5F] bg-pink-50/50" : "border-gray-200 bg-white hover:border-gray-300"
                  } ${!section.isVisible ? "opacity-50" : ""}`}
                  onClick={() => setSelectedId(isSelected ? null : section.id)}
                >
                  <div className="flex items-center gap-2">
                    <SectionIcon type={section.type} />
                    <span className="text-sm font-medium flex-1 truncate">
                      <SectionLabel type={section.type} />
                      {typeof section.config.title === "string" && section.config.title && (
                        <span className="text-muted-foreground font-normal ml-1 text-xs truncate">
                          — {section.config.title}
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleVisible(section.id)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground"
                        title={section.isVisible ? "Hide section" : "Show section"}
                      >
                        {section.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => move(section.id, "up")} disabled={idx === 0}
                        className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30">
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => move(section.id, "down")} disabled={idx === sections.length - 1}
                        className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30">
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteSection(section.id)}
                        className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {sections.length === 0 && (
              <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                <LayoutTemplate className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No sections yet. Click "Add Section" to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: section editor */}
        <div className="flex-1 min-w-0">
          {selectedSection ? (
            <div className="bg-white border rounded-lg p-6 h-full overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <SectionIcon type={selectedSection.type} />
                <div className="flex-1">
                  <h2 className="font-semibold text-base"><SectionLabel type={selectedSection.type} /></h2>
                  <p className="text-xs text-muted-foreground">
                    {SECTION_TYPES.find((t) => t.type === selectedSection.type)?.description}
                  </p>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SectionEditor
                section={selectedSection}
                onChange={(config) => updateConfig(selectedSection.id, config)}
              />
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed rounded-lg h-full flex flex-col items-center justify-center text-muted-foreground">
              <LayoutTemplate className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Select a section to edit its settings</p>
              <p className="text-xs mt-1">Or add a new section from the panel on the left</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Section Modal */}
      {addingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-serif font-bold text-lg">Add Section</h2>
              <button onClick={() => setAddingSection(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 p-6 overflow-y-auto">
              {SECTION_TYPES.map((meta) => {
                const Icon = meta.icon;
                return (
                  <button
                    key={meta.type}
                    onClick={() => addSection(meta)}
                    className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#9B0F5F] hover:bg-pink-50/30 text-left transition-all group"
                  >
                    <div className="h-9 w-9 rounded-md flex items-center justify-center flex-shrink-0 bg-gray-100 group-hover:bg-pink-100">
                      <Icon className="h-5 w-5 text-gray-500 group-hover:text-[#9B0F5F]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 group-hover:text-[#9B0F5F]">{meta.label}</p>
                      <p className="text-xs text-muted-foreground leading-snug mt-0.5">{meta.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
