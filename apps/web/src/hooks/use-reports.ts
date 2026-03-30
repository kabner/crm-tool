import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Report {
  id: string;
  name: string;
  description: string | null;
  dataSource: string;
  fields: string[];
  filters: any[];
  groupBy: Record<string, any> | null;
  sort: Record<string, any> | null;
  visualization: Record<string, any>;
  createdBy: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportResults {
  columns: string[];
  rows: any[];
  total: number;
}

export interface CreateReportInput {
  name: string;
  description?: string;
  dataSource: string;
  fields: string[];
  filters?: any[];
  groupBy?: Record<string, any>;
  sort?: Record<string, any>;
  visualization?: Record<string, any>;
}

export interface UpdateReportInput extends Partial<CreateReportInput> {}

export function useReports() {
  return useQuery<Report[]>({
    queryKey: ["reports"],
    queryFn: () => apiClient.get<Report[]>("/api/v1/data/reports"),
  });
}

export function useReport(id: string) {
  return useQuery<Report>({
    queryKey: ["reports", id],
    queryFn: () => apiClient.get<Report>(`/api/v1/data/reports/${id}`),
    enabled: !!id,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReportInput) =>
      apiClient.post<Report>("/api/v1/data/reports", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReportInput }) =>
      apiClient.patch<Report>(`/api/v1/data/reports/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["reports", variables.id] });
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/data/reports/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useExecuteReport(id: string) {
  return useQuery<ReportResults>({
    queryKey: ["reports", id, "results"],
    queryFn: () =>
      apiClient.post<ReportResults>(`/api/v1/data/reports/${id}/execute`),
    enabled: !!id,
  });
}
