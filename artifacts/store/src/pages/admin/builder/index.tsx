import { useState, useEffect } from "react";
import { useAuth } from "@/lib/clerk-stub";
import { useSiteSettings, useUpdateSiteSettings } from "@/hooks/use-site-settings";
import type { HomepageSection } from "@/components/section-renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MediaPicker } from "@/components/media-picker";
import {
  useLandingPages, useCreateLandingPage, useUpdateLandingPage, useDeleteLandingPage, useReorderLandingPages,
  type LandingPageSummary,
} from "@/hooks/use-landing-pages";
import { useQuery } from "@tanstack/react-query";
import {
  Eye, EyeOff, Trash2, Plus, ExternalLink,
  LayoutTemplate, Megaphone, Image as ImageIcon, Grid3X3, Users,
  AlignLeft, MessageSquare, Code, Sparkles, X, Star,
  Home, FileText, Globe, GlobeLock, PencilLine, ChevronLeft, GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const BRAND = "#9B0F5F";
const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

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

// ── Sortable section card ──────────────────────────────────────────────────
function SortableSectionCard({
  section,
  isSelected,
  onSelect,
  onToggleVisible,
  onDelete,
  isDragOverlay,
}: {
  section: HomepageSection;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
  onDelete: () => void;
  isDragOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 0 : undefined,
  };

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={isDragOverlay ? undefined : style}
      className={`border rounded-lg p-3 transition-colors cursor-pointer ${
        isDragOverlay
          ? "border-[#9B0F5F] bg-pink-50/80 shadow-lg rotate-1"
          : isSelected
          ? "border-[#9B0F5F] bg-pink-50/50"
          : "border-gray-200 bg-white hover:border-gray-300"
      } ${!section.isVisible && !isDragOverlay ? "opacity-50" : ""}`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2">
        {/* Drag handle */}
        <button
          type="button"
          {...(isDragOverlay ? {} : { ...attributes, ...listeners })}
          className="p-0.5 rounded text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
          onClick={(e) => e.stopPropagation()}
          title="Drag to reorder"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
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
            onClick={onToggleVisible}
            className="p-1 rounded hover:bg-muted text-muted-foreground"
            title={section.isVisible ? "Hide section" : "Show section"}
          >
            {section.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Section list + editor panel (shared for homepage and landing pages) ────
function SectionsEditor({
  sections,
  setSections,
  selectedId,
  setSelectedId,
  addingSection,
  setAddingSection,
}: {
  sections: HomepageSection[];
  setSections: React.Dispatch<React.SetStateAction<HomepageSection[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  addingSection: boolean;
  setAddingSection: (v: boolean) => void;
}) {
  const selectedSection = sections.find((s) => s.id === selectedId) ?? null;
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSections((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      return arrayMove(prev, oldIndex, newIndex).map((s, i) => ({ ...s, order: i }));
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

  const activeSection = activeDragId ? sections.find((s) => s.id === activeDragId) ?? null : null;

  return (
    <div className="flex gap-6 flex-1 min-h-0">
      {/* Left: section list */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-3">
        <Button variant="outline" className="w-full gap-2" onClick={() => setAddingSection(true)}>
          <Plus className="h-4 w-4" /> Add Section
        </Button>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 overflow-y-auto">
              {sections.map((section) => (
                <SortableSectionCard
                  key={section.id}
                  section={section}
                  isSelected={selectedId === section.id}
                  onSelect={() => setSelectedId(selectedId === section.id ? null : section.id)}
                  onToggleVisible={() => toggleVisible(section.id)}
                  onDelete={() => deleteSection(section.id)}
                />
              ))}

              {sections.length === 0 && (
                <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                  <LayoutTemplate className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No sections yet. Click "Add Section" to get started.</p>
                </div>
              )}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeSection && (
              <SortableSectionCard
                section={activeSection}
                isSelected={false}
                onSelect={() => {}}
                onToggleVisible={() => {}}
                onDelete={() => {}}
                isDragOverlay
              />
            )}
          </DragOverlay>
        </DndContext>
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

// ── Homepage builder ────────────────────────────────────────────────────────
function HomepageBuilder() {
  const settings = useSiteSettings();
  const update = useUpdateSiteSettings();
  const { toast } = useToast();

  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [showSeo, setShowSeo] = useState(false);

  useEffect(() => {
    if (settings.homepageSections && settings.homepageSections.length > 0) {
      setSections([...settings.homepageSections].sort((a, b) => a.order - b.order));
    }
    setMetaTitle(settings.homepageMetaTitle ?? "");
    setMetaDescription(settings.homepageMetaDescription ?? "");
  }, [settings.homepageSections, settings.homepageMetaTitle, settings.homepageMetaDescription]);

  const handleSave = () => {
    update.mutate(
      {
        homepageSections: sections,
        homepageMetaTitle: metaTitle || "",
        homepageMetaDescription: metaDescription || "",
      } as Parameters<typeof update.mutate>[0],
      {
        onSuccess: () => toast({ title: "✓ Homepage saved", description: "Changes are live on the store." }),
        onError: () => toast({ title: "Failed to save", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-[#9B0F5F]" />
          <span className="font-semibold text-sm">Homepage</span>
          <span className="text-xs text-muted-foreground">— live at /</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSeo((v) => !v)}
            title="SEO settings"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
              showSeo
                ? "border-[#9B0F5F] bg-pink-50 text-[#9B0F5F]"
                : "border-gray-200 text-gray-500 hover:border-gray-400"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            SEO
          </button>
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" /> Preview
            </Button>
          </a>
          <Button onClick={handleSave} disabled={update.isPending} style={{ background: BRAND }} className="text-white hover:opacity-90 min-w-[120px]">
            {update.isPending ? "Saving…" : "Save & Publish"}
          </Button>
        </div>
      </div>

      {showSeo && (
        <div className="mb-4 border rounded-lg bg-white p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-4 w-4 text-[#9B0F5F]" />
            <h3 className="font-semibold text-sm">SEO &amp; Social Sharing</h3>
            <span className="text-xs text-muted-foreground ml-auto">Saved when you click Save &amp; Publish</span>
          </div>
          <Field label="Page Title (browser tab &amp; Google)">
            <Input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Sriswa Studio"
              maxLength={70}
              className="h-9 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">{metaTitle.length}/70 characters — leave blank to use the default store name</p>
          </Field>
          <Field label="Meta Description (shown in Google results &amp; WhatsApp previews)">
            <Textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Describe your homepage in 1–2 sentences…"
              maxLength={160}
              className="h-20 text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">{metaDescription.length}/160 characters</p>
          </Field>
        </div>
      )}

      <SectionsEditor
        sections={sections}
        setSections={setSections}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        addingSection={addingSection}
        setAddingSection={setAddingSection}
      />
    </div>
  );
}

// ── Landing page builder ────────────────────────────────────────────────────
function LandingPageBuilder({ page, onBack }: { page: LandingPageSummary; onBack: () => void }) {
  const { toast } = useToast();
  const update = useUpdateLandingPage();

  const { getToken } = useAuth();

  const { data: fullPage, isLoading } = useQuery({
    queryKey: ["landing-page-full", page.id],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/admin/landing-pages/${page.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [isPublished, setIsPublished] = useState(page.isPublished);
  const [isInNav, setIsInNav] = useState(page.isInNav ?? false);
  const [metaTitle, setMetaTitle] = useState(page.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(page.metaDescription ?? "");
  const [showSeo, setShowSeo] = useState(false);

  useEffect(() => {
    if (fullPage?.sections) {
      setSections([...fullPage.sections as HomepageSection[]].sort((a, b) => a.order - b.order));
    }
    if (fullPage?.isInNav !== undefined) {
      setIsInNav(fullPage.isInNav);
    }
    if (fullPage?.metaTitle !== undefined) {
      setMetaTitle(fullPage.metaTitle ?? "");
    }
    if (fullPage?.metaDescription !== undefined) {
      setMetaDescription(fullPage.metaDescription ?? "");
    }
  }, [fullPage]);

  const handleSave = (pub?: boolean) => {
    const publishedValue = pub ?? isPublished;
    update.mutate(
      { id: page.id, sections, isPublished: publishedValue, isInNav, metaTitle: metaTitle || null, metaDescription: metaDescription || null },
      {
        onSuccess: () => {
          setIsPublished(publishedValue);
          toast({
            title: publishedValue ? "✓ Page saved & published" : "✓ Page saved",
            description: publishedValue ? `Live at /p/${page.slug}` : "Saved as draft.",
          });
        },
        onError: () => toast({ title: "Failed to save", variant: "destructive" }),
      }
    );
  };

  const handleToggleNav = () => {
    const newVal = !isInNav;
    setIsInNav(newVal);
    update.mutate(
      { id: page.id, isInNav: newVal },
      {
        onSuccess: () => toast({
          title: newVal ? "✓ Added to navigation" : "✓ Removed from navigation",
          description: newVal ? "Page will appear in the nav and footer." : "Page is no longer in nav.",
        }),
        onError: () => { setIsInNav(!newVal); toast({ title: "Failed to update", variant: "destructive" }); },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-[#9B0F5F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm">
            <ChevronLeft className="h-4 w-4" /> My Pages
          </button>
          <span className="text-muted-foreground">/</span>
          <FileText className="h-4 w-4 text-[#9B0F5F]" />
          <span className="font-semibold text-sm">{page.title}</span>
          <span className="text-xs text-muted-foreground">— /p/{page.slug}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {isPublished ? "Published" : "Draft"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSeo((v) => !v)}
            title="SEO settings"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
              showSeo
                ? "border-[#9B0F5F] bg-pink-50 text-[#9B0F5F]"
                : "border-gray-200 text-gray-500 hover:border-gray-400"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            SEO
          </button>
          <button
            type="button"
            onClick={handleToggleNav}
            disabled={!isPublished || update.isPending}
            title={
              !isPublished
                ? "Publish this page first — draft pages are never shown in navigation"
                : isInNav
                ? "Remove from site navigation"
                : "Show in site navigation"
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
              !isPublished
                ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
                : isInNav
                ? "border-[#9B0F5F] bg-pink-50 text-[#9B0F5F]"
                : "border-gray-200 text-gray-500 hover:border-gray-400"
            }`}
          >
            <GlobeLock className="h-3.5 w-3.5" />
            {isInNav ? "In Nav" : "Add to Nav"}
          </button>
          <a
            href={isPublished ? `/p/${page.slug}` : `/p/${page.slug}?preview=1`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              {isPublished ? "Preview" : "Preview Draft"}
            </Button>
          </a>
          {!isPublished ? (
            <Button onClick={() => handleSave(true)} disabled={update.isPending} variant="outline" size="sm" className="gap-1.5 border-green-500 text-green-600 hover:bg-green-50">
              <Globe className="h-3.5 w-3.5" /> Publish
            </Button>
          ) : (
            <Button onClick={() => handleSave(false)} disabled={update.isPending} variant="outline" size="sm" className="gap-1.5 border-orange-400 text-orange-600 hover:bg-orange-50">
              <GlobeLock className="h-3.5 w-3.5" /> Unpublish
            </Button>
          )}
          <Button onClick={() => handleSave()} disabled={update.isPending} style={{ background: BRAND }} className="text-white hover:opacity-90 min-w-[100px]">
            {update.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {showSeo && (
        <div className="mb-4 border rounded-lg bg-white p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-4 w-4 text-[#9B0F5F]" />
            <h3 className="font-semibold text-sm">SEO &amp; Social Sharing</h3>
            <span className="text-xs text-muted-foreground ml-auto">Saved when you click Save</span>
          </div>
          <Field label="Page Title (browser tab &amp; Google)">
            <Input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder={page.title}
              maxLength={70}
              className="h-9 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">{metaTitle.length}/70 characters — leave blank to use the page title</p>
          </Field>
          <Field label="Meta Description (shown in Google results &amp; WhatsApp previews)">
            <Textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Describe this page in 1–2 sentences…"
              maxLength={160}
              className="h-20 text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">{metaDescription.length}/160 characters</p>
          </Field>
        </div>
      )}

      <SectionsEditor
        sections={sections}
        setSections={setSections}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        addingSection={addingSection}
        setAddingSection={setAddingSection}
      />
    </div>
  );
}

// ── New page creation modal ─────────────────────────────────────────────────
function NewPageModal({ onClose, onCreate }: { onClose: () => void; onCreate: (page: LandingPageSummary) => void }) {
  const { toast } = useToast();
  const create = useCreateLandingPage();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!slugEdited) {
      setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) return;
    create.mutate(
      { title: title.trim(), slug: slug.trim() },
      {
        onSuccess: (page) => {
          toast({ title: "Page created", description: `Editing /p/${(page as LandingPageSummary).slug}` });
          onCreate(page as LandingPageSummary);
        },
        onError: (err) => toast({ title: err.message || "Failed to create page", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-serif font-bold text-lg">New Landing Page</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Page Title">
            <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="e.g. Sale — Up to 50% Off" className="h-9" autoFocus />
          </Field>
          <Field label="URL Slug">
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground whitespace-nowrap">/p/</span>
              <Input
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
                placeholder="sale"
                className="h-9 font-mono text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Only lowercase letters, numbers, and hyphens.</p>
          </Field>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={create.isPending || !title.trim() || !slug.trim()} style={{ background: BRAND }} className="flex-1 text-white hover:opacity-90">
              {create.isPending ? "Creating…" : "Create Page"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sortable page row ────────────────────────────────────────────────────────
function SortablePageRow({
  page,
  onSelect,
  onDelete,
  isDragOverlay,
}: {
  page: LandingPageSummary;
  onSelect: () => void;
  onDelete: () => void;
  isDragOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={isDragOverlay ? undefined : style}
      className={`border rounded-lg p-4 bg-white transition-all flex items-center gap-3 ${
        isDragOverlay ? "border-[#9B0F5F] shadow-lg rotate-1 bg-pink-50/80" : "hover:border-gray-300"
      }`}
    >
      <button
        type="button"
        {...(isDragOverlay ? {} : { ...attributes, ...listeners })}
        className="p-1 rounded text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        onClick={(e) => e.stopPropagation()}
        title="Drag to reorder"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onSelect}>
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{page.title}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${page.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {page.isPublished ? "Published" : "Draft"}
          </span>
          {page.isInNav && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 bg-pink-100 text-pink-700">
              In Nav
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 font-mono">/p/{page.slug}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {page.isPublished && (
          <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
            <button className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="Open page">
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </a>
        )}
        <button className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="Edit page" onClick={onSelect}>
          <PencilLine className="h-3.5 w-3.5" />
        </button>
        <button
          className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"
          title="Delete page"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── My Pages sidebar list ───────────────────────────────────────────────────
function MyPagesList({ onSelect }: { onSelect: (page: LandingPageSummary) => void }) {
  const { data: rawPages = [], isLoading } = useLandingPages();
  const deletePage = useDeleteLandingPage();
  const reorder = useReorderLandingPages();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [pages, setPages] = useState<LandingPageSummary[]>([]);
  const [activeDragId, setActiveDragId] = useState<number | null>(null);

  useEffect(() => {
    setPages([...rawPages].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)));
  }, [rawPages]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPages((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      const items = reordered.map((p, i) => ({ id: p.id, sortOrder: i }));
      reorder.mutate(items, {
        onError: () => toast({ title: "Failed to save order", variant: "destructive" }),
      });
      return reordered.map((p, i) => ({ ...p, sortOrder: i }));
    });
  };

  const handleDelete = (id: number) => {
    deletePage.mutate(id, {
      onSuccess: () => { setConfirmDelete(null); toast({ title: "Page deleted" }); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  };

  const activePageDrag = activeDragId !== null ? pages.find((p) => p.id === activeDragId) ?? null : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#9B0F5F]" /> Landing Pages
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Create pages with rich sections — drag to set the nav order</p>
        </div>
        <Button onClick={() => setCreating(true)} size="sm" style={{ background: BRAND }} className="text-white hover:opacity-90 gap-1.5">
          <Plus className="h-3.5 w-3.5" /> New Page
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#9B0F5F] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : pages.length === 0 ? (
        <div className="border-2 border-dashed rounded-xl p-10 text-center text-muted-foreground flex flex-col items-center gap-3">
          <FileText className="h-10 w-10 opacity-20" />
          <div>
            <p className="font-medium text-sm">No landing pages yet</p>
            <p className="text-xs mt-1">Create a Sale page, About Us, or seasonal campaign</p>
          </div>
          <Button onClick={() => setCreating(true)} variant="outline" size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Create your first page
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={pages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {pages.map((page) => (
                <SortablePageRow
                  key={page.id}
                  page={page}
                  onSelect={() => onSelect(page)}
                  onDelete={() => setConfirmDelete(page.id)}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activePageDrag && (
              <SortablePageRow
                page={activePageDrag}
                onSelect={() => {}}
                onDelete={() => {}}
                isDragOverlay
              />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {pages.length > 1 && (
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
          <GripVertical className="h-3.5 w-3.5 opacity-50" />
          Drag pages to control the order they appear in the navigation
        </p>
      )}

      {creating && (
        <NewPageModal
          onClose={() => setCreating(false)}
          onCreate={(page) => { setCreating(false); onSelect(page); }}
        />
      )}

      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-serif font-bold text-lg">Delete page?</h2>
            <p className="text-sm text-muted-foreground">This cannot be undone. The page and all its sections will be permanently deleted.</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
                disabled={deletePage.isPending}
                onClick={() => handleDelete(confirmDelete)}
              >
                {deletePage.isPending ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main builder page ──────────────────────────────────────────────────────
export default function AdminBuilder() {
  type Tab = "homepage" | "pages";
  const [activeTab, setActiveTab] = useState<Tab>("homepage");
  const [editingPage, setEditingPage] = useState<LandingPageSummary | null>(null);

  const handleSelectPage = (page: LandingPageSummary) => {
    setEditingPage(page);
  };

  const handleBackToList = () => {
    setEditingPage(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Page Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">Build pages with rich sections — changes go live when you save</p>
        </div>
      </div>

      {/* Tabs */}
      {!editingPage && (
        <div className="flex gap-1 mb-6 border-b">
          <button
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "homepage"
                ? "border-[#9B0F5F] text-[#9B0F5F]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("homepage")}
          >
            <Home className="h-4 w-4" /> Homepage
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "pages"
                ? "border-[#9B0F5F] text-[#9B0F5F]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("pages")}
          >
            <FileText className="h-4 w-4" /> Landing Pages
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === "homepage" && !editingPage && <HomepageBuilder />}
        {activeTab === "pages" && !editingPage && (
          <MyPagesList onSelect={handleSelectPage} />
        )}
        {editingPage && (
          <LandingPageBuilder page={editingPage} onBack={handleBackToList} />
        )}
      </div>
    </div>
  );
}
