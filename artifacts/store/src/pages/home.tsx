import { useEffect } from "react";
import { StoreLayout } from "@/components/layout/store-layout";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { SectionRenderer } from "@/components/section-renderer";
import { setMetaTag, setOgTag } from "@/lib/meta";

export default function Home() {
  const settings = useSiteSettings();
  const sections = (settings.homepageSections ?? [])
    .filter((s) => s.isVisible)
    .sort((a, b) => a.order - b.order);

  useEffect(() => {
    const title = settings.homepageMetaTitle || "Sriswa Studio";
    const description = settings.homepageMetaDescription || "";

    document.title = title;
    setOgTag("og:title", title);

    setMetaTag("description", description);
    setOgTag("og:description", description);

    return () => {
      document.title = "Sriswa Studio";
      setOgTag("og:title", "");
      setOgTag("og:description", "");
      setMetaTag("description", "");
    };
  }, [settings.homepageMetaTitle, settings.homepageMetaDescription]);

  return (
    <StoreLayout>
      <SectionRenderer sections={sections} colors={settings.colors} />
    </StoreLayout>
  );
}
