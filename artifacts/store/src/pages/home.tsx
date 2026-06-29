import { useEffect } from "react";
import { StoreLayout } from "@/components/layout/store-layout";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { SectionRenderer } from "@/components/section-renderer";

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

    if (description) {
      setMetaTag("description", description);
      setOgTag("og:description", description);
    }

    return () => {
      document.title = "Sriswa Studio";
    };
  }, [settings.homepageMetaTitle, settings.homepageMetaDescription]);

  return (
    <StoreLayout>
      <SectionRenderer sections={sections} colors={settings.colors} />
    </StoreLayout>
  );
}
