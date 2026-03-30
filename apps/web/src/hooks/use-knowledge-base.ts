import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// ── Types ─────────────────────────────────────────────────────────

export interface KBCategory {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  position: number;
  visibility: string;
  createdAt: string;
  sections: KBSection[];
}

export interface KBSection {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  articleCount?: number;
}

export interface KBArticle {
  id: string;
  tenantId: string;
  sectionId: string;
  title: string;
  slug: string;
  bodyHtml: string;
  bodyJson: Record<string, any> | null;
  status: string;
  authorId: string;
  visibility: string;
  seoTitle: string | null;
  seoDescription: string | null;
  helpfulCount: number;
  notHelpfulCount: number;
  viewCount: number;
  position: number;
  publishedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  section?: KBSection & { category?: KBCategory };
}

export interface KBArticlesResponse {
  data: KBArticle[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface KBArticleFilters {
  page?: number;
  limit?: number;
  sectionId?: string;
  status?: string;
  visibility?: string;
  search?: string;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  position?: number;
  visibility?: string;
}

export interface CreateSectionInput {
  name: string;
  categoryId: string;
  slug?: string;
  description?: string;
  position?: number;
}

export interface CreateArticleInput {
  title: string;
  sectionId: string;
  bodyHtml: string;
  bodyJson?: Record<string, any>;
  status?: string;
  visibility?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface UpdateArticleInput extends Partial<CreateArticleInput> {}

// ── Helpers ───────────────────────────────────────────────────────

const KB_BASE = "/api/v1/service/kb";

function buildQueryString(filters: Record<string, any>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// ── Category Hooks ────────────────────────────────────────────────

export function useKBCategories() {
  return useQuery<KBCategory[]>({
    queryKey: ["kb-categories"],
    queryFn: () => apiClient.get<KBCategory[]>(`${KB_BASE}/categories`),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryInput) =>
      apiClient.post<KBCategory>(`${KB_BASE}/categories`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCategoryInput> }) =>
      apiClient.patch<KBCategory>(`${KB_BASE}/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`${KB_BASE}/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-categories"] });
    },
  });
}

// ── Section Hooks ─────────────────────────────────────────────────

export function useCreateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSectionInput) =>
      apiClient.post<KBSection>(`${KB_BASE}/sections`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-categories"] });
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSectionInput> }) =>
      apiClient.patch<KBSection>(`${KB_BASE}/sections/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-categories"] });
    },
  });
}

export function useDeleteSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`${KB_BASE}/sections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-categories"] });
    },
  });
}

// ── Article Hooks ─────────────────────────────────────────────────

export function useKBArticles(filters: KBArticleFilters = {}) {
  return useQuery<KBArticlesResponse>({
    queryKey: ["kb-articles", filters],
    queryFn: () =>
      apiClient.get<KBArticlesResponse>(
        `${KB_BASE}/articles${buildQueryString(filters)}`,
      ),
  });
}

export function useKBArticle(id: string) {
  return useQuery<KBArticle>({
    queryKey: ["kb-articles", id],
    queryFn: () => apiClient.get<KBArticle>(`${KB_BASE}/articles/${id}`),
    enabled: !!id,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateArticleInput) =>
      apiClient.post<KBArticle>(`${KB_BASE}/articles`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-articles"] });
      queryClient.invalidateQueries({ queryKey: ["kb-categories"] });
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateArticleInput }) =>
      apiClient.patch<KBArticle>(`${KB_BASE}/articles/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kb-articles"] });
      queryClient.invalidateQueries({
        queryKey: ["kb-articles", variables.id],
      });
    },
  });
}

export function usePublishArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<KBArticle>(`${KB_BASE}/articles/${id}/publish`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["kb-articles"] });
      queryClient.invalidateQueries({ queryKey: ["kb-articles", id] });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`${KB_BASE}/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-articles"] });
      queryClient.invalidateQueries({ queryKey: ["kb-categories"] });
    },
  });
}

export function useSearchKB(query: string, visibility?: string) {
  return useQuery<KBArticle[]>({
    queryKey: ["kb-search", query, visibility],
    queryFn: () =>
      apiClient.get<KBArticle[]>(
        `${KB_BASE}/articles/search${buildQueryString({ q: query, visibility })}`,
      ),
    enabled: query.length > 0,
  });
}
