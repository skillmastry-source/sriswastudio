import { StoreLayout } from "@/components/layout/store-layout";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { SectionRenderer } from "@/components/section-renderer";

export default function Home() {
  const settings = useSiteSettings();
  const sections = (settings.homepageSections ?? [])
    .filter((s) => s.isVisible)
    .sort((a, b) => a.order - b.order);

  return (
    <StoreLayout>
      <SectionRenderer sections={sections} colors={settings.colors} />
    </StoreLayout>
  );
}
