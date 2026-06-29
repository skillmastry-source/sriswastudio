import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { StoreLayout } from "@/components/layout/store-layout";
import { Calendar } from "lucide-react";

const BRAND = "#9B0F5F";
const GOLD  = "#D4AF37";

type CmsPage = { id: number; type: string; slug: string; title: string; content: string; publishedAt: string | null; metaDescription: string | null };

async function fetchPublic(): Promise<CmsPage[]> {
  const res = await fetch("/api/cms/pages");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

export default function BlogList() {
  const { data: allPages = [], isLoading } = useQuery<CmsPage[]>({
    queryKey: ["/api/cms/pages"],
    queryFn: fetchPublic,
  });

  const posts = allPages.filter((p) => p.type === "blog");

  return (
    <StoreLayout>
      <div className="container mx-auto px-6 max-w-4xl py-16">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: GOLD }}>From the Studio</p>
          <h1 className="text-4xl font-serif font-bold" style={{ color: "#1a0a0f" }}>Journal</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2" style={{ borderColor: BRAND }} />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <p className="text-lg font-serif">No posts yet — check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <article className="group cursor-pointer border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white">
                  <div className="h-3 w-full" style={{ background: `linear-gradient(90deg, ${BRAND}, ${GOLD})` }} />
                  <div className="p-6">
                    <h2 className="text-xl font-serif font-bold mb-2 group-hover:text-[#9B0F5F] transition-colors">
                      {post.title}
                    </h2>
                    {post.metaDescription && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{post.metaDescription}</p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                        : "—"}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
