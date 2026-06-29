import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Globe, Lock } from "lucide-react";

const BRAND = "#9B0F5F";

type CmsPage = {
  id: number;
  type: string;
  slug: string;
  title: string;
  isPublished: boolean;
  createdAt: string;
};

const TYPE_LABELS: Record<string, string> = {
  blog:   "Blog Post",
  faq:    "FAQ",
  policy: "Policy Page",
};

const TYPE_COLORS: Record<string, string> = {
  blog:   "bg-blue-100 text-blue-800",
  faq:    "bg-purple-100 text-purple-800",
  policy: "bg-amber-100 text-amber-800",
};

async function fetchPages(): Promise<CmsPage[]> {
  const res = await fetch("/api/admin/cms/pages", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load pages");
  return res.json();
}

async function deletePage(id: number): Promise<void> {
  const res = await fetch(`/api/admin/cms/pages/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error("Delete failed");
}

export default function AdminCMS() {
  const queryClient = useQueryClient();
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const { data: pages = [], isLoading } = useQuery<CmsPage[]>({
    queryKey: ["/api/admin/cms/pages"],
    queryFn: fetchPages,
  });

  const del = useMutation({
    mutationFn: deletePage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/pages"] });
      setConfirmId(null);
    },
  });

  const groups: Record<string, CmsPage[]> = { blog: [], faq: [], policy: [] };
  for (const p of pages) {
    if (groups[p.type]) groups[p.type].push(p);
    else groups[p.type] = [p];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold">CMS</h1>
        <Link href="/admin/cms/new">
          <Button style={{ background: BRAND }} className="text-white hover:opacity-90 gap-2">
            <Plus className="h-4 w-4" /> New Page
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2" style={{ borderColor: BRAND }} />
        </div>
      ) : pages.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground text-sm mb-4">No pages yet. Create your first blog post, FAQ or policy page.</p>
            <Link href="/admin/cms/new">
              <Button style={{ background: BRAND }} className="text-white hover:opacity-90 gap-2">
                <Plus className="h-4 w-4" /> Create First Page
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {(["blog", "faq", "policy"] as const).map((type) => (
            groups[type]?.length > 0 && (
              <div key={type}>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  {TYPE_LABELS[type]}s
                </h2>
                <div className="grid gap-3">
                  {groups[type].map((page) => (
                    <Card key={page.id} className="group">
                      <CardContent className="flex items-center gap-4 py-4 px-5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{page.title}</span>
                            <Badge className={`text-[10px] px-1.5 py-0 ${TYPE_COLORS[page.type]}`}>
                              {TYPE_LABELS[page.type] ?? page.type}
                            </Badge>
                            {page.isPublished ? (
                              <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-800 gap-1">
                                <Globe className="h-2.5 w-2.5" /> Published
                              </Badge>
                            ) : (
                              <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 gap-1">
                                <Lock className="h-2.5 w-2.5" /> Draft
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono">/{page.type === "blog" ? "blog" : page.type === "faq" ? "faq" : "pages"}/{page.slug}</p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/admin/cms/${page.id}/edit`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          {confirmId === page.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs"
                                onClick={() => del.mutate(page.id)}
                                disabled={del.isPending}
                              >
                                Confirm
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setConfirmId(null)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setConfirmId(page.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
