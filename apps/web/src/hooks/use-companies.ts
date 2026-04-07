import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Company {
  id: string;
  tenantId: string;
  name: string;
  domain: string | null;
  industry: string | null;
  size: string | null;
  phone: string | null;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  } | null;
  lifecycleStage: string;
  ownerId: string | null;
  parentId: string | null;
  customProps: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  contactsCount?: number;
  parent?: Company | null;
  createdById: string | null;
  createdBy: { firstName: string; lastName: string } | null;
}

export interface CompanyContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  role: string | null;
  isPrimary: boolean;
}

export interface CompanyFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "ASC" | "DESC";
  search?: string;
  industry?: string;
  size?: string;
  ownerId?: string;
  lifecycleStage?: string;
  favorite?: string;
  createdAfter?: string;
  createdBefore?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateCompanyInput {
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  phone?: string;
  lifecycleStage?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  ownerId?: string;
  parentId?: string;
  customProps?: Record<string, unknown>;
}

function buildQueryString(filters: CompanyFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useCompanies(filters: CompanyFilters = {}) {
  return useQuery<PaginatedResponse<Company>>({
    queryKey: ["companies", filters],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Company>>(
        `/api/v1/companies${buildQueryString(filters)}`,
      ),
  });
}

export function useCompany(id: string) {
  return useQuery<Company>({
    queryKey: ["companies", id],
    queryFn: () => apiClient.get<Company>(`/api/v1/companies/${id}`),
    enabled: !!id,
  });
}

export function useCompanyContacts(id: string) {
  return useQuery<CompanyContact[]>({
    queryKey: ["companies", id, "contacts"],
    queryFn: () =>
      apiClient.get<CompanyContact[]>(`/api/v1/companies/${id}/contacts`),
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCompanyInput) =>
      apiClient.post<Company>("/api/v1/companies", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCompanyInput> }) =>
      apiClient.patch<Company>(`/api/v1/companies/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies", variables.id] });
    },
  });
}

export function useAddContactToCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, contactId }: { companyId: string; contactId: string }) =>
      apiClient.post(`/api/v1/companies/${companyId}/contacts`, { contactId }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["companies", variables.companyId, "contacts"] });
      queryClient.invalidateQueries({ queryKey: ["companies", variables.companyId] });
    },
  });
}

export function useRemoveContactFromCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, contactId }: { companyId: string; contactId: string }) =>
      apiClient.delete(`/api/v1/companies/${companyId}/contacts/${contactId}`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["companies", variables.companyId, "contacts"] });
      queryClient.invalidateQueries({ queryKey: ["companies", variables.companyId] });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/v1/companies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}
