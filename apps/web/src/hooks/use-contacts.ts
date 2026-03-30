import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Contact {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  lifecycleStage: string;
  leadStatus: string | null;
  ownerId: string | null;
  tags: string[];
  customProps: Record<string, any>;
  source: string | null;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
  companies?: any[];
}

export interface ContactsResponse {
  data: Contact[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ContactFilters {
  page?: number;
  limit?: number;
  search?: string;
  lifecycleStage?: string;
  leadStatus?: string;
  ownerId?: string;
  tags?: string;
  companyId?: string;
  sort?: string;
  order?: "ASC" | "DESC";
}

export interface CreateContactInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  lifecycleStage?: string;
  leadStatus?: string;
  tags?: string[];
  source?: string;
  companyIds?: string[];
}

export interface UpdateContactInput extends Partial<CreateContactInput> {}

function buildQueryString(filters: ContactFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useContacts(filters: ContactFilters = {}) {
  return useQuery<ContactsResponse>({
    queryKey: ["contacts", filters],
    queryFn: () =>
      apiClient.get<ContactsResponse>(
        `/api/v1/contacts${buildQueryString(filters)}`,
      ),
  });
}

export function useContact(id: string) {
  return useQuery<Contact>({
    queryKey: ["contacts", id],
    queryFn: () => apiClient.get<Contact>(`/api/v1/contacts/${id}`),
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContactInput) =>
      apiClient.post<Contact>("/api/v1/contacts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactInput }) =>
      apiClient.patch<Contact>(`/api/v1/contacts/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({
        queryKey: ["contacts", variables.id],
      });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/v1/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}
