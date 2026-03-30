import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface WorkflowNode {
  id: string;
  type: string;
  config: Record<string, any>;
  positionX: number;
  positionY: number;
}

export interface WorkflowEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  conditionBranch?: string | null;
}

export interface WorkflowStats {
  totalEnrolled: number;
  active: number;
  completed: number;
  goalMet: number;
  errors: number;
}

export interface Workflow {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  status: string;
  triggerConfig: {
    type: "form_submission" | "list_membership" | "property_change" | "manual";
    conditions: Record<string, any>;
  };
  version: number;
  createdBy: string;
  publishedAt: string | null;
  statsCache: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  enrolledCount?: number;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  stats?: WorkflowStats;
}

export interface WorkflowsResponse {
  data: Workflow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface WorkflowFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  triggerConfig: {
    type: "form_submission" | "list_membership" | "property_change" | "manual";
    conditions: Record<string, any>;
  };
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  triggerConfig?: {
    type: "form_submission" | "list_membership" | "property_change" | "manual";
    conditions: Record<string, any>;
  };
  nodes?: {
    id?: string;
    type: string;
    config: Record<string, any>;
    positionX: number;
    positionY: number;
  }[];
  edges?: {
    id?: string;
    fromNodeId: string;
    toNodeId: string;
    conditionBranch?: string;
  }[];
}

function buildQueryString(filters: WorkflowFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useWorkflows(filters: WorkflowFilters = {}) {
  return useQuery<WorkflowsResponse>({
    queryKey: ["workflows", filters],
    queryFn: () =>
      apiClient.get<WorkflowsResponse>(
        `/api/v1/marketing/workflows${buildQueryString(filters)}`,
      ),
  });
}

export function useWorkflow(id: string) {
  return useQuery<Workflow>({
    queryKey: ["workflows", id],
    queryFn: () =>
      apiClient.get<Workflow>(`/api/v1/marketing/workflows/${id}`),
    enabled: !!id,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorkflowInput) =>
      apiClient.post<Workflow>("/api/v1/marketing/workflows", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkflowInput }) =>
      apiClient.patch<Workflow>(`/api/v1/marketing/workflows/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({
        queryKey: ["workflows", variables.id],
      });
    },
  });
}

export function usePublishWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<Workflow>(`/api/v1/marketing/workflows/${id}/publish`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["workflows", id] });
    },
  });
}

export function usePauseWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<Workflow>(`/api/v1/marketing/workflows/${id}/pause`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["workflows", id] });
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/v1/marketing/workflows/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

export function useEnrollContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workflowId,
      contactId,
    }: {
      workflowId: string;
      contactId: string;
    }) =>
      apiClient.post(`/api/v1/marketing/workflows/${workflowId}/enroll`, {
        contactId,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["workflows", variables.workflowId],
      });
      queryClient.invalidateQueries({
        queryKey: ["workflow-stats", variables.workflowId],
      });
    },
  });
}

export function useWorkflowStats(workflowId: string) {
  return useQuery<WorkflowStats>({
    queryKey: ["workflow-stats", workflowId],
    queryFn: () =>
      apiClient.get<WorkflowStats>(
        `/api/v1/marketing/workflows/${workflowId}/stats`,
      ),
    enabled: !!workflowId,
  });
}
