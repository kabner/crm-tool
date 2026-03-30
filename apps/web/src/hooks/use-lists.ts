import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Contact } from "./use-contacts";

export interface ListItem {
  id: string;
  tenantId: string;
  name: string;
  type: "smart" | "static";
  filters: SmartListFilters | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
}

export interface SmartListFilters {
  operator: "AND" | "OR";
  conditions: FilterCondition[];
}

export interface FilterCondition {
  field: string;
  operator: string;
  value?: string;
}

export interface ListsResponse {
  data: ListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ListMembersResponse {
  data: Contact[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ListFilters {
  page?: number;
  limit?: number;
  type?: "smart" | "static";
  search?: string;
  sort?: string;
  order?: "ASC" | "DESC";
}

export interface CreateListInput {
  name: string;
  type: "smart" | "static";
  filters?: SmartListFilters;
}

export interface UpdateListInput {
  name?: string;
  filters?: SmartListFilters;
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

export function useLists(filters: ListFilters = {}) {
  return useQuery<ListsResponse>({
    queryKey: ["lists", filters],
    queryFn: () =>
      apiClient.get<ListsResponse>(
        `/api/v1/lists${buildQueryString(filters)}`,
      ),
  });
}

export function useList(id: string) {
  return useQuery<ListItem>({
    queryKey: ["lists", id],
    queryFn: () => apiClient.get<ListItem>(`/api/v1/lists/${id}`),
    enabled: !!id,
  });
}

export function useListMembers(
  listId: string,
  pagination: { page?: number; limit?: number } = {},
) {
  return useQuery<ListMembersResponse>({
    queryKey: ["lists", listId, "members", pagination],
    queryFn: () =>
      apiClient.get<ListMembersResponse>(
        `/api/v1/lists/${listId}/members${buildQueryString(pagination)}`,
      ),
    enabled: !!listId,
  });
}

export function useCreateList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateListInput) =>
      apiClient.post<ListItem>("/api/v1/lists", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });
}

export function useUpdateList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateListInput }) =>
      apiClient.patch<ListItem>(`/api/v1/lists/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      queryClient.invalidateQueries({ queryKey: ["lists", variables.id] });
    },
  });
}

export function useDeleteList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/lists/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
    },
  });
}

export function useAddMembers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      listId,
      contactIds,
    }: {
      listId: string;
      contactIds: string[];
    }) =>
      apiClient.post<{ added: number }>(`/api/v1/lists/${listId}/members`, {
        contactIds,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      queryClient.invalidateQueries({
        queryKey: ["lists", variables.listId],
      });
      queryClient.invalidateQueries({
        queryKey: ["lists", variables.listId, "members"],
      });
    },
  });
}

export function useRemoveMembers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      listId,
      contactIds,
    }: {
      listId: string;
      contactIds: string[];
    }) =>
      apiClient.post<{ removed: number }>(
        `/api/v1/lists/${listId}/members/remove`,
        { contactIds },
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lists"] });
      queryClient.invalidateQueries({
        queryKey: ["lists", variables.listId],
      });
      queryClient.invalidateQueries({
        queryKey: ["lists", variables.listId, "members"],
      });
    },
  });
}

export function usePreviewSmartList() {
  return useMutation({
    mutationFn: (filters: SmartListFilters) =>
      apiClient.post<{ count: number }>("/api/v1/lists/preview", filters),
  });
}
