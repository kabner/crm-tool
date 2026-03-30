import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  actualSpend: number | null;
  ownerId: string | null;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  assetCounts?: {
    emails: number;
  };
}

export interface CampaignsResponse {
  data: Campaign[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CampaignStats {
  emailsSent: number;
  contactsReached: number;
  formsSubmitted: number;
  linkedEmails: number;
}

export interface CampaignFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
}

export interface CreateCampaignInput {
  name: string;
  type: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  ownerId?: string;
}

export interface UpdateCampaignInput extends Partial<CreateCampaignInput> {
  status?: string;
}

function buildQueryString(filters: CampaignFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useCampaigns(filters: CampaignFilters = {}) {
  return useQuery<CampaignsResponse>({
    queryKey: ["campaigns", filters],
    queryFn: () =>
      apiClient.get<CampaignsResponse>(
        `/api/v1/marketing/campaigns${buildQueryString(filters)}`,
      ),
  });
}

export function useCampaign(id: string) {
  return useQuery<Campaign>({
    queryKey: ["campaigns", id],
    queryFn: () => apiClient.get<Campaign>(`/api/v1/marketing/campaigns/${id}`),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCampaignInput) =>
      apiClient.post<Campaign>("/api/v1/marketing/campaigns", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCampaignInput }) =>
      apiClient.patch<Campaign>(`/api/v1/marketing/campaigns/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({
        queryKey: ["campaigns", variables.id],
      });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/v1/marketing/campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useCampaignStats(id: string) {
  return useQuery<CampaignStats>({
    queryKey: ["campaigns", id, "stats"],
    queryFn: () =>
      apiClient.get<CampaignStats>(`/api/v1/marketing/campaigns/${id}/stats`),
    enabled: !!id,
  });
}
