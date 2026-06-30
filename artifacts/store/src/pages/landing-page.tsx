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

  const { data: pageResult, isLoading, isError } = useQuery({
    queryKey: ["landing-page", slug, isPreview],
    queryFn: async () => {
      if (isPreview) {
        const token = await getToken();
        const res = await fetch(`${BASE_URL}/api/admin/landing-pages/slug/${slug}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.status === 401 || res.status === 403) return { authError: true };
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Failed to load page");
        return { page: await res.json() };
      }
      const res = await fetch(`${BASE_URL}/api/landing-pages/${slug}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to load page");
      return { page: await res.json() };
    },
    enabled: !!slug,
    retry: false,
  });

  const page = pageResult && "page" in pageResult ? pageResult.page : null;
  const isAuthError = pageResult && "authError" in pageResult && pageResult.authError === true;

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
      setOgTag("og:title", "");
      setOgTag("og:description", "");
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

  if (isAuthError) {
    const currentUrl = encodeURIComponent(window.location.href);
    return (
      <StoreLayout>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">This is a draft page</h1>
            <p className="text-gray-500 text-sm">
              Sign in as an admin to preview this page before it's published.
            </p>
            <a
              href={`/sign-in?redirect_url=${currentUrl}`}
              className="inline-block mt-2 px-5 py-2.5 bg-[#9B0F5F] text-white text-sm font-medium rounded-lg hover:bg-[#7a0c4c] transition-colors"
            >
              Sign in as admin
            </a>
          </div>
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
