import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface LeadScoreRule {
  id: string;
  modelId: string;
  type: string;
  attribute: string;
  condition: Record<string, any>;
  points: number;
  decayPerDay: number;
  createdAt: string;
}

export interface LeadScoreModel {
  id: string;
  tenantId: string;
  name: string;
  mqlThreshold: number;
  sqlThreshold: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  rules?: LeadScoreRule[];
  ruleCount?: number;
}

export interface LeadScoreRuleInput {
  type: "demographic" | "behavioral";
  attribute: string;
  condition: Record<string, any>;
  points: number;
  decayPerDay?: number;
}

export interface CreateScoreModelInput {
  name: string;
  mqlThreshold?: number;
  sqlThreshold?: number;
  isDefault?: boolean;
  rules?: LeadScoreRuleInput[];
}

export interface UpdateScoreModelInput extends Partial<CreateScoreModelInput> {}

export interface ScoreBreakdownEntry {
  ruleId: string;
  attribute: string;
  type: string;
  basePoints: number;
  finalPoints: number;
  matched: boolean;
  decay?: number;
}

export interface CalculateScoreResult {
  score: number;
  breakdown: ScoreBreakdownEntry[];
  qualificationLevel: string;
}

export function useLeadScoreModels() {
  return useQuery<LeadScoreModel[]>({
    queryKey: ["lead-score-models"],
    queryFn: () =>
      apiClient.get<LeadScoreModel[]>(
        "/api/v1/marketing/lead-scoring/models",
      ),
  });
}

export function useLeadScoreModel(id: string) {
  return useQuery<LeadScoreModel>({
    queryKey: ["lead-score-models", id],
    queryFn: () =>
      apiClient.get<LeadScoreModel>(
        `/api/v1/marketing/lead-scoring/models/${id}`,
      ),
    enabled: !!id,
  });
}

export function useCreateScoreModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateScoreModelInput) =>
      apiClient.post<LeadScoreModel>(
        "/api/v1/marketing/lead-scoring/models",
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-score-models"] });
    },
  });
}

export function useUpdateScoreModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScoreModelInput }) =>
      apiClient.patch<LeadScoreModel>(
        `/api/v1/marketing/lead-scoring/models/${id}`,
        data,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead-score-models"] });
      queryClient.invalidateQueries({
        queryKey: ["lead-score-models", variables.id],
      });
    },
  });
}

export function useDeleteScoreModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/v1/marketing/lead-scoring/models/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-score-models"] });
    },
  });
}

export function useCalculateScore() {
  return useMutation({
    mutationFn: ({
      contactId,
      modelId,
    }: {
      contactId: string;
      modelId?: string;
    }) => {
      const params = modelId ? `?modelId=${modelId}` : "";
      return apiClient.post<CalculateScoreResult>(
        `/api/v1/marketing/lead-scoring/calculate/${contactId}${params}`,
      );
    },
  });
}
