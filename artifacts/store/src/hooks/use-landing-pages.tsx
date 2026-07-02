import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

export type LandingPageSummary = {
  id: number;
  title: string;
  slug: string;
  isPublished: boolean;
  isInNav: boolean;
  sortOrder: number;
  updatedAt: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

export type NavLandingPage = {
  id: number;
  title: string;
  slug: string;
};

export type LandingPageFull = LandingPageSummary & {
  sections: unknown[];
  createdAt: string;
};

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE_URL}/api${path}`, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export function useLandingPages() {
  return useQuery<LandingPageSummary[]>({
    queryKey: ["landing-pages"],
    queryFn: () => apiFetch("/landing-pages"),
  });
}

export function useNavLandingPages() {
  return useQuery<NavLandingPage[]>({
    queryKey: ["landing-pages-nav"],
    queryFn: () => apiFetch("/landing-pages/nav"),
    staleTime: 60_000,
  });
}

export function useLandingPage(id: number | null) {
  return useQuery<LandingPageFull>({
    queryKey: ["landing-page", id],
    queryFn: () => apiFetch(`/landing-pages/${id}`),
    enabled: id !== null,
  });
}

export function useCreateLandingPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; slug: string }) =>
      apiFetch("/admin/landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landing-pages"] }),
  });
}

export function useUpdateLandingPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; title?: string; slug?: string; sections?: unknown[]; isPublished?: boolean; isInNav?: boolean; metaTitle?: string | null; metaDescription?: string | null }) =>
      apiFetch(`/admin/landing-pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onMutate: (vars) => {
      const { id, sections: _sections, ...patch } = vars;
      if (Object.keys(patch).length === 0) return;
      qc.setQueryData<LandingPageSummary[]>(["landing-pages"], (prev) => {
        if (!prev) return prev;
        return prev.map((p) =>
          p.id === id ? { ...p, ...patch } : p
        );
      });
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["landing-pages"] });
      qc.invalidateQueries({ queryKey: ["landing-page", vars.id] });
      qc.invalidateQueries({ queryKey: ["landing-pages-nav"] });
    },
  });
}

export function useDeleteLandingPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/admin/landing-pages/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["landing-pages"] }),
  });
}

export function useReorderLandingPages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { id: number; sortOrder: number }[]) =>
      apiFetch("/admin/landing-pages/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(items),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["landing-pages"] });
      qc.invalidateQueries({ queryKey: ["landing-pages-nav"] });
    },
  });
}
