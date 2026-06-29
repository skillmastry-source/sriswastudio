import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type HomepageSection = {
  id: string;
  type: "hero" | "product_grid" | "category_grid" | "testimonials" | "text_image" | "strip" | "whatsapp_cta" | "custom_html";
  isVisible: boolean;
  order: number;
  config: Record<string, unknown>;
};

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSection[] = [
  {
    id: "strip-default",
    type: "strip",
    isVisible: true,
    order: 0,
    config: {
      items: ["✦ Anti-Tarnish Jewellery", "✦ Ships in 24 Hours", "✦ Free Shipping above ₹999", "✦ 10,000+ Happy Customers", "✦ Waterproof & Skin-Friendly", "✦ Handcrafted with Love"],
      bgColor: "#1a0a0f",
      textColor: "#D4AF37",
    },
  },
  {
    id: "hero-default",
    type: "hero",
    isVisible: true,
    order: 1,
    config: {
      badge: "New Arrivals · 2025",
      title: "Jewellery That",
      titleGold: "Lasts Forever",
      subtitle: "Anti-tarnish · Waterproof · Skin-friendly · Starting ₹399",
      shopButtonText: "Shop Now",
      imageUrl: "/brand/hero-banner.png",
    },
  },
  {
    id: "category-default",
    type: "category_grid",
    isVisible: true,
    order: 2,
    config: {
      title: "Shop by Category",
      subtitle: "Browse",
    },
  },
  {
    id: "product-new",
    type: "product_grid",
    isVisible: true,
    order: 3,
    config: {
      title: "New Arrivals",
      subtitle: "Fresh In",
      filter: "newest",
      limit: 8,
      layout: "slider",
      bgColor: "#fdf6f9",
    },
  },
  {
    id: "product-best",
    type: "product_grid",
    isVisible: true,
    order: 4,
    config: {
      title: "Best Sellers",
      subtitle: "Top Picks",
      filter: "featured",
      limit: 8,
      layout: "grid",
      bgColor: "#ffffff",
    },
  },
  {
    id: "testimonials-default",
    type: "testimonials",
    isVisible: true,
    order: 5,
    config: {
      title: "What Our Customers Say",
      subtitle: "Testimonials",
      reviews: [
        { name: "Priya S.", city: "Mumbai", rating: 5, text: "I've been wearing my anklet for 3 months, even in the shower — not a single tarnish! Absolutely love it." },
        { name: "Riya M.", city: "Bangalore", rating: 5, text: "The necklace looks so premium and it's so affordable. Sriswa Studio is my go-to now!" },
        { name: "Ananya K.", city: "Chennai", rating: 5, text: "Super fast delivery and beautiful packaging. The earrings are lightweight and perfect for sensitive ears!" },
        { name: "Divya R.", city: "Hyderabad", rating: 5, text: "Was skeptical at first but the quality is amazing. 100% worth every rupee!" },
      ],
    },
  },
  {
    id: "whatsapp-default",
    type: "whatsapp_cta",
    isVisible: true,
    order: 6,
    config: {
      title: "Join Our WhatsApp Community",
      subtitle: "Get exclusive offers, new launch alerts & jewellery care tips directly on WhatsApp. Be the first to know!",
      waNumber: "919618535437",
      bgColor: "#9B0F5F",
    },
  },
];

export const DEFAULT_SITE_DESIGN = {
  header: {
    logoSize: 48,
    announcementText: "✦ Anti-Tarnish  |  Waterproof  |  Skin-Friendly  |  Free Shipping above ₹999",
    announcementBgColor: "#9B0F5F",
    showAnnouncement: true,
  },
  hero: {
    badge: "New Arrivals · 2025",
    title: "Jewellery That",
    titleGold: "Lasts Forever",
    subtitle: "Anti-tarnish · Waterproof · Skin-friendly · Starting ₹399",
    shopButtonText: "Shop Now",
    viewAllText: "View All →",
  },
  colors: {
    brand: "#9B0F5F",
    gold: "#D4AF37",
    dark: "#1a0a0f",
  },
  usp: [
    { text: "Anti-Tarnish" },
    { text: "Waterproof" },
    { text: "Skin-Friendly" },
    { text: "Free Shipping ₹999+" },
  ],
  collection: {
    label: "Shop All Jewellery",
    title: "Our Collection",
  },
  tabs: {
    newArrivalsLabel: "New Arrivals",
    bestSellersLabel: "Best Sellers",
    shopAllText: "Shop All →",
  },
  testimonials: [
    { name: "Priya S.", city: "Mumbai", rating: 5, text: "I've been wearing my anklet for 3 months, even in the shower — not a single tarnish! Absolutely love it." },
    { name: "Riya M.", city: "Bangalore", rating: 5, text: "The necklace looks so premium and it's so affordable. Sriswa Studio is my go-to now!" },
    { name: "Ananya K.", city: "Chennai", rating: 5, text: "Super fast delivery and beautiful packaging. The earrings are lightweight and perfect for sensitive ears!" },
    { name: "Divya R.", city: "Hyderabad", rating: 5, text: "Was skeptical at first but the quality is amazing. 100% worth every rupee!" },
  ],
  footer: {
    logoSize: 60,
    tagline: "Timeless Beauty, Everyday Shine.\nPremium anti-tarnish jewellery\ncrafted for the modern woman.",
    instagramUrl: "https://www.instagram.com/sriswa_studio",
    facebookUrl: "https://facebook.com/sriswastudio",
  },
  homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
  homepageMetaTitle: "",
  homepageMetaDescription: "",
};

export type SiteDesign = typeof DEFAULT_SITE_DESIGN;

const QUERY_KEY = ["site-design"];

export function useSiteSettings(): SiteDesign {
  const { data } = useQuery<SiteDesign>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/site-design");
      if (!res.ok) return DEFAULT_SITE_DESIGN;
      const data = await res.json() as Partial<SiteDesign>;
      return {
        ...DEFAULT_SITE_DESIGN,
        ...data,
        homepageSections: data.homepageSections ?? DEFAULT_SITE_DESIGN.homepageSections,
      } as SiteDesign;
    },
    staleTime: 60_000,
  });
  return data ?? DEFAULT_SITE_DESIGN;
}

export function useUpdateSiteSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (design: Partial<SiteDesign>) => {
      const res = await fetch("/api/admin/site-design", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(design),
      });
      if (!res.ok) throw new Error("Failed to save design settings");
      return res.json() as Promise<SiteDesign>;
    },
    onSuccess: (data) => {
      qc.setQueryData(QUERY_KEY, data);
    },
  });
}
