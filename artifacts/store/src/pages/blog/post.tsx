import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { StoreLayout } from "@/components/layout/store-layout";
import { ArrowLeft, Calendar } from "lucide-react";

const BRAND = "#9B0F5F";
const GOLD  = "#D4AF37";

type CmsPage = { id: number; type: string; slug: string; title: string; content: string; publishedAt: string | null; metaTitle: string | null; metaDescription: string | null };

async function fetchPage(slug: string): Promise<CmsPage> {
  const res = await fetch(`/api/cms/pages/${slug}`);
  if (!res.ok) throw new Error("Not found");
  return res.json();
}

function renderMarkdown(content: string) {
  const html = content
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");
  return `<p>${html}</p>`;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, isError } = useQuery<CmsPage>({
    queryKey: ["/api/cms/pages", slug],
    queryFn: () => fetchPage(slug!),
    enabled: Boolean(slug),
  });

  return (
    <StoreLayout>
      <div className="container mx-auto px-6 max-w-3xl py-12">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Journal
        </Link>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2" style={{ borderColor: BRAND }} />
          </div>
        ) : isError || !post ? (
          <div className="text-center py-24">
            <p className="text-lg font-serif text-muted-foreground">Article not found.</p>
            <Link href="/blog" className="text-sm mt-4 inline-block" style={{ color: BRAND }}>← Back to Journal</Link>
          </div>
        ) : (
          <article>
            <header className="mb-10 pb-8 border-b" style={{ borderColor: `${GOLD}44` }}>
              <h1 className="text-4xl font-serif font-bold mb-4" style={{ color: "#1a0a0f" }}>{post.title}</h1>
              {post.metaDescription && (
                <p className="text-lg text-gray-600 mb-4">{post.metaDescription}</p>
              )}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                  : "—"}
              </div>
            </header>

            <div
              className="prose prose-lg max-w-none
                prose-headings:font-serif prose-headings:text-[#1a0a0f]
                prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                prose-p:text-gray-700 prose-p:leading-relaxed
                prose-strong:text-gray-900
                prose-li:text-gray-700
                prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-code:text-sm"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
            />
          </article>
        )}
      </div>
    </StoreLayout>
  );
}
