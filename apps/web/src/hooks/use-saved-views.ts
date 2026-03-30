import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SavedView {
  id: string;
  tenantId: string;
  userId: string | null;
  objectType: "contact" | "company" | "deal";
  name: string;
  filters: Record<string, any>;
  columns: string[];
  sort: { field: string; order: "ASC" | "DESC" } | Record<string, never>;
  viewType: "table" | "board";
  isDefault: boolean;
  createdAt: string;
}

export interface CreateSavedViewInput {
  objectType: "contact" | "company" | "deal";
  name: string;
  filters?: Record<string, any>;
  columns?: string[];
  sort?: { field: string; order: "ASC" | "DESC" };
  viewType?: "table" | "board";
  isDefault?: boolean;
}

export interface UpdateSavedViewInput {
  name?: string;
  filters?: Record<string, any>;
  columns?: string[];
  sort?: { field: string; order: "ASC" | "DESC" };
  viewType?: "table" | "board";
  isDefault?: boolean;
}

export function useSavedViews(objectType: string) {
  return useQuery<SavedView[]>({
    queryKey: ["saved-views", objectType],
    queryFn: () =>
      apiClient.get<SavedView[]>(
        `/api/v1/views?objectType=${encodeURIComponent(objectType)}`,
      ),
    enabled: !!objectType,
  });
}

export function useSavedView(id: string) {
  return useQuery<SavedView>({
    queryKey: ["saved-views", "detail", id],
    queryFn: () => apiClient.get<SavedView>(`/api/v1/views/${id}`),
    enabled: !!id,
  });
}

export function useCreateView() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSavedViewInput) =>
      apiClient.post<SavedView>("/api/v1/views", data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["saved-views", variables.objectType],
      });
    },
  });
}

export function useUpdateView() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSavedViewInput }) =>
      apiClient.patch<SavedView>(`/api/v1/views/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-views"] });
    },
  });
}

export function useDeleteView() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/views/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-views"] });
    },
  });
}

export function useSetDefaultView() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      objectType,
    }: {
      id: string;
      objectType: string;
    }) =>
      apiClient.post<SavedView>(`/api/v1/views/${id}/set-default`, {
        objectType,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-views"] });
    },
  });
}
