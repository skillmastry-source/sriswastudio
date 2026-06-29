import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Instagram, Save, Plus, Trash2, ExternalLink } from "lucide-react";

const BRAND = "#9B0F5F";

interface InstagramSection {
  enabled?: boolean;
  username?: string;
  heading?: string;
  subheading?: string;
  images?: { url: string; link?: string; alt?: string }[];
}

interface SiteDesign { instagramSection?: InstagramSection }

async function getSiteDesign(): Promise<SiteDesign> {
  const res = await fetch("/api/site-design", { credentials: "include" });
  return res.json();
}

async function patchSiteDesign(patch: Partial<SiteDesign>) {
  const res = await fetch("/api/admin/site-design", {
    method: "PATCH", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Failed to save");
  return res.json();
}

export default function AdminInstagram() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: design, isLoading } = useQuery({ queryKey: ["/api/site-design"], queryFn: getSiteDesign });

  const [enabled, setEnabled] = useState(false);
  const [username, setUsername] = useState("sriswa_studio");
  const [heading, setHeading] = useState("Follow Our Journey");
  const [subheading, setSubheading] = useState("Tag us @sriswa_studio to be featured");
  const [images, setImages] = useState<{ url: string; link?: string; alt?: string }[]>([]);

  useEffect(() => {
    if (!design?.instagramSection) return;
    const ig = design.instagramSection;
    setEnabled(ig.enabled ?? false);
    setUsername(ig.username ?? "sriswa_studio");
    setHeading(ig.heading ?? "Follow Our Journey");
    setSubheading(ig.subheading ?? "Tag us @sriswa_studio to be featured");
    setImages(ig.images ?? []);
  }, [design]);

  const save = useMutation({
    mutationFn: () => patchSiteDesign({ instagramSection: { enabled, username, heading, subheading, images } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/site-design"] });
      toast({ title: "Saved!", description: "Instagram section updated." });
    },
    onError: () => toast({ title: "Error", description: "Could not save.", variant: "destructive" }),
  });

  const addImage = () => setImages(prev => [...prev, { url: "", link: "", alt: "" }]);
  const removeImage = (i: number) => setImages(prev => prev.filter((_, idx) => idx !== i));
  const updateImage = (i: number, field: string, value: string) =>
    setImages(prev => prev.map((img, idx) => idx === i ? { ...img, [field]: value } : img));

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND }} />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Instagram Feed</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Show a curated Instagram-style grid on your homepage</p>
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
              <Instagram className="h-4 w-4" style={{ color: BRAND }} />
              <CardTitle className="text-base">Section Settings</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{enabled ? "Visible" : "Hidden"}</span>
              <Switch checked={enabled} onCheckedChange={setEnabled} style={enabled ? { backgroundColor: BRAND } : {}} />
            </div>
          </div>
          <CardDescription>This section appears near the bottom of your homepage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Instagram Handle</Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-400 text-sm">@</span>
              <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="sriswa_studio" />
              <a href={`https://instagram.com/${username}`} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded border hover:bg-gray-50 flex-shrink-0">
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </a>
            </div>
          </div>
          <div>
            <Label>Section Heading</Label>
            <Input className="mt-1" value={heading} onChange={e => setHeading(e.target.value)} placeholder="Follow Our Journey" />
          </div>
          <div>
            <Label>Subheading</Label>
            <Input className="mt-1" value={subheading} onChange={e => setSubheading(e.target.value)} placeholder="Tag us @sriswa_studio to be featured" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Curated Images ({images.length})</CardTitle>
              <CardDescription className="mt-1">Add image URLs from your Media Library. Each links to an Instagram post.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addImage} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add Image
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {images.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
              No images yet. Click "Add Image" to add your first one.
            </div>
          )}
          {images.map((img, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start p-3 rounded-lg border bg-gray-50">
              <div>
                <Label className="text-xs">Image URL</Label>
                <Input className="mt-1 text-xs" value={img.url} onChange={e => updateImage(i, "url", e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label className="text-xs">Instagram Post Link (optional)</Label>
                <Input className="mt-1 text-xs" value={img.link ?? ""} onChange={e => updateImage(i, "link", e.target.value)} placeholder="https://instagram.com/p/..." />
              </div>
              <button onClick={() => removeImage(i)} className="mt-5 p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
              {img.url && (
                <div className="col-span-3">
                  <img src={img.url} alt="preview" className="h-16 w-16 object-cover rounded border" onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {images.length > 0 && enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {images.slice(0, 6).map((img, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {img.url ? (
                    <img src={img.url} alt={img.alt || `Post ${i + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Instagram className="h-6 w-6" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
