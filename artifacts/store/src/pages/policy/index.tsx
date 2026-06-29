import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { StoreLayout } from "@/components/layout/store-layout";
import { ArrowLeft } from "lucide-react";

const BRAND = "#9B0F5F";
const GOLD  = "#D4AF37";

type CmsPage = { id: number; type: string; slug: string; title: string; content: string; metaTitle: string | null };

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
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");
  return `<p>${html}</p>`;
}

export default function PolicyPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, isError } = useQuery<CmsPage>({
    queryKey: ["/api/cms/pages", slug],
    queryFn: () => fetchPage(slug!),
    enabled: Boolean(slug),
  });

  return (
    <StoreLayout>
      <div className="container mx-auto px-6 max-w-3xl py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Home
        </Link>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2" style={{ borderColor: BRAND }} />
          </div>
        ) : isError || !page ? (
          <div className="text-center py-24">
            <p className="text-lg font-serif text-muted-foreground">Page not found.</p>
          </div>
        ) : (
          <article>
            <header className="mb-10 pb-6 border-b" style={{ borderColor: `${GOLD}44` }}>
              <h1 className="text-4xl font-serif font-bold" style={{ color: "#1a0a0f" }}>{page.title}</h1>
            </header>
            <div
              className="prose prose-lg max-w-none
                prose-headings:font-serif prose-headings:text-[#1a0a0f]
                prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                prose-p:text-gray-700 prose-p:leading-relaxed
                prose-strong:text-gray-900
                prose-li:text-gray-700"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }}
            />
          </article>
        )}
      </div>
    </StoreLayout>
  );
}
