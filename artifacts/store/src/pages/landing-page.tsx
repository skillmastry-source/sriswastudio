import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { StoreLayout } from "@/components/layout/store-layout";
import { SectionRenderer } from "@/components/section-renderer";
import { useSiteSettings } from "@/hooks/use-site-settings";
import type { HomepageSection } from "@/hooks/use-site-settings";
import NotFound from "@/pages/not-found";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchLandingPage(slug: string) {
  const res = await fetch(`${BASE_URL}/api/landing-pages/${slug}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load page");
  return res.json();
}

export default function LandingPage() {
  const [, params] = useRoute("/p/:slug");
  const slug = params?.slug ?? "";
  const settings = useSiteSettings();

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ["landing-page", slug],
    queryFn: () => fetchLandingPage(slug),
    enabled: !!slug,
    retry: false,
  });

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
      <SectionRenderer sections={sections} colors={settings.colors} />
    </StoreLayout>
  );
}
