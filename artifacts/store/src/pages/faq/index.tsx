import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { StoreLayout } from "@/components/layout/store-layout";
import { ChevronDown } from "lucide-react";

const BRAND = "#9B0F5F";
const GOLD  = "#D4AF37";

type CmsPage = { id: number; type: string; slug: string; title: string; content: string };

async function fetchPublic(): Promise<CmsPage[]> {
  const res = await fetch("/api/cms/pages");
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

function parseFaqContent(content: string): { q: string; a: string }[] {
  const items: { q: string; a: string }[] = [];
  const lines = content.split("\n");
  let current: { q: string; a: string[] } | null = null;

  for (const line of lines) {
    const match = line.match(/^#{1,3}\s+(.+)$/);
    if (match) {
      if (current) items.push({ q: current.q, a: current.a.join("\n").trim() });
      current = { q: match[1], a: [] };
    } else if (current) {
      current.a.push(line);
    }
  }
  if (current) items.push({ q: current.q, a: current.a.join("\n").trim() });
  return items;
}

export default function FAQ() {
  const { data: allPages = [], isLoading } = useQuery<CmsPage[]>({
    queryKey: ["/api/cms/pages"],
    queryFn: fetchPublic,
  });

  const faqs = allPages.filter((p) => p.type === "faq");
  const [openId, setOpenId] = useState<string | null>(null);

  const allItems = faqs.flatMap((faq) =>
    parseFaqContent(faq.content).map((item, i) => ({ ...item, key: `${faq.id}-${i}` }))
  );

  return (
    <StoreLayout>
      <div className="container mx-auto px-6 max-w-3xl py-16">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: GOLD }}>Got Questions?</p>
          <h1 className="text-4xl font-serif font-bold" style={{ color: "#1a0a0f" }}>Frequently Asked Questions</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2" style={{ borderColor: BRAND }} />
          </div>
        ) : allItems.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <p className="font-serif text-lg">No FAQs yet — we're working on it.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {allItems.map(({ key, q, a }) => (
              <div
                key={key}
                className="border rounded-xl overflow-hidden transition-shadow hover:shadow-sm"
                style={{ borderColor: openId === key ? `${BRAND}44` : "#e5e7eb" }}
              >
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                  onClick={() => setOpenId(openId === key ? null : key)}
                >
                  <span className="font-medium text-base pr-4">{q}</span>
                  <ChevronDown
                    className="h-4 w-4 flex-shrink-0 transition-transform"
                    style={{
                      color: openId === key ? BRAND : "#9ca3af",
                      transform: openId === key ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>
                {openId === key && a && (
                  <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                    <div className="pt-3">{a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
