import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface ContentPage {
  id: string;
  tenantId: string;
  type: string;
  title: string;
  slug: string;
  bodyJson: Record<string, any>;
  bodyHtml: string | null;
  excerpt: string | null;
  featuredImage: string | null;
  status: string;
  authorId: string;
  categoryId: string | null;
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  ogImage: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  version: number;
  viewCount: number;
  wordCount: number;
  readingTimeMin: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentVersion {
  id: string;
  pageId: string;
  version: number;
  bodyJson: Record<string, any>;
  title: string;
  changedBy: string;
  changeSummary: string | null;
  createdAt: string;
}

export interface ContentPagesResponse {
  data: ContentPage[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ContentFilters {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  categoryId?: string;
  search?: string;
  tags?: string;
  sort?: string;
  order?: "ASC" | "DESC";
}

export interface CreateContentPageInput {
  title: string;
  type: string;
  slug?: string;
  bodyJson: Record<string, any>;
  excerpt?: string;
  categoryId?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  status?: string;
}

export interface UpdateContentPageInput
  extends Partial<CreateContentPageInput> {}

export interface ContentCategory {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  type: string;
  position: number;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  type: string;
  description?: string;
  parentId?: string;
}

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

export function useContentPages(filters: ContentFilters = {}) {
  return useQuery<ContentPagesResponse>({
    queryKey: ["content-pages", filters],
    queryFn: () =>
      apiClient.get<ContentPagesResponse>(
        `/api/v1/content/pages${buildQueryString(filters)}`,
      ),
  });
}

export function useContentPage(id: string) {
  return useQuery<ContentPage>({
    queryKey: ["content-pages", id],
    queryFn: () =>
      apiClient.get<ContentPage>(`/api/v1/content/pages/${id}`),
    enabled: !!id,
  });
}

export function useContentVersions(pageId: string) {
  return useQuery<ContentVersion[]>({
    queryKey: ["content-versions", pageId],
    queryFn: () =>
      apiClient.get<ContentVersion[]>(
        `/api/v1/content/pages/${pageId}/versions`,
      ),
    enabled: !!pageId,
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContentPageInput) =>
      apiClient.post<ContentPage>("/api/v1/content/pages", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-pages"] });
    },
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateContentPageInput;
    }) => apiClient.patch<ContentPage>(`/api/v1/content/pages/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["content-pages"] });
      queryClient.invalidateQueries({
        queryKey: ["content-pages", variables.id],
      });
    },
  });
}

export function usePublishPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<ContentPage>(`/api/v1/content/pages/${id}/publish`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["content-pages"] });
      queryClient.invalidateQueries({ queryKey: ["content-pages", id] });
    },
  });
}

export function useUnpublishPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<ContentPage>(`/api/v1/content/pages/${id}/unpublish`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["content-pages"] });
      queryClient.invalidateQueries({ queryKey: ["content-pages", id] });
    },
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/v1/content/pages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-pages"] });
    },
  });
}

export function useRevertToVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      pageId,
      versionId,
    }: {
      pageId: string;
      versionId: string;
    }) =>
      apiClient.post<ContentPage>(
        `/api/v1/content/pages/${pageId}/revert/${versionId}`,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["content-pages"] });
      queryClient.invalidateQueries({
        queryKey: ["content-pages", variables.pageId],
      });
      queryClient.invalidateQueries({
        queryKey: ["content-versions", variables.pageId],
      });
    },
  });
}

export function useContentCategories(type?: string) {
  return useQuery<ContentCategory[]>({
    queryKey: ["content-categories", type],
    queryFn: () =>
      apiClient.get<ContentCategory[]>(
        `/api/v1/content/categories${type ? `?type=${type}` : ""}`,
      ),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryInput) =>
      apiClient.post<ContentCategory>("/api/v1/content/categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-categories"] });
    },
  });
}
