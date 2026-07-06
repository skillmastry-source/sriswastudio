import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Eye, Image as ImageIcon } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { MediaPicker } from "@/components/media-picker";
import { useAuth } from "@clerk/react";

const BRAND = "#9B0F5F";

type CmsPage = {
  id: number;
  type: string;
  slug: string;
  title: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
};

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function MarkdownPreview({ content }: { content: string }) {
  const html = content
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3 class='text-lg font-semibold mt-4 mb-2'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='text-xl font-bold mt-5 mb-2'>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1 class='text-2xl font-bold mt-6 mb-3'>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code class='bg-gray-100 px-1 rounded text-sm font-mono'>$1</code>")
    .replace(/^- (.+)$/gm, "<li class='ml-4 list-disc'>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li class='ml-4 list-decimal'>$2</li>")
    .replace(/\n\n/g, "</p><p class='mb-3'>")
    .replace(/\n/g, "<br/>");
  return (
    <div
      className="prose prose-sm max-w-none p-4 text-sm text-gray-800 min-h-[300px]"
      dangerouslySetInnerHTML={{ __html: `<p class='mb-3'>${html}</p>` }}
    />
  );
}

async function fetchPage(id: string, token: string | null): Promise<CmsPage> {
  const res = await fetch(`/api/admin/cms/pages`, {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to load pages");
  const pages: CmsPage[] = await res.json();
  const page = pages.find((p) => p.id === Number(id));
  if (!page) throw new Error("Page not found");
  return page;
}

async function savePage(data: Partial<CmsPage> & { id?: number }, token: string | null) {
  const { id, ...body } = data;
  const url  = id ? `/api/admin/cms/pages/${id}` : "/api/admin/cms/pages";
  const method = id ? "PATCH" : "POST";
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Save failed" }));
    throw new Error(err.error ?? "Save failed");
  }
  return res.json();
}

export default function AdminCmsForm() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const isEdit = Boolean(params.id);

  const { data: existing, isLoading } = useQuery<CmsPage>({
    queryKey: ["/api/admin/cms/pages", params.id],
    queryFn: async () => fetchPage(params.id!, await getToken()),
    enabled: isEdit,
  });

  const [type,            setType]            = useState("blog");
  const [title,           setTitle]           = useState("");
  const [slug,            setSlug]            = useState("");
  const [slugManual,      setSlugManual]      = useState(false);
  const [content,         setContent]         = useState("");
  const [metaTitle,       setMetaTitle]       = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isPublished,     setIsPublished]     = useState(false);
  const [previewTab,      setPreviewTab]      = useState<"edit" | "preview">("edit");
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (existing) {
      setType(existing.type);
      setTitle(existing.title);
      setSlug(existing.slug);
      setSlugManual(true);
      setContent(existing.content ?? "");
      setMetaTitle(existing.metaTitle ?? "");
      setMetaDescription(existing.metaDescription ?? "");
      setIsPublished(existing.isPublished);
    }
  }, [existing]);

  const handleTitleChange = useCallback((val: string) => {
    setTitle(val);
    if (!slugManual) setSlug(slugify(val));
  }, [slugManual]);

  const mutation = useMutation({
    mutationFn: async (data: Partial<CmsPage> & { id?: number }) => savePage(data, await getToken()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages"] });
      toast({ title: isEdit ? "Page updated" : "Page created", description: `"${title}" has been saved.` });
      navigate("/admin/cms");
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      id: isEdit ? Number(params.id) : undefined,
      type,
      slug,
      title,
      content,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      isPublished,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2" style={{ borderColor: BRAND }} />
      </div>
    );
  }

  const storePath = type === "blog" ? `/blog/${slug}` : type === "faq" ? "/faq" : `/pages/${slug}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/cms">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-serif font-bold">{isEdit ? "Edit Page" : "New Page"}</h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch
              id="published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
            <Label htmlFor="published" className="cursor-pointer">
              {isPublished ? "Published" : "Draft"}
            </Label>
          </div>
          <Button type="submit" disabled={mutation.isPending} className="gap-2 text-white" style={{ background: BRAND }}>
            <Save className="h-4 w-4" />
            {mutation.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Page title"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug">
                  Slug *
                  <span className="ml-1 text-xs text-muted-foreground font-normal">
                    → storefront: <span className="font-mono">{storePath}</span>
                  </span>
                </Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => { setSlug(slugify(e.target.value)); setSlugManual(true); }}
                  placeholder="url-friendly-slug"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as "edit" | "preview")}>
                  <div className="flex items-center justify-between">
                    <Label>Content (Markdown supported)</Label>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground"
                        onClick={() => setMediaPickerOpen(true)}
                        title="Insert image from Media Library"
                      >
                        <ImageIcon className="h-3.5 w-3.5 mr-1" />
                        Insert Image
                      </Button>
                      <TabsList className="h-7">
                        <TabsTrigger value="edit" className="text-xs px-2 py-1">Edit</TabsTrigger>
                        <TabsTrigger value="preview" className="text-xs px-2 py-1">
                          <Eye className="h-3 w-3 mr-1" />Preview
                        </TabsTrigger>
                      </TabsList>
                    </div>
                  </div>
                  <TabsContent value="edit" className="mt-1.5">
                    <Textarea
                      ref={textareaRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your content here… Markdown is supported."
                      className="min-h-[300px] font-mono text-sm resize-y"
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="mt-1.5">
                    <div className="border rounded-md overflow-auto min-h-[300px] bg-white">
                      {content ? <MarkdownPreview content={content} /> : (
                        <p className="text-muted-foreground text-sm p-4">Nothing to preview yet — write some content first.</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Content Type *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog">Blog Post</SelectItem>
                    <SelectItem value="faq">FAQ</SelectItem>
                    <SelectItem value="policy">Policy Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Leave blank to use page title"
                />
                <p className="text-[11px] text-muted-foreground">{metaTitle.length}/60 chars</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="metaDesc">Meta Description</Label>
                <Textarea
                  id="metaDesc"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Brief description for search engines"
                  className="min-h-[80px] resize-none text-sm"
                />
                <p className="text-[11px] text-muted-foreground">{metaDescription.length}/160 chars</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <MediaPicker
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => {
          const ta = textareaRef.current;
          const insert = `\n![image](${url})\n`;
          if (ta) {
            const start = ta.selectionStart ?? content.length;
            const end = ta.selectionEnd ?? content.length;
            setContent((prev) => prev.slice(0, start) + insert + prev.slice(end));
          } else {
            setContent((prev) => prev + insert);
          }
          setMediaPickerOpen(false);
        }}
      />
    </form>
  );
}
