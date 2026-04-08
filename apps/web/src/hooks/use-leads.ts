import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Lead {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  jobTitle: string | null;
  source: string | null;
  status: string;
  ownerId: string | null;
  score: number;
  notes: string | null;
  customProps: Record<string, any>;
  convertedAt: string | null;
  convertedContactId: string | null;
  convertedDealId: string | null;
  convertedContact: { id: string; firstName: string; lastName: string } | null;
  convertedDeal: { id: string; name: string } | null;
  createdById: string | null;
  createdBy: { id: string; firstName: string; lastName: string } | null;
  owner: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadsResponse {
  data: Lead[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LeadFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  source?: string;
  ownerId?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export interface CreateLeadInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  companyName?: string;
  jobTitle?: string;
  source?: string;
  status?: string;
  notes?: string;
  ownerId?: string;
  customProps?: Record<string, any>;
}

export interface UpdateLeadInput extends Partial<CreateLeadInput> {}

export interface ConvertLeadInput {
  createDeal?: boolean;
  pipelineId?: string;
  stageId?: string;
  dealName?: string;
  dealAmount?: number;
  companyId?: string;
}

function buildQueryString(filters: LeadFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useLeads(filters: LeadFilters = {}) {
  return useQuery<LeadsResponse>({
    queryKey: ['leads', filters],
    queryFn: () =>
      apiClient.get<LeadsResponse>(`/api/v1/leads${buildQueryString(filters)}`),
  });
}

export function useLead(id: string) {
  return useQuery<Lead>({
    queryKey: ['leads', id],
    queryFn: () => apiClient.get<Lead>(`/api/v1/leads/${id}`),
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLeadInput) =>
      apiClient.post<Lead>('/api/v1/leads', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadInput }) =>
      apiClient.patch<Lead>(`/api/v1/leads/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads', variables.id] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/leads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useConvertLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConvertLeadInput }) =>
      apiClient.post<{ lead: Lead; contact: { id: string }; deal?: { id: string } }>(
        `/api/v1/leads/${id}/convert`,
        data,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads', variables.id] });
    },
  });
}
