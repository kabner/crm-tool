import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// Types

export interface DealOwner {
  firstName: string;
  lastName: string;
}

export interface DealCompany {
  name: string;
}

export interface Deal {
  id: string;
  name: string;
  amount: number | null;
  closeDate: string | null;
  stage: {
    id: string;
    name: string;
    stageType: string;
    probability: number;
    pipeline?: { id: string; name: string };
  };
  pipeline?: { id: string; name: string };
  owner: DealOwner | null;
  company: DealCompany | null;
  customProps: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DealsResponse {
  data: Deal[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DealFilters {
  page?: number;
  limit?: number;
  search?: string;
  pipelineId?: string;
  stageId?: string;
  ownerId?: string;
  minAmount?: number;
  maxAmount?: number;
  closeDateFrom?: string;
  closeDateTo?: string;
  sort?: string;
  order?: "ASC" | "DESC";
}

export interface PipelineStage {
  id: string;
  name: string;
  position: number;
  probability: number;
  stageType: string;
  deals: {
    id: string;
    name: string;
    amount: number | null;
    closeDate: string | null;
    owner: DealOwner | null;
    company: DealCompany | null;
  }[];
}

export interface PipelineBoardResponse {
  pipeline: { id: string; name: string };
  stages: PipelineStage[];
}

export interface PipelineSummaryRaw {
  totalValue: number;
  weightedValue: number;
  stages: {
    id: string;
    name: string;
    position: number;
    probability: number;
    stageType: string;
    dealCount: number;
    totalValue: number;
    weightedValue: number;
  }[];
}

export interface PipelineSummary {
  totalDeals: number;
  totalValue: number;
  weightedValue: number;
  stageBreakdown: {
    stageId: string;
    stageName: string;
    count: number;
    value: number;
  }[];
}

export interface Pipeline {
  id: string;
  name: string;
  isDefault: boolean;
  stages?: {
    id: string;
    name: string;
    position: number;
    probability: number;
    stageType: string;
  }[];
}

export interface CreateDealInput {
  name: string;
  amount?: number;
  pipelineId: string;
  stageId: string;
  closeDate?: string;
  companyName?: string;
  ownerId?: string;
}

export interface UpdateDealInput extends Partial<CreateDealInput> {}

// Helpers

function buildQueryString(filters: DealFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// Query hooks

export function useDeals(filters: DealFilters = {}) {
  return useQuery<DealsResponse>({
    queryKey: ["deals", filters],
    queryFn: () =>
      apiClient.get<DealsResponse>(
        `/api/v1/deals${buildQueryString(filters)}`,
      ),
  });
}

export function useDeal(id: string) {
  return useQuery<Deal>({
    queryKey: ["deals", id],
    queryFn: () => apiClient.get<Deal>(`/api/v1/deals/${id}`),
    enabled: !!id,
  });
}

export function usePipelineBoard(pipelineId: string) {
  return useQuery<PipelineBoardResponse>({
    queryKey: ["pipeline-board", pipelineId],
    queryFn: () =>
      apiClient.get<PipelineBoardResponse>(
        `/api/v1/deals/pipeline/${pipelineId}`,
      ),
    enabled: !!pipelineId,
  });
}

export function usePipelineSummary(pipelineId: string) {
  return useQuery<PipelineSummary>({
    queryKey: ["pipeline-summary", pipelineId],
    queryFn: async () => {
      const raw = await apiClient.get<PipelineSummaryRaw>(
        `/api/v1/deals/pipeline/${pipelineId}/summary`,
      );
      const totalDeals = raw.stages.reduce((sum, s) => sum + s.dealCount, 0);
      return {
        totalDeals,
        totalValue: raw.totalValue,
        weightedValue: raw.weightedValue,
        stageBreakdown: raw.stages.map((s) => ({
          stageId: s.id,
          stageName: s.name,
          count: s.dealCount,
          value: s.totalValue,
        })),
      };
    },
    enabled: !!pipelineId,
  });
}

export function usePipelines() {
  return useQuery<Pipeline[]>({
    queryKey: ["pipelines"],
    queryFn: () => apiClient.get<Pipeline[]>("/api/v1/pipelines"),
  });
}

export function useDefaultPipeline() {
  return useQuery<Pipeline>({
    queryKey: ["pipelines", "default"],
    queryFn: () => apiClient.get<Pipeline>("/api/v1/pipelines/default"),
  });
}

export function usePipeline(id: string) {
  return useQuery<Pipeline>({
    queryKey: ["pipelines", id],
    queryFn: () => apiClient.get<Pipeline>(`/api/v1/pipelines/${id}`),
    enabled: !!id,
  });
}

// Mutation hooks

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDealInput) =>
      apiClient.post<Deal>("/api/v1/deals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline-board"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline-summary"] });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDealInput }) =>
      apiClient.patch<Deal>(`/api/v1/deals/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["deals", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["pipeline-board"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline-summary"] });
    },
  });
}

export function useMoveDealStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stageId, position }: { id: string; stageId: string; position?: number }) =>
      apiClient.patch<Deal>(`/api/v1/deals/${id}/stage`, { stageId, ...(position !== undefined && { position }) }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["deals", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["pipeline-board"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline-summary"] });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/deals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline-board"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline-summary"] });
    },
  });
}
