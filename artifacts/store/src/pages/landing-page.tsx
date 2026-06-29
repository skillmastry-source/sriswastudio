import { useEffect } from "react";
import { useRoute, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/clerk-stub";
import { StoreLayout } from "@/components/layout/store-layout";
import { SectionRenderer } from "@/components/section-renderer";
import { useSiteSettings } from "@/hooks/use-site-settings";
import type { HomepageSection } from "@/hooks/use-site-settings";
import NotFound from "@/pages/not-found";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

function setMetaTag(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setOgTag(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export default function LandingPage() {
  const [, params] = useRoute("/p/:slug");
  const slug = params?.slug ?? "";
  const settings = useSiteSettings();
  const search = useSearch();
  const isPreview = new URLSearchParams(search).get("preview") === "1";
  const { getToken } = useAuth();

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ["landing-page", slug, isPreview],
    queryFn: async () => {
      if (isPreview) {
        const token = await getToken();
        const res = await fetch(`${BASE_URL}/api/admin/landing-pages/slug/${slug}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.status === 404 || res.status === 401 || res.status === 403) return null;
        if (!res.ok) throw new Error("Failed to load page");
        return res.json();
      }
      const res = await fetch(`${BASE_URL}/api/landing-pages/${slug}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to load page");
      return res.json();
    },
    enabled: !!slug,
    retry: false,
  });

  useEffect(() => {
    if (!page) return;

    const title = page.metaTitle || page.title || settings.storeName || "Sriswa Studio";
    const description = page.metaDescription || "";

    document.title = title;
    setOgTag("og:title", title);

    if (description) {
      setMetaTag("description", description);
      setOgTag("og:description", description);
    }

    return () => {
      document.title = settings.storeName || "Sriswa Studio";
    };
  }, [page, settings.storeName]);

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#9B0F5F] border-t-transparent rounded-full animate-spin" />
        </div>
      </StoreLayout>
    );
  }

  if (isError || page === null) {
    return <NotFound />;
  }

  const sections: HomepageSection[] = ((page?.sections ?? []) as HomepageSection[])
    .filter((s) => s.isVisible)
    .sort((a, b) => a.order - b.order);

  return (
    <StoreLayout>
      {isPreview && !page.isPublished && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-700 font-medium">
          Draft preview — this page is not published yet
        </div>
      )}
      <SectionRenderer sections={sections} colors={settings.colors} />
    </StoreLayout>
  );
}
