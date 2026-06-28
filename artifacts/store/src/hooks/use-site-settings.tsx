import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
    instagramUrl: "https://instagram.com/sriswastudio",
    facebookUrl: "https://facebook.com/sriswastudio",
  },
};

export type SiteDesign = typeof DEFAULT_SITE_DESIGN;

const QUERY_KEY = ["site-design"];

export function useSiteSettings(): SiteDesign {
  const { data } = useQuery<SiteDesign>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/site-design");
      if (!res.ok) return DEFAULT_SITE_DESIGN;
      return res.json();
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
