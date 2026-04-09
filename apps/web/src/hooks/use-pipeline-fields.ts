import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface PipelineField {
  id: string;
  pipelineId: string;
  name: string;
  fieldKey: string;
  fieldType: string;
  options: string[] | null;
  required: boolean;
  position: number;
}

export function usePipelineFields(pipelineId: string) {
  return useQuery<PipelineField[]>({
    queryKey: ["pipeline-fields", pipelineId],
    queryFn: () =>
      apiClient.get<PipelineField[]>(
        `/api/v1/pipelines/${pipelineId}/fields`,
      ),
    enabled: !!pipelineId,
  });
}

export function useCreatePipelineField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      pipelineId,
      data,
    }: {
      pipelineId: string;
      data: {
        name: string;
        fieldKey?: string;
        fieldType?: string;
        options?: string[];
        required?: boolean;
      };
    }) =>
      apiClient.post<PipelineField>(
        `/api/v1/pipelines/${pipelineId}/fields`,
        data,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["pipeline-fields", variables.pipelineId],
      });
    },
  });
}

export function useUpdatePipelineField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      pipelineId,
      id,
      data,
    }: {
      pipelineId: string;
      id: string;
      data: Partial<{
        name: string;
        fieldType: string;
        options: string[] | null;
        required: boolean;
        position: number;
      }>;
    }) =>
      apiClient.patch<PipelineField>(
        `/api/v1/pipelines/${pipelineId}/fields/${id}`,
        data,
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["pipeline-fields", variables.pipelineId],
      });
    },
  });
}

export function useDeletePipelineField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      pipelineId,
      id,
    }: {
      pipelineId: string;
      id: string;
    }) =>
      apiClient.delete(`/api/v1/pipelines/${pipelineId}/fields/${id}`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["pipeline-fields", variables.pipelineId],
      });
    },
  });
}
