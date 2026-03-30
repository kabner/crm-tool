import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SequenceStep {
  id: string;
  sequenceId: string;
  position: number;
  type: "email" | "manual_email" | "task" | "delay";
  delayDays: number;
  delayHours: number;
  config: Record<string, any>;
}

export interface Sequence {
  id: string;
  tenantId: string;
  name: string;
  status: string;
  createdBy: string;
  settings: Record<string, any>;
  statsCache: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  steps?: SequenceStep[];
  stepsCount?: number;
  enrolledCount?: number;
}

export interface SequenceEnrollment {
  id: string;
  sequenceId: string;
  contactId: string;
  enrolledBy: string;
  currentStep: number;
  status: string;
  enrolledAt: string;
  completedAt: string | null;
  exitReason: string | null;
}

export interface SequencesResponse {
  data: Sequence[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface EnrollmentsResponse {
  data: SequenceEnrollment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SequenceStats {
  totalEnrolled: number;
  active: number;
  completed: number;
  replied: number;
  bounced: number;
}

export interface SequenceStepInput {
  position: number;
  type: "email" | "manual_email" | "task" | "delay";
  delayDays?: number;
  delayHours?: number;
  config: Record<string, any>;
}

function buildQueryString(
  filters: Record<string, string | number | undefined>,
): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useSequences(
  filters: { page?: number; limit?: number; status?: string } = {},
) {
  return useQuery<SequencesResponse>({
    queryKey: ["sequences", filters],
    queryFn: () =>
      apiClient.get<SequencesResponse>(
        `/api/v1/sequences${buildQueryString(filters)}`,
      ),
  });
}

export function useSequence(id: string) {
  return useQuery<Sequence>({
    queryKey: ["sequences", id],
    queryFn: () => apiClient.get<Sequence>(`/api/v1/sequences/${id}`),
    enabled: !!id,
  });
}

export function useCreateSequence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; settings?: Record<string, any> }) =>
      apiClient.post<Sequence>("/api/v1/sequences", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sequences"] });
    },
  });
}

export function useUpdateSequence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        settings?: Record<string, any>;
        steps?: SequenceStepInput[];
      };
    }) => apiClient.patch<Sequence>(`/api/v1/sequences/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sequences"] });
      queryClient.invalidateQueries({
        queryKey: ["sequences", variables.id],
      });
    },
  });
}

export function useActivateSequence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<Sequence>(`/api/v1/sequences/${id}/activate`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["sequences"] });
      queryClient.invalidateQueries({ queryKey: ["sequences", id] });
    },
  });
}

export function usePauseSequence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<Sequence>(`/api/v1/sequences/${id}/pause`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["sequences"] });
      queryClient.invalidateQueries({ queryKey: ["sequences", id] });
    },
  });
}

export function useDeleteSequence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/v1/sequences/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sequences"] });
    },
  });
}

export function useEnrollContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sequenceId,
      contactId,
    }: {
      sequenceId: string;
      contactId: string;
    }) =>
      apiClient.post<SequenceEnrollment>(
        `/api/v1/sequences/${sequenceId}/enroll`,
        { contactId },
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["sequence-enrollments", variables.sequenceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["sequence-stats", variables.sequenceId],
      });
    },
  });
}

export function useSequenceEnrollments(
  sequenceId: string,
  filters: { page?: number; limit?: number; status?: string } = {},
) {
  return useQuery<EnrollmentsResponse>({
    queryKey: ["sequence-enrollments", sequenceId, filters],
    queryFn: () =>
      apiClient.get<EnrollmentsResponse>(
        `/api/v1/sequences/${sequenceId}/enrollments${buildQueryString(filters)}`,
      ),
    enabled: !!sequenceId,
  });
}

export function useSequenceStats(sequenceId: string) {
  return useQuery<SequenceStats>({
    queryKey: ["sequence-stats", sequenceId],
    queryFn: () =>
      apiClient.get<SequenceStats>(`/api/v1/sequences/${sequenceId}/stats`),
    enabled: !!sequenceId,
  });
}
